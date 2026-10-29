# Wallet refresh budget

Current static graph: visible or hidden tab → 1.5-second interval → `/api/me` →
account/ledger reads. With Steward auth, every call also verifies `/user/me`.
Overlapping requests are possible when a response takes longer than the interval.

Measured baseline from the local preview request log: requests at timestamps
1793101406796, 1793101408290 and 1793101409797 ms; gaps 1494 and 1507 ms.
That is approximately 40 local account reads per minute even when idle, plus
40 upstream identity checks per minute for Steward accounts.

Target graph:

- Pending action: one refresh at most every 1.5 seconds, one in flight.
- Idle foreground: one refresh at most every 15 seconds, one in flight.
- Hidden document: no periodic refresh; workers continue on the server.
- Mutation, native resume, browser focus or visible-again event: refresh promptly.
- Failed reads preserve the last verified balance; they never create zero money.

The target preserves cross-device drift detection while reducing steady idle
requests by 90%. No cache is introduced. A read may still require one upstream
refresh-token rotation before its one identity check when access expires.
The browser acceptance suite measures the idle window and exercises active flows.
