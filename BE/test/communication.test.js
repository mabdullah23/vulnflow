import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Submission from "../src/models/Submission.js";
import Comment from "../src/models/Comment.js";
import Notification from "../src/models/Notification.js";

test("private report comments notify the other participant; notifications remain user-scoped", async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "communication-test-secret";
  const original = { user: User.findById, report: Submission.findById,
    commentFind: Comment.find, commentCreate: Comment.create, notificationCreate: Notification.create,
    notificationFind: Notification.find, count: Notification.countDocuments, mark: Notification.updateMany };
  const ownerId = "123456789012345678901234";
  const researcherId = "223456789012345678901234";
  const strangerId = "423456789012345678901234";
  const reportId = "323456789012345678901234";
  const comments = [];
  const notifications = [];
  let missingReport = false;
  let failComment = false;
  let failNotification = false;
  User.findById = (id) => ({ select: async () => ({ _id: id, name: id === ownerId ? "Owner" : "Researcher" }) });
  Submission.findById = (id) => ({ populate: async () => !missingReport && id === reportId
    ? { _id: reportId, title: "Demo bug", bugHunter: researcherId, project: { owner: ownerId } } : null });
  Comment.find = (filter) => ({ sort: async (sort) => {
    assert.deepEqual(filter, { submission: reportId });
    assert.deepEqual(sort, { createdAt: 1, _id: 1 });
    return comments;
  } });
  Comment.create = async (data) => {
    if (failComment) throw new Error("Comment save failed");
    const comment = new Comment(data);
    await comment.validate();
    comment.createdAt = new Date();
    comments.push(comment);
    return comment;
  };
  Notification.create = async (data) => {
    if (failNotification) throw new Error("Notification save failed");
    const notification = new Notification(data);
    await notification.validate();
    notification.createdAt = new Date();
    notifications.push(notification);
    return notification;
  };
  const forUser = (filter) => notifications.filter((item) => item.recipient.toString() === filter.recipient &&
    (filter.read === undefined || item.read === filter.read));
  Notification.find = (filter) => ({ sort: (sort) => {
    assert.deepEqual(sort, { createdAt: -1 });
    return { limit: async (limit) => {
      assert.equal(limit, 30);
      return forUser(filter).slice().reverse().slice(0, limit);
    } };
  } });
  Notification.countDocuments = async (filter) => forUser(filter).length;
  Notification.updateMany = async (filter, update) => {
    assert.equal(filter.read, false);
    assert.deepEqual(update, { $set: { read: true } });
    forUser(filter).forEach((item) => { item.read = true; });
  };
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = (path, userId, method = "GET", body) => fetch(`${base}${path}`, {
    method, headers: { "Content-Type": "application/json",
      ...(userId ? { Authorization: `Bearer ${jwt.sign({ userId }, process.env.JWT_SECRET)}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const thread = `/submissions/${reportId}/comments`;
  try {
    assert.equal((await request(thread)).status, 401);
    assert.equal((await request(thread, null, "POST", { text: "Hi" })).status, 401);
    assert.equal((await request(thread, strangerId)).status, 403);
    assert.equal((await request(thread, strangerId, "POST", { text: "Hi" })).status, 403);
    assert.equal((await request("/submissions/invalid/comments", ownerId)).status, 400);
    missingReport = true;
    assert.equal((await request(thread, ownerId)).status, 404);
    missingReport = false;
    assert.deepEqual((await (await request(thread, ownerId)).json()).comments, []);
    for (const text of [undefined, null, {}, 123, "", "   ", "x".repeat(2001)]) {
      assert.equal((await request(thread, researcherId, "POST", { text })).status, 400);
    }
    assert.equal(comments.length, 0);
    assert.equal(notifications.length, 0);
    let response = await request(thread, researcherId, "POST", { text: " More evidence ", author: strangerId, authorName: "Forged" });
    assert.equal(response.status, 201);
    let comment = (await response.json()).comment;
    assert.equal(comment.text, "More evidence");
    assert.equal(comment.author, researcherId);
    assert.equal(comment.authorName, "Researcher");
    assert.equal(notifications[0].recipient.toString(), ownerId);
    assert.equal(notifications[0].submission.toString(), reportId);
    assert.equal(notifications[0].message, 'Researcher replied on "Demo bug".');
    assert.equal((await request(thread, ownerId, "POST", { text: "Thanks" })).status, 201);
    assert.equal(notifications[1].recipient.toString(), researcherId);
    response = await request(thread, researcherId);
    assert.deepEqual((await response.json()).comments.map((item) => item.text), ["More evidence", "Thanks"]);
    failComment = true;
    assert.equal((await request(thread, ownerId, "POST", { text: "Not saved" })).status, 500);
    assert.equal(notifications.length, 2);
    failComment = false;
    failNotification = true;
    assert.equal((await request(thread, ownerId, "POST", { text: "Still saved" })).status, 201);
    assert.equal(comments.length, 3);
    failNotification = false;
    for (let i = 0; i < 35; i++) {
      await Notification.create({ recipient: ownerId, submission: reportId, message: `Notice ${i}` });
    }
    assert.equal((await request("/notifications")).status, 401);
    assert.equal((await request("/notifications/read", null, "PATCH")).status, 401);
    response = await request(`/notifications?recipient=${ownerId}`, strangerId);
    assert.deepEqual(await response.json(), { notifications: [], unreadCount: 0 });
    response = await request("/notifications", ownerId);
    let inbox = await response.json();
    assert.equal(inbox.unreadCount, 36);
    assert.equal(inbox.notifications.length, 30);
    assert.equal(inbox.notifications[0].message, "Notice 34");
    assert.equal(inbox.notifications[0].recipient, undefined);
    assert.equal((await request("/notifications/read", strangerId, "PATCH", { recipient: ownerId })).status, 200);
    assert.equal((await (await request("/notifications", ownerId)).json()).unreadCount, 36);
    assert.equal((await request("/notifications/read", ownerId, "PATCH")).status, 200);
    inbox = await (await request("/notifications", ownerId)).json();
    assert.equal(inbox.unreadCount, 0);
    assert.ok(inbox.notifications.every((item) => item.read));
    assert.equal((await (await request("/notifications", researcherId)).json()).unreadCount, 1);
  } finally {
    User.findById = original.user;
    Submission.findById = original.report;
    Comment.find = original.commentFind;
    Comment.create = original.commentCreate;
    Notification.create = original.notificationCreate;
    Notification.find = original.notificationFind;
    Notification.countDocuments = original.count;
    Notification.updateMany = original.mark;
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
    await new Promise((resolve) => server.close(resolve));
  }
});
