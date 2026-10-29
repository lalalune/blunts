import { test } from "node:test";
import assert from "node:assert/strict";
import {
  HOSTED_RELEASE_APPROVED,
  RELEASE_ORIGIN,
} from "../shared/release-target.js";
import { executionPolicyForOrigin } from "../shared/execution-policy.js";
test("HTTP loopback signing is allowed while unknown and native origins are refused", () => {
  for (const origin of ["http://localhost:8745", "http://127.0.0.1:8751"]) {
    const p = executionPolicyForOrigin(origin);
    assert.equal(p.enabled, true);
    assert.equal(p.chainId, 4663);
    assert.ok(Object.isFrozen(p));
  }
  for (const origin of [
    undefined,
    "https://blunts.example.com",
    "https://localhost",
    "capacitor://localhost",
    "http://192.168.1.1",
    "http://localhost.evil.com",
    "http://user:secret@localhost",
    "http://localhost/path",
    "http://localhost?enable=true",
    "http://localhost/#sign",
  ])
    assert.equal(executionPolicyForOrigin(origin).enabled, false);
});

test("hosted signing follows only the source-reviewed approval for the pinned origin", () => {
  assert.equal(
    executionPolicyForOrigin(RELEASE_ORIGIN).enabled,
    HOSTED_RELEASE_APPROVED,
  );
});
