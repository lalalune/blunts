import { openDatabase } from "./database.js";
import { createApp } from "./app.js";
import { tick, reconcile } from "./domain.js";
const port = Number(process.env.PORT ?? 8740);
const origin = process.env.APP_ORIGIN ?? `http://localhost:${port}`;
const mode = process.env.MONEY_MODE ?? "simulation";
if (mode !== "simulation")
  throw new Error(
    "Live money is not implemented. MONEY_MODE must be simulation.",
  );
const db = await openDatabase(process.env.DATABASE_URL ?? "data/blunts");
const app = await createApp({
  db,
  origin,
  mode,
  serveStatic: true,
  logger: true,
});
let running = false,
  stopping = false,
  cycles = 0;
const timer = setInterval(async () => {
  if (running || stopping) return;
  running = true;
  try {
    await tick(db);
    if (++cycles % 30 === 0) {
      const result = await reconcile(db);
      if (!result.ok) app.log.error("Reconciliation requires operator review.");
    }
  } catch {
    app.log.error("Worker failed; intents remain durable for recovery.");
  } finally {
    running = false;
  }
}, 500);
await app.listen({ port, host: process.env.HOST ?? "127.0.0.1" });
async function stop() {
  if (stopping) return;
  stopping = true;
  clearInterval(timer);
  await app.close();
  while (running) await new Promise((r) => setTimeout(r, 25));
  await db.close();
}
process.once("SIGTERM", () => void stop());
process.once("SIGINT", () => void stop());
