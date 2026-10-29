import { formatTokenAmount } from "./format-token";
import { quoteAfterFee } from "../shared/app-fee";
import { executionPolicyForOrigin } from "../shared/execution-policy";
import { WalletSigning, type WalletProgress } from "./WalletSigning";
import { useEffect, useRef, useState } from "react";
import { formatUnits, type Address } from "viem";
import {
  BanknoteArrowDown,
  Flame,
  Wallet,
  Menu,
  X,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";
import { HowItWorks } from "./HowItWorks";
import { request } from "./platform";
import { mobileWalletHandoff } from "../shared/mobile-wallet";
import { Tray } from "./Tray";
import {
  robinhood,
  stock,
  cash,
  tokenAbi,
  amountUnits,
  type Market,
  type SwapQuote,
} from "../shared/robinhood";
import "./evm.css";
import { chainReader as reader } from "./chain";
import { prepareSwap, InsufficientTokenBalanceError } from "./prepare-swap";
import {
  ReviewStore,
  ReviewStorageError,
  type SavedReview,
} from "./review-store";
import { ReferenceGapError } from "../shared/reference-price";
import { TransactionActivity } from "./TransactionActivity";
import { estimateFirstStepFee, type StepFee } from "./gas-readiness";
import type { SwapPlan } from "../shared/swap-plan";
type Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<any>;
  on?: (name: string, fn: (value: any) => void) => void;
  removeListener?: (name: string, fn: (value: any) => void) => void;
  off?: (name: string, fn: (value: any) => void) => void;
};
type WalletChoice = { id: string; name: string; provider: Provider };
const usd = (value: bigint) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(value) / 100,
  );
