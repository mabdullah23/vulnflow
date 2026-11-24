import assert from "node:assert/strict";
import { once } from "node:events";
import { readFile, readdir, rmdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Project from "../src/models/Project.js";
import Submission from "../src/models/Submission.js";
import Notification from "../src/models/Notification.js";
import { removeFile, uploadsRoot } from "../src/config/storage.js";

test("local uploads, scoped downloads, access checks, and failure cleanup", async () => {
  const previousSecret = process.env.JWT_SECRET;
  const previousApiUrl = process.env.API_URL;
  process.env.JWT_SECRET = "local-upload-integration-test-secret";
  delete process.env.API_URL;
  const userId = "123456789012345678901234";
  const projectId = "223456789012345678901234";
  const submissionId = "323456789012345678901234";
  const original = { findUser: User.findById, update: User.findByIdAndUpdate,
    project: Project.findById, create: Submission.create, find: Submission.findById, notify: Notification.create };
  const notifications = [];
  Notification.create = async (data) => { notifications.push(data); };
  const files = new Set();
  let user = { _id: userId, name: "Demo", email: "demo@example.com" };
  let submission;
  let failSave = false;
  let projectOwner = "423456789012345678901234";
  User.findById = () => ({ select: async () => user });
  User.findByIdAndUpdate = (_id, updates) => ({ select: async () => {
    user = { ...user, ...updates };
    return user;
  } });
  Project.findById = async () => ({ _id: projectId, owner: projectOwner, bountyAmount: 100 });
  Submission.create = async (data) => {
    if (failSave) throw new Error("Simulated database failure");
    submission = { ...data, _id: submissionId, status: new Submission(data).status };
    files.add(data.videoPath);
    files.add(data.pdfPath);
    return submission;
  };
  Submission.findById = async () => submission;
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  const headers = { Authorization: `Bearer ${token}` };
  function reportForm() {
    const form = new FormData();
    form.set("title", "Demo bug");
    form.set("description", "Reproduction details");
    form.set("severity", "low");
    form.set("video", new Blob(["video bytes"], { type: "video/mp4" }), "demo.mp4");
    form.set("pdf", new Blob(["%PDF-demo"], { type: "application/pdf" }), "demo.pdf");
    return form;
  }
  try {
    const profile = new FormData();
    profile.set("profileImage", new Blob(["image bytes"], { type: "image/png" }), "../../demo.png");
    let response = await fetch(`${base}/api/profile`, { method: "PATCH", headers, body: profile });
    assert.equal(response.status, 200);
    const profileUrl = (await response.json()).user.profilePicture;
    const imagePath = new URL(profileUrl).pathname.slice("/uploads/".length);
    files.add(imagePath);
    assert.match(imagePath, /^profile-images\/123456789012345678901234\/[a-f\d-]+\.png$/);
    assert.equal(await (await fetch(profileUrl)).text(), "image bytes");

    response = await fetch(`${base}/api/submissions/project/${projectId}`, { method: "POST", body: reportForm() });
    assert.equal(response.status, 401);
    response = await fetch(`${base}/api/submissions/project/${projectId}`, { method: "POST", headers, body: reportForm() });
    assert.equal(response.status, 201);
    const report = (await response.json()).submission;
    assert.equal(report.status, "submitted");
    assert.deepEqual(report.nextStatuses, ["under_review"]);
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].recipient, projectOwner);
    assert.equal(notifications[0].submission, submissionId);
    assert.match(notifications[0].message, /New report: "Demo bug"/);
    assert.equal(await readFile(path.join(uploadsRoot, submission.pdfPath), "utf8"), "%PDF-demo");
    response = await fetch(report.pdfUrl);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /application\/pdf/);
    assert.equal(await response.text(), "%PDF-demo");
    assert.equal(await (await fetch(report.videoUrl)).text(), "video bytes");
    assert.equal((await fetch(`${base}/uploads/${submission.pdfPath}`)).status, 404);
    assert.equal((await fetch(report.pdfUrl.replace("/files/pdf", "/files/video"))).status, 401);
    const expired = jwt.sign({ purpose: "evidence", submissionId, kind: "pdf" }, process.env.JWT_SECRET,
      { audience: "evidence-download", expiresIn: -1 });
    assert.equal((await fetch(`${base}/api/submissions/${submissionId}/files/pdf?token=${expired}`)).status, 401);
    assert.equal((await fetch(`${base}/api/submissions/${submissionId}/files/pdf?token=${token}`)).status, 401);
    const evidenceToken = new URL(report.pdfUrl).searchParams.get("token");
    assert.equal((await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${evidenceToken}` } })).status, 401);

    const folder = path.join(uploadsRoot, "reports", userId);
    const before = await readdir(folder);
    failSave = true;
    response = await fetch(`${base}/api/submissions/project/${projectId}`, { method: "POST", headers, body: reportForm() });
    assert.equal(response.status, 500);
    assert.deepEqual(await readdir(folder), before);
    projectOwner = userId;
    response = await fetch(`${base}/api/submissions/project/${projectId}`, { method: "POST", headers, body: reportForm() });
    assert.equal(response.status, 403);
    assert.deepEqual(await readdir(folder), before);
    assert.equal(notifications.length, 1);
  } finally {
    await Promise.all([...files].map(removeFile));
    for (const folder of ["reports", "profile-images"]) {
      await rmdir(path.join(uploadsRoot, folder, userId)).catch(() => {});
      await rmdir(path.join(uploadsRoot, folder)).catch(() => {});
    }
    User.findById = original.findUser;
    User.findByIdAndUpdate = original.update;
    Project.findById = original.project;
    Submission.create = original.create;
    Submission.findById = original.find;
    Notification.create = original.notify;
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
    if (previousApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = previousApiUrl;
    await new Promise((resolve) => server.close(resolve));
  }
});
