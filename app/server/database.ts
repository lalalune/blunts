import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
export type Row = Record<string, any>;
export interface SQL {
  query<T extends Row = Row>(sql: string, args?: any[]): Promise<T[]>;
}
export interface Database extends SQL {
  transaction<T>(fn: (db: SQL) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
export async function openDatabase(location: string): Promise<Database> {
  let tail = Promise.resolve();
  if (location.startsWith("postgres")) {
    const pool = new pg.Pool({ connectionString: location, max: 8 });
    return {
      async query<T extends Row>(sql: string, args: any[] = []) {
        return (await pool.query(sql, args)).rows as T[];
      },
      async transaction<T>(fn: (db: SQL) => Promise<T>) {
        const client = await pool.connect();
        try {
          await client.query("BEGIN");
          // All financial mutations and worker polls share an advisory lock across replicas.
          await client.query("SELECT pg_advisory_xact_lock(19480203)");
          const result = await fn({
            query: async <R extends Row>(sql: string, args: any[] = []) =>
              (await client.query(sql, args)).rows as R[],
          });
          await client.query("COMMIT");
          return result;
        } catch (e) {
          await client.query("ROLLBACK");
          throw e;
        } finally {
          client.release();
        }
      },
      async close() {
        await pool.end();
      },
    };
  }
  if (location !== "memory://")
    await mkdir(dirname(location), { recursive: true });
  const db = new PGlite(location === "memory://" ? undefined : location);
  const serial = async <T>(fn: () => Promise<T>): Promise<T> => {
    const previous = tail;
    let release!: () => void;
    tail = new Promise<void>((r) => {
      release = r;
    });
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  };
  return {
    query: <T extends Row>(sql: string, args: any[] = []) =>
      serial(async () => (await db.query<T>(sql, args)).rows),
    transaction: <T>(fn: (db: SQL) => Promise<T>) =>
      serial(() =>
        db.transaction((tx) =>
          fn({
            query: async <R extends Row>(sql: string, args: any[] = []) =>
              (await tx.query<R>(sql, args)).rows,
          }),
        ),
      ),
    close: () => db.close(),
  };
}
export async function migrate(db: Database) {
  await db.transaction(async (tx) => {
    await tx.query(
      `CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY, applied_at BIGINT NOT NULL)`,
    );
    if (
      !(await tx.query("SELECT version FROM schema_version WHERE version=1"))
        .length
    ) {
      const statements = [
        `CREATE TABLE users (id TEXT PRIMARY KEY, handle TEXT UNIQUE NOT NULL, password TEXT NOT NULL, recovery TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', created_at BIGINT NOT NULL)`,
        `CREATE TABLE sessions (hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), csrf TEXT NOT NULL, expires_at BIGINT NOT NULL)`,
        `CREATE TABLE consents (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), version TEXT NOT NULL, created_at BIGINT NOT NULL)`,
        `CREATE TABLE destinations (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), label TEXT NOT NULL, rail TEXT NOT NULL, address TEXT NOT NULL, created_at BIGINT NOT NULL)`,
        `CREATE TABLE quotes (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL, data JSONB NOT NULL, destination_id TEXT REFERENCES destinations(id), expires_at BIGINT NOT NULL, used BOOLEAN NOT NULL DEFAULT false)`,
        `CREATE TABLE intents (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL, state TEXT NOT NULL, quote_id TEXT UNIQUE NOT NULL REFERENCES quotes(id), data JSONB NOT NULL, destination_id TEXT REFERENCES destinations(id), idempotency_key TEXT NOT NULL, fingerprint TEXT NOT NULL, scenario TEXT NOT NULL, due_at BIGINT NOT NULL, created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL, UNIQUE(user_id,idempotency_key))`,
        `CREATE TABLE reservations (intent_id TEXT PRIMARY KEY REFERENCES intents(id), user_id TEXT NOT NULL REFERENCES users(id), asset TEXT NOT NULL, amount NUMERIC(30,0) NOT NULL CHECK(amount>=0))`,
        `CREATE TABLE journals (id TEXT PRIMARY KEY, intent_id TEXT NOT NULL REFERENCES intents(id), event TEXT NOT NULL, created_at BIGINT NOT NULL, UNIQUE(intent_id,event))`,
        `CREATE TABLE postings (journal_id TEXT NOT NULL REFERENCES journals(id), user_id TEXT NOT NULL REFERENCES users(id), account TEXT NOT NULL, asset TEXT NOT NULL, amount NUMERIC(30,0) NOT NULL)`,
        `CREATE INDEX postings_user ON postings(user_id,asset)`,
        `CREATE TABLE provider_actions (id TEXT PRIMARY KEY REFERENCES intents(id), status TEXT NOT NULL, polls INTEGER NOT NULL DEFAULT 0, scenario TEXT NOT NULL, created_at BIGINT NOT NULL)`,
        `CREATE TABLE activity (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), intent_id TEXT REFERENCES intents(id), message TEXT NOT NULL, created_at BIGINT NOT NULL)`,
        `CREATE TABLE support_cases (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), message TEXT NOT NULL, created_at BIGINT NOT NULL)`,
        `CREATE TABLE reconciliation (id TEXT PRIMARY KEY, ok BOOLEAN NOT NULL, details JSONB NOT NULL, created_at BIGINT NOT NULL)`,
      ];
      for (const sql of statements) await tx.query(sql);
      await tx.query("INSERT INTO schema_version VALUES (1,$1)", [Date.now()]);
    }
    if (
      !(await tx.query("SELECT version FROM schema_version WHERE version=2"))
        .length
    ) {
      await tx.query(
        `CREATE FUNCTION prevent_journal_mutation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Financial records are append-only; post a compensating entry'; END $$`,
      );
      for (const table of ["journals", "postings", "activity", "consents"])
        await tx.query(
          `CREATE TRIGGER append_only BEFORE UPDATE OR DELETE ON ${table} FOR EACH ROW EXECUTE FUNCTION prevent_journal_mutation()`,
        );
      await tx.query("INSERT INTO schema_version VALUES (2,$1)", [Date.now()]);
    }
    if (
      !(await tx.query("SELECT version FROM schema_version WHERE version=3"))
        .length
    ) {
      await tx.query(
        "ALTER TABLE reservations DROP CONSTRAINT reservations_pkey",
      );
      await tx.query(
        "ALTER TABLE reservations ADD PRIMARY KEY(intent_id,asset)",
      );
      await tx.query("INSERT INTO schema_version VALUES (3,$1)", [Date.now()]);
    }
    if (
      !(await tx.query("SELECT version FROM schema_version WHERE version=4"))
        .length
    ) {
      await tx.query(
        `CREATE TABLE flows (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL, amount TEXT NOT NULL, fingerprint TEXT NOT NULL, state TEXT NOT NULL, intent_id TEXT NOT NULL REFERENCES intents(id), error TEXT, created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL, UNIQUE(user_id,id))`,
      );
      await tx.query(
        `CREATE UNIQUE INDEX one_active_flow ON flows(user_id) WHERE state IN ('funding','investing','selling')`,
      );
      await tx.query("INSERT INTO schema_version VALUES (4,$1)", [Date.now()]);
    }
  });
}
