import { FinalityStatus } from "./FinalityStatus";
import { checkActivityFinality } from "./activity-finality";
import { useEffect, useRef, useState } from "react";
import type { Address } from "viem";
import {
  SwapJournal,
  reconcileSwapAttempt,
  type SwapAttempt,
} from "../shared/swap-journal";
import { trackWalletTransaction } from "./transaction-activity";
import { chainReader } from "./chain";
import { useReceiptPolling } from "./use-receipt-polling";
import { withActivityLock } from "./activity-lock";
import { robinhood } from "../shared/robinhood";
const labels: Record<SwapAttempt["state"], string> = {
  awaiting_wallet: "Wallet response missing",
  unknown: "Outcome unknown",
  cancelled: "Wallet request declined",
  pending: "Waiting for a receipt",
  included: "Confirmed on Robinhood Chain",
  confirmed: "Confirmed on local fork",
  reverted: "Transaction reverted",
  reorged: "Chain inclusion changed",
  mismatch: "Transaction did not match",
  replaced: "Original request replaced",
};
export function TransactionActivity({ owner }: { owner: Address }) {
  const [records, setRecords] = useState<SwapAttempt[]>([]),
    [hash, setHash] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const epoch = useRef(0);
  const inFlight = useRef(false);
  const disclosure = useRef<HTMLDetailsElement>(null);
  const latestRow = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (disclosure.current?.open && records.length)
      latestRow.current?.scrollIntoView({
        block: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  }, [records]);
  useEffect(() => {
    const key = `blunts:swap:4663:${owner.toLowerCase()}`;
    const reload = () => {
      try {
        setRecords(new SwapJournal(window.localStorage, owner, 4663).read());
      } catch {
        setError(
          "Activity could not be read. Existing browser records were preserved.",
        );
      }
    };
    reload();
    const changed = (event: StorageEvent) => {
      if (event.key === key || event.key === null) reload();
    };
    window.addEventListener("storage", changed);
    return () => {
      epoch.current++;
      window.removeEventListener("storage", changed);
    };
  }, [owner]);
  async function track() {
    if (inFlight.current) return;
    inFlight.current = true;
    const version = epoch.current;
    setBusy(true);
    setError("");
    try {
      const journal = new SwapJournal(window.localStorage, owner, 4663);
      await withActivityLock(journal.key, async () => {
        if (version !== epoch.current) return;
        const observed = await trackWalletTransaction(
          hash.trim(),
          owner,
          journal,
        );
        await checkActivityFinality(observed, journal);
      });
      if (version === epoch.current) {
        setRecords(journal.read());
        setHash("");
      }
    } catch {
      if (version === epoch.current)
        setError(
          "This hash could not be verified for your wallet or saved in this browser. Check the hash and try again. No new transaction was sent.",
        );
    } finally {
      inFlight.current = false;
      if (version === epoch.current) setBusy(false);
    }
  }
  async function refresh(record: SwapAttempt) {
    if (inFlight.current) return;
    inFlight.current = true;
    const version = epoch.current;
    setBusy(true);
    setError("");
    try {
      const journal = new SwapJournal(window.localStorage, owner, 4663);
      await withActivityLock(journal.key, async () => {
        if (version !== epoch.current) return;
        const latest = journal
          .read()
          .find((r) => r.planId === record.planId && r.step === record.step);
        if (!latest) throw Error("Saved activity is missing");
        let observed: SwapAttempt;
        if (latest.replacement)
          observed = await trackWalletTransaction(
            latest.replacement.hash,
            owner,
            journal,
            chainReader,
          );
        else
          observed = await reconcileSwapAttempt(latest, chainReader, journal);
        if (["included", "confirmed", "replaced"].includes(observed.state))
          await checkActivityFinality(observed, journal);
      });
      if (version === epoch.current) setRecords(journal.read());
    } catch {
      if (version === epoch.current)
        setError(
          "Receipt check unavailable. Existing transaction records were preserved.",
        );
    } finally {
      inFlight.current = false;
      if (version === epoch.current) setBusy(false);
    }
  }
  useReceiptPolling(
    records.find(
      (r) =>
        !!r.hash && ["pending", "unknown", "awaiting_wallet"].includes(r.state),
    ),
    refresh,
  );
  function downloadActivity() {
    try {
      const journal = new SwapJournal(window.localStorage, owner, 4663);
      const text = JSON.stringify(
        {
          version: 1,
          chainId: 4663,
          wallet: owner,
          exportedAt: new Date().toISOString(),
          records: journal.read(),
        },
        null,
        2,
      );
      const url = URL.createObjectURL(
        new Blob([text], { type: "application/json" }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `blunts-activity-4663-${Date.now()}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError(
        "Activity export is unavailable. Existing browser records were preserved.",
      );
    }
  }
  return (
    <section className="evm-activity" aria-label="Transaction activity">
      <details ref={disclosure}>
        <summary>Activity</summary>
        <div>
          <details className="evm-recovery">
            <summary>Recover a wallet request</summary>{" "}
            <p>
              Track an existing approval, QQQ/USDG swap, or wallet cancellation
              for a saved request. Checking a hash never sends a transaction.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void track();
              }}
            >
              <label>
                Transaction hash
                <input
                  value={hash}
                  onChange={(e) => setHash(e.target.value.trim())}
                  placeholder="0x…"
                  spellCheck={false}
                  autoComplete="off"
                  required
                  pattern="0x[0-9a-fA-F]{64}"
                />
              </label>
              <button
                disabled={busy || !/^0x[0-9a-fA-F]{64}$/.test(hash.trim())}
              >
                {busy ? "Checking…" : "Track transaction"}
              </button>
            </form>
          </details>{" "}
          {records.length > 0 && (
            <button type="button" onClick={downloadActivity}>
              Download activity
            </button>
          )}
          {records.length === 0 ? (
            <p className="evm-fine">No activity yet.</p>
          ) : (
            <ul className="evm-activity-list">
              {records
                .slice()
                .reverse()
                .map((record, index) => (
                  <li
                    key={`${record.planId}:${record.step}`}
                    ref={index === 0 ? latestRow : undefined}
                  >
                    <strong>
                      {record.call.kind === "swap"
                        ? "QQQ / USDG swap"
                        : record.call.kind === "reset"
                          ? "Clear token allowance"
                          : "Token approval"}
                    </strong>
                    <p>{labels[record.state]}</p>
                    <details>
                      <summary>Receipt details</summary>
                      {record.replacement && (
                        <>
                          <p>
                            {record.state !== "replaced"
                              ? "Replacement inclusion needs checking"
                              : record.replacement.outcome === "reverted"
                                ? "Replacement reverted; the original nonce was consumed."
                                : record.replacement.kind === "cancel"
                                  ? "Wallet cancellation included"
                                  : "Equivalent replacement included"}
                          </p>
                          <a
                            href={`${robinhood.blockExplorers!.default.url}/tx/${record.replacement.hash}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View replacement{" "}
                            {record.replacement.hash.slice(0, 10)}…
                          </a>
                          <p>
                            Original request preserved. Review a fresh quote
                            before another request. Independent Ethereum
                            finality is not verified here.
                          </p>
                          {!record.hash && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void refresh(record)}
                            >
                              Check replacement receipt
                            </button>
                          )}
                        </>
                      )}
                      {record.observation === "unavailable" && (
                        <p>
                          Latest receipt check unavailable; showing the last
                          verified state.
                        </p>
                      )}
                      <FinalityStatus record={record} />
                      {!record.hash && !record.replacement ? (
                        <p>
                          Find the hash in your wallet’s activity before trying
                          again. Blunts will not repeat this attempt.
                        </p>
                      ) : record.hash ? (
                        <>
                          <a
                            href={`${robinhood.blockExplorers!.default.url}/tx/${record.hash}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View {record.hash.slice(0, 10)}…
                            {record.hash.slice(-6)}
                          </a>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void refresh(record)}
                          >
                            Check receipt
                          </button>
                        </>
                      ) : null}
                      {record.observedAt && (
                        <small>
                          Last verified{" "}
                          {new Date(record.observedAt).toLocaleString()}
                        </small>
                      )}
                    </details>
                  </li>
                ))}
            </ul>
          )}
          {error && (
            <p className="evm-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </details>
    </section>
  );
}
