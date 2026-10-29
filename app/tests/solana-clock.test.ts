import { test } from "node:test";
import assert from "node:assert/strict";
import { PublicKey, type AccountInfo } from "@solana/web3.js";
import { verifiedSolanaTime } from "../server/solana-clock.js";
test("Clock fallback accepts canonical recent time and rejects stale, wrong-owner and distant-slot data", () => {
  const now = 1793268167000,
    data = Buffer.alloc(40);
  data.writeBigUInt64LE(123n, 0);
  data.writeBigInt64LE(BigInt(now / 1000), 32);
  const info: AccountInfo<Buffer> = {
    data,
    owner: new PublicKey("Sysvar1111111111111111111111111111111111111"),
    lamports: 1,
    executable: false,
    rentEpoch: 0,
  };
  assert.equal(verifiedSolanaTime(123, null, info, now), now / 1000);
  assert.equal(verifiedSolanaTime(123, now / 1000, null, now), now / 1000);
  assert.throws(() => verifiedSolanaTime(123, null, null, now));
  assert.throws(() => verifiedSolanaTime(200, null, info, now));
  assert.throws(() =>
    verifiedSolanaTime(123, null, { ...info, owner: PublicKey.default }, now),
  );
  assert.throws(() =>
    verifiedSolanaTime(123, null, { ...info, executable: true }, now),
  );
  assert.throws(() => verifiedSolanaTime(123, null, info, now + 91000));
  assert.throws(() => verifiedSolanaTime(123, now / 1000 - 91, null, now));
});
