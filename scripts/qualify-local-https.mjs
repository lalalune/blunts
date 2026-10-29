// Local-only TLS/proxy qualification. Requires prebuilt Docker images; never
// publishes DNS, obtains public certificates, trusts a CA in the OS or signs.
import assert from "node:assert/strict";
import { HOSTED_RELEASE_APPROVED } from "../app/shared/release-target.ts";
import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";

const root = resolve(import.meta.dirname, "..");
const appImage = process.argv[2] ?? "blunts-local:release-final";
const suffix = randomUUID().slice(0, 8);
const network = `blunts-tls-${suffix}`;
const app = `${network}-app`;
const proxy = `${network}-proxy`;
const dir = mkdtempSync(join(tmpdir(), "blunts-local-tls-"));
const docker = (...args) =>
  execFileSync("docker", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
const created = [];
try {
  docker("image", "inspect", appImage);
  docker("image", "inspect", "caddy:2-alpine");
  // Validate the exact production file offline; do not start it publicly.
  docker(
    "run",
    "--rm",
    "--network",
    "none",
    "--mount",
    `type=bind,source=${join(root, "infra/Caddyfile")},target=/etc/caddy/Caddyfile,readonly`,
    "caddy:2-alpine",
    "caddy",
    "validate",
    "--config",
    "/etc/caddy/Caddyfile",
    "--adapter",
    "caddyfile",
  );
  writeFileSync(
    join(dir, "Caddyfile"),
    `{
  admin off
  skip_install_trust
  auto_https disable_redirects
}
https://blunt.nubs.site:8443 {
  tls internal
  reverse_proxy blunts-app:8745
}
`,
  );
  docker("network", "create", network);
  created.push("network");
  docker(
    "run",
    "--detach",
    "--name",
    app,
    "--network",
    network,
    "--network-alias",
    "blunts-app",
    appImage,
  );
  created.push(app);
  docker(
    "run",
    "--detach",
    "--name",
    proxy,
    "--network",
    network,
    "--publish",
    "127.0.0.1:8748:8443",
    "--mount",
    `type=bind,source=${join(dir, "Caddyfile")},target=/etc/caddy/Caddyfile,readonly`,
    "caddy:2-alpine",
  );
  created.push(proxy);
  const ca = join(dir, "local-root.crt");
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      docker("cp", `${proxy}:/data/caddy/pki/authorities/local/root.crt`, ca);
      ready = true;
      break;
    } catch {
      await new Promise((done) => setTimeout(done, 250));
    }
  }
  assert.ok(ready, "Disposable CA must become available");
  const curl = (path, options = []) =>
    execFileSync(
      "curl",
      [
        "--noproxy",
        "*",
        "--silent",
        "--show-error",
        "--fail",
        "--max-time",
        "20",
        "--retry",
        "8",
        "--retry-delay",
        "1",
        "--retry-connrefused",
        "--retry-all-errors",
        "--cacert",
        ca,
        "--connect-to",
        "blunt.nubs.site:443:127.0.0.1:8748",
        ...options,
        `https://blunt.nubs.site${path}`,
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
  const health = JSON.parse(curl("/api/health"));
  assert.equal(health.origin, "https://blunt.nubs.site");
  assert.equal(health.transactionsEnabled, HOSTED_RELEASE_APPROVED);
  const headers = curl("/", ["--dump-header", "-"]);
  assert.ok(headers.includes('id="root"'));
  assert.match(headers, /content-security-policy:.*frame-ancestors 'none'/i);
  assert.match(headers, /strict-transport-security:/i);
  const asset = headers.match(/src="([^\"]+\.js)"/);
  assert.ok(asset);
  assert.ok(curl(asset[1]).length > 0);
  // Deliberately omit the CA: failure proves validation was not bypassed.
  let rejectedUntrusted = false;
  try {
    execFileSync(
      "curl",
      [
        "--noproxy",
        "*",
        "--silent",
        "--show-error",
        "--max-time",
        "10",
        "--connect-to",
        "blunt.nubs.site:443:127.0.0.1:8748",
        "https://blunt.nubs.site/api/health",
      ],
      { stdio: "pipe" },
    );
  } catch (error) {
    assert.equal(
      error.status,
      60,
      "The failure must be certificate validation",
    );
    rejectedUntrusted = true;
  }
  assert.ok(rejectedUntrusted);
  // A second real network client exhausts its own budget through Caddy.
  // Rotating spoofed XFF headers must not reset that budget.
  const caPem = execFileSync("cat", [ca], { encoding: "utf8" });
  const flood = docker(
    "exec",
    app,
    "node",
    "--input-type=module",
    "-e",
    `
    import https from "node:https";
    const ca = process.argv[1], hostname = process.argv[2];
    const statuses = [];
    for (let i = 0; i < 91; i++) {
      statuses.push(await new Promise((resolve, reject) => {
        const req = https.get({ hostname, port: 8443, servername: "blunt.nubs.site", ca,
          path: "/api/health", headers: { host: "blunt.nubs.site", "x-forwarded-for": "192.0.2." + (i + 1) } },
          (res) => { res.resume(); res.on("end", () => resolve(res.statusCode)); });
        req.on("error", reject);
        req.setTimeout(5000, () => req.destroy(new Error("timeout")));
      }));
    }
    console.log(JSON.stringify({ first: statuses[0], last: statuses.at(-1), ok: statuses.filter(x => x === 200).length }));
  `,
    "--",
    caPem,
    proxy,
  );
  const budget = JSON.parse(flood);
  assert.equal(budget.first, 200);
  assert.equal(budget.ok, 90);
  assert.equal(budget.last, 429);
  assert.equal(
    JSON.parse(curl("/api/health")).ok,
    true,
    "Other client must retain API access",
  );
  console.log(
    JSON.stringify({
      localOnly: true,
      releaseOrigin: health.origin,
      tlsVerifiedWithDisposableCA: true,
      untrustedCARejected: true,
      productionCaddyfileValidated: true,
      htmlAndAsset: true,
      cspAndHsts: true,
      independentProxyClientBudgets: true,
      spoofedForwardedHeadersIgnored: true,
      hostedSigning: health.transactionsEnabled,
      publicCertificatesRequested: false,
      osTrustChanged: false,
      walletRequests: 0,
      appImage: docker("image", "inspect", "--format", "{{.Id}}", appImage),
      proxyImage: docker(
        "image",
        "inspect",
        "--format",
        "{{.Id}}",
        "caddy:2-alpine",
      ),
    }),
  );
} catch (error) {
  for (const name of created.filter((name) => name !== "network")) {
    try {
      const logs = spawnSync("docker", ["logs", "--tail", "20", name], {
        encoding: "utf8",
      });
      process.stderr.write((logs.stdout ?? "") + (logs.stderr ?? "") + "\n");
    } catch {
      /* Preserve original failure. */
    }
  }
  throw error;
} finally {
  for (const name of [...created].reverse()) {
    try {
      if (name === "network") docker("network", "rm", network);
      else docker("rm", "--force", "--volumes", name);
    } catch (error) {
      process.stderr.write(`Cleanup required for ${name}: ${error.message}\n`);
      process.exitCode = 1;
    }
  }
  rmSync(dir, { recursive: true, force: true });
}
