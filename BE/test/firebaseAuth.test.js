import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import User from "../src/models/User.js";
import { getFirebaseAuth } from "../src/config/firebase.js";

test("Firebase verifies tokens, creates users, and preserves MongoDB IDs", async () => {
  const previous = { secret: process.env.JWT_SECRET, project: process.env.FIREBASE_PROJECT_ID };
  process.env.JWT_SECRET = "test-session-secret";
  delete process.env.FIREBASE_PROJECT_ID;
  assert.throws(getFirebaseAuth, { status: 503 });
  process.env.FIREBASE_PROJECT_ID = "vulnflow-test";
  const auth = getFirebaseAuth();
  await assert.rejects(auth.verifyIdToken("forged-token"));
  const original = { verify: auth.verifyIdToken, find: User.findOne, create: User.create };
  const userId = "123456789012345678901234";
  let user;
  let provider = "google.com";
  auth.verifyIdToken = async (token) => {
    if (token !== "valid-token") throw new Error("Invalid token");
    return { uid: "firebase-user", email: "demo@example.com", name: "Demo",
      firebase: { sign_in_provider: provider } };
  };
  User.findOne = async () => user;
  User.create = async (data) => {
    user = { ...data, _id: userId };
    return user;
  };
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const post = (body) => fetch(`http://127.0.0.1:${server.address().port}/api/auth/firebase`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  try {
    assert.equal((await post({})).status, 400);
    assert.equal((await post({ idToken: "forged-token" })).status, 401);
    assert.equal(user, undefined);
    let response = await post({ idToken: "valid-token", email: "forged@example.com" });
    assert.equal(response.status, 200);
    const session = await response.json();
    assert.equal(user.email, "demo@example.com");
    assert.equal(user.firebaseUid, "firebase-user");
    assert.equal(user.password, undefined);
    assert.equal(session.user.firebaseUid, undefined);
    assert.equal(jwt.verify(session.token, process.env.JWT_SECRET).userId, userId);
    response = await post({ idToken: "valid-token" });
    assert.equal((await response.json()).user.id, userId);
    user = undefined;
    provider = "password";
    response = await post({ idToken: "valid-token", username: "Researcher" });
    assert.equal(response.status, 200);
    assert.equal(user.name, "Researcher");
    await new User(user).validate();
    user = undefined;
    provider = "anonymous";
    assert.equal((await post({ idToken: "valid-token" })).status, 401);
    provider = "google.com";
    User.create = async () => { throw Object.assign(new Error("Duplicate email"), { code: 11000 }); };
    assert.equal((await post({ idToken: "valid-token" })).status, 409);
  } finally {
    auth.verifyIdToken = original.verify;
    User.findOne = original.find;
    User.create = original.create;
    if (previous.secret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous.secret;
    if (previous.project === undefined) delete process.env.FIREBASE_PROJECT_ID;
    else process.env.FIREBASE_PROJECT_ID = previous.project;
    await new Promise((resolve) => server.close(resolve));
  }
});
