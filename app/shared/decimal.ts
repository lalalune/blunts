/** Exact decimal wire amounts. No cents/fixture-price assumptions and no
 * rounding of values the selected provider cannot represent.
 */
export function atomic(value: string, decimals = 6): bigint {
  if (
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 18 ||
    !/^(0|[1-9]\d{0,12})(\.\d+)?$/.test(value)
  )
    throw new Error("Invalid decimal amount.");
  const [whole, fraction = ""] = value.split(".");
  if (fraction.length > decimals)
    throw new Error("Amount exceeds supported precision.");
  return (
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt(fraction.padEnd(decimals, "0") || "0")
  );
}
export function decimal(value: bigint, decimals = 6): string {
  if (
    value < 0n ||
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 18
  )
    throw new Error("Invalid atomic amount.");
  const scale = 10n ** BigInt(decimals);
  return decimals
    ? `${value / scale}.${String(value % scale).padStart(decimals, "0")}`
    : String(value);
}
export function providerNumber(value: string, decimals = 6): number {
  const units = atomic(value, decimals);
  const result = Number(value);
  if (
    units > BigInt(Number.MAX_SAFE_INTEGER) ||
    !Number.isFinite(result) ||
    atomic(String(result), decimals) !== units
  )
    throw new Error("Amount cannot be represented safely by the provider SDK.");
  return result;
}
