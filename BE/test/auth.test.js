import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import User from "../src/models/User.js";

test("local signup, existing-account login, and authenticated session", async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "local-auth-test-secret";
  const original = { findOne: User.findOne, create: User.create, findById: User.findById };
  const userId = "123456789012345678901234";
  let storedUser;
  User.findOne = async ({ email }) => storedUser?.email === email ? storedUser : null;
  User.create = async (data) => {
    await new User(data).validate();
    storedUser = { ...data, _id: userId };
    return storedUser;
  };
  User.findById = (id) => ({ select: async () => id === userId ? storedUser : null });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${server.address().port}/api/auth`;
  const post = (path, body) => fetch(`${url}/${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  try {
    assert.equal((await post("signup", { username: "Demo", email: "demo@example.com", password: "short" })).status, 400);
    const response = await post("signup", { username: " Demo ", email: " DEMO@example.com ", password: "correct-password" });
    assert.equal(response.status, 201);
    const session = await response.json();
    assert.equal(storedUser.name, "Demo");
    assert.equal(storedUser.email, "demo@example.com");
    assert.notEqual(storedUser.password, "correct-password");
    assert.equal(await bcrypt.compare("correct-password", storedUser.password), true);
    assert.equal(session.user.password, undefined);
    assert.equal(jwt.verify(session.token, process.env.JWT_SECRET).userId, userId);
    assert.equal((await post("signup", { username: "Other", email: "demo@example.com", password: "correct-password" })).status, 409);
    assert.equal((await post("login", { email: "demo@example.com", password: "wrong-password" })).status, 401);
    assert.equal((await post("login", { email: "missing@example.com", password: "correct-password" })).status, 401);
    // A pre-existing bcrypt account keeps its identity and password.
    storedUser.password = await bcrypt.hash("old-account-password", 12);
    const login = await post("login", { email: "DEMO@example.com", password: "old-account-password" });
    assert.equal(login.status, 200);
    const loggedIn = await login.json();
    assert.equal(loggedIn.user.id, userId);
    assert.equal(loggedIn.user.password, undefined);
    const me = await fetch(`${url}/me`, { headers: { Authorization: `Bearer ${loggedIn.token}` } });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).user.id, userId);
    assert.equal((await fetch(`${url}/me`)).status, 401);
    delete storedUser.password;
    assert.equal((await post("login", { email: "demo@example.com", password: "anything" })).status, 401);
  } finally {
    Object.assign(User, original);
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
    await new Promise((resolve) => server.close(resolve));
  }
});
