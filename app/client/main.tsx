import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { dollars, quantity, type Kind } from "../shared/money";
import "./style.css";
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
  fund: "Add USDC",
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
  const response = await fetch(`/api${path}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers: {
      ...(body === undefined
        ? {}
        : {
            "Content-Type": "application/json",
            "X-Blunts-Request": "1",
            "X-CSRF-Token": csrf,
          }),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
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
          <code>{i.id.slice(0, 8)}</code>
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
              Authorize simulated deposit
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
      <div className="sandbox">
        <span className="dot" /> Sandbox · simulated funds only{" "}
        <span className="sandbox-note">Never send real money</span>
      </div>
      <header>
        <a className="brand" href="/" aria-label="Blunts home">
          blunt<span>$</span>
        </a>
        <span className="network">USDC / Arbitrum concept</span>
        {me && (
          <button
            className="quiet"
            onClick={() =>
              run(async () => {
                await api("/auth/logout", {});
                authEpoch.current++;
                csrf = "";
                setMe(null);
                setRecovery("");
                setTab("wallet");
              })
            }
          >
            Sign out
          </button>
        )}
      </header>
      <main>
        {!loaded ? (
          <p role="status">Opening your wallet…</p>
        ) : !me ? (
          <section className="welcome">
            <div className="intro">
              <p className="eyebrow">A LITTLE AT A TIME.</p>
              <h1>
                Your wallet.
                <br />
                <em>Your pace.</em>
              </h1>
              <p>
                Add funds. Fill an investment. Spark it back into your wallet.
                Try the whole journey with simulated USDC.
              </p>
              <div className="principles">
                <span>1% per conversion</span>
                <span>No fee cap</span>
                <span>No subscription</span>
              </div>
              <p className="muted">
                This build has no real wallet, Cash App connection or brokerage
                account. Prices and execution are test fixtures.
              </p>
            </div>
            <section className="card auth">
              <h2>
                {authMode === "register"
                  ? "Create a sandbox wallet"
                  : authMode === "login"
                    ? "Welcome back"
                    : "Recover your wallet"}
              </h2>
              <p>
                Use a made-up handle. No email or identity documents needed for
                this simulation.
              </p>
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
                <button
                  className="quiet"
                  onClick={() => {
                    setAuthMode("recover");
                    setError("");
                  }}
                >
                  Use recovery code
                </button>
              </div>
            </section>
          </section>
        ) : (
          <>
            {recovery && (
              <section className="callout">
                <h2>Save your recovery code</h2>
                <p>
                  This is shown once. Store it privately to recover this sandbox
                  account if you forget your password.
                </p>
                <code className="recovery">{recovery}</code>
                <button onClick={() => setRecovery("")}>
                  I saved my recovery code
                </button>
              </section>
            )}
            {me.status === "new" ? (
              <section className="card onboarding">
                <p className="eyebrow">BEFORE YOU FILL</p>
                <h1>Make yourself at home.</h1>
                <p>
                  This is a testing environment, not identity verification or
                  approval to invest.
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
                    <input type="checkbox" required /> I am 18 or older.
                  </label>
                  <label className="check">
                    <input type="checkbox" required /> I understand all funds,
                    investments, payment methods and outcomes here are
                    simulated.
                  </label>
                  <label className="check">
                    <input type="checkbox" required /> I accept the sandbox
                    terms: use test data only; no investment advice, actual
                    custody or tax reporting is provided.
                  </label>
                  <button className="primary" disabled={busy}>
                    Open sandbox wallet
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
                    <section className="balance-hero">
                      <div>
                        <p className="eyebrow">
                          HEY, {me.handle.toUpperCase()}
                        </p>
                        <h1>Your growing space.</h1>
                        <p className="muted">A wallet for the long game.</p>
                      </div>
                      <div className="leaf-art" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <span>blunt$</span>
                      </div>
                    </section>
                    <div className="balance-grid">
                      <section className="card investment">
                        <span>Simulated investment value</span>
                        <strong className="big-number">
                          {dollars(me.balances.investmentValue)}
                        </strong>
                        <p>{quantity(me.balances.units)} DEMO_QQQ units</p>
                        <small>
                          Fixture price: $500.00 · no live market feed
                        </small>
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
                        <small>
                          1% on each completed conversion. No dollar cap.
                        </small>
                      </section>
                      <section className="card">
                        <span>Available simulated USDC</span>
                        <strong className="big-number">
                          {dollars(me.balances.availableCash)}
                        </strong>
                        <p>Reserved: {dollars(me.balances.reservedCash)}</p>
                        <div className="button-row">
                          <button
                            disabled={me.status !== "active"}
                            onClick={() => open("fund")}
                          >
                            Add USDC
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
                        <small>
                          Adding USDC does not automatically buy an investment.
                        </small>
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
                          <h3>Room to grow.</h3>
                          <p>
                            Add simulated USDC, then Fill when you’re ready.
                          </p>
                        </div>
                      )}
                    </section>
                    <div className="footnote">
                      Free holding. No subscription. External ramp, network and
                      execution costs will be separately quoted in a live
                      product.
                    </div>
                  </>
                )}
                {tab === "activity" && (
                  <>
                    <div className="section-heading">
                      <div>
                        <h1>Every move, accounted for.</h1>
                        <p>
                          Pending actions survive reloads. A browser callback
                          never changes your balance.
                        </p>
                      </div>
                    </div>
                    <a
                      className="download"
                      href="/api/documents/statement"
                      download
                    >
                      Download simulated statement ↗
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
                    <h1>Make it yours.</h1>
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
        {!action && error && (
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
      <footer>
        blunt$ · Browser sandbox{" "}
        <span>Clear fees. Your confirmation. Every time.</span>
      </footer>
      <dialog
        ref={dialog}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        aria-labelledby="dialog-title"
      >
        <div className="dialog-head">
          <span className="eyebrow">SIMULATED TRANSACTION</span>
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
                  ? "Approve this simulated deposit. No Cash App or MoonPay account is connected."
                  : currentIntent.state === "completed"
                    ? "Your simulated balance has been updated."
                    : currentIntent.state === "failed"
                      ? "The provider rejected this action. Reserved funds were released."
                      : terminal.has(currentIntent.state)
                        ? "This action has ended. See activity for details."
                        : "Your instruction is saved. You can close this window; processing continues safely."}
              </p>
              <code>{currentIntent.id}</code>
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
                Authorize simulated deposit
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
                ? "Buy DEMO_QQQ at the fixed test price."
                : action === "sell"
                  ? "Sell DEMO_QQQ; proceeds become available after simulated settlement."
                  : action === "fund"
                    ? "Credit simulated USDC. Funding does not buy an investment."
                    : "Send simulated USDC to your test destination."}
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
            <p className="muted">
              External fees are $0 in this simulation. Live providers will quote
              their actual costs.
            </p>
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
              {busy ? "Saving instruction…" : "Confirm simulated transaction"}
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
                ? "Practice adding USDC. No real payment will be requested."
                : action === "buy"
                  ? "Convert available simulated USDC into investment units."
                  : action === "sell"
                    ? "Convert investment units back into simulated USDC."
                    : "Choose a test destination. Add one in Settings first."}
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
