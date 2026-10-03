import { openDatabase, migrate } from "./database.js";
import { reconcile, audit, balances } from "./domain.js";
const [command, userId] = process.argv.slice(2);
if (!["status", "reconcile", "release-hold"].includes(command))
  throw new Error(
    "Usage: npm run ops -- status|reconcile|release-hold USER_ID",
  );
const db = await openDatabase(process.env.DATABASE_URL ?? "data/blunts");
try {
  await migrate(db);
  if (command === "status") {
    const states = await db.query(
      "SELECT state,COUNT(*)::text AS count FROM intents GROUP BY state",
    );
    const last = await db.query(
      "SELECT ok,created_at FROM reconciliation ORDER BY created_at DESC LIMIT 1",
    );
    console.log(
      JSON.stringify({
        mode: "simulation",
        states,
        lastReconciliation: last[0] ?? null,
      }),
    );
  } else if (command === "reconcile") {
    const result = await reconcile(db);
    console.log(JSON.stringify(result));
    if (!result.ok) process.exitCode = 1;
  } else {
    if (!userId) throw new Error("A specific user ID is required.");
    const result = await reconcile(db);
    if (!result.ok)
      throw new Error("Unresolved reconciliation breaks prevent release.");
    await db.transaction(async (tx) => {
      const [u] = await tx.query("SELECT status FROM users WHERE id=$1", [
        userId,
      ]);
      if (u?.status !== "restricted")
        throw new Error("Account is not restricted.");
      const b = await balances(tx, userId);
      if (BigInt(b.availableCash) < 0n || BigInt(b.availableUnits) < 0n)
        throw new Error("Negative balances prevent release.");
      await tx.query("UPDATE users SET status='active' WHERE id=$1", [userId]);
      await audit(
        tx,
        userId,
        "Local operator released reconciled sandbox hold.",
      );
    });
    console.log("Reconciled sandbox account released. No balance was edited.");
  }
} finally {
  await db.close();
}
