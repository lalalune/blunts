// Offline qualification of the UNAPPLIED launch patch. Never edits active source,
// starts a listener, talks to a wallet or makes a network request.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, copyFile, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
import { executionPolicyForOrigin } from "../app/shared/execution-policy.js";
import {
  HOSTED_RELEASE_APPROVED,
  RELEASE_ORIGIN,
} from "../app/shared/release-target.js";

const root = resolve(import.meta.dirname, "..");
const candidate = await mkdtemp(join(tmpdir(), "blunts-release-origin-"));
const activeSource = await readFile(
  join(root, "app/shared/release-target.ts"),
  "utf8",
);
try {
  assert.equal(
    typeof HOSTED_RELEASE_APPROVED,
    "boolean",
    "Approval is source-pinned",
  );
  assert.equal(
    executionPolicyForOrigin(RELEASE_ORIGIN).enabled,
    HOSTED_RELEASE_APPROVED,
  );
  await mkdir(join(candidate, "app/shared"), { recursive: true });
  for (const name of ["release-target.ts", "execution-policy.ts"])
    await copyFile(
      join(root, "app/shared", name),
      join(candidate, "app/shared", name),
    );
  execFileSync("git", ["init", "--quiet", candidate]);
  const patch = join(root, "infra/approval/enable-hosted-signing.patch");
  if (!HOSTED_RELEASE_APPROVED) {
    execFileSync("git", ["apply", "--check", patch], { cwd: candidate });
    execFileSync("git", ["apply", patch], { cwd: candidate });
  }
  const { executionPolicyForOrigin: candidatePolicy } = await import(
    pathToFileURL(join(candidate, "app/shared/execution-policy.ts")).href
  );
  for (const origin of [
    RELEASE_ORIGIN,
    "http://localhost:8745",
    "http://127.0.0.1:8745",
  ])
    assert.equal(candidatePolicy(origin).enabled, true, origin);
  const denied = [
    undefined,
    "https://blunts.nubs.site",
    "http://blunt.nubs.site",
    "https://blunt.nubs.site:8443",
    "https://blunt.nubs.site.evil.example",
    "https://other.nubs.site",
    "https://blunt.nubs.site@evil.example",
    "https://user:secret@blunt.nubs.site",
    "https://blunt.nubs.site/path",
    "https://blunt.nubs.site/?enable=true",
    "https://blunt.nubs.site/#enable",
    "capacitor://localhost",
    "http://192.168.1.1",
    "https://localhost",
  ];
  for (const origin of denied)
    assert.equal(candidatePolicy(origin).enabled, false, origin ?? "undefined");
  assert.equal(
    await readFile(join(root, "app/shared/release-target.ts"), "utf8"),
    activeSource,
  );
  console.log(
    JSON.stringify({
      releaseOrigin: RELEASE_ORIGIN,
      activeHostedSigning: HOSTED_RELEASE_APPROVED,
      unappliedPatchQualified: true,
      allowedOrigins: 3,
      deniedOrigins: denied.length,
      networkRequests: 0,
      walletRequests: 0,
    }),
  );
} finally {
  await rm(candidate, { recursive: true, force: true });
}
