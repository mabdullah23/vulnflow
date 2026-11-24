import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Submission from "../src/models/Submission.js";

test("report lifecycle enforces transitions, ownership, and legacy compatibility", async () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "report-lifecycle-test-secret";
  const original = { user: User.findById, find: Submission.findById, update: Submission.findOneAndUpdate };
  const ownerId = "123456789012345678901234";
  const researcherId = "223456789012345678901234";
  const reportId = "323456789012345678901234";
  let report;
  let conflict = false;
  let writes = 0;
  User.findById = (id) => ({ select: async () => ({ _id: id }) });
  Submission.findById = () => ({ populate: async () => report });
  Submission.findOneAndUpdate = (filter, update, options) => ({ populate: async () => {
    writes++;
    assert.equal(filter._id, reportId);
    assert.equal(filter.status, report.status);
    assert.equal(options.runValidators, true);
    assert.equal(options.new, true);
    if (conflict) return null;
    Object.assign(report, update.$set);
    return report;
  } });
  function reset(status) {
    report = { _id: reportId, status, project: { owner: ownerId }, reviewNote: "Existing note" };
  }
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${server.address().port}/api/submissions/${reportId}/review`;
  const patch = (body, userId = ownerId) => fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(userId ? { Authorization: `Bearer ${jwt.sign({ userId }, process.env.JWT_SECRET)}` } : {}),
    },
    body: JSON.stringify(body),
  });
  try {
    const allowed = {
      submitted: ["under_review"], under_review: ["accepted", "rejected"],
      accepted: ["resolved"], rejected: ["closed"], resolved: ["closed"], closed: [],
    };
    assert.equal(new Submission().status, "submitted");
    for (const from of Object.keys(allowed)) {
      for (const to of Object.keys(allowed)) {
        reset(from);
        const response = await patch({ status: to });
        const valid = allowed[from].includes(to);
        assert.equal(response.status, valid ? 200 : 400, `${from} -> ${to}`);
        assert.equal(report.status, valid ? to : from);
        if (valid) {
          const data = (await response.json()).submission;
          assert.equal(data.status, to);
          assert.deepEqual(data.nextStatuses, allowed[to]);
          assert.equal(report.reviewedBy, ownerId);
          assert.ok(report.reviewedAt instanceof Date);
          assert.equal(report.reviewNote, "Existing note");
        }
      }
    }
    reset("submitted");
    let before = writes;
    assert.equal((await patch({ status: "under_review" }, null)).status, 401);
    assert.equal((await patch({ status: "under_review" }, researcherId)).status, 403);
    for (const status of ["approved", "pending", "unknown", "toString", null, {}]) {
      assert.equal((await patch({ status })).status, 400);
    }
    assert.equal((await patch({ status: "under_review", reviewNote: {} })).status, 400);
    assert.equal(writes, before);
    assert.equal((await patch({ status: "under_review", reviewNote: " Reviewing " })).status, 200);
    assert.equal(report.reviewNote, "Reviewing");
    for (const [oldStatus, next] of [["pending", "under_review"], ["approved", "resolved"]]) {
      reset(oldStatus);
      assert.equal((await patch({ status: next })).status, 200);
      assert.equal(report.status, next);
    }
    reset("submitted");
    conflict = true;
    assert.equal((await patch({ status: "under_review" })).status, 409);
    assert.equal(report.status, "submitted");
    report = null;
    assert.equal((await patch({ status: "under_review" })).status, 404);
  } finally {
    User.findById = original.user;
    Submission.findById = original.find;
    Submission.findOneAndUpdate = original.update;
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
    await new Promise((resolve) => server.close(resolve));
  }
});
