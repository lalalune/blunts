import { getAddress } from "viem";
import { z } from "zod";
import { amountUnits } from "../shared/robinhood";
const savedReview = z
  .object({
    version: z.literal(1),
    chainId: z.literal(4663),
    owner: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
    side: z.enum(["fill", "spark"]),
    amount: z.string().max(32),
    reviewedAt: z.number().int().safe().nonnegative(),
  })
  .strict();
export type SavedReview = z.infer<typeof savedReview>;
export class ReviewStorageError extends Error {
  constructor() {
    super(
      "Saved review could not be read or updated. Existing data was preserved.",
    );
  }
}
export interface ReviewStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
/** Saves the user's reviewed amount only. Quotes, calldata, signatures, account
 * sessions and transaction states are deliberately absent. Resume must requote. */
export class ReviewStore {
  constructor(private storage: ReviewStorage) {}
  private key(owner: string) {
    return `blunts:review:4663:${getAddress(owner).toLowerCase()}`;
  }
  load(owner: string): SavedReview | null {
    try {
      const raw = this.storage.getItem(this.key(owner));
      if (raw === null) return null;
      if (raw.length > 4096) throw Error();
      const value = savedReview.parse(JSON.parse(raw));
      if (
        value.owner.toLowerCase() !== owner.toLowerCase() ||
        value.reviewedAt > Date.now() + 30000
      )
        throw Error();
      amountUnits(value.amount, value.side === "fill" ? 6 : 18);
      return value;
    } catch {
      throw new ReviewStorageError();
    }
  }
  save(owner: string, side: "fill" | "spark", amount: string): SavedReview {
    try {
      this.load(owner);
      amountUnits(amount, side === "fill" ? 6 : 18);
      const value = savedReview.parse({
        version: 1,
        chainId: 4663,
        owner: getAddress(owner),
        side,
        amount,
        reviewedAt: Date.now(),
      });
      this.storage.setItem(this.key(owner), JSON.stringify(value));
      return value;
    } catch {
      throw new ReviewStorageError();
    }
  }
}
