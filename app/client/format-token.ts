/** Display only. Truncate rather than overstate a promised minimum. Exact token
 * quantities remain in transaction details and calldata; never parse this back. */
export function formatTokenAmount(raw: string, symbol: "USDG" | "QQQ") {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(raw);
  if (!match) return "—";
  const whole = BigInt(match[1]);
  const fraction = match[2] ?? "";
  const first = fraction.search(/[1-9]/);
  const base = symbol === "USDG" ? 2 : 6;
  const places = whole === 0n && first >= base ? Math.min(18, first + 3) : base;
  let tail = fraction.slice(0, places);
  tail =
    symbol === "USDG" && places === 2
      ? tail.padEnd(2, "0")
      : tail.replace(/0+$/, "");
  return whole.toLocaleString("en-US") + (tail ? `.${tail}` : "");
}
