import { RELEASE_ORIGIN } from "../shared/release-target.js";
import { executionPolicyForOrigin } from "../shared/execution-policy.js";

export function evmConfig(env: NodeJS.ProcessEnv) {
  const port = Number(env.PORT ?? 8745);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT must be an integer from 1 to 65535");
  const host = env.HOST ?? "127.0.0.1";
  if (!["127.0.0.1", "0.0.0.0"].includes(host))
    throw new Error("HOST must be 127.0.0.1 or 0.0.0.0");
  // An externally bound server must declare its intended origin explicitly.
  const origin =
    env.APP_ORIGIN ??
    (host === "127.0.0.1" ? `http://localhost:${port}` : RELEASE_ORIGIN);
  const execution = executionPolicyForOrigin(origin);
  if (!execution.enabled && origin !== RELEASE_ORIGIN)
    throw new Error(
      "APP_ORIGIN must be HTTP loopback or the pinned release origin",
    );
  // Release layout: exactly one Caddy proxy, with the app port private/loopback.
  // Development ignores forwarded headers. Do not expose the app port publicly.
  const trustProxy =
    origin === RELEASE_ORIGIN
      ? (_address: string, hop: number) => hop === 0
      : false;
  return Object.freeze({ port, host, origin, execution, trustProxy });
}
