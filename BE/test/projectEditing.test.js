import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Project from "../src/models/Project.js";

test("program editing validates fields and allows only the owner to update", async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "project-editing-test-secret";
  const original = { user: User.findById, update: Project.findOneAndUpdate, find: Project.findById };
  const ownerId = "123456789012345678901234";
  const otherId = "223456789012345678901234";
  const projectId = "323456789012345678901234";
  const project = { _id: projectId, owner: ownerId, name: "Demo", domain: "web",
    description: "Original description", scope: "https://example.com", bountyAmount: 100 };
  let writes = 0;
  let failUpdate = false;
  User.findById = (id) => ({ select: async () => ({ _id: id }) });
  Project.findById = async () => project;
  Project.findOneAndUpdate = async (filter, update, options) => {
    if (failUpdate) throw new Error("Simulated update failure");
    if (filter._id !== projectId || filter.owner !== project.owner) return null;
    assert.equal(options.new, true);
    assert.equal(options.runValidators, true);
    assert.deepEqual(Object.keys(update.$set).sort(), ["bountyAmount", "description", "scope"]);
    Object.assign(project, update.$set);
    writes++;
    return project;
  };
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}/api/projects`;
  const headers = (userId) => ({ "Content-Type": "application/json",
    ...(userId ? { Authorization: `Bearer ${jwt.sign({ userId }, process.env.JWT_SECRET)}` } : {}) });
  const valid = { description: " Updated description ", scope: " https://new.example.com ", bountyAmount: "250.5" };
  const patch = (body, userId = ownerId, id = projectId) => fetch(`${base}/${id}`, {
    method: "PATCH", headers: headers(userId), body: JSON.stringify(body),
  });
  try {
    for (const [userId, canEdit] of [[ownerId, true], [otherId, false]]) {
      const response = await fetch(`${base}/${projectId}`, { headers: headers(userId) });
      assert.equal((await response.json()).permissions.canEdit, canEdit);
    }
    assert.equal((await patch(valid, null)).status, 401);
    assert.equal((await patch(valid, otherId)).status, 404);
    assert.equal((await patch(valid, ownerId, "423456789012345678901234")).status, 404);
    assert.equal((await patch(valid, ownerId, "invalid-id")).status, 400);
    for (const field of ["description", "scope"]) {
      for (const value of [undefined, "", "   ", 123, {}, null]) {
        assert.equal((await patch({ ...valid, [field]: value })).status, 400);
      }
    }
    for (const bountyAmount of [undefined, "", "  ", -1, "abc", "Infinity", null, true, {}, []]) {
      assert.equal((await patch({ ...valid, bountyAmount })).status, 400);
    }
    assert.equal(writes, 0);
    const response = await patch({ ...valid, owner: otherId, name: "Changed", domain: "api" });
    assert.equal(response.status, 200);
    const updated = (await response.json()).project;
    assert.equal(updated.description, "Updated description");
    assert.equal(updated.scope, "https://new.example.com");
    assert.equal(updated.bountyAmount, 250.5);
    assert.equal(updated.owner, ownerId);
    assert.equal(updated.name, "Demo");
    assert.equal(updated.domain, "web");
    assert.equal((await patch({ ...valid, bountyAmount: 0 })).status, 200);
    assert.equal(project.bountyAmount, 0);
    failUpdate = true;
    assert.equal((await patch(valid)).status, 500);
  } finally {
    User.findById = original.user;
    Project.findOneAndUpdate = original.update;
    Project.findById = original.find;
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
    await new Promise((resolve) => server.close(resolve));
  }
});
