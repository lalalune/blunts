import { useEffect, useRef, useState } from "react";
import type { WalletAccount } from "@wallet-standard/base";
import { Buffer } from "buffer";
import { VersionedTransaction, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import {
  BanknoteArrowDown,
  Flame,
  Wallet,
  Menu,
  X,
  LoaderCircle,
  Check,
} from "lucide-react";
import { Tray } from "./Tray";
import { withActivityLock } from "./activity-lock";
import {
  compatibleSolanaWallet,
  solanaWalletAccount,
  solanaWalletRegistry,
  type SolanaWallet,
} from "./solana-wallet";
import {
  readSolanaActivity,
  saveSolanaActivity,
  newSolanaActivity,
  unresolvedSolana,
  type SolanaActivity,
} from "./solana-journal";
import {
  solanaExecutionOrigin,
  solanaAmount,
  solanaRawFromDisplay,
  solanaScaledUnits,
  type SolanaReview,
  type SolanaSide,
} from "../shared/solana";
import { formatUnits } from "viem";
import "./evm.css";

async function api<T>(path: string, body?: unknown): Promise<T> {
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 45000);
  try {
    const r = await fetch("/api/solana/" + path, {
      method: body === undefined ? "GET" : "POST",
      headers:
        body === undefined
          ? {}
          : { "content-type": "application/json", "x-blunts-request": "1" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.error || "Please try again.");
    return d;
  } finally {
    clearTimeout(timer);
  }
}
const display = (raw: string, decimals: number, multiplier = 1) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals === 6 ? 6 : 8,
  }).format(Number(formatUnits(BigInt(raw), decimals)) * multiplier);
const minimumDisplay = (raw: string, decimals: number, multiplier = 1) =>
  formatUnits(solanaScaledUnits(BigInt(raw), multiplier), decimals);
