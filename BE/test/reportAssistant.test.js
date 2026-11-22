import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import User from "../src/models/User.js";
import { improveDescription } from "../src/services/reportAssistant.js";

test("AI assistant validates input, authenticates requests, and handles provider failures", async (t) => {
  const previous = { key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL, secret: process.env.JWT_SECRET };
  const originalFetch = globalThis.fetch;
  const originalFind = User.findById;
  let providerCalls = 0;
  let provider;
  let sent;
  globalThis.fetch = async (url, options) => {
    if (url !== "https://api.groq.com/openai/v1/chat/completions") return originalFetch(url, options);
    providerCalls++;
    sent = JSON.parse(options.body);
    assert.equal(options.headers.Authorization, "Bearer test-only-key");
    assert.ok(options.signal);
    return provider();
  };
  process.env.JWT_SECRET = "ai-test-session-secret";
  process.env.GROQ_API_KEY = "test-only-key";
  process.env.GROQ_MODEL = "test-model";
  User.findById = () => ({ select: async () => ({ _id: "123456789012345678901234" }) });
  const token = jwt.sign({ userId: "123456789012345678901234" }, process.env.JWT_SECRET);
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const request = (body, authenticated = true) => originalFetch(`http://127.0.0.1:${server.address().port}/api/ai/improve-description`, {
    method: "POST", headers: { "Content-Type": "application/json", ...(authenticated ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const completion = (value, finish = "stop") => Response.json({ choices: [{ finish_reason: finish, message: { content: JSON.stringify(value) } }] });
  try {
    await t.test("requires authentication before calling Groq", async () => {
      assert.equal((await request({ description: "A detailed report description" }, false)).status, 401);
      assert.equal(providerCalls, 0);
    });
    await t.test("rejects missing, short, non-string, and oversized input", async () => {
      for (const description of [undefined, "short", 123, " ".repeat(20), "a".repeat(5001)]) {
        assert.equal((await request({ description })).status, 400);
      }
      assert.equal(providerCalls, 0);
    });
    await t.test("missing API key returns a setup message without a provider call", async () => {
      delete process.env.GROQ_API_KEY;
      assert.equal((await request({ description: "A detailed report description" })).status, 503);
      assert.equal(providerCalls, 0);
      process.env.GROQ_API_KEY = "test-only-key";
    });
    await t.test("returns a suggestion and separate missing details, sending only the draft", async () => {
      provider = () => completion({ description: "The page exposes another user's record.", missingDetails: ["Which endpoint is affected?"] });
      const response = await request({ description: "  other user record shows on page  ", title: "Do not send", severity: "critical" });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { description: "The page exposes another user's record.", missingDetails: ["Which endpoint is affected?"] });
      assert.equal(sent.model, "test-model");
      assert.deepEqual(sent.messages[1], { role: "user", content: "other user record shows on page" });
      assert.match(sent.messages[0].content, /Do not invent/);
      assert.ok(!JSON.stringify(sent).includes("Do not send"));
    });
    await t.test("provider errors are sanitized, including rate limits", async () => {
      for (const status of [401, 429, 500]) {
        provider = () => Response.json({ error: "private provider error or key" }, { status });
        const response = await request({ description: "A detailed report description" });
        assert.equal(response.status, status === 429 ? 429 : 502);
        assert.ok(!(await response.text()).includes("private provider"));
      }
    });
    await t.test("rejects invalid, blank, oversized, and truncated model output", async () => {
      for (const value of [{}, { description: " ", missingDetails: [] }, { description: "ok", missingDetails: [123] },
        { description: "a".repeat(10001), missingDetails: [] }]) {
        provider = () => completion(value);
        await assert.rejects(improveDescription("A detailed report description"), { status: 502 });
      }
      provider = () => completion({ description: "Partial output", missingDetails: [] }, "length");
      await assert.rejects(improveDescription("A detailed report description"), { status: 502 });
      provider = () => Response.json({ choices: [{ finish_reason: "stop", message: { content: "not JSON" } }] });
      await assert.rejects(improveDescription("A detailed report description"), { status: 502 });
    });
    await t.test("network failures and timeouts return a recoverable error", async () => {
      provider = () => { throw new Error("Connection failed with sensitive internals"); };
      await assert.rejects(improveDescription("A detailed report description"), { status: 502 });
    });
  } finally {
    globalThis.fetch = originalFetch;
    User.findById = originalFind;
    for (const [name, value] of [["GROQ_API_KEY", previous.key], ["GROQ_MODEL", previous.model], ["JWT_SECRET", previous.secret]]) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    await new Promise((resolve) => server.close(resolve));
  }
});
