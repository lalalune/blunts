import { HOSTED_RELEASE_APPROVED, RELEASE_ORIGIN } from "./release-target.js";

// Owner approved LOCAL signing on 2026-10-28. Publishing/remote activation was
// expressly withheld. No URL/env/storage toggle can expand this origin policy.
export function executionPolicyForOrigin(origin: string | undefined) {
  let enabled = false;
  try {
    const url = new URL(origin ?? "");
    enabled =
      ((url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)) ||
        (HOSTED_RELEASE_APPROVED && url.origin === RELEASE_ORIGIN)) &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash;
  } catch {
    /* Unknown, native and hosted origins remain disabled. */
  }
  return Object.freeze({ chainId: 4663 as const, enabled });
}
