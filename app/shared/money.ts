export const SHARE_SCALE = 1_000_000n;
export const PRICE_CENTS = 50_000n; // Deterministic sandbox fixture, never a market quote.
export const MAX_CENTS = 100_000_000n; // Sandbox exposure limit, not a fee cap.
export const KINDS = ["fund", "buy", "sell", "payout"] as const;
export type Kind = (typeof KINDS)[number];
export function cents(value: string): bigint {
  if (!/^(0|[1-9]\d{0,8})(\.\d{1,2})?$/.test(value))
    throw new Error("Enter a dollar amount with up to two decimals.");
  const [whole, fraction = ""] = value.split(".");
  const amount = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (amount <= 0n || amount > MAX_CENTS)
    throw new Error("Sandbox amount must be between $0.01 and $1,000,000.");
  return amount;
}
export function fee(gross: bigint): bigint {
  return (gross + 50n) / 100n;
}
export function dollars(amount: string | bigint): string {
  const n = BigInt(amount);
  const a = n < 0n ? -n : n;
  return `${n < 0n ? "-" : ""}$${(a / 100n).toLocaleString("en-US")}.${String(a % 100n).padStart(2, "0")}`;
}
export function quantity(units: string | bigint): string {
  const a = BigInt(units);
  return `${a / SHARE_SCALE}.${String(a % SHARE_SCALE).padStart(6, "0")}`;
}
export function quoteNumbers(kind: Kind, amount: bigint, allUnits?: bigint) {
  let gross = amount,
    units = 0n,
    net = amount,
    charge = 0n,
    debit = amount;
  if (kind === "buy") {
    charge = fee(amount);
    units = ((amount - charge) * SHARE_SCALE) / PRICE_CENTS;
    net = (units * PRICE_CENTS) / SHARE_SCALE;
    debit = net + charge;
    if (units <= 0n || net <= 0n)
      throw new Error("Amount is too small after fees.");
  }
  if (kind === "sell") {
    units = allUnits ?? (amount * SHARE_SCALE) / PRICE_CENTS;
    gross = (units * PRICE_CENTS) / SHARE_SCALE;
    charge = fee(gross);
    net = gross - charge;
    debit = 0n;
    if (units <= 0n || net <= 0n)
      throw new Error("Amount is too small after fees.");
  }
  return {
    gross: gross.toString(),
    fee: charge.toString(),
    net: net.toString(),
    units: units.toString(),
    debit: debit.toString(),
    price: PRICE_CENTS.toString(),
  };
}
