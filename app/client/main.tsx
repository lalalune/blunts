import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { cents, dollars, quoteNumbers, type Kind } from "../shared/money";
import "@fontsource/bungee/latin-400.css";
import "@fontsource/figtree/latin-500.css";
import "@fontsource/figtree/latin-800.css";
import "./style.css";
import "./scene-layout.css";
import { Tray } from "./Tray";
import { AmountPicker } from "./AmountPicker";
import { CashOut } from "./CashOut";
import { BanknoteArrowDown } from "lucide-react";
import { StewardLogin } from "./StewardLogin";
import { EvmApp } from "./EvmApp";
import { lazy, Suspense } from "react";
const SolanaApp = lazy(() =>
  import("./SolanaApp").then((m) => ({ default: m.SolanaApp })),
);
import { HowItWorks } from "./HowItWorks";
import { request, native, shareStatement, onResume, onBack } from "./platform";
type Intent = {
  id: string;
  kind: Kind;
  state: string;
  data: Record<string, string>;
  created_at: string;
};
type Me = {
  handle: string;
  status: string;
  csrf: string;
  balances: Record<string, string>;
  intents: Intent[];
  flows: { id: string; kind: string; state: string; error: string | null }[];
  destinations: { id: string; label: string; rail: string; address: string }[];
  support: { id: string; message: string }[];
  steward?: {
    userId: string;
    wallet: { address: string; agentId: string } | null;
  } | null;
};
type PendingFlow = {
  key: string;
  body: { kind: "fill" | "spark"; amount: string; all: boolean };
};
const labels: Record<Kind, string> = {
  fund: "Fill",
  buy: "Fill · Buy investment",
  sell: "Spark",
  payout: "Withdraw USDC",
};
const terminal = new Set([
  "completed",
  "failed",
  "cancelled",
  "expired",
  "returned",
]);
let csrf = "";
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function api<T = any>(
  path: string,
  body?: unknown,
  key?: string,
): Promise<T> {
  const response = await request(path, body, {
    ...(body === undefined
      ? {}
      : {
          "Content-Type": "application/json",
          "X-Blunts-Request": "1",
          "X-CSRF-Token": csrf,
        }),
    ...(key ? { "Idempotency-Key": key } : {}),
  });
  const data = response.data;
  if (!response.ok)
    throw new ApiError(
      data.error ?? "Could not complete request.",
      response.status,
    );
  return data;
}
function App() {
  const [me, setMe] = useState<Me | null>(null),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [tab, setTab] = useState("wallet");
  const [authMode, setAuthMode] = useState("register"),
    [busy, setBusy] = useState(false),
    [recovery, setRecovery] = useState("");
  const [authProvider, setAuthProvider] = useState<
    "demo" | "steward" | "eliza-cloud" | null
  >(null);
  const [connected, setConnected] = useState(false);
  const [accountUrl, setAccountUrl] = useState<string | null>(null);
  const [action, setAction] = useState<Kind | null>(null);
  const [pendingCommand, setPendingCommand] = useState<PendingFlow | null>(
    null,
  );
  const [amount, setAmount] = useState("25");
  const [all, setAll] = useState(false);
  const [help, setHelp] = useState(false);
  const [cashOut, setCashOut] = useState(false);
  const [menuPage, setMenuPage] = useState("menu");
  const unsettled =
    !!pendingCommand ||
    !!me?.flows?.some((f) => !["completed", "failed"].includes(f.state)) ||
    !!me?.intents?.some((i) => !terminal.has(i.state));
  const rolled = BigInt(me?.balances.investmentValue ?? "0") / 10000n;
  const helpDialog = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  useEffect(() => {
    if (help) helpDialog.current?.showModal();
    else helpDialog.current?.close();
  }, [help]);
  useEffect(
    () =>
      onBack(() => {
        if (cashOut) {
          setCashOut(false);
          return true;
        }
        if (help) {
          setHelp(false);
          return true;
        }
        if (action) {
          close();
          return true;
        }
        if (tab !== "wallet") {
          setTab("wallet");
          return true;
        }
        return false;
      }),
    [help, action, cashOut, tab, busy],
  );
  const authEpoch = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null),
    inFlight = useRef(false);
  // Cost: one account read. Periodic cadence is 1.5s pending / 15s idle;
  // hidden tabs pause and explicit mutations/resume invalidate immediately.
  async function refresh() {
    const epoch = authEpoch.current;
    let next: Me;
    try {
      next = await api<Me>("/me");
    } catch (e) {
      if (epoch === authEpoch.current) setConnected(false);
      throw e;
    }
    if (epoch === authEpoch.current) {
      csrf = next.csrf;
      setMe(next);
      setConnected(true);
    }
    return next;
  }
  useEffect(() => {
    Promise.all([
      api<{
        provider: "demo" | "steward" | "eliza-cloud";
        accountUrl: string | null;
      }>("/auth/config").then((config) => {
        setAuthProvider(config.provider);
        setAccountUrl(config.accountUrl);
      }),
      refresh().catch((e) => {
        if (!(e instanceof ApiError && e.status === 401)) throw e;
      }),
    ])
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoaded(true));
  }, []);
  useEffect(
    () =>
      onResume(() => {
        void refresh().catch(() => {});
      }),
    [],
  );
  useEffect(() => {
    if (!me) return;
    let cancelled = false,
      refreshing = false;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      if (!cancelled && !document.hidden)
        timer = setTimeout(poll, unsettled ? 1500 : 15000);
    };
    async function poll() {
      if (cancelled || refreshing || document.hidden) return;
      clearTimeout(timer);
      refreshing = true;
      const epoch = authEpoch.current;
      try {
        await refresh();
      } catch (e) {
        if (
          epoch === authEpoch.current &&
          e instanceof ApiError &&
          e.status === 401
        ) {
          authEpoch.current++;
          csrf = "";
          setMe(null);
          setAction(null);
          setError("Session expired. Sign in again.");
        }
      } finally {
        refreshing = false;
        schedule();
      }
    }
    const resume = () => {
      clearTimeout(timer);
      if (!document.hidden) void poll();
    };
    schedule();
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", resume);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", resume);
    };
  }, [me?.handle, unsettled]);
  useEffect(() => {
    if (action) {
      dialog.current?.showModal();
    } else dialog.current?.close();
  }, [action]);
  const activeFlow = me?.flows?.find(
    (f) => !["completed", "failed"].includes(f.state),
  );
  const working = busy || !!activeFlow || !!pendingCommand || !connected;
  useEffect(() => {
    setPendingCommand(null);
    if (!me?.handle) return;
    try {
      const stored = localStorage.getItem(`blunts-flow:${me.handle}`);
      if (stored) {
        const command = JSON.parse(stored) as PendingFlow;
        setPendingCommand(command);
        void run(() => sendFlow(command));
      }
    } catch {
      setError(
        "Browser storage is unavailable. Enable it before using Fill or Spark.",
      );
    }
  }, [me?.handle]);
  async function sendFlow(command: PendingFlow) {
    const handle = me!.handle;
    try {
      await api("/flows", command.body, command.key);
      localStorage.removeItem(`blunts-flow:${handle}`);
      setPendingCommand(null);
      await refresh();
    } catch (e) {
      if (e instanceof ApiError && [400, 409, 422].includes(e.status)) {
        localStorage.removeItem(`blunts-flow:${handle}`);
        setPendingCommand(null);
      }
      throw e;
    }
  }
  function submitFlow(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current || working || !action || !me) return;
    try {
      const preview = quoteNumbers(
        action === "sell" ? "sell" : "buy",
        all ? BigInt(me.balances.investmentValue) : cents(amount),
        all ? BigInt(me.balances.availableUnits) : undefined,
      );
      if (
        action === "sell" &&
        BigInt(preview.units) > BigInt(me.balances.availableUnits)
      )
        throw new Error("Choose an amount within your available investment.");
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    const command: PendingFlow = {
      key: crypto.randomUUID(),
      body: { kind: action === "sell" ? "spark" : "fill", amount, all },
    };
    // Persist the authorized instruction before I/O; retries reuse this key.
    try {
      localStorage.setItem(`blunts-flow:${me.handle}`, JSON.stringify(command));
    } catch {
      setError("Allow browser storage before continuing.");
      return;
    }
    setPendingCommand(command);
    setAction(null);
    void run(() => sendFlow(command));
  }
  async function run(fn: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  function open(kind: Kind) {
    setAction(kind);
    setAmount(
      kind === "fund"
        ? "25"
        : kind === "buy"
          ? String(
              Math.min(25, Number(me?.balances.availableCash ?? "0") / 100),
            )
          : String(
              Math.min(
                100,
                Number(
                  kind === "sell"
                    ? (me?.balances.investmentValue ?? "0")
                    : (me?.balances.availableCash ?? "0"),
                ) / 100,
              ),
            ),
    );
    setAll(false);
    setError("");
  }
  function close() {
    if (busy) return;
    setAction(null);
    setError("");
  }
  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(async () => {
      const data = await api(`/auth/${authMode}`, {
        handle: form.get("handle"),
        password: form.get("password"),
        ...(authMode === "recover"
          ? { recoveryCode: form.get("recoveryCode") }
          : {}),
      });
      csrf = data.csrf;
      setRecovery(data.recoveryCode ?? "");
      await refresh();
      setNotice("");
    });
  }
  function operation(i: Intent) {
    return (
      <div className="activity-row" key={i.id}>
        <div>
          <strong>{labels[i.kind]}</strong>
          <span>{new Date(Number(i.created_at)).toLocaleString()}</span>
        </div>
        <div className="activity-right">
          <strong>{dollars(i.data.gross)}</strong>
          <span className={`status ${i.state}`}>
            {i.state.replaceAll("_", " ")}
          </span>
        </div>
        {i.state === "awaiting_authorization" && (
          <div className="row-actions">
            <button
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await api(`/intents/${i.id}/authorize`, { confirm: true });
                  await refresh();
                })
              }
            >
              Add demo funds
            </button>
            <button
              className="quiet"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await api(`/intents/${i.id}/cancel`, {});
                  await refresh();
                })
              }
            >
              Cancel deposit
            </button>
          </div>
        )}
      </div>
    );
  }
  return (
    <>
      <header className="scene-header">
        <div className="scene-counts">
          <div className="scene-count" aria-label={`Blunts rolled: ${rolled}`}>
            <svg width="30" height="12" viewBox="0 0 30 12">
              <defs>
                <linearGradient id="bl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#9a6a3c" />
                  <stop offset="1" stopColor="#5a3719" />
                </linearGradient>
              </defs>
              <path
                d="M3 3.2 L26 2 Q29 2 29 6 Q29 10 26 10 L3 8.8 Q1 8.6 1 6 Q1 3.4 3 3.2Z"
                fill="url(#bl)"
              />
              <path
                d="M8 2.8l-2 6.6M14 2.5l-2 7.2M20 2.2l-2 7.6"
                stroke="#3a220f"
                strokeWidth=".8"
                opacity=".6"
              />
            </svg>
            <span>{rolled.toString()}</span>
          </div>
          <div className="scene-count" aria-label={`Bands: ${rolled / 10n}`}>
            <svg width="26" height="18" viewBox="0 0 26 18">
              <rect x="1" y="3" width="24" height="13" rx="3" fill="#3e5e1c" />
              <rect x="1" y="1" width="24" height="13" rx="3" fill="#7fae45" />
              <rect
                x="10"
                y="0"
                width="6"
                height="17"
                rx="1.5"
                fill="#c8412f"
              />
            </svg>
            <span>{(rolled / 10n).toString()}</span>
          </div>
        </div>
        <button
          className="menu-button"
          aria-label="Menu"
          onClick={() => {
            setMenuPage("menu");
            setHelp(true);
          }}
        >
          <svg
            width="18"
            height="14"
            viewBox="0 0 18 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M1 1h16M1 7h16M1 13h10" />
          </svg>
        </button>
      </header>
      <main
        className={`scene-main ${!me || me.status === "new" ? "setup-main" : ""}`}
      >
        <Tray
          key={me?.handle ?? "guest"}
          value={me?.balances.investmentValue ?? "0"}
          paused={!!action || help || cashOut || tab !== "wallet"}
        />

        {!loaded ? (
          <p role="status">Opening your wallet…</p>
        ) : !authProvider ? (
          <section className="card setup-overlay">
            <h2>Connection interrupted</h2>
            <p>Your wallet records are safe. Reconnect to continue.</p>
            <button onClick={() => window.location.reload()}>Reconnect</button>
          </section>
        ) : !me && authProvider !== "demo" ? (
          <StewardLogin
            api={api}
            providerLabel={
              authProvider === "eliza-cloud" ? "Eliza Cloud" : "Steward"
            }
            onSuccess={async (token) => {
              csrf = token;
              await refresh();
              setNotice("");
            }}
          />
        ) : !me ? (
          <section
            className="welcome setup-overlay"
            role="dialog"
            aria-label="Wallet setup"
          >
            <section className="card auth">
              <h2>
                {authMode === "register"
                  ? "Your wallet."
                  : authMode === "login"
                    ? "Welcome back"
                    : "Recover your wallet"}
              </h2>
              <p>Demo wallet · no real money or investments.</p>

              <form onSubmit={authenticate}>
                <label>
                  Handle
                  <input
                    name="handle"
                    required
                    minLength={3}
                    maxLength={32}
                    pattern="[a-zA-Z0-9_-]+"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </label>
                <label>
                  {authMode === "recover" ? "New password" : "Password"}
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={12}
                    maxLength={128}
                    autoComplete={
                      authMode === "login" ? "current-password" : "new-password"
                    }
                  />
                </label>
                <small>At least 12 characters.</small>
                {authMode === "recover" && (
                  <label>
                    Recovery code
                    <input name="recoveryCode" required autoComplete="off" />
                  </label>
                )}
                <button className="primary" disabled={busy}>
                  {busy
                    ? "Please wait…"
                    : authMode === "register"
                      ? "Create wallet"
                      : authMode === "login"
                        ? "Sign in"
                        : "Recover account"}
                </button>
              </form>
              <div className="auth-links">
                <button
                  className="quiet"
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "register" : "login");
                    setError("");
                  }}
                >
                  {authMode === "login"
                    ? "Create a wallet"
                    : "Already have a wallet?"}
                </button>
              </div>
            </section>
          </section>
        ) : (
          <>
            {me.status === "new" ? (
              <section
                className="card onboarding setup-overlay"
                role="dialog"
                aria-label="Wallet setup"
              >
                <h1>Try it out.</h1>
                <p>
                  {me.steward
                    ? "Steward manages your login and wallet. Trading here uses demo funds; your real wallet funds are never used."
                    : "All money and investments in this demo are simulated."}
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(async () => {
                      await api("/onboarding", {
                        adult: true,
                        simulation: true,
                        agreement: "sandbox-v1",
                      });
                      await refresh();
                    });
                  }}
                >
                  <label className="check">
                    <input type="checkbox" required /> I’m 18 or older and agree
                    to use test data only. No real money, investments or tax
                    documents.
                  </label>
                  <button className="primary" disabled={busy}>
                    Open wallet
                  </button>
                </form>
              </section>
            ) : (
              <>
                {tab !== "wallet" && (
                  <div className="utility-panel">
                    <nav aria-label="Wallet navigation">
                      {["wallet", "activity", "settings"].map((t) => (
                        <button
                          key={t}
                          aria-current={tab === t ? "page" : undefined}
                          onClick={() => setTab(t)}
                        >
                          {t[0].toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </nav>
                  </div>
                )}
                {me.status === "restricted" && (
                  <div className="callout warning" role="alert">
                    This account needs reconciliation. New actions are paused.
                    Download your records and open a support case.
                  </div>
                )}
                {tab === "wallet" && (
                  <>
                    <div className="scene-hud">
                      <span className="sr-only">Invested</span>
                      <strong className="scene-value">
                        {dollars(me.balances.investmentValue)}
                      </strong>
                      <div className="scene-cash">
                        <span>Available </span>
                        <strong>{dollars(me.balances.availableCash)}</strong>
                      </div>
                    </div>
                    <div className="scene-dock">
                      <button
                        className="scene-act fill"
                        aria-label="Fill"
                        disabled={me.status !== "active" || working}
                        onClick={() => open("fund")}
                      >
                        <span className="orb">
                          <BanknoteArrowDown
                            size={42}
                            strokeWidth={2.2}
                            color="#15210a"
                            aria-hidden="true"
                          />
                        </span>
                        <span className="lbl">FILL</span>
                      </button>
                      <button
                        className="scene-act spark"
                        aria-label="Spark"
                        disabled={
                          me.status !== "active" ||
                          working ||
                          (BigInt(me.balances.availableUnits) <= 0n &&
                            BigInt(me.balances.availableCash) <= 0n)
                        }
                        onClick={() =>
                          BigInt(me.balances.availableUnits) > 0n
                            ? open("sell")
                            : setCashOut(true)
                        }
                      >
                        <span className="orb">
                          <svg
                            width="40"
                            height="44"
                            viewBox="0 0 40 44"
                            fill="none"
                          >
                            <path
                              d="M20 3c2 7 11 11 11 22a11 11 0 0 1-22 0c0-6 3-9 5-12 0 4 2 6 4 6-1-6 0-11 2-16z"
                              fill="#2a0e03"
                            />
                            <path
                              d="M20 24c1 3 5 4 5 9a5 5 0 0 1-10 0c0-3 2-4 3-6 0 2 1 3 2 3z"
                              fill="#ffc07a"
                            />
                          </svg>
                        </span>
                        <span className="lbl">SPARK</span>
                      </button>
                    </div>
                    {me.intents.some((i) => !terminal.has(i.state)) && (
                      <button
                        className="pending-link"
                        onClick={() => setTab("activity")}
                      >
                        View pending activity
                      </button>
                    )}
                  </>
                )}
                {tab === "activity" && (
                  <section className="utility-content">
                    <div className="section-heading">
                      <div>
                        <h1>Activity</h1>
                      </div>
                    </div>
                    <a
                      className="download"
                      href="/api/documents/statement"
                      onClick={(e) => {
                        if (native) {
                          e.preventDefault();
                          void run(async () => {
                            await shareStatement(
                              await api("/documents/statement"),
                            );
                          });
                        }
                      }}
                      download
                    >
                      Download statement ↗
                    </a>
                    <section className="card activity-list">
                      {me.intents.length ? (
                        me.intents.map(operation)
                      ) : (
                        <p>No activity yet.</p>
                      )}
                    </section>
                    <details className="card">
                      <summary>Sandbox failure testing</summary>
                      <p>
                        Automated tests cover rejection, unknown submission and
                        partial fills. Completed test transfers can be returned
                        below.
                      </p>
                      {me.intents
                        .filter(
                          (i) =>
                            i.state === "completed" &&
                            ["fund", "payout"].includes(i.kind),
                        )
                        .map((i) => (
                          <div className="test-row" key={i.id}>
                            <span>
                              {labels[i.kind]} · {dollars(i.data.gross)} ·{" "}
                              {i.id.slice(0, 8)}
                            </span>
                            <button
                              disabled={busy}
                              onClick={() =>
                                run(async () => {
                                  await api(
                                    `/intents/${i.id}/simulate-return`,
                                    {},
                                  );
                                  await refresh();
                                  setNotice(
                                    "Return recorded. If funds were already spent, the account is held for reconciliation.",
                                  );
                                })
                              }
                            >
                              Simulate return
                            </button>
                          </div>
                        ))}
                    </details>
                  </section>
                )}
                {tab === "settings" && (
                  <section className="utility-content">
                    <h1>Settings</h1>
                    <div className="settings-grid">
                      <section className="card">
                        <h2>Payout destinations</h2>
                        <p>
                          Test labels only. These are not linked payment
                          accounts or blockchain addresses.
                        </p>
                        {me.destinations.map((d) => (
                          <p key={d.id}>
                            <strong>{d.label}</strong>
                            <br />
                            <small>
                              {d.rail === "cash_app_demo"
                                ? "Cash App simulation"
                                : "Wallet simulation"}{" "}
                              · {d.address}
                            </small>
                          </p>
                        ))}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            const values = new FormData(form);
                            run(async () => {
                              await api("/destinations", {
                                label: values.get("label"),
                                rail: values.get("rail"),
                                ...(!me.steward
                                  ? { password: values.get("password") }
                                  : {}),
                              });
                              form.reset();
                              await refresh();
                              setNotice(
                                "Simulated destination added. No external account was linked.",
                              );
                            });
                          }}
                        >
                          <label>
                            Destination label
                            <input
                              name="label"
                              required
                              minLength={2}
                              maxLength={50}
                              placeholder="My test Cash App"
                            />
                          </label>
                          <label>
                            Test destination type
                            <select name="rail">
                              <option value="cash_app_demo">
                                Cash App simulation
                              </option>
                              <option value="wallet_demo">
                                Wallet simulation
                              </option>
                            </select>
                          </label>
                          {!me.steward && (
                            <label>
                              Confirm password
                              <input
                                name="password"
                                type="password"
                                required
                                autoComplete="current-password"
                              />
                            </label>
                          )}
                          <button disabled={busy}>Save test destination</button>
                        </form>
                      </section>
                      <section className="card">
                        <h2>Support & records</h2>
                        <p>
                          Cases are saved in this sandbox. No support team is
                          notified. Never include personal or financial
                          credentials.
                        </p>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const form = e.currentTarget;
                            const values = new FormData(form);
                            run(async () => {
                              const result = await api("/support", {
                                message: values.get("message"),
                              });
                              form.reset();
                              setNotice(
                                `${result.notice} Case ${result.id.slice(0, 8)}.`,
                              );
                              await refresh();
                            });
                          }}
                        >
                          <label>
                            Describe the test issue
                            <textarea
                              name="message"
                              required
                              minLength={10}
                              maxLength={2000}
                            />
                          </label>
                          <button disabled={busy}>Save support case</button>
                        </form>
                        {me.support.map((c) => (
                          <p key={c.id}>
                            <code>{c.id.slice(0, 8)}</code> · {c.message}
                          </p>
                        ))}
                        <a
                          className="download"
                          href="/api/documents/statement"
                          onClick={(e) => {
                            if (native) {
                              e.preventDefault();
                              void run(async () => {
                                await shareStatement(
                                  await api("/documents/statement"),
                                );
                              });
                            }
                          }}
                          download
                        >
                          Export my sandbox records ↗
                        </a>
                        <h3>Integration status</h3>
                        <ul className="integration-list">
                          <li>
                            Simulator <span>Connected</span>
                          </li>
                          <li>
                            MoonPay / Cash App <span>Not connected</span>
                          </li>
                          <li>
                            Dinari US <span>Not connected</span>
                          </li>
                          <li>
                            Steward wallet{" "}
                            <span>
                              {me.steward?.wallet
                                ? "Connected"
                                : "Not connected"}
                            </span>
                          </li>
                        </ul>
                      </section>
                    </div>
                    <details className="card">
                      <summary>Close sandbox account</summary>
                      <p>
                        First sell all units, withdraw the simulated USDC and
                        resolve pending actions. Financial test records remain
                        in the local database; closure revokes access, it does
                        not erase records.
                      </p>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const values = new FormData(e.currentTarget);
                          run(async () => {
                            await api("/close", {
                              ...(!me.steward
                                ? { password: values.get("password") }
                                : {}),
                            });
                            authEpoch.current++;
                            csrf = "";
                            setMe(null);
                            setRecovery("");
                            setNotice(
                              "Sandbox account closed. Sessions revoked.",
                            );
                          });
                        }}
                      >
                        {!me.steward && (
                          <label>
                            Confirm password
                            <input
                              name="password"
                              type="password"
                              required
                              autoComplete="current-password"
                            />
                          </label>
                        )}
                        <button className="danger" disabled={busy}>
                          Close account
                        </button>
                      </form>
                    </details>
                  </section>
                )}
              </>
            )}
          </>
        )}
        {!action && !help && error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {me && !connected && !action && !help && !error && (
          <div className="notice" role="status">
            Connection interrupted. Showing your last confirmed balance.
            <button
              className="quiet"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await refresh();
                })
              }
            >
              Reconnect
            </button>
          </div>
        )}
        {!action && pendingCommand && !busy && (
          <button
            className="pending-link"
            onClick={() => void run(() => sendFlow(pendingCommand))}
          >
            Retry pending action
          </button>
        )}
        {!action && !error && me?.flows?.[0]?.state === "failed" && (
          <p className="error" role="alert">
            {me.flows[0].error}
          </p>
        )}
        {notice && (
          <div className="notice" role="status">
            {notice}
            <button
              aria-label="Dismiss notice"
              className="quiet"
              onClick={() => setNotice("")}
            >
              ×
            </button>
          </div>
        )}
      </main>
      <dialog
        ref={helpDialog}
        className="menu-sheet"
        aria-labelledby="help-title"
        onCancel={(e) => {
          e.preventDefault();
          setHelp(false);
        }}
      >
        <div className="dialog-head">
          <h2 id="help-title">
            {menuPage === "menu"
              ? "Menu"
              : menuPage === "how"
                ? "How it works"
                : "Your wallet"}
          </h2>
          <button
            className="quiet"
            aria-label="Close menu"
            onClick={() => setHelp(false)}
          >
            ×
          </button>
        </div>
        {menuPage === "menu" ? (
          <div className="original-menu">
            <button
              disabled={!me || me.status === "new"}
              onClick={() => {
                setTab("activity");
                setHelp(false);
              }}
            >
              <span aria-hidden="true">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                  <path d="M3 3v5h5M12 7v5l3 2" />
                </svg>
              </span>{" "}
              HISTORY
            </button>
            <button onClick={() => setMenuPage("how")}>
              <span aria-hidden="true">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="9.5" />
                  <path d="M9.5 9a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.6v.6" />
                  <circle cx="12" cy="17" r=".6" fill="currentColor" />
                </svg>
              </span>{" "}
              HOW IT WORKS
            </button>
            <button onClick={() => setMenuPage("wallet")}>
              <span aria-hidden="true">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="5" width="18" height="15" rx="3" />
                  <path d="M3 8V5l14-3v3M21 11h-6v5h6" />
                </svg>
              </span>{" "}
              WALLET
            </button>
          </div>
        ) : menuPage === "how" ? (
          <HowItWorks onDone={() => setHelp(false)} />
        ) : (
          <>
            <button className="quiet" onClick={() => setMenuPage("menu")}>
              Back to menu
            </button>
            {me ? (
              <>
                <div className="help-links">
                  <button
                    onClick={() => {
                      setTab("activity");
                      setHelp(false);
                    }}
                  >
                    Activity
                  </button>
                  <button
                    onClick={() => {
                      setTab("settings");
                      setHelp(false);
                    }}
                  >
                    Settings
                  </button>
                  <button
                    disabled={me.status !== "active" || working}
                    onClick={() => {
                      setHelp(false);
                      setCashOut(true);
                    }}
                  >
                    Cash out
                  </button>
                </div>
                {me.steward ? (
                  <>
                    <h3>
                      {authProvider === "eliza-cloud"
                        ? "Cloud wallet"
                        : "Steward wallet"}
                    </h3>
                    <p>
                      Login, keys and recovery are managed by your Steward
                      service. This demo never signs transactions or spends
                      wallet funds.
                    </p>
                    {accountUrl && (
                      <a href={accountUrl} target="_blank" rel="noreferrer">
                        Manage account and recovery
                      </a>
                    )}
                    {me.steward.wallet ? (
                      <code className="recovery">
                        {me.steward.wallet.address}
                      </code>
                    ) : (
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await api("/steward/wallet", {});
                            await refresh();
                          })
                        }
                      >
                        Create Steward wallet
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <h3>Back up wallet</h3>
                    <p>
                      Save a recovery code for this demo account. This is not a
                      seed phrase.
                    </p>
                    {recovery ? (
                      <>
                        <code className="recovery">{recovery}</code>
                        <button
                          onClick={() => {
                            setRecovery("");
                            setNotice("");
                          }}
                        >
                          I saved my recovery code
                        </button>
                      </>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const values = new FormData(e.currentTarget);
                          void run(async () => {
                            const result = await api("/auth/backup", {
                              password: values.get("password"),
                            });
                            setRecovery(result.recoveryCode);
                          });
                        }}
                      >
                        <label>
                          Confirm password
                          <input
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                          />
                        </label>
                        <p>Generating a code replaces the previous one.</p>
                        <button disabled={busy}>Generate recovery code</button>
                      </form>
                    )}
                  </>
                )}
                <button
                  className="quiet"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      const result = await api<{ upstreamRevoked: boolean }>(
                        "/auth/logout",
                        {},
                      );
                      authEpoch.current++;
                      csrf = "";
                      setMe(null);
                      setRecovery("");
                      setTab("wallet");
                      setHelp(false);
                      if (!result.upstreamRevoked)
                        setNotice(
                          "Signed out of Blunts. Steward was unavailable; manage other sessions in Steward when it reconnects.",
                        );
                    })
                  }
                >
                  Sign out
                </button>
              </>
            ) : authProvider !== "demo" ? (
              <p>Sign in with your Steward email to recover access.</p>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("recover");
                  setError("");
                  setHelp(false);
                }}
              >
                Recover wallet
              </button>
            )}
            <details>
              <summary>About this demo</summary>
              <p>
                No real money or investments. 1% per buy or sell, with no fee
                cap.
              </p>
            </details>
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </dialog>
      <dialog
        ref={dialog}
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          backdropPress.current =
            e.target === e.currentTarget &&
            (e.clientX < r.left ||
              e.clientX > r.right ||
              e.clientY < r.top ||
              e.clientY > r.bottom);
        }}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            backdropPress.current &&
            e.target === e.currentTarget &&
            (e.clientX < r.left ||
              e.clientX > r.right ||
              e.clientY < r.top ||
              e.clientY > r.bottom)
          )
            close();
          backdropPress.current = false;
        }}
        className={`transaction-sheet ${action === "fund" || action === "buy" ? "fill" : "spark"}`}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        aria-labelledby="dialog-title"
      >
        <h2 id="dialog-title" className="sr-only">
          {action ? labels[action] : ""}
        </h2>
        <form onSubmit={submitFlow}>
          {action && (
            <AmountPicker
              key={action}
              kind={action}
              amount={amount}
              setAmount={setAmount}
              all={all}
              setAll={setAll}
              available={
                action === "fund"
                  ? "100000000"
                  : (
                      (BigInt(me?.balances.availableUnits ?? "0") * 50000n) /
                      1000000n
                    ).toString()
              }
            />
          )}
          <button className="picker-go" disabled={working}>
            {action === "fund" ? (
              <BanknoteArrowDown
                size={24}
                strokeWidth={2.2}
                aria-hidden="true"
              />
            ) : (
              <svg
                width="22"
                height="24"
                viewBox="0 0 42 44"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M20 3c2 7 11 11 11 22a11 11 0 0 1-22 0c0-6 3-9 5-12 0 4 2 6 4 6-1-6 0-11 2-16z"
                  fill="currentColor"
                />
              </svg>
            )}
            {action === "fund" ? "FILL" : "SPARK"}
          </button>
          <small className="action-fee">Demo money · 1% fee</small>
          {action === "sell" &&
            BigInt(me?.balances.availableCash ?? "0") > 0n && (
              <button
                type="button"
                className="cash-out-link"
                onClick={() => {
                  setAction(null);
                  setCashOut(true);
                }}
              >
                Cash out available {dollars(me!.balances.availableCash)}
              </button>
            )}
        </form>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
      </dialog>
      {cashOut && me && (
        <CashOut
          handle={me.handle}
          available={me.balances.availableCash}
          destinations={me.destinations}
          passwordRequired={!me.steward}
          api={api}
          onClose={() => setCashOut(false)}
          onSettings={() => {
            setCashOut(false);
            setTab("settings");
          }}
          onComplete={async () => {
            setNotice(
              "Demo cash-out submitted. Follow its settlement in History.",
            );
            await refresh().catch(() =>
              setError("Cash-out submitted. Reload to refresh your balance."),
            );
          }}
        />
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  window.location.pathname === "/legacy" ? (
    <App />
  ) : window.location.pathname === "/sol" ? (
    <Suspense fallback={<p>Opening your stash…</p>}>
      <SolanaApp />
    </Suspense>
  ) : (
    <EvmApp />
  ),
);
