import { useState } from "react";
import { cents, dollars, type Kind } from "../shared/money";

export function BluntIcon({
  fill = 1,
  lit = false,
}: {
  fill?: number;
  lit?: boolean;
}) {
  if (!lit)
    return (
      <svg width="56" height="22" viewBox="0 0 56 22" aria-hidden="true">
        <rect x="1" y="3" width="54" height="16" rx="8" fill="#4a2c14" />
        <rect
          x="4"
          y="6"
          width={Math.max(3, 48 * fill)}
          height="10"
          rx="5"
          fill="#8dbb50"
        />
        {[1, 2, 3].map((q) => (
          <line
            key={q}
            x1={4 + 12 * q}
            y1="5"
            x2={4 + 12 * q}
            y2="17"
            stroke="#1c1109"
            strokeWidth="1.4"
            opacity=".6"
          />
        ))}
      </svg>
    );
  return (
    <svg width="46" height="18" viewBox="0 0 46 18" aria-hidden="true">
      <path
        d="M4 5.5 L38 4 Q42 4 42 9 Q42 14 38 14 L4 12.5 Q2 12.3 2 9 Q2 5.7 4 5.5Z"
        fill="#9a6a3c"
      />
      <path
        d="M10 5l-2.5 8M18 4.8l-2.5 8.8M26 4.4l-2.5 9.2M34 4.2l-2.5 9.6"
        stroke="#2c1a0b"
        strokeWidth="1"
        opacity=".5"
      />
      <circle cx="42" cy="9" r="7" fill="#ff6a2b" opacity=".2" />
      <circle cx="42" cy="9" r="3" fill="#ffd27a" />
    </svg>
  );
}

export function AmountPicker({
  kind,
  amount,
  setAmount,
  all,
  setAll,
  available,
}: {
  kind: Kind;
  amount: string;
  setAmount: (s: string) => void;
  all: boolean;
  setAll: (v: boolean) => void;
  available: string;
}) {
  const [mode, setMode] = useState<"blunts" | "cash">("blunts");
  const fill = kind === "fund" || kind === "buy";
  const limit = BigInt(available);
  let value = 0n;
  try {
    value = cents(amount);
  } catch {
    /* Input remains editable until valid. */
  }
  const selected = all ? limit : value;
  const step = fill ? 2500n : 10000n;
  const whole = selected / 10000n;
  const quarter = Number((selected % 10000n) / 2500n);
  const label = all
    ? "ALL"
    : fill
      ? `${whole || ""}${["", "¼", "½", "¾"][quarter]}` || "0"
      : `×${whole || 1n}`;
  const choose = (v: bigint) => {
    setAmount(`${v / 100n}.${String(v % 100n).padStart(2, "0")}`);
    setAll(!fill && kind === "sell" && v >= limit);
  };
  return (
    <div className={`amount-picker ${fill ? "fill" : "spark"}`}>
      <div className="amount-segment" aria-label="Amount mode">
        <button
          type="button"
          aria-label="Blunts"
          aria-pressed={mode === "blunts"}
          onClick={() => setMode("blunts")}
        >
          <BluntIcon fill={0.75} lit={!fill} />
        </button>
        <button
          type="button"
          aria-label="Dollars"
          aria-pressed={mode === "cash"}
          onClick={() => setMode("cash")}
        >
          $
        </button>
      </div>
      {mode === "blunts" ? (
        <>
          <div className="picker-value">
            {dollars(selected).replace(/\.00$/, "")}
          </div>
          <div className="blunt-stepper">
            <button
              type="button"
              aria-label="Less"
              disabled={selected <= step}
              onClick={() => choose(selected > step ? selected - step : step)}
            >
              −
            </button>
            <div className="blunt-selection">
              <div className="blunt-icons">
                {Array.from(
                  {
                    length: Math.min(
                      8,
                      Math.max(1, Number((selected + 9999n) / 10000n)),
                    ),
                  },
                  (_, i) => (
                    <BluntIcon
                      key={i}
                      fill={Math.min(
                        1,
                        Math.max(
                          0,
                          Number(selected - BigInt(i) * 10000n) / 10000,
                        ),
                      )}
                      lit={!fill}
                    />
                  ),
                )}
              </div>
              <strong>{label}</strong>
            </div>
            <button
              type="button"
              aria-label="More"
              disabled={selected >= limit}
              onClick={() =>
                choose(selected + step > limit ? limit : selected + step)
              }
            >
              +
            </button>
          </div>
        </>
      ) : (
        <label className="picker-cash">
          <span>$</span>
          <input
            aria-label="Amount in dollars"
            autoFocus
            inputMode="decimal"
            value={amount}
            disabled={all}
            required
            pattern="[0-9]+(\.[0-9]{1,2})?"
            style={{ width: `${Math.min(10, Math.max(1, amount.length))}ch` }}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
      )}
      {kind === "payout" && (
        <button
          className="picker-max"
          type="button"
          onClick={() => choose(limit)}
        >
          MAX {dollars(limit)}
        </button>
      )}
      {kind === "sell" && (
        <label className="picker-max">
          <input
            type="checkbox"
            aria-label="Sell all available units"
            checked={all}
            onChange={(e) => {
              setAll(e.target.checked);
              if (e.target.checked) choose(limit);
            }}
          />{" "}
          MAX {dollars(limit)}
        </label>
      )}
    </div>
  );
}
