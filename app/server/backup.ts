import { writeFile, readFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { openDatabase, migrate } from "./database.js";
const [command, path] = process.argv.slice(2);
if (!["backup", "restore"].includes(command) || !path)
  throw new Error(
    "Usage: npm run db:backup -- backup|restore /private/path/snapshot.json",
  );
const db = await openDatabase(process.env.DATABASE_URL ?? "data/blunts");
const tables = [
  "users",
  "sessions",
  "consents",
  "destinations",
  "quotes",
  "intents",
  "flows",
  "reservations",
  "journals",
  "postings",
  "provider_actions",
  "activity",
  "support_cases",
  "reconciliation",
];
try {
  await migrate(db);
  if (command === "backup") {
    const result = await db.transaction(async (tx) => {
      const data: Record<string, unknown[]> = {};
      for (const table of tables)
        data[table] = await tx.query(`SELECT * FROM ${table}`);
      return {
        schema: 2,
        mode: "simulation",
        createdAt: new Date().toISOString(),
        data,
      };
    });
    // Sessions are intentionally omitted so restoration cannot revive browser access.
    result.data.sessions = [];
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    await writeFile(path, JSON.stringify(result), { mode: 0o600, flag: "wx" });
    console.log(
      "Sandbox snapshot written. Contains private account records; store encrypted.",
    );
  } else {
    const snapshot = JSON.parse(await readFile(path, "utf8"));
    if (![1, 2].includes(snapshot.schema) || snapshot.mode !== "simulation")
      throw new Error("Unsupported snapshot.");
    if (snapshot.schema === 1 && !snapshot.data.flows) snapshot.data.flows = [];
    await db.transaction(async (tx) => {
      for (const table of tables)
        if ((await tx.query(`SELECT 1 FROM ${table} LIMIT 1`)).length)
          throw new Error("Restore requires an empty database.");
      for (const table of tables.filter((t) => t !== "sessions")) {
        const columns = (
          await tx.query(
            "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",
            [table],
          )
        ).map((r) => r.column_name);
        if (!Array.isArray(snapshot.data[table]))
          throw new Error(`Missing table ${table}`);
        for (const row of snapshot.data[table]) {
          if (Object.keys(row).some((k) => !columns.includes(k)))
            throw new Error("Unexpected snapshot field.");
          await tx.query(
            `INSERT INTO ${table} (${columns.map((c) => `"${c}"`).join(",")}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(",")})`,
            columns.map((c) =>
              ["data", "details"].includes(c) ? JSON.stringify(row[c]) : row[c],
            ),
          );
        }
      }
    });
    console.log("Sandbox snapshot restored. All users must sign in again.");
  }
} finally {
  await db.close();
}
