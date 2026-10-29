import { test } from "node:test";
import assert from "node:assert/strict";
import { withActivityLock } from "../client/activity-lock.js";
test("activity lock requests exclusive wallet scope and refuses unsupported browsers before mutation", async () => {
  let mutations = 0;
  const locks = {
    request: async (
      name: string,
      options: { mode: string },
      callback: () => Promise<number>,
    ) => {
      assert.equal(name, "blunts:activity:blunts:swap:4663:wallet");
      assert.equal(options.mode, "exclusive");
      return callback();
    },
  } as unknown as LockManager;
  assert.equal(
    await withActivityLock(
      "blunts:swap:4663:wallet",
      async () => ++mutations,
      locks,
    ),
    1,
  );
  await assert.rejects(
    withActivityLock(
      "blunts:swap:4663:wallet",
      async () => ++mutations,
      null as unknown as LockManager,
    ),
  );
  assert.equal(mutations, 1);
});
