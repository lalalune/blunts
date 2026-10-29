import { useEffect, useRef, useState } from "react";

type Challenge = { type: "totp" | "sms"; challengeId: string };
type LoginResult = { csrf?: string; mfaRequired?: boolean; mfa?: Challenge };

export function StewardLogin({
  api,
  onSuccess,
  providerLabel,
}: {
  api: <T = any>(path: string, body?: unknown, key?: string) => Promise<T>;
  onSuccess: (csrf: string) => Promise<void>;
  providerLabel: "Steward" | "Eliza Cloud";
}) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const [notice, setNotice] = useState("");
  const inFlight = useRef(false);
  const codeInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (sent && !busy) codeInput.current?.focus();
  }, [sent, challenge, busy]);
  useEffect(() => {
    if (!resendAt) return;
    const timer = window.setTimeout(
      () => setResendAt(0),
      Math.max(0, resendAt - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [resendAt]);
  async function sendEmailCode() {
    await api("/auth/steward/send", { email });
    setSent(true);
    setCode("");
    setResendAt(Date.now() + 60_000);
    setNotice("Email code requested. Check your inbox and spam folder.");
  }
  async function resend() {
    if (inFlight.current || challenge || resendAt > Date.now()) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await sendEmailCode();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      if (!sent) {
        await sendEmailCode();
      } else {
        const result = await api<LoginResult>(
          challenge ? "/auth/steward/mfa" : "/auth/steward/verify",
          challenge ? { ...challenge, code } : { email, code },
        );
        if (result.mfaRequired && result.mfa) {
          setChallenge(result.mfa);
          setCode("");
          setNotice("");
        } else if (result.csrf) await onSuccess(result.csrf);
        else
          throw new Error(
            "Steward could not complete sign-in. Please try again.",
          );
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <section
      className="welcome setup-overlay"
      role="dialog"
      aria-label="Wallet setup"
    >
      <section className="card auth">
        <h2>Your wallet.</h2>
        <p>
          Sign in with {providerLabel}. Your wallet stays with your account.
        </p>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              autoCapitalize="none"
              value={email}
              disabled={sent || busy}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {sent && (
            <label>
              {challenge ? "Verification code" : "Email code"}
              <input
                ref={codeInput}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern={challenge ? "[0-9]{6,12}" : "[0-9]{6}"}
                required
                maxLength={challenge ? 12 : 6}
                aria-describedby="sign-in-code-help"
                autoFocus
                disabled={busy}
              />
            </label>
          )}
          {sent && (
            <p id="sign-in-code-help">
              {challenge?.type === "totp"
                ? "Enter the code from your authenticator."
                : challenge?.type === "sms"
                  ? "Enter the code sent to your Steward phone."
                  : "Enter the six-digit code from your email."}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy
              ? "Please wait…"
              : sent
                ? "Open wallet"
                : `Continue with ${providerLabel}`}
          </button>
        </form>
        {notice && <p role="status">{notice}</p>}
        {sent && !challenge && (
          <button
            type="button"
            className="quiet"
            disabled={busy || resendAt > Date.now()}
            onClick={() => void resend()}
          >
            {resendAt > Date.now()
              ? "Resend available after one minute"
              : "Resend email code"}
          </button>
        )}
        {sent && (
          <button
            className="quiet"
            disabled={busy}
            onClick={() => {
              setSent(false);
              setCode("");
              setChallenge(null);
              setError("");
              setNotice("");
            }}
          >
            Use another email
          </button>
        )}
        <small>
          Investments and money flows in this preview are simulated.
        </small>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </section>
    </section>
  );
}