export function SolanaApp() {
  const [wallets, setWallets] = useState<SolanaWallet[]>([]),
    [wallet, setWallet] = useState<SolanaWallet | null>(null),
    [account, setAccount] = useState<WalletAccount | null>(null);
  const [walletRevision, setWalletRevision] = useState(0);
  const [sellAll, setSellAll] = useState(true);
  const [panel, setPanel] = useState<"wallet" | "menu" | SolanaSide | null>(
      null,
    ),
    [amount, setAmount] = useState("1"),
    [review, setReview] = useState<SolanaReview | null>(null),
    [eligible, setEligible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [clock, setClock] = useState(Date.now());
  const [market, setMarket] = useState<{
      price: number;
      multiplier: number;
    } | null>(null),
    [balances, setBalances] = useState<{
      cash: string;
      stock: string;
      native: number;
    } | null>(null),
    [records, setRecords] = useState<SolanaActivity[]>([]),
    [storageError, setStorageError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    identity = useRef(0),
    flight = useRef(false),
    prepareEpoch = useRef(0);
  const address = account?.address,
    local = solanaExecutionOrigin(location.origin);
  const reloadActivity = () => {
    try {
      setRecords(readSolanaActivity());
      setStorageError("");
    } catch (e) {
      setStorageError((e as Error).message);
    }
  };
  useEffect(() => {
    const registry = solanaWalletRegistry(),
      update = () => setWallets(registry.get().filter(compatibleSolanaWallet));
    update();
    const off = registry.on("register", update),
      off2 = registry.on("unregister", update);
    return () => {
      off();
      off2();
    };
  }, []);
  useEffect(() => {
    reloadActivity();
    const changed = () => reloadActivity();
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);
  useEffect(() => {
    let stopped = false,
      loading = false;
    const refresh = async () => {
      if (loading) return;
      loading = true;
      try {
        const m = await api<{ price: number; multiplier: number }>("market");
        if (!stopped) setMarket(m);
      } catch {
        if (!stopped) setMarket(null);
      } finally {
        loading = false;
      }
    };
    void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 30000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    identity.current++;
    prepareEpoch.current++;
    setReview(null);
    setEligible(false);
    setBalances(null);
    if (!wallet) return;
    return wallet.features["standard:events"].on("change", () => {
      identity.current++;
      prepareEpoch.current++;
      setReview(null);
      setBalances(null);
      setAccount(wallet.accounts.find(solanaWalletAccount) || null);
      setWalletRevision((v) => v + 1);
    });
  }, [wallet, address]);
  useEffect(() => {
    if (!address) return;
    let stopped = false,
      loading = false;
    const refresh = async () => {
      if (loading) return;
      loading = true;
      try {
        const b = await api<{ cash: string; stock: string; native: number }>(
          "balances?owner=" + address,
        );
        if (!stopped) setBalances(b);
      } catch {
        if (!stopped) setBalances(null);
      } finally {
        loading = false;
      }
    };
    void refresh();
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 15000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [
    address,
    walletRevision,
    records.filter((r) => r.state === "complete").length,
  ]);
  useEffect(() => {
    if (panel) dialog.current?.showModal();
    else dialog.current?.close();
  }, [panel]);
  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  // Receipt observation only. It never signs, sends, or retries a transaction.
  useEffect(() => {
    let stopped = false,
      loading = false;
    const watch = async () => {
      if (loading) return;
      loading = true;
      try {
        const pending = readSolanaActivity().filter(
          (r) => r.signature && r.state === "pending",
        );
        for (const record of pending) {
          try {
            const result = await api<{ state: string }>(
              `receipt?signature=${record.signature}&messageHash=${record.messageHash}`,
            );
            if (stopped) return;
            if (result.state === "complete" || result.state === "failed")
              await withActivityLock(
                `solana:mainnet:${record.owner}`,
                async () => {
                  const latest = readSolanaActivity().find(
                    (r) => r.id === record.id,
                  );
                  if (latest?.state === "pending")
                    saveSolanaActivity({
                      ...latest,
                      state: result.state as "complete" | "failed",
                    });
                },
              );
          } catch {
            /* Unknown outcomes retain the signature and block another send. */
          }
        }
        if (!stopped) reloadActivity();
      } catch (e) {
        if (!stopped) setStorageError((e as Error).message);
      } finally {
        loading = false;
      }
    };
    void watch();
    const timer = setInterval(() => void watch(), 5000);
    const wake = () => {
      if (!document.hidden) void watch();
    };
    document.addEventListener("visibilitychange", wake);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", wake);
    };
  }, []);
  const current = records.find((r) => r.id === review?.id),
    blocked = records.some((r) => r.owner === address && unresolvedSolana(r)),
    waiting = current?.state === "pending" || current?.state === "wallet";
  const cents =
      balances && market
        ? BigInt(
            Math.floor(
              Number(formatUnits(BigInt(balances.stock), 8)) *
                market.multiplier *
                market.price *
                100,
            ),
          )
        : null,
    rolled = (cents ?? 0n) / 10000n;
  function open(next: typeof panel) {
    if (flight.current) return;
    prepareEpoch.current++;
    setPanel(next);
    setReview(null);
    setEligible(false);
    setError("");
    if (next === "fill") setAmount("1");
    if (next === "spark") setSellAll(true);
    if (next === "spark")
      setAmount(balances ? formatUnits(BigInt(balances.stock), 8) : "0");
  }
  async function connect(w: SolanaWallet) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await w.features["standard:connect"].connect();
      const a = result.accounts.find(solanaWalletAccount);
      if (!a) throw Error("Choose a Solana account in your wallet.");
      if (new PublicKey(a.publicKey).toBase58() !== a.address)
        throw Error(
          "Wallet returned a different account. Reconnect to try again.",
        );
      setWallet(w);
      setAccount(a);
      setPanel(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function preview() {
    if (!address || !wallet) {
      open("wallet");
      return;
    }
    if (busy || (panel !== "fill" && panel !== "spark")) return;
    const version = ++prepareEpoch.current,
      who = identity.current;
    setBusy(true);
    setError("");
    setReview(null);
    setEligible(false);
    try {
      if (blocked || storageError)
        throw Error(
          "Your previous trade still needs confirmation. See Activity in the menu.",
        );
      const requested =
        panel === "spark" && !sellAll
          ? formatUnits(
              solanaRawFromDisplay(amount, market?.multiplier ?? 0),
              8,
            )
          : amount;
      const r = await api<SolanaReview>("prepare", {
        owner: address,
        side: panel,
        amount: requested,
      });
      if (version !== prepareEpoch.current || who !== identity.current) return;
      if (
        r.owner !== address ||
        r.side !== panel ||
        r.inAmount !==
          String(solanaAmount(requested, panel === "fill" ? 6 : 8)) ||
        r.expiresAt <= Date.now() ||
        r.expiresAt > Date.now() + 60000
      )
        throw Error("Price changed. Please try again.");
      setReview(r);
    } catch (e) {
      if (version === prepareEpoch.current) setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function sign() {
    if (
      !review ||
      !wallet ||
      !account ||
      !eligible ||
      !local ||
      busy ||
      flight.current
    )
      return;
    const r = review,
      w = wallet,
      a = account,
      who = identity.current;
    flight.current = true;
    setBusy(true);
    setError("");
    try {
      await withActivityLock(`solana:mainnet:${a.address}`, async () => {
        if (
          identity.current !== who ||
          r.owner !== a.address ||
          r.expiresAt <= Date.now() ||
          readSolanaActivity().some(
            (x) => x.owner === a.address && unresolvedSolana(x),
          )
        )
          throw Error("Update your price or wait for the previous trade.");
        let activity = newSolanaActivity(r);
        saveSolanaActivity(activity);
        reloadActivity();
        let signed: Uint8Array;
        try {
          const result = await w.features[
            "solana:signTransaction"
          ].signTransaction({
            account: a,
            chain: "solana:mainnet",
            transaction: Uint8Array.from(Buffer.from(r.transaction, "base64")),
          });
          if (result.length !== 1)
            throw Error("Wallet returned no signed trade.");
          signed = result[0].signedTransaction;
        } catch (e) {
          saveSolanaActivity({ ...activity, state: "unsigned" });
          reloadActivity();
          throw e;
        }
        let tx: VersionedTransaction;
        try {
          tx = VersionedTransaction.deserialize(signed);
          const expected = VersionedTransaction.deserialize(
            Buffer.from(r.transaction, "base64"),
          );
          if (
            identity.current !== who ||
            !Buffer.from(tx.message.serialize()).equals(
              Buffer.from(expected.message.serialize()),
            ) ||
            tx.signatures.length !== 1 ||
            tx.signatures[0].every((n) => n === 0) ||
            !(await crypto.subtle.verify(
              "Ed25519",
              await crypto.subtle.importKey(
                "raw",
                Uint8Array.from(a.publicKey),
                "Ed25519",
                false,
                ["verify"],
              ),
              Uint8Array.from(tx.signatures[0]),
              Uint8Array.from(tx.message.serialize()),
            ))
          ) {
            throw Error("Wallet changed this trade. Nothing was sent.");
          }
        } catch {
          saveSolanaActivity({ ...activity, state: "unsigned" });
          throw Error("Wallet changed this trade. Nothing was sent.");
        }
        activity = {
          ...activity,
          signature: bs58.encode(tx.signatures[0]),
          state: "pending",
        };
        // Persist BEFORE broadcasting; never store signed bytes in localStorage.
        saveSolanaActivity(activity);
        reloadActivity();
        try {
          const result = await api<{
            signature?: string;
            sent?: false;
            error?: string;
          }>("submit", {
            id: r.id,
            transaction: Buffer.from(signed).toString("base64"),
          });
          if (result.sent === false) {
            saveSolanaActivity({ ...activity, state: "failed" });
            setError(result.error || "Nothing was sent. Update price.");
            return;
          }
          if (result.signature !== activity.signature)
            throw Error("Submission returned a different signature.");
        } catch {
          setError(
            "Still checking your trade. Keep this activity saved; don’t send it again.",
          );
        }
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      flight.current = false;
      setBusy(false);
      reloadActivity();
    }
  }
  async function discardUnsigned(record: SolanaActivity) {
    try {
      await withActivityLock(`solana:mainnet:${record.owner}`, async () => {
        const latest = readSolanaActivity().find((r) => r.id === record.id);
        if (latest?.state === "wallet" && !latest.signature)
          saveSolanaActivity({ ...latest, state: "unsigned" });
      });
      reloadActivity();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <header className="scene-header">
        <div className="scene-counts">
          <span className="scene-count">{String(rolled)} rolled</span>
          <span className="scene-count">
            {String(rolled / 10n)} {rolled / 10n === 1n ? "band" : "bands"}
          </span>
        </div>
        <button
          className="menu-button"
          aria-label="Menu"
          onClick={() => open("menu")}
        >
          <Menu size={20} />
        </button>
      </header>
      <main className="scene-main">
        <Tray value={String(cents ?? 0n)} paused={panel !== null} />
        <div className="scene-hud">
          <strong className="scene-value">
            {cents === null
              ? "—"
              : new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(Number(cents) / 100)}
          </strong>
          <div className="scene-cash">
            {address
              ? balances
                ? `${display(balances.cash, 6)} USDC available`
                : "Balance unavailable"
              : "Your wallet. Your stash."}
          </div>
        </div>
        <div className="evm-connect">
          <button onClick={() => open("wallet")}>
            <Wallet size={16} />
            {address
              ? `${address.slice(0, 5)}…${address.slice(-4)}`
              : "Connect wallet"}
          </button>
        </div>
        <div className="scene-dock">
          <button
            className="scene-act fill"
            aria-label="Fill"
            onClick={() => open("fill")}
          >
            <span className="orb">
              <BanknoteArrowDown size={42} />
            </span>
            <span className="lbl">FILL</span>
          </button>
          <button
            className="scene-act spark"
            aria-label="Spark"
            onClick={() => open("spark")}
          >
            <span className="orb">
              <Flame size={42} />
            </span>
            <span className="lbl">SPARK</span>
          </button>
        </div>
      </main>
      <dialog
        ref={dialog}
        className="evm-sheet"
        onCancel={(e) => {
          if (flight.current) e.preventDefault();
          else setPanel(null);
        }}
      >
        <div className="evm-sheet-body">
          <button
            className="evm-close"
            aria-label="Close"
            disabled={busy}
            onClick={() => setPanel(null)}
          >
            <X size={20} />
          </button>
          {panel === "wallet" ? (
            <>
              <h1>{address ? "Your wallet" : "Bring your wallet."}</h1>
              {address ? (
                <>
                  <p className="evm-address">{address}</p>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={async () => {
                      await wallet?.features[
                        "standard:disconnect"
                      ]?.disconnect();
                      setWallet(null);
                      setAccount(null);
                      setPanel(null);
                    }}
                  >
                    Disconnect
                  </button>
                </>
              ) : wallets.length ? (
                wallets.map((w) => (
                  <button
                    className="primary"
                    disabled={busy}
                    key={w.name}
                    onClick={() => void connect(w)}
                  >
                    {w.name}
                  </button>
                ))
              ) : (
                <p>
                  Open Blunts in your Solana wallet’s browser, or install a
                  compatible wallet extension.
                </p>
              )}
            </>
          ) : panel === "menu" ? (
            <>
              <h1>Same ritual.</h1>
              <a href="/">Use an Ethereum wallet</a>
              <p className="evm-fine">
                <a
                  href="https://github.com/lalalune/blunts"
                  target="_blank"
                  rel="noreferrer"
                >
                  Original concept &amp; tray by Shaw
                </a>
              </p>
              <p>
                Fill buys QQQx with USDC. Spark sells it back. Your funds stay
                in your wallet.
              </p>
              <p>
                Every $100 in your stash rolls a blunt. Ten make a band. Your
                stash can rise or fall with the market.
              </p>
              <p>
                Blunts takes 1% of what you receive on each trade. Network costs
                are separate.
              </p>
              <p>
                QQQx tracks QQQ’s economic value; it is not direct ownership of
                ETF shares.{" "}
                <a
                  href="https://assets.backed.fi/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Token details & eligibility
                </a>
              </p>
              <details>
                <summary>Activity</summary>
                {records.filter((r) => r.owner === address).length ? (
                  records
                    .filter((r) => r.owner === address)
                    .slice()
                    .reverse()
                    .map((r) => (
                      <div key={r.id}>
                        <p>
                          {r.side === "fill" ? "Fill" : "Spark"} ·{" "}
                          {r.state === "complete"
                            ? "Complete"
                            : r.state === "failed"
                              ? "Failed"
                              : r.state === "unsigned"
                                ? "Not sent"
                                : r.state === "wallet"
                                  ? "Unfinished review"
                                  : "Confirming…"}
                        </p>
                        {r.signature && (
                          <a
                            href={`https://solscan.io/tx/${r.signature}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View receipt
                          </a>
                        )}
                        {r.state === "wallet" && !r.signature && (
                          <button onClick={() => void discardUnsigned(r)}>
                            Close unsigned review
                          </button>
                        )}
                      </div>
                    ))
                ) : (
                  <p>No trades yet.</p>
                )}
                <button
                  onClick={() => {
                    const blob = new Blob(
                        [JSON.stringify(readSolanaActivity(), null, 2)],
                        { type: "application/json" },
                      ),
                      url = URL.createObjectURL(blob),
                      a = document.createElement("a");
                    a.href = url;
                    a.download = "blunts-solana-activity.json";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Save activity
                </button>
              </details>
            </>
          ) : (
            <>
              <h1>
                {current?.state === "complete"
                  ? panel === "fill"
                    ? "Fill complete."
                    : "Spark complete."
                  : waiting
                    ? current.state === "wallet"
                      ? "Check your wallet."
                      : panel === "fill"
                        ? "Adding to your stash…"
                        : "Returning to your wallet…"
                    : review
                      ? panel === "fill"
                        ? "Review your Fill."
                        : "Review your Spark."
                      : panel === "fill"
                        ? "Fill your stash."
                        : "Spark it back."}
              </h1>
              {current?.state === "complete" ? (
                <>
                  <Check aria-hidden="true" />
                  <button className="primary" onClick={() => setPanel(null)}>
                    Done
                  </button>
                </>
              ) : waiting ? (
                <div className="evm-signing-progress" role="status">
                  <LoaderCircle className="evm-spinner" aria-hidden="true" />
                  <p>
                    {current.state === "wallet"
                      ? "Confirm the trade in your wallet."
                      : "Waiting for confirmation. You can leave this open."}
                  </p>
                </div>
              ) : current?.state === "failed" ||
                current?.state === "unsigned" ? (
                <>
                  <p>
                    {current.state === "failed"
                      ? "This trade failed. Your investment did not move; a network fee may apply."
                      : "Nothing was sent."}
                  </p>
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() => void preview()}
                  >
                    Update price
                  </button>
                </>
              ) : review ? (
                <>
                  <div className="evm-spend">
                    You spend{" "}
                    <strong>
                      {display(
                        review.inAmount,
                        review.side === "fill" ? 6 : 8,
                        review.side === "spark" ? review.multiplier : 1,
                      )}{" "}
                      {review.side === "fill" ? "USDC" : "QQQx"}
                    </strong>
                  </div>
                  <p>
                    You receive about{" "}
                    <strong>
                      {display(
                        review.outAmount,
                        review.side === "fill" ? 8 : 6,
                        review.side === "fill" ? review.multiplier : 1,
                      )}{" "}
                      {review.side === "fill" ? "QQQx" : "USDC"}
                    </strong>
                    .
                  </p>
                  <p className="evm-fine">
                    1% fee included. Network cost up to{" "}
                    {review.nativeCost / 1e9} SOL.
                  </p>
                  <p className="evm-fine">
                    At least{" "}
                    {minimumDisplay(
                      review.minimumOut,
                      review.side === "fill" ? 8 : 6,
                      review.side === "fill" ? review.multiplier : 1,
                    )}{" "}
                    {review.side === "fill" ? "QQQx" : "USDC"}.
                  </p>
                  <label className="check solana-eligibility">
                    <input
                      type="checkbox"
                      checked={eligible}
                      onChange={(e) => setEligible(e.target.checked)}
                    />{" "}
                    <span>
                      I’m an eligible non-U.S. holder.{" "}
                      <a
                        href="https://assets.backed.fi/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Eligibility
                      </a>
                    </span>
                  </label>
                  {clock >= review.expiresAt ? (
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={() => void preview()}
                    >
                      Update price
                    </button>
                  ) : (
                    <button
                      className="primary"
                      disabled={
                        !eligible || busy || !local || blocked || !!storageError
                      }
                      onClick={() => void sign()}
                    >
                      {busy
                        ? "Opening your wallet…"
                        : review.side === "fill"
                          ? "Fill"
                          : "Spark"}
                    </button>
                  )}
                  <button
                    className="quiet"
                    disabled={busy}
                    onClick={() => {
                      setReview(null);
                      setEligible(false);
                    }}
                  >
                    Change amount
                  </button>
                </>
              ) : panel === "spark" && balances?.stock === "0" ? (
                <>
                  <p>Your stash is empty. Fill it first.</p>
                  <button className="primary" onClick={() => open("fill")}>
                    Fill your stash
                  </button>
                </>
              ) : (
                <>
                  <label className="evm-amount">
                    {panel === "fill" ? "USDC to spend" : "QQQx to sell"}
                    <input
                      inputMode="decimal"
                      value={
                        panel === "spark" &&
                        sellAll &&
                        balances &&
                        amount === formatUnits(BigInt(balances.stock), 8)
                          ? display(balances.stock, 8, market?.multiplier ?? 1)
                          : amount
                      }
                      readOnly={panel === "spark" && sellAll}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </label>
                  {panel === "spark" && sellAll && (
                    <p className="evm-fine">
                      Selling your whole stash.{" "}
                      <button
                        className="quiet"
                        onClick={() => {
                          setSellAll(false);
                          setAmount(
                            display(
                              balances?.stock ?? "0",
                              8,
                              market?.multiplier ?? 1,
                            ).replaceAll(",", ""),
                          );
                        }}
                      >
                        Choose amount
                      </button>
                    </p>
                  )}
                  {panel === "spark" && !sellAll && (
                    <button
                      className="quiet"
                      onClick={() => {
                        setSellAll(true);
                        setAmount(
                          formatUnits(BigInt(balances?.stock ?? "0"), 8),
                        );
                      }}
                    >
                      Sell all
                    </button>
                  )}
                  <button
                    className="primary"
                    disabled={busy || !!storageError || blocked || !market}
                    onClick={() => void preview()}
                  >
                    {busy ? "Checking your balance and price…" : "Continue"}
                  </button>
                </>
              )}
            </>
          )}
          {(error || storageError) && (
            <p role="alert" className="evm-error">
              {storageError || error}
            </p>
          )}
          {blocked && !waiting && panel !== "menu" && (
            <p role="status">
              Your previous trade needs confirmation. Open Activity in the menu
              to follow it.
            </p>
          )}
          {!local && (
            <p role="status">Trading isn’t available at this address.</p>
          )}
        </div>
      </dialog>
    </>
  );
}
