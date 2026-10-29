import type { AccountInfo } from "@solana/web3.js";

/** A recent slot may not have a block-time record yet. Its canonical Clock
 * sysvar can supply time, but must match the requested slot and sysvar owner. */
export function verifiedSolanaTime(
  slot: number,
  blockTime: number | null,
  clock: AccountInfo<Buffer> | null,
  now = Date.now(),
) {
  let time = blockTime;
  if (time === null) {
    if (
      !clock ||
      clock.owner.toBase58() !==
        "Sysvar1111111111111111111111111111111111111" ||
      clock.data.length !== 40 ||
      clock.executable
    )
      throw Error("Trading is temporarily unavailable.");
    const clockSlot = clock.data.readBigUInt64LE(0);
    if (clockSlot > BigInt(slot) + 8n || clockSlot + 8n < BigInt(slot))
      throw Error("Trading is temporarily unavailable.");
    time = Number(clock.data.readBigInt64LE(32));
  }
  if (!Number.isSafeInteger(time) || Math.abs(now / 1000 - time) > 90)
    throw Error("Trading is temporarily unavailable.");
  return time;
}
