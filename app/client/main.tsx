import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { dollars, quantity, type Kind } from "../shared/money";
import "@fontsource/bungee/latin-400.css";
import "@fontsource/figtree/latin-500.css";
import "@fontsource/figtree/latin-800.css";
import "./style.css";
import "./scene-layout.css";
import { Tray } from "./Tray";
import { AmountPicker } from "./AmountPicker";
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
  destinations: { id: string; label: string; rail: string; address: string }[];
  support: { id: string; message: string }[];
};
type Quote = {
  id: string;
  kind: Kind;
  gross: string;
  net: string;
  fee: string;
  debit: string;
  units: string;
  expiresAt: number;
};
const labels: Record<Kind, string> = {
  fund: "Add money",
  buy: "Fill · Buy investment",
  sell: "Spark · Sell investment",
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
  const [action, setAction] = useState<Kind | null>(null),
    [quote, setQuote] = useState<Quote | null>(null),
    [intent, setIntent] = useState<Intent | null>(null);
  const [amount, setAmount] = useState("100"),
    [scenario, setScenario] = useState("success"),
    [destination, setDestination] = useState(""),
    [password, setPassword] = useState("");
  const [all, setAll] = useState(false),
    [clock, setClock] = useState(Date.now());
  const [help, setHelp] = useState(false);
  const [menuPage, setMenuPage] = useState("menu");
  const rolled = BigInt(me?.balances.investmentValue ?? "0") / 10000n;
  const helpDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (help) helpDialog.current?.showModal();
    else helpDialog.current?.close();
  }, [help]);
  useEffect(
    () =>
      onBack(() => {
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
    [help, action, tab, busy],
  );
  const authEpoch = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null),
    submitKey = useRef(crypto.randomUUID()),
    inFlight = useRef(false);
  async function refresh() {
    const epoch = authEpoch.current;
    const next = await api<Me>("/me");
    if (epoch === authEpoch.current) {
      csrf = next.csrf;
      setMe(next);
    }
    return next;
  }
  useEffect(() => {
    refresh()
      .catch(() => {})
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
    const t = setInterval(() => {
      const epoch = authEpoch.current;
      refresh().catch((e) => {
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
      });
    }, 1500);
    return () => clearInterval(t);
  }, [me?.handle]);
  useEffect(() => {
    if (action) {
      dialog.current?.showModal();
    } else dialog.current?.close();
  }, [action]);
  useEffect(() => {
    if (!quote) return;
    const t = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(t);
  }, [quote]);
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
    setQuote(null);
    setIntent(null);
    setAmount(
      kind === "fund" || kind === "buy"
        ? "25"
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
    setPassword("");
    setAll(false);
    setScenario("success");
    setDestination(me?.destinations[0]?.id ?? "");
    setError("");
  }
  function close() {
    if (busy) return;
    setAction(null);
    setError("");
    setPassword("");
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
  async function preview(event: React.FormEvent) {
    event.preventDefault();
    await run(async () => {
      const q = await api<Quote>("/quotes", {
        kind: action,
        amount,
        all,
        destinationId: action === "payout" ? destination : undefined,
      });
      submitKey.current = crypto.randomUUID();
      setClock(Date.now());
      setQuote(q);
    });
  }
  async function confirm() {
    if (!quote) return;
    await run(async () => {
      const i = await api<Intent>(
        "/intents",
        {
          quoteId: quote.id,
          scenario,
          ...(action === "payout" ? { password } : {}),
        },
        submitKey.current,
      );
      setIntent(i);
      await refresh();
    });
  }
  const currentIntent = intent
    ? (me?.intents.find((i) => i.id === intent.id) ?? intent)
    : null;
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
          paused={!!action || help || tab !== "wallet"}
        />

        {!loaded ? (
          <p role="status">Opening your wallet…</p>
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
                <p>All money and investments in this demo are simulated.</p>
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
                        disabled={me.status !== "active"}
                        onClick={() =>
                          open(
                            BigInt(me.balances.availableCash) > 0n
                              ? "buy"
                              : "fund",
                          )
                        }
                      >
                        <span className="orb">
                          <svg
                            width="42"
                            height="42"
                            viewBox="0 0 42 42"
                            fill="none"
                          >
                            <path
                              d="M5 26c6 7 26 7 32 0"
                              stroke="#15210a"
                              strokeWidth="3.2"
                              strokeLinecap="round"
                            />
                            <circle cx="14" cy="9" r="2.6" fill="#15210a" />
                            <circle cx="22" cy="15" r="2.2" fill="#15210a" />
                            <circle cx="28" cy="7" r="2" fill="#15210a" />
                            <circle cx="19" cy="4" r="1.6" fill="#15210a" />
                            <path
                              d="M21 19v6M18 22.5l3 3 3-3"
                              stroke="#15210a"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="lbl">FILL</span>
                      </button>
                      <button
                        className="scene-act spark"
                        aria-label="Spark"
                        disabled={
                          me.status !== "active" ||
                          (BigInt(me.balances.availableUnits) <= 0n &&
                            BigInt(me.balances.availableCash) <= 0n)
                        }
                        onClick={() =>
                          open(
                            BigInt(me.balances.availableUnits) > 0n
                              ? "sell"
                              : "payout",
                          )
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
                        Use the scenario selector before confirming a new action
                        to test rejection, unknown submission or partial fills.
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
                                password: values.get("password"),
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
                          <label>
                            Confirm password
                            <input
                              name="password"
                              type="password"
                              required
                              autoComplete="current-password"
                            />
                          </label>
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
                            Real wallet <span>Not connected</span>
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
                              password: values.get("password"),
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
                        <label>
                          Confirm password
                          <input
                            name="password"
                            type="password"
                            required
                            autoComplete="current-password"
                          />
                        </label>
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
          <div className="menu-how">
            <p>
              Fill adds funds and invests. Spark sells and sends funds back out.
            </p>
            <p>One blunt represents $100 invested. Ten blunts make a band.</p>
            <p>This version uses simulated money and investments.</p>
            <button onClick={() => setMenuPage("menu")}>Back to menu</button>
          </div>
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
                </div>
                <h3>Back up wallet</h3>
                <p>
                  Save a recovery code for this demo account. This is not a seed
                  phrase.
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
                <button
                  className="quiet"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await api("/auth/logout", {});
                      authEpoch.current++;
                      csrf = "";
                      setMe(null);
                      setRecovery("");
                      setTab("wallet");
                      setHelp(false);
                    })
                  }
                >
                  Sign out
                </button>
              </>
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
        className={`transaction-sheet ${action === "fund" || action === "buy" ? "fill" : "spark"}`}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        aria-labelledby="dialog-title"
      >
        <div className="dialog-head">
          <span />
          <button
            className="quiet"
            aria-label="Close transaction"
            onClick={close}
            disabled={busy}
          >
            ×
          </button>
        </div>
        <h2 id="dialog-title" className="sr-only">
          {action ? labels[action] : ""}
        </h2>
        {currentIntent ? (
          <>
            <div className="callout">
              <strong>{currentIntent.state.replaceAll("_", " ")}</strong>
              <p>
                {currentIntent.state === "awaiting_authorization"
                  ? "Confirm this demo deposit."
                  : currentIntent.state === "completed"
                    ? "Balance updated."
                    : currentIntent.state === "failed"
                      ? "Not completed. Your funds are available again."
                      : terminal.has(currentIntent.state)
                        ? "This action has ended. See activity for details."
                        : "Processing. You can close this window."}
              </p>
            </div>
            {currentIntent.state === "awaiting_authorization" && (
              <button
                className="primary"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await api(`/intents/${currentIntent.id}/authorize`, {
                      confirm: true,
                    });
                    await refresh();
                  })
                }
              >
                Add demo funds
              </button>
            )}
            {currentIntent.state === "completed" &&
              (action === "fund" || action === "sell") && (
                <button
                  className="primary"
                  onClick={() => {
                    const nextAmount =
                      action === "fund"
                        ? amount
                        : (
                            Number(me?.balances.availableCash ?? "0") / 100
                          ).toFixed(2);
                    open(action === "fund" ? "buy" : "payout");
                    setAmount(nextAmount);
                  }}
                  disabled={busy}
                >
                  {action === "fund"
                    ? "Continue to invest"
                    : "Continue to cash out"}
                </button>
              )}
            <button className="quiet outline" onClick={close} disabled={busy}>
              Back to wallet
            </button>
          </>
        ) : quote ? (
          <>
            <p>
              {action === "buy"
                ? "Buy demo QQQ."
                : action === "sell"
                  ? "Sell demo QQQ. Funds arrive after settlement."
                  : action === "fund"
                    ? "Add demo funds to your wallet."
                    : "Withdraw to your test destination."}
            </p>
            <dl className="quote">
              <div>
                <dt>Gross amount</dt>
                <dd>{dollars(quote.gross)}</dd>
              </div>
              <div>
                <dt>
                  Blunts fee
                  {["buy", "sell"].includes(action ?? "") ? " · 1%" : ""}
                </dt>
                <dd>{dollars(quote.fee)}</dd>
              </div>
              <div>
                <dt>{action === "buy" ? "Invested value" : "Net proceeds"}</dt>
                <dd>{dollars(quote.net)}</dd>
              </div>
              {["buy", "sell"].includes(action ?? "") && (
                <div>
                  <dt>Investment units</dt>
                  <dd>{quantity(quote.units)}</dd>
                </div>
              )}
            </dl>
            <p className="muted">No other fees in this demo.</p>
            <p role="status">
              {clock >= quote.expiresAt
                ? "Quote expired. Go back for a fresh quote."
                : `Quote expires in ${Math.ceil((quote.expiresAt - clock) / 1000)} seconds.`}
            </p>
            <button
              className="primary"
              disabled={busy || clock >= quote.expiresAt}
              onClick={confirm}
            >
              {busy ? "Saving instruction…" : "Confirm"}
            </button>
            <button
              className="quiet"
              disabled={busy}
              onClick={() => setQuote(null)}
            >
              Back to amount
            </button>
          </>
        ) : (
          <form onSubmit={preview}>
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
                    : action === "buy" || action === "payout"
                      ? (me?.balances.availableCash ?? "0")
                      : (me?.balances.investmentValue ?? "0")
                }
              />
            )}
            {action === "payout" && (
              <>
                <label>
                  Destination
                  <select
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    <option value="">Select a test destination</option>
                    {me?.destinations.map((d) => (
                      <option value={d.id} key={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Confirm password
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
              </>
            )}
            <button
              className="picker-go"
              aria-label={`${action === "fund" || action === "buy" ? "Fill" : "Spark"} · Review quote`}
              disabled={busy}
            >
              <svg
                width="22"
                height="24"
                viewBox="0 0 42 44"
                fill="none"
                aria-hidden="true"
              >
                {action === "fund" || action === "buy" ? (
                  <>
                    <path
                      d="M5 26c6 7 26 7 32 0"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <circle cx="14" cy="10" r="3" fill="currentColor" />
                    <circle cx="23" cy="15" r="3" fill="currentColor" />
                    <circle cx="29" cy="7" r="2.6" fill="currentColor" />
                  </>
                ) : (
                  <path
                    d="M20 3c2 7 11 11 11 22a11 11 0 0 1-22 0c0-6 3-9 5-12 0 4 2 6 4 6-1-6 0-11 2-16z"
                    fill="currentColor"
                  />
                )}
              </svg>
              {busy
                ? "Preparing…"
                : action === "fund" || action === "buy"
                  ? "FILL"
                  : "SPARK"}
            </button>
            <details className="transaction-options">
              <summary>Options</summary>
              {!quote && !currentIntent && (
                <div className="flow-options" aria-label="Transaction type">
                  {(action === "fund" || action === "buy"
                    ? [
                        ["fund", "Add funds"],
                        ["buy", "Invest"],
                      ]
                    : [
                        ["sell", "Sell"],
                        ["payout", "Cash out"],
                      ]
                  ).map(([kind, label]) => (
                    <button
                      key={kind}
                      type="button"
                      aria-pressed={action === kind}
                      disabled={busy}
                      onClick={() => open(kind as Kind)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <details>
                <summary>Test a failure or recovery path</summary>
                <label>
                  Simulation scenario
                  <select
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                  >
                    <option value="success">Successful execution</option>
                    <option value="reject">Provider rejection</option>
                    <option value="timeout">
                      Timeout after acceptance → recover by lookup
                    </option>
                    {["buy", "sell"].includes(action ?? "") && (
                      <option value="partial">Partial fill → completion</option>
                    )}
                  </select>
                </label>
              </details>
            </details>
          </form>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
      </dialog>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
