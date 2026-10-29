import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { open, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname } from "node:path";
import { z } from "zod";
import type { Database } from "./database.js";
import { Problem, requireThat } from "./domain.js";

const tokensSchema = z.object({
  token: z.string().min(20).max(16384),
  refreshToken: z.string().min(20).max(16384),
  expiresIn: z.number().int().positive().max(86400),
});
const identitySchema = z.object({
  userId: z.string().min(1).max(256),
  wallet: z
    .object({ address: z.string().max(256), agentId: z.string().max(256) })
    .nullable(),
});
export type StewardTokens = z.infer<typeof tokensSchema>;
export type StewardIdentity = z.infer<typeof identitySchema>;
export type StewardConfig = {
  apiUrl: string;
  encryptionKey: Buffer;
  provider?: "steward" | "eliza-cloud";
  accountUrl?: string;
};

export async function stewardConfig(): Promise<StewardConfig | undefined> {
  const provider = process.env.AUTH_PROVIDER ?? "eliza-cloud";
  if (provider === "demo") return;
  requireThat(
    ["steward", "eliza-cloud"].includes(provider),
    "AUTH_PROVIDER must be demo, steward or eliza-cloud.",
    500,
  );
  const cloud = provider === "eliza-cloud";
  const apiUrl = cloud
    ? `${(process.env.ELIZA_CLOUD_API_URL ?? "https://api.eliza.app").replace(/\/+$/, "")}/steward`
    : process.env.STEWARD_API_URL;
  requireThat(apiUrl, "Set STEWARD_API_URL for Steward login.", 500);
  const configured = process.env.STEWARD_SESSION_ENCRYPTION_KEY;
  let key: Buffer;
  if (configured) key = Buffer.from(configured, "base64");
  else {
    requireThat(
      process.env.NODE_ENV !== "production",
      "Set a persistent STEWARD_SESSION_ENCRYPTION_KEY in the secret manager.",
      500,
    );
    const path =
      process.env.STEWARD_SESSION_KEY_FILE ?? "data/steward-session.key";
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    key = await readSessionKeyFile(path);
  }
  requireThat(
    key.length === 32,
    "Steward session encryption requires a 32-byte key.",
    500,
  );
  const accountUrl = cloud
    ? (process.env.ELIZA_CLOUD_WEB_URL ??
      (apiUrl === "https://api.eliza.app/steward"
        ? "https://eliza.app"
        : undefined))
    : process.env.STEWARD_WEB_URL;
  if (accountUrl) {
    const url = new URL(accountUrl);
    requireThat(
      !url.username &&
        !url.password &&
        !url.search &&
        !url.hash &&
        (url.protocol === "https:" ||
          (url.protocol === "http:" &&
            ["localhost", "127.0.0.1"].includes(url.hostname))),
      "Use an HTTPS or loopback account-management URL.",
      500,
    );
  }
  return {
    apiUrl: apiUrl!,
    encryptionKey: key,
    provider: cloud ? "eliza-cloud" : "steward",
    ...(accountUrl ? { accountUrl } : {}),
  };
}

/** Refuse symlinks, other owners and group/world-readable files rather than
 * silently trusting a replacement encryption root on restart. */
