import { useEffect, useRef } from "react";
import type { SwapAttempt } from "../shared/swap-journal";

/** Observations only: no wallet requests, retries of transactions or journal
 * deletion. Poll one known hash, pause hidden tabs and back off long waits. */
export function useReceiptPolling(
  record: SwapAttempt | undefined,
  observe: (record: SwapAttempt) => Promise<void>,
) {
  const latest = useRef(observe);
  latest.current = observe;
  const key = record?.hash
    ? `${record.owner}:${record.planId}:${record.step}:${record.hash}`
    : undefined;
  useEffect(() => {
    if (
      !key ||
      !record ||
      !["pending", "unknown", "awaiting_wallet"].includes(record.state)
    )
      return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const started = Date.now();
    const schedule = (delay: number) => {
      timer = setTimeout(() => void poll(), delay);
    };
    const poll = async () => {
      if (stopped) return;
      if (!document.hidden) await latest.current(record);
      if (!stopped)
        schedule(
          document.hidden
            ? 30000
            : Date.now() - started > 300000
              ? 30000
              : Date.now() - started > 60000
                ? 15000
                : 4000,
        );
    };
    const visible = () => {
      if (!document.hidden) {
        clearTimeout(timer);
        schedule(0);
      }
    };
    document.addEventListener("visibilitychange", visible);
    schedule(1000);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [key, record?.state]);
}