export function EvmApp() {
  const [wallets, setWallets] = useState<WalletChoice[]>([]),
    [provider, setProvider] = useState<Provider | null>(null),
    [account, setAccount] = useState<Address | null>(null),
    [chain, setChain] = useState<number | null>(null),
    [walletRevision, setWalletRevision] = useState(0),
    [networkSetup, setNetworkSetup] = useState<"unknown" | "missing" | "added">(
      "unknown",
    ),
    [market, setMarket] = useState<Market | null>(null),
    [balances, setBalances] = useState<{
      cash: bigint;
      stock: bigint;
      eth: bigint;
    } | null>(null),
    [panel, setPanel] = useState<
      "wallet" | "menu" | "how" | "fill" | "spark" | null
    >(null),
    [amount, setAmount] = useState("25"),
    [quote, setQuote] = useState<SwapQuote | null>(null),
    [prepared, setPrepared] = useState<SwapPlan | null>(null),
    [walletProgress, setWalletProgress] = useState<WalletProgress>("review"),
    [sellAll, setSellAll] = useState(false),
    [stepFee, setStepFee] = useState<StepFee | null>(null),
    [feeUnavailable, setFeeUnavailable] = useState(false),
    [savedReview, setSavedReview] = useState<SavedReview | null>(null),
    [reviewStorageError, setReviewStorageError] = useState(""),
    [restoredReview, setRestoredReview] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [marketError, setMarketError] = useState(""),
    [clock, setClock] = useState(Date.now());
  const networkInFlight = useRef(false);
  const quoteEpoch = useRef(0);
  const balanceEpoch = useRef(0);
  const epoch = useRef(0),
    dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const announce = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail?.provider || typeof detail.info?.uuid !== "string") return;
      setWallets((items) =>
        items.some((w) => w.provider === detail.provider)
          ? items
          : [
              ...items,
              {
                id: detail.info.uuid,
                name: String(detail.info.name).slice(0, 60),
                provider: detail.provider,
              },
            ],
      );
    };
    window.addEventListener("eip6963:announceProvider", announce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const fallback = (window as unknown as { ethereum?: Provider }).ethereum;
    if (fallback)
      setWallets((items) =>
        items.some((w) => w.provider === fallback)
          ? items
          : [
              ...items,
              { id: "injected", name: "Browser wallet", provider: fallback },
            ],
      );
    return () =>
      window.removeEventListener("eip6963:announceProvider", announce);
  }, []);
  useEffect(() => {
    let stopped = false,
      loading = false;
    async function update() {
      if (loading || stopped) return;
      loading = true;
      try {
        const r = await request("/onchain/market", undefined, {});
        const d = r.data;
        if (!r.ok) throw Error(d.error);
        if (!stopped) {
          setMarket(d);
          setMarketError("");
        }
      } catch {
        if (!stopped) {
          setMarket(null);
          setMarketError("Market data unavailable. Refresh to try again.");
        }
      } finally {
        loading = false;
      }
    }
    void update();
    const visible = () => {
      if (!document.hidden) void update();
    };
    document.addEventListener("visibilitychange", visible);
    const timer = setInterval(() => {
      if (!document.hidden) void update();
    }, 30000);
    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", visible);
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    quoteEpoch.current++;
    if (panel) dialog.current?.showModal();
    else dialog.current?.close();
    setError("");
    setQuote(null);
    setPrepared(null);
    setStepFee(null);
    setWalletProgress("review");
  }, [panel]);
  useEffect(() => {
    if (!quote) return;
    setClock(Date.now());
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [quote]);
  useEffect(() => {
    if (!provider) return;
    const invalidate = () => {
      epoch.current++;
      setWalletRevision((version) => version + 1);
      quoteEpoch.current++;
      balanceEpoch.current++;
      setBalances(null);
      setQuote(null);
      setPrepared(null);
      setStepFee(null);
    };
    const accountsChanged = (raw: unknown) => {
      const accounts = Array.isArray(raw) ? raw : [];
      invalidate();
      setAccount(
        /^0x[0-9a-fA-F]{40}$/.test(accounts[0] ?? "")
          ? (accounts[0] as Address)
          : null,
      );
      setBalances(null);
      setQuote(null);
    };
    const chainChanged = (value: unknown) => {
      invalidate();
      setChain(
        typeof value === "string" &&
          /^0x[0-9a-fA-F]+$/.test(value) &&
          Number.isSafeInteger(Number(value))
          ? Number(value)
          : null,
      );
    };
    const disconnected = () => {
      invalidate();
      setProvider(null);
      setAccount(null);
      setChain(null);
    };
    provider.on?.("disconnect", disconnected);
    provider.on?.("accountsChanged", accountsChanged);
    provider.on?.("chainChanged", chainChanged);
    return () => {
      const remove = provider.removeListener ?? provider.off;
      remove?.call(provider, "disconnect", disconnected);
      remove?.call(provider, "accountsChanged", accountsChanged);
      remove?.call(provider, "chainChanged", chainChanged);
    };
  }, [provider]);
  async function refreshBalances() {
    if (!account || chain !== 4663) return;
    const version = epoch.current;
    const readVersion = ++balanceEpoch.current;
    try {
      const [c, s, e] = await Promise.all([
        reader.readContract({
          address: cash.address,
          abi: tokenAbi,
          functionName: "balanceOf",
          args: [account],
        }),
        reader.readContract({
          address: stock.address,
          abi: tokenAbi,
          functionName: "balanceOf",
          args: [account],
        }),
        reader.getBalance({ address: account }),
      ]);
      if (version === epoch.current && readVersion === balanceEpoch.current)
        setBalances({ cash: c, stock: s, eth: e });
    } catch {
      if (version === epoch.current && readVersion === balanceEpoch.current) {
        setBalances(null);
        setError("Could not read wallet balances. Try refreshing.");
      }
    }
  }
  useEffect(() => {
    void refreshBalances();
  }, [account, chain, walletRevision]);
  async function connect(choice: WalletChoice) {
    setBusy(true);
    setError("");
    try {
      const accounts = await choice.provider.request({
        method: "eth_requestAccounts",
      });
      const selected = accounts?.[0];
      if (!/^0x[0-9a-fA-F]{40}$/.test(selected ?? "")) throw Error();
      const id = Number(
        await choice.provider.request({ method: "eth_chainId" }),
      );
      epoch.current++;
      setProvider(choice.provider);
      setAccount(selected);
      setChain(id);
      setBalances(null);
      setPanel(null);
    } catch {
      setError("Wallet connection was cancelled or unavailable. Try again.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    setNetworkSetup("unknown");
  }, [provider, account]);
  async function switchChain() {
    if (!provider || networkInFlight.current) return;
    networkInFlight.current = true;
    const adding = networkSetup === "missing";
    setBusy(true);
    setError("");
    const version = ++epoch.current;
    quoteEpoch.current++;
    setBalances(null);
    setQuote(null);
    setPrepared(null);
    setStepFee(null);
    try {
      await provider.request(
        adding
          ? {
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0x1237",
                  chainName: robinhood.name,
                  nativeCurrency: { ...robinhood.nativeCurrency },
                  rpcUrls: [...robinhood.rpcUrls.default.http],
                  blockExplorerUrls: [robinhood.blockExplorers!.default.url],
                },
              ],
            }
          : {
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x1237" }],
            },
      );
      const id = Number(await provider.request({ method: "eth_chainId" }));
      if (adding) setNetworkSetup("added");
      // A chainChanged event can finish its balance read before this request
      // resolves. Its newer epoch owns the view; do not erase it afterward.
      if (version === epoch.current) setChain(id);
    } catch (failure) {
      const code =
        failure && typeof failure === "object" && "code" in failure
          ? failure.code
          : undefined;
      if (!adding && code === 4902) {
        setNetworkSetup("missing");
        setError("");
      } else if (code === 4001) {
        setError(
          adding
            ? "Network addition was cancelled. You can try again."
            : "Network switch was cancelled. You can try again.",
        );
      } else {
        setError(
          adding
            ? "Your wallet could not add the network. Add Robinhood Chain using the details shown, then switch."
            : "Select Robinhood Chain (4663) in your wallet, then reconnect.",
        );
      }
    } finally {
      networkInFlight.current = false;
      setBusy(false);
    }
  }
  useEffect(() => {
    setPrepared(null);
    setStepFee(null);
    setFeeUnavailable(false);
  }, [quote, account, chain]);
  useEffect(() => {
    setSavedReview(null);
    setReviewStorageError("");
    setRestoredReview(false);
    if (!account || chain !== 4663) return;
    try {
      setSavedReview(new ReviewStore(window.localStorage).load(account));
    } catch {
      setReviewStorageError(
        "Saved review is unavailable. Existing browser data was preserved.",
      );
    }
  }, [account, chain]);
  function resumeReview() {
    if (
      !account ||
      chain !== 4663 ||
      savedReview?.owner.toLowerCase() !== account.toLowerCase()
    )
      return;
    setAmount(savedReview.amount);
    setPanel(savedReview.side);
    setRestoredReview(true);
  }
  async function reviewSteps(reviewQuote: SwapQuote | null = quote) {
    const quote = reviewQuote;
    if (!quote || quote.side !== panel || !account || chain !== 4663 || !market)
      return;
    const version = quoteEpoch.current,
      identity = epoch.current;
    setBusy(true);
    setError("");
    setPrepared(null);
    try {
      const plan = await prepareSwap(quote, account, reader, 4663, market);
      const fee = await estimateFirstStepFee(plan).catch(() => null);
      if (version === quoteEpoch.current && identity === epoch.current) {
        const saved = new ReviewStore(window.localStorage).save(
          account,
          quote.side,
          quote.amountIn,
        );
        setSavedReview(saved);
        setReviewStorageError("");
        setStepFee(fee);
        setFeeUnavailable(fee === null);
        setPrepared(plan);
      }
    } catch (failure) {
      if (version === quoteEpoch.current && identity === epoch.current)
        setError(
          failure instanceof ReferenceGapError ||
            failure instanceof ReviewStorageError ||
            failure instanceof InsufficientTokenBalanceError
            ? failure.message
            : "Wallet steps could not be verified or saved. Check your balance and preview again.",
        );
    } finally {
      setBusy(false);
    }
  }
  async function preview() {
    if (panel !== "fill" && panel !== "spark") return;
    const version = ++quoteEpoch.current;
    const identity = epoch.current;
    setRestoredReview(false);
    setBusy(true);
    setError("");
    setQuote(null);
    setPrepared(null);
    setStepFee(null);
    try {
      amountUnits(amount, panel === "fill" ? 6 : 18);
      const response = await request(
        `/onchain/quote?side=${panel}&amount=${encodeURIComponent(amount)}`,
        undefined,
        {},
      );
      const data = response.data;
      if (!response.ok) throw Error(data.error);
      if (
        data.side !== panel ||
        amountUnits(data.amountIn, panel === "fill" ? 6 : 18) !==
          amountUnits(amount, panel === "fill" ? 6 : 18)
      )
        throw Error("This price didn't match your amount. Please try again.");
      if (version === quoteEpoch.current && identity === epoch.current) {
        setQuote(data);
        if (account && chain === 4663 && market) await reviewSteps(data);
      }
    } catch (e) {
      if (version === quoteEpoch.current && identity === epoch.current)
        setError(
          e instanceof Error ? e.message : "Quote unavailable. Try again.",
        );
    } finally {
      setBusy(false);
    }
  }
  let value: bigint | null = null;
  try {
    if (market && balances)
      value =
        (balances.stock *
          amountUnits(market.bid, 18) *
          amountUnits(market.multiplier, 18)) /
        10n ** 52n;
  } catch {
    /* Unverified values stay unavailable. */
  }
  const mobileHandoff = mobileWalletHandoff(
    import.meta.env.VITE_NATIVE_BUILD === "true"
      ? import.meta.env.VITE_PUBLIC_APP_ORIGIN
      : window.location.origin,
  );
  const signingEnabled =
    executionPolicyForOrigin(window.location.origin).enabled &&
    market?.transactionsEnabled === true;
  const rolled = (value ?? 0n) / 10000n;
  const short = account
    ? `${account.slice(0, 6)}…${account.slice(-4)}`
    : "Connect wallet";
  return (
    <>
      <header className="scene-header">
        <div className="scene-counts">
          <span className="scene-count">{rolled.toString()} rolled</span>
          <span className="scene-count">
            {(rolled / 10n).toString()} {rolled / 10n === 1n ? "band" : "bands"}
          </span>
        </div>
        <button
          className="menu-button"
          aria-label="Menu"
          onClick={() => setPanel("menu")}
        >
          <Menu size={20} />
        </button>
      </header>
      <main className="scene-main">
        <Tray value={String(value ?? 0n)} paused={panel !== null} />
        <div className="scene-hud">
          <strong className="scene-value">
            {value === null ? "—" : usd(value)}
          </strong>
          <div className="scene-cash">
            {account
              ? balances
                ? `${formatTokenAmount(formatUnits(balances.cash, 6), "USDG")} USDG available`
                : "Wallet balance unavailable"
              : "Your wallet. Your stash."}
          </div>
        </div>
        <div className="evm-connect">
          <button onClick={() => setPanel("wallet")}>
            <Wallet size={16} />
            {short}
          </button>
        </div>
        {marketError && (
          <p className="evm-market-error" role="status">
            {marketError}
          </p>
        )}
        <div className="scene-dock">
          <button
            className="scene-act fill"
            aria-label="Fill"
            onClick={() => {
              setSellAll(false);
              setAmount("1");
              setPanel("fill");
            }}
          >
            <span className="orb">
              <BanknoteArrowDown size={42} strokeWidth={2.2} />
            </span>
            <span className="lbl">FILL</span>
          </button>
          <button
            className="scene-act spark"
            aria-label="Spark"
            onClick={() => {
              setSellAll(!!balances?.stock);
              setAmount(balances ? formatUnits(balances.stock, 18) : "0");
              setPanel("spark");
            }}
          >
            <span className="orb">
              <Flame size={42} strokeWidth={2.2} />
            </span>
            <span className="lbl">SPARK</span>
          </button>
        </div>
      </main>
      <dialog
        ref={dialog}
        className="evm-sheet"
        onCancel={() => setPanel(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setPanel(null);
        }}
      >
        <div className="evm-sheet-body">
          <button
            className="evm-close"
            aria-label="Close"
            onClick={() => setPanel(null)}
          >
            <X size={20} />
          </button>
          {panel === "wallet" ? (
            <>
              <h1>{account ? "Your wallet" : "Bring your wallet."}</h1>
              <p>
                {account
                  ? "Your funds stay in your wallet."
                  : "Choose your wallet to get started."}
              </p>
              {account ? (
                <>
                  <p className="evm-address">
                    {account.slice(0, 6)}…{account.slice(-4)}
                  </p>
                  <p>
                    {chain === 4663
                      ? "Connected to Robinhood Chain."
                      : `Your wallet is on chain ${chain}.`}
                  </p>
                  {chain !== 4663 ? (
                    <>
                      {networkSetup === "missing" && (
                        <section
                          className="evm-network-details"
                          aria-label="Robinhood Chain network details"
                        >
                          <p>
                            Your wallet needs Robinhood Chain. Review these
                            details in its network prompt.
                          </p>
                          <dl>
                            <dt>Network</dt>
                            <dd>Robinhood Chain · 4663</dd>
                            <dt>Gas token</dt>
                            <dd>ETH · 18 decimals</dd>
                            <dt>RPC</dt>
                            <dd>
                              <code>{robinhood.rpcUrls.default.http[0]}</code>
                            </dd>
                          </dl>
                        </section>
                      )}
                      {networkSetup === "added" && (
                        <p role="status">
                          Network added. Switch to Robinhood Chain to continue.
                        </p>
                      )}
                      <button
                        className="primary"
                        disabled={busy}
                        onClick={switchChain}
                      >
                        {networkSetup === "missing"
                          ? "Add Robinhood Chain"
                          : "Switch to Robinhood Chain"}
                      </button>
                    </>
                  ) : (
                    <button
                      disabled={busy}
                      onClick={() => void refreshBalances()}
                    >
                      <RefreshCw size={16} /> Refresh balances
                    </button>
                  )}
                  <a
                    href={`${robinhood.blockExplorers!.default.url}/address/${account}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View wallet <ArrowUpRight size={14} />
                  </a>
                  {savedReview &&
                    chain === 4663 &&
                    savedReview.owner.toLowerCase() ===
                      account.toLowerCase() && (
                      <section className="evm-saved" aria-label="Saved review">
                        <h2>Pick up your review.</h2>
                        <p>
                          {savedReview.side === "fill" ? "Fill" : "Spark"} ·{" "}
                          {savedReview.amount}{" "}
                          {savedReview.side === "fill" ? "USDG" : "QQQ"}
                        </p>
                        <button onClick={resumeReview}>
                          Resume{" "}
                          {savedReview.side === "fill" ? "Fill" : "Spark"}{" "}
                          review
                        </button>
                      </section>
                    )}
                  {chain === 4663 && (
                    <TransactionActivity
                      key={account.toLowerCase()}
                      owner={account}
                    />
                  )}
                  {reviewStorageError && (
                    <p className="evm-error" role="status">
                      {reviewStorageError}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      epoch.current++;
                      setProvider(null);
                      setAccount(null);
                      setBalances(null);
                      setChain(null);
                      setPanel(null);
                    }}
                  >
                    Disconnect from Blunts
                  </button>
                </>
              ) : wallets.length ? (
                wallets.map((w) => (
                  <button
                    className="evm-wallet-choice"
                    key={w.id}
                    disabled={busy}
                    onClick={() => void connect(w)}
                  >
                    <Wallet size={20} />
                    {w.name}
                  </button>
                ))
              ) : (
                <div className="evm-wallet-help">
                  <p className="evm-note">
                    No browser wallet detected. Use an EVM wallet extension
                    here, or open Blunts in your mobile wallet’s browser.
                  </p>
                  {mobileHandoff ? (
                    <>
                      <a
                        className="evm-wallet-handoff"
                        href={mobileHandoff}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open in MetaMask mobile
                      </a>
                      <p className="evm-fine">
                        Opens this app’s public address in MetaMask. Connect
                        there to continue. Browser history and saved reviews
                        stay separate.
                      </p>
                    </>
                  ) : (
                    <p className="evm-fine">
                      This localhost preview cannot be opened on another device.
                      A public HTTPS app address is needed for mobile handoff;
                      nothing has been published.
                    </p>
                  )}
                </div>
              )}
              <p className="evm-fine">
                Connecting only requests your public address. Blunts never asks
                for a seed phrase or private key.
              </p>
            </>
          ) : panel === "menu" ? (
            <>
              <a href="/sol">Use a Solana wallet</a>
              <p className="evm-fine">
                <a
                  href="https://github.com/lalalune/blunts"
                  target="_blank"
                  rel="noreferrer"
                >
                  Original concept &amp; tray by Shaw
                </a>
              </p>
              <button onClick={() => setPanel("how")}>How it works</button>
              <h1>
                Same ritual.
                <br />
                Your own wallet.
              </h1>
              <p>
                Fill swaps USDG into Robinhood’s QQQ token. Spark swaps it back
                into USDG in your wallet.
              </p>
              <p>
                This version reads real market data and previews swaps. It only
                requests a transaction after you choose a step and approve in
                your wallet. Blunts takes 1% of the tokens received on each
                swap. Bank withdrawals are not connected.
              </p>
              <p>
                QQQ tokens provide economic exposure; they are not direct
                ownership of QQQ shares. Available only in eligible regions,
                excluding US persons.
              </p>
              <a
                href="https://docs.robinhood.com/chain/stock-tokens/"
                target="_blank"
                rel="noreferrer"
              >
                Token details & eligibility <ArrowUpRight size={14} />
              </a>
            </>
          ) : panel === "how" ? (
            <HowItWorks
              mode="wallet"
              signingEnabled={signingEnabled}
              onDone={() => setPanel("menu")}
            />
          ) : (
            <>
              <h1>
                {walletProgress === "approval"
                  ? "Confirming permission…"
                  : walletProgress === "swap"
                    ? panel === "fill"
                      ? "Adding to your stash…"
                      : "Returning to your wallet…"
                    : walletProgress === "wallet"
                      ? "Check your wallet."
                      : walletProgress === "complete"
                        ? panel === "fill"
                          ? "Fill complete."
                          : "Spark complete."
                        : prepared
                          ? panel === "fill"
                            ? "Review your Fill."
                            : "Review your Spark."
                          : panel === "fill"
                            ? "Fill your stash."
                            : "Spark it back."}
              </h1>
              {prepared ? (
                walletProgress === "review" && (
                  <div className="evm-spend">
                    <span>
                      You spend{" "}
                      <strong>
                        {formatTokenAmount(
                          prepared.quote.amountIn,
                          panel === "fill" ? "USDG" : "QQQ",
                        )}{" "}
                        {panel === "fill" ? "USDG" : "QQQ"}
                      </strong>
                    </span>
                    <button
                      className="evm-edit"
                      onClick={() => {
                        quoteEpoch.current++;
                        setQuote(null);
                        setPrepared(null);
                        setStepFee(null);
                        setError("");
                      }}
                    >
                      Change amount
                    </button>
                  </div>
                )
              ) : (
                <>
                  {panel === "spark" && account && balances?.stock === 0n ? (
                    <>
                      <p>Your stash is empty. Fill it first.</p>
                      <button
                        className="primary"
                        onClick={() => {
                          setSellAll(false);
                          setAmount("1");
                          setPanel("fill");
                        }}
                      >
                        Fill your stash
                      </button>
                    </>
                  ) : (
                    <>
                      {restoredReview && (
                        <p role="status" className="evm-available">
                          Your saved amount is ready. Continue for a fresh
                          price.
                        </p>
                      )}
                      {panel === "spark" && sellAll ? (
                        <p>
                          You’re selling your whole stash:{" "}
                          {formatTokenAmount(amount, "QQQ")} QQQ.{" "}
                          <button
                            className="quiet"
                            onClick={() => setSellAll(false)}
                          >
                            Choose amount
                          </button>
                        </p>
                      ) : (
                        <label className="evm-amount">
                          {panel === "fill"
                            ? "USDG to spend"
                            : "QQQ tokens to sell"}
                          <input
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => {
                              quoteEpoch.current++;
                              setRestoredReview(false);
                              setAmount(e.target.value);
                              setQuote(null);
                              setError("");
                            }}
                          />
                        </label>
                      )}
                      {panel === "spark" &&
                        !sellAll &&
                        balances &&
                        balances.stock > 0n && (
                          <button
                            className="quiet"
                            onClick={() => {
                              setSellAll(true);
                              setAmount(formatUnits(balances.stock, 18));
                            }}
                          >
                            Sell all
                          </button>
                        )}
                      {balances && (
                        <p className="evm-available">
                          Available:{" "}
                          {formatTokenAmount(
                            formatUnits(
                              panel === "fill" ? balances.cash : balances.stock,
                              panel === "fill" ? 6 : 18,
                            ),
                            panel === "fill" ? "USDG" : "QQQ",
                          )}{" "}
                          {panel === "fill" ? "USDG" : "QQQ"}
                        </p>
                      )}
                      {!prepared && (
                        <button
                          className="primary"
                          disabled={busy || !market}
                          onClick={() => void preview()}
                        >
                          {busy
                            ? "Checking your balance and price…"
                            : "Continue"}
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
              {quote && quote.side === panel && (
                <div
                  className={`evm-quote ${walletProgress !== "review" ? "evm-flow-status" : ""}`}
                  role="status"
                >
                  {walletProgress === "review" && (
                    <>
                      <div>
                        <span>You receive approximately</span>
                        <strong>
                          {formatTokenAmount(
                            quoteAfterFee(quote).amountOut,
                            panel === "fill" ? "QQQ" : "USDG",
                          )}{" "}
                          {panel === "fill" ? "QQQ" : "USDG"}
                        </strong>
                      </div>
                      <p>
                        At least{" "}
                        {formatTokenAmount(
                          quoteAfterFee(quote).minimumOut,
                          panel === "fill" ? "QQQ" : "USDG",
                        )}{" "}
                        {panel === "fill" ? "QQQ" : "USDG"}.
                      </p>
                      <p>1% Blunts fee included. Network fee extra.</p>
                    </>
                  )}
                  {!prepared && clock >= quote.expiresAt && (
                    <p>Get a fresh price to continue.</p>
                  )}
                  {prepared && (
                    <section
                      className="evm-plan"
                      aria-label="Prepared wallet steps"
                    >
                      {stepFee?.status === "needs_eth" && (
                        <p className="evm-error">
                          Add a little ETH on Robinhood Chain to pay the network
                          fee.
                        </p>
                      )}
                      {stepFee?.status === "estimated" &&
                        !stepFee.hasEnoughEth && (
                          <p className="evm-error">
                            Add a little ETH to cover the network fee.
                          </p>
                        )}
                      {feeUnavailable && (
                        <p className="evm-error">
                          We couldn't check the network fee. Update the price to
                          try again.
                        </p>
                      )}
                      {provider && (
                        <WalletSigning
                          plan={prepared}
                          wallet={provider}
                          fee={stepFee}
                          expired={clock >= quote.expiresAt}
                          onRefresh={() => void preview()}
                          onObserved={refreshBalances}
                          onProgress={setWalletProgress}
                          onDone={() => setPanel(null)}
                        />
                      )}
                    </section>
                  )}
                </div>
              )}
              {!signingEnabled && (
                <p className="evm-fine">
                  Preview only. Wallet approvals and swaps are disabled.
                </p>
              )}
              {!account && (
                <button onClick={() => setPanel("wallet")}>
                  Connect wallet to view your balances
                </button>
              )}
            </>
          )}
          {error && (
            <p className="evm-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </dialog>
    </>
  );
}