export async function readSessionKeyFile(path: string): Promise<Buffer> {
  try {
    const created = await open(
      path,
      constants.O_CREAT |
        constants.O_EXCL |
        constants.O_WRONLY |
        constants.O_NOFOLLOW,
      0o600,
    );
    try {
      await created.writeFile(randomBytes(32));
      await created.sync();
    } finally {
      await created.close();
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await file.stat();
    requireThat(
      stat.isFile() &&
        stat.size === 32 &&
        (stat.mode & 0o077) === 0 &&
        (typeof process.getuid !== "function" || stat.uid === process.getuid()),
      "Session key must be an owner-only 32-byte regular file. Restore its original protected key before restarting.",
      500,
    );
    return await file.readFile();
  } finally {
    await file.close();
  }
}

/** Blunts is a server-side client of the user's Steward service. No platform
 * key, signing key, access token or refresh token is returned to the browser. */
export class Steward {
  readonly issuer: string;
  constructor(private readonly config: StewardConfig) {
    const url = new URL(config.apiUrl);
    requireThat(
      !url.username &&
        !url.password &&
        !url.search &&
        !url.hash &&
        ["/", "/steward", "/steward/"].includes(url.pathname) &&
        (url.protocol === "https:" ||
          (url.protocol === "http:" &&
            ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))),
      "Use an HTTPS or loopback login origin, optionally ending in /steward for Eliza Cloud.",
      500,
    );
    requireThat(
      config.encryptionKey.length === 32,
      "Invalid Steward session encryption key.",
      500,
    );
    this.issuer = `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  }

  async request(path: string, body?: unknown, token?: string): Promise<any> {
    // Cost: one fixed upstream request, no automatic retries, 15s timeout and
    // 128 KiB response budget. Callers own cadence and idempotency semantics.
    let response: Response;
    try {
      response = await fetch(`${this.issuer}${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new Problem(
        503,
        "Steward is unavailable. Your records are safe; try again shortly.",
      );
    }
    let data: any;
    try {
      const reader = response.body?.getReader();
      requireThat(reader, "Missing Steward response.", 502);
      const chunks: Uint8Array[] = [];
      let size = 0;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 131072) {
          await reader.cancel();
          throw new Error("Response budget exceeded");
        }
        chunks.push(value);
      }
      data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      throw new Problem(502, "Steward returned an invalid response.");
    }
    requireThat(
      data && typeof data === "object" && !Array.isArray(data),
      "Steward returned an invalid response.",
      502,
    );
    if (!response.ok || data.ok === false) {
      const status = [400, 401, 403, 404, 409, 429].includes(response.status)
        ? response.status
        : 503;
      throw new Problem(
        status,
        status === 401
          ? "Steward verification expired or was not accepted. Sign in again."
          : status === 429
            ? "Steward is busy. Wait a minute before retrying."
            : "Steward could not complete this step. Check your code or try again.",
      );
    }
    return data;
  }

  async identity(token: string): Promise<StewardIdentity> {
    const result = await this.request("/user/me", undefined, token);
    const parsed = identitySchema.safeParse(result.data);
    requireThat(
      parsed.success,
      "Steward did not verify a personal user account.",
      502,
    );
    return parsed.data;
  }

  async completeSession(
    result: any,
  ): Promise<{ tokens: StewardTokens; identity: StewardIdentity }> {
    let tokens = this.parseTokens(result);
    let identity: StewardIdentity;
    try {
      identity = await this.identity(tokens.token);
    } catch (error) {
      // Cloud pins its app tenant on sign-in. Its owned login service requires
      // a personal session for user-wallet routes. The refresh endpoint checks
      // membership before switching; no Cloud organization key is minted.
      if (!(error instanceof Problem && error.statusCode === 403)) throw error;
      const subject = z.string().min(1).max(256).safeParse(result.user?.id);
      requireThat(
        subject.success,
        "Steward did not confirm a personal identity.",
        502,
      );
      tokens = this.parseTokens(
        await this.request("/auth/refresh", {
          refreshToken: tokens.refreshToken,
          tenantId: `personal-${subject.data}`,
        }),
      );
      identity = await this.identity(tokens.token);
      requireThat(
        identity.userId === subject.data,
        "Steward identity changed during sign-in.",
        401,
      );
    }
    return { tokens, identity };
  }

  parseTokens(value: unknown): StewardTokens {
    const parsed = tokensSchema.safeParse(value);
    requireThat(
      parsed.success,
      "Steward did not issue a complete session.",
      502,
    );
    return parsed.data;
  }

  seal(tokens: StewardTokens, hash: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.config.encryptionKey, iv);
    cipher.setAAD(Buffer.from(`${this.issuer}:${hash}`));
    const body = Buffer.concat([
      cipher.update(JSON.stringify(tokens)),
      cipher.final(),
    ]);
    return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64");
  }

  unseal(value: string, hash: string): StewardTokens {
    try {
      const bytes = Buffer.from(value, "base64");
      const decipher = createDecipheriv(
        "aes-256-gcm",
        this.config.encryptionKey,
        bytes.subarray(0, 12),
      );
      decipher.setAAD(Buffer.from(`${this.issuer}:${hash}`));
      decipher.setAuthTag(bytes.subarray(12, 28));
      return this.parseTokens(
        JSON.parse(
          Buffer.concat([
            decipher.update(bytes.subarray(28)),
            decipher.final(),
          ]).toString(),
        ),
      );
    } catch {
      throw new Problem(
        401,
        "Steward session could not be restored. Sign in again.",
      );
    }
  }

  async saveSession(db: Database, hash: string, tokens: StewardTokens) {
    await db.query("INSERT INTO steward_sessions VALUES ($1,$2,$3,0)", [
      hash,
      this.seal(tokens, hash),
      Date.now() + tokens.expiresIn * 1000,
    ]);
  }

  async verifySession(
    db: Database,
    hash: string,
    user: string,
  ): Promise<StewardIdentity | null> {
    const [stored] = await db.query(
      "SELECT * FROM steward_sessions WHERE hash=$1",
      [hash],
    );
    if (!stored) return null;
    const [identity] = await db.query(
      "SELECT * FROM steward_identities WHERE user_id=$1",
      [user],
    );
    requireThat(
      identity?.issuer === this.issuer,
      "This account belongs to another Steward deployment.",
      401,
    );
    let tokens = this.unseal(stored.sealed, hash);
    if (Number(stored.expires_at) < Date.now() + 30000) {
      if (
        Number(stored.lease_until) > 0 &&
        Number(stored.lease_until) < Date.now()
      ) {
        await db.query("DELETE FROM sessions WHERE hash=$1", [hash]);
        throw new Problem(
          401,
          "Session refresh was interrupted. Sign in again to reconnect safely.",
        );
      }
      const claimed = await db.query(
        "UPDATE steward_sessions SET lease_until=$1 WHERE hash=$2 AND lease_until=0 RETURNING hash",
        [Date.now() + 20000, hash],
      );
      requireThat(
        claimed.length,
        "Your Steward session is refreshing. Try again shortly.",
        503,
      );
      try {
        tokens = this.parseTokens(
          await this.request("/auth/refresh", {
            refreshToken: tokens.refreshToken,
          }),
        );
        const updated = await db.query(
          "UPDATE steward_sessions SET sealed=$1,expires_at=$2,lease_until=0 WHERE hash=$3 RETURNING hash",
          [this.seal(tokens, hash), Date.now() + tokens.expiresIn * 1000, hash],
        );
        requireThat(
          updated.length,
          "Session signed out while refreshing.",
          401,
        );
      } catch {
        // A timeout/crash can follow a successful upstream rotation. Replaying
        // its old token can revoke ALL of the owner's other Cloud sessions.
        // Discard only this local session and require fresh authentication.
        await db.query("DELETE FROM sessions WHERE hash=$1", [hash]);
        throw new Problem(
          401,
          "Session refresh was interrupted. Sign in again to reconnect safely.",
        );
      }
    }
    const current = await this.identity(tokens.token);
    requireThat(
      current.userId === identity.subject,
      "Steward account changed. Sign in again.",
      401,
    );
    return current;
  }

  async revokeSession(db: Database, hash: string) {
    const [stored] = await db.query(
      "SELECT * FROM steward_sessions WHERE hash=$1",
      [hash],
    );
    if (!stored) return;
    const tokens = this.unseal(stored.sealed, hash);
    await this.request("/auth/revoke", { refreshToken: tokens.refreshToken });
  }
}
