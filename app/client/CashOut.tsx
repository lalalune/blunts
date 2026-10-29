import { useEffect, useRef, useState } from "react";
import { cents, dollars } from "../shared/money";

type Draft = {
  key: string;
  quoteId: string;
  amount: string;
  destinationId: string;
};

export function CashOut({
  handle,
  available,
  destinations,
  api,
  onClose,
  onSettings,
  onComplete,
  passwordRequired,
}: {
  handle: string;
  available: string;
  destinations: { id: string; label: string }[];
  api: <T = any>(path: string, body?: unknown, key?: string) => Promise<T>;
  onClose: () => void;
  onSettings: () => void;
  onComplete: () => Promise<void>;
  passwordRequired: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
  const storageKey = `blunts-payout:${handle}`;
  const [draft, setDraft] = useState<Draft | null>(null);
  const [amount, setAmount] = useState(
    `${BigInt(available) / 100n}.${String(BigInt(available) % 100n).padStart(2, "0")}`,
  );
  const [destinationId, setDestinationId] = useState(destinations[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const pending = JSON.parse(stored) as Draft;
        setDraft(pending);
        setAmount(pending.amount);
        setDestinationId(pending.destinationId);
      }
    } catch {
      setError("Browser storage is unavailable. Enable it before cashing out.");
    }
  }, [storageKey]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const password = new FormData(event.currentTarget).get("password");
    inFlight.current = true;
    setBusy(true);
    setError("");
    let command = draft;
    try {
      if (!command) {
        if (cents(amount) > BigInt(available))
          throw new Error("Choose an amount within your available cash.");
        const quote = await api<{ id: string }>("/quotes", {
          kind: "payout",
          amount,
          destinationId,
        });
        command = {
          key: crypto.randomUUID(),
          quoteId: quote.id,
          amount,
          destinationId,
        };
        // Save before submission; never save the password. A lost response must
        // replay this exact intent, including after closing or reloading.
        localStorage.setItem(storageKey, JSON.stringify(command));
        setDraft(command);
      }
      await api(
        "/intents",
        { quoteId: command.quoteId, ...(passwordRequired ? { password } : {}) },
        command.key,
      );
      localStorage.removeItem(storageKey);
      setDraft(null);
      onClose();
      await onComplete();
    } catch (e) {
      const failure = e as Error & { status?: number };
      if (failure.status && [400, 404, 409, 422].includes(failure.status)) {
        localStorage.removeItem(storageKey);
        setDraft(null);
      }
      setError(failure.message || "Check History, then retry this cash-out.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="cash-out-sheet"
      aria-labelledby="cash-out-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="dialog-head">
        <h2 id="cash-out-title">Cash out</h2>
        <button
          type="button"
          className="quiet"
          aria-label="Close cash out"
          disabled={busy}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <p>Move simulated cash to your test destination. No real money moves.</p>
      {destinations.length || draft ? (
        <form onSubmit={submit}>
          {draft && (
            <p role="status">
              This cash-out may already be submitted.{" "}
              {passwordRequired ? "Confirm your password to check" : "Check"}{" "}
              and retry the same instruction safely.
            </p>
          )}
          <label>
            Amount in dollars
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              required
              pattern="[0-9]+(\.[0-9]{1,2})?"
              disabled={busy || !!draft}
            />
          </label>
          <small>
            Available {dollars(available)} · No cash-out fee in this demo
          </small>
          <label>
            Test destination
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              disabled={busy || !!draft}
              required
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          {passwordRequired && (
            <label>
              Confirm password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={busy}
              />
            </label>
          )}
          <button className="primary" disabled={busy}>
            {busy
              ? "Submitting…"
              : draft
                ? "Retry cash out"
                : "Cash out demo funds"}
          </button>
        </form>
      ) : (
        <>
          <p>Add a test destination in Wallet settings first.</p>
          <button className="primary" onClick={onSettings}>
            Add test destination
          </button>
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </dialog>
  );
}
