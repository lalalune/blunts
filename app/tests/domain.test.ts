import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase, migrate, type Database } from "../server/database.js";
import {
  balances,
  createQuote,
  createIntent,
  tick,
  reconcile,
  returnIntent,
} from "../server/domain.js";
import { cents, fee, quoteNumbers } from "../shared/money.js";
const user = "11111111-1111-4111-8111-111111111111";
async function setup(location = "memory://") {
  const db = await openDatabase(location);
  await migrate(db);
  await db.query(
    "INSERT INTO users VALUES ($1,'tester','not-real','not-real','active',$2)",
    [user, Date.now()],
  );
  return db;
}
async function make(
  db: Database,
  kind: "fund" | "buy" | "sell" | "payout",
  amount: string,
  scenario = "success",
  extra: Record<string, any> = {},
) {
  return db.transaction(async (tx) => {
    const q = await createQuote(tx, user, { kind, amount, ...extra });
    const i = await createIntent(tx, user, q.id, randomUUID(), scenario);
    if (kind === "fund")
      await tx.query("UPDATE intents SET state='queued' WHERE id=$1", [i.id]);
    return i;
  });
}
async function advance(db: Database, n = 5) {
  for (let j = 0; j < n; j++) {
    await db.query("UPDATE intents SET due_at=0");
    await tick(db);
  }
}
test("money is exact, rejects malformed amounts, and fees have no dollar cap", () => {
  assert.equal(cents("10000.01"), 1000001n);
  assert.equal(fee(1000000n), 10000n);
  for (const amount of [
    "NaN",
    "1e6",
    "-1",
    "1.001",
    " 5",
    "00.01",
    "0",
    "1000000.01",
  ])
    assert.throws(() => cents(amount));
  for (let a = 1n; a < 20000n; a += 17n) {
    const q = quoteNumbers("buy", a);
    assert.equal(BigInt(q.fee), fee(a));
    assert.ok(BigInt(q.debit) <= a);
    assert.ok(BigInt(q.net) > 0n);
  }
});
test("fund → buy → sell → payout closes with balanced immutable postings", async () => {
  const db = await setup();
  try {
    await make(db, "fund", "100");
    await advance(db);
    await make(db, "buy", "100");
    await advance(db);
    let b = await balances(db, user);
    assert.equal(b.cash, "0");
    assert.equal(b.investmentValue, "9900");
    await make(db, "sell", "99", "success", { all: true });
    await advance(db);
    b = await balances(db, user);
    assert.equal(b.cash, "9801");
    assert.equal(b.units, "0");
    const dest = randomUUID();
    await db.query("INSERT INTO destinations VALUES ($1,$2,$3,$4,$5,$6)", [
      dest,
      user,
      "Demo",
      "cash_app_demo",
      "DEMO",
      Date.now(),
    ]);
    await make(db, "payout", "98.01", "success", { destinationId: dest });
    await advance(db);
    b = await balances(db, user);
    assert.equal(b.cash, "0");
    assert.equal(b.reservedCash, "0");
    assert.ok((await reconcile(db)).ok);
    const [fees] = await db.query(
      "SELECT SUM(amount)::text AS amount FROM postings WHERE account='fees'",
    );
    assert.equal(fees.amount, "199");
  } finally {
    await db.close();
  }
});
test("idempotency, single-use quotes and reservations prevent double spending", async () => {
  const db = await setup();
  try {
    await make(db, "fund", "100");
    await advance(db);
    const [a, b] = await Promise.all([
      db.transaction((tx) =>
        createQuote(tx, user, { kind: "buy", amount: "80" }),
      ),
      db.transaction((tx) =>
        createQuote(tx, user, { kind: "buy", amount: "80" }),
      ),
    ]);
    const key = randomUUID();
    const i = await db.transaction((tx) =>
      createIntent(tx, user, a.id, key, "success"),
    );
    const again = await db.transaction((tx) =>
      createIntent(tx, user, a.id, key, "success"),
    );
    assert.equal(i.id, again.id);
    await assert.rejects(
      db.transaction((tx) => createIntent(tx, user, b.id, key, "success")),
      /different request/,
    );
    await assert.rejects(
      db.transaction((tx) =>
        createIntent(tx, user, a.id, randomUUID(), "success"),
      ),
      /already been confirmed/,
    );
    await assert.rejects(
      db.transaction((tx) =>
        createIntent(tx, user, b.id, randomUUID(), "success"),
      ),
      /Not enough/,
    );
    assert.equal((await balances(db, user)).availableCash, "2000");
    await advance(db);
    assert.ok((await reconcile(db)).ok);
  } finally {
    await db.close();
  }
});
test("provider timeout is resolved by lookup with one economic action", async () => {
  const db = await setup();
  try {
    const i = await make(db, "fund", "250", "timeout");
    await advance(db, 1);
    assert.equal(
      (await db.query("SELECT state FROM intents WHERE id=$1", [i.id]))[0]
        .state,
      "unknown",
    );
    await advance(db, 8);
    assert.equal((await balances(db, user)).cash, "25000");
    assert.equal((await db.query("SELECT * FROM provider_actions")).length, 1);
    assert.equal((await db.query("SELECT * FROM journals")).length, 1);
  } finally {
    await db.close();
  }
});
test("partial fills charge cumulative fee exactly once and release reservations", async () => {
  const db = await setup();
  try {
    await make(db, "fund", "2000.01");
    await advance(db);
    await make(db, "buy", "2000.01", "partial");
    await advance(db, 2);
    const partial = await balances(db, user);
    assert.ok(BigInt(partial.reservedCash) > 0n);
    assert.ok(BigInt(partial.units) > 0n);
    await advance(db);
    await make(db, "sell", "0", "partial", { all: true });
    const before = await balances(db, user);
    await advance(db, 2);
    const unsettled = await balances(db, user);
    assert.ok(BigInt(unsettled.reservedCash) > 0n);
    assert.equal(unsettled.availableCash, before.availableCash);
    await advance(db);
    const b = await balances(db, user);
    assert.equal(b.units, "0");
    assert.equal(b.reservedCash, "0");
    assert.equal(b.reservedUnits, "0");
    const [f] = await db.query(
      "SELECT SUM(amount)::text AS fee FROM postings WHERE account='fees'",
    );
    assert.equal(f.fee, "3980");
    assert.ok((await reconcile(db)).ok);
  } finally {
    await db.close();
  }
});
test("rejected conversion releases money without a charge; expired quote cannot execute", async () => {
  const db = await setup();
  try {
    await make(db, "fund", "100");
    await advance(db);
    await make(db, "buy", "100", "reject");
    await advance(db);
    assert.equal((await balances(db, user)).availableCash, "10000");
    assert.equal(
      (await db.query("SELECT * FROM postings WHERE account='fees'")).length,
      0,
    );
    const q = await db.transaction((tx) =>
      createQuote(tx, user, { kind: "buy", amount: "100" }),
    );
    await db.query("UPDATE quotes SET expires_at=0 WHERE id=$1", [q.id]);
    await assert.rejects(
      db.transaction((tx) =>
        createIntent(tx, user, q.id, randomUUID(), "success"),
      ),
      /expired/,
    );
  } finally {
    await db.close();
  }
});
test("returned funding is compensated once and spent returns restrict the account", async () => {
  const db = await setup();
  try {
    const funding = await make(db, "fund", "100");
    await advance(db);
    await make(db, "buy", "100");
    await advance(db);
    await db.transaction((tx) => returnIntent(tx, user, funding.id));
    await db.transaction((tx) => returnIntent(tx, user, funding.id));
    assert.equal((await balances(db, user)).cash, "-10000");
    assert.equal(
      (await db.query("SELECT status FROM users WHERE id=$1", [user]))[0]
        .status,
      "restricted",
    );
    assert.equal((await reconcile(db)).ok, false);
    await assert.rejects(
      db.transaction((tx) =>
        createQuote(tx, user, { kind: "fund", amount: "100" }),
      ),
      /onboarding/,
    );
  } finally {
    await db.close();
  }
});
test("returned payout restores wallet funds and never repeats the transfer", async () => {
  const db = await setup();
  try {
    await make(db, "fund", "100");
    await advance(db);
    const dest = randomUUID();
    await db.query("INSERT INTO destinations VALUES ($1,$2,$3,$4,$5,$6)", [
      dest,
      user,
      "Demo",
      "wallet_demo",
      "DEMO",
      Date.now(),
    ]);
    const p = await make(db, "payout", "100", "success", {
      destinationId: dest,
    });
    await advance(db);
    await db.transaction((tx) => returnIntent(tx, user, p.id));
    await advance(db);
    assert.equal((await balances(db, user)).cash, "10000");
    assert.ok((await reconcile(db)).ok);
  } finally {
    await db.close();
  }
});
test("process restart retains unknown intent and completes without resubmission", async () => {
  const dir = await mkdtemp(join(tmpdir(), "blunts-restart-"));
  let db = await setup(join(dir, "db"));
  try {
    await make(db, "fund", "345", "timeout");
    await advance(db, 1);
    await db.close();
    db = await openDatabase(join(dir, "db"));
    await migrate(db);
    await advance(db);
    assert.equal((await balances(db, user)).cash, "34500");
    assert.equal((await db.query("SELECT * FROM provider_actions")).length, 1);
  } finally {
    await db.close();
    await rm(dir, { recursive: true, force: true });
  }
});
test(
  "Postgres adapter full cycle",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    const db = await openDatabase(process.env.TEST_DATABASE_URL!);
    try {
      await migrate(db);
      const name = `pg_${randomUUID()}`;
      await db.query("INSERT INTO users VALUES ($1,$2,$3,$4,$5,$6)", [
        user,
        name,
        "x",
        "x",
        "active",
        Date.now(),
      ]);
      await make(db, "fund", "123");
      await advance(db);
      assert.equal((await balances(db, user)).cash, "12300");
      await make(db, "buy", "123");
      await advance(db);
      await make(db, "sell", "0", "success", { all: true });
      await advance(db);
      const dest = randomUUID();
      await db.query("INSERT INTO destinations VALUES ($1,$2,$3,$4,$5,$6)", [
        dest,
        user,
        "Demo",
        "wallet_demo",
        "DEMO",
        Date.now(),
      ]);
      await make(db, "payout", "120.55", "success", { destinationId: dest });
      await advance(db);
      assert.equal((await balances(db, user)).cash, "0");
      assert.equal((await balances(db, user)).units, "0");
      await assert.rejects(db.query("DELETE FROM postings"), /append-only/);
      assert.ok((await reconcile(db)).ok);
    } finally {
      await db.close();
    }
  },
);
test("ledger mutation is rejected and reconciliation detects missing economic evidence", async () => {
  const db = await setup();
  try {
    const i = await make(db, "fund", "100");
    await advance(db);
    await assert.rejects(
      db.query("UPDATE postings SET amount=0 WHERE account='customer'"),
      /append-only/,
    );
    await assert.rejects(db.query("DELETE FROM journals"), /append-only/);
    await db.query(
      "UPDATE intents SET data=jsonb_set(data,'{gross}','\"20000\"') WHERE id=$1",
      [i.id],
    );
    const result = await reconcile(db);
    assert.equal(result.ok, false);
    assert.deepEqual(result.details.mismatches, [i.id]);
  } finally {
    await db.close();
  }
});
test("a return stops still-unsubmitted investment commands before provider acceptance", async () => {
  const db = await setup();
  try {
    const funding = await make(db, "fund", "100");
    await advance(db);
    const buy = await make(db, "buy", "100");
    await db.transaction((tx) => returnIntent(tx, user, funding.id));
    await advance(db);
    assert.equal(
      (await db.query("SELECT state FROM intents WHERE id=$1", [buy.id]))[0]
        .state,
      "failed",
    );
    assert.equal(
      (await db.query("SELECT * FROM provider_actions WHERE id=$1", [buy.id]))
        .length,
      0,
    );
    assert.equal((await balances(db, user)).reservedCash, "0");
  } finally {
    await db.close();
  }
});
