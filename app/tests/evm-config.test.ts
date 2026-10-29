import { test } from "node:test";
import assert from "node:assert/strict";
import { evmConfig } from "../server/evm-config.js";
import {
  HOSTED_RELEASE_APPROVED,
  RELEASE_ORIGIN,
} from "../shared/release-target.js";
import { executionPolicyForOrigin } from "../shared/execution-policy.js";

test("local signing defaults and container signing follow the source-reviewed origin policy", () => {
  assert.equal(evmConfig({}).execution.enabled, true);
  const container = evmConfig({ HOST: "0.0.0.0" });
  assert.equal(container.origin, RELEASE_ORIGIN);
  assert.equal(container.execution.enabled, HOSTED_RELEASE_APPROVED);
  assert.equal(container.host, "0.0.0.0");
  assert.equal(
    executionPolicyForOrigin(RELEASE_ORIGIN).enabled,
    HOSTED_RELEASE_APPROVED,
  );
});
test("release configuration rejects invalid ports and unrecognized origins", () => {
  for (const PORT of ["0", "65536", "NaN", "3.5"])
    assert.throws(() => evmConfig({ PORT }));
  for (const APP_ORIGIN of [
    "https://blunts.nubs.site",
    "https://blunt.nubs.site.evil.com",
    "https://blunt.nubs.site/path",
    "https://blunt.nubs.site?sign=1",
  ])
    assert.throws(() => evmConfig({ APP_ORIGIN }));
  assert.throws(() => evmConfig({ HOST: "example.com" }));
});
