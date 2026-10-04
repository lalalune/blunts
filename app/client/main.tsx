import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { dollars, quantity, type Kind } from "../shared/money";
import "./style.css";
import { Tray } from "./Tray";
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
    setAmount("100");
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
      setNotice(data.recoveryCode ? "Save your recovery code in ?." : "");
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
      <div className="sandbox">Demo · no real money</div>
      <header>
        <a className="brand" href="/" aria-label="Blunts home">
          blunt<span>$</span>
        </a>
        <button
          className="help-button"
          aria-label="Wallet help"
          onClick={() => setHelp(true)}
        >
          ?
        </button>
      </header>
      <main className={!me || me.status === "new" ? "setup-main" : undefined}>
        <Tray value={me?.balances.investmentValue ?? "0"} />

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
                {me.status === "restricted" && (
                  <div className="callout warning" role="alert">
                    This account needs reconciliation. New actions are paused.
                    Download your records and open a support case.
                  </div>
                )}
                {tab === "wallet" && (
                  <>
                    <h1>Wallet</h1>
                    <div className="balance-grid">
                      <section className="card investment">
                        <span>Invested</span>
                        <strong className="big-number">
                          {dollars(me.balances.investmentValue)}
                        </strong>
                        <details>
                          <summary>Investment details</summary>
                          <p>
                            {quantity(me.balances.units)} demo QQQ units · fixed
                            $500 test price.
                          </p>
                        </details>
                        <div className="button-row">
                          <button
                            className="primary"
                            disabled={me.status !== "active"}
                            onClick={() => open("buy")}
                          >
                            Fill
                          </button>
                          <button
                            className="ember"
                            disabled={
                              me.status !== "active" ||
                              BigInt(me.balances.availableUnits) <= 0n
                            }
                            onClick={() => open("sell")}
                          >
                            Spark
                          </button>
                        </div>
                        <small>1% to buy or sell.</small>
                      </section>
                      <section className="card">
                        <span>Available</span>
                        <strong className="big-number">
                          {dollars(me.balances.availableCash)}
                        </strong>
                        {BigInt(me.balances.reservedCash) > 0n && (
                          <p>Pending: {dollars(me.balances.reservedCash)}</p>
                        )}
                        <div className="button-row">
                          <button
                            disabled={me.status !== "active"}
                            onClick={() => open("fund")}
                          >
                            Add money
                          </button>
                          <button
                            className="quiet outline"
                            disabled={
                              me.status !== "active" ||
                              BigInt(me.balances.availableCash) <= 0n
                            }
                            onClick={() => open("payout")}
                          >
                            Withdraw
                          </button>
                        </div>
                      </section>
                    </div>
                    <section className="section-heading">
                      <h2>Recent activity</h2>
                      <button
                        className="quiet"
                        onClick={() => setTab("activity")}
                      >
                        View all
                      </button>
                    </section>
                    <section className="card activity-list">
                      {me.intents.length ? (
                        me.intents.slice(0, 5).map(operation)
                      ) : (
                        <div className="empty">
                          <p>No activity yet.</p>
                        </div>
                      )}
                    </section>
                  </>
                )}
                {tab === "activity" && (
                  <>
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
                  </>
                )}
                {tab === "settings" && (
                  <>
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
                  </>
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
        aria-labelledby="help-title"
        onCancel={(e) => {
          e.preventDefault();
          setHelp(false);
        }}
      >
        <div className="dialog-head">
          <h2 id="help-title">Your wallet</h2>
          <button
            className="quiet"
            aria-label="Close help"
            onClick={() => setHelp(false)}
          >
            ×
          </button>
        </div>
        {me ? (
          <>
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
            No real money or investments. 1% per buy or sell, with no fee cap.
          </p>
        </details>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </dialog>
      <dialog
        ref={dialog}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        aria-labelledby="dialog-title"
      >
        <div className="dialog-head">
          <span>Demo</span>
          <button
            className="quiet"
            aria-label="Close transaction"
            onClick={close}
            disabled={busy}
          >
            ×
          </button>
        </div>
        <h2 id="dialog-title">{action ? labels[action] : ""}</h2>
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
            <p>
              {action === "fund"
                ? "Add demo funds."
                : action === "buy"
                  ? "Buy demo QQQ. 1% fee."
                  : action === "sell"
                    ? "Sell demo QQQ. 1% fee."
                    : "Choose a destination from Settings."}
            </p>
            <label>
              Amount in dollars
              <input
                autoFocus
                inputMode="decimal"
                value={amount}
                disabled={all}
                onChange={(e) => setAmount(e.target.value)}
                required
                pattern="[0-9]+(\.[0-9]{1,2})?"
              />
            </label>
            {action === "sell" && (
              <label className="check">
                <input
                  type="checkbox"
                  checked={all}
                  onChange={(e) => setAll(e.target.checked)}
                />{" "}
                Sell all available units
              </label>
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
            <button className="primary" disabled={busy}>
              {busy ? "Preparing…" : "Review quote"}
            </button>
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
