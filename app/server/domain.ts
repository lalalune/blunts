import { randomUUID } from "node:crypto";
import { simulator } from "./providers.js";
import type { Database, SQL, Row } from "./database.js";
import {
  SHARE_SCALE,
  PRICE_CENTS,
  fee,
  quoteNumbers,
  cents,
  type Kind,
} from "../shared/money.js";
export class Problem extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}
export function requireThat(
  condition: unknown,
  message: string,
  code = 409,
): asserts condition {
  if (!condition) throw new Problem(code, message);
}
export const now = () => Date.now();
export async function balances(tx: SQL, user: string) {
  const postings = await tx.query(
    `SELECT asset, SUM(amount)::text AS amount FROM postings WHERE user_id=$1 AND account='customer' GROUP BY asset`,
    [user],
  );
  const reservations = await tx.query(
    `SELECT asset,SUM(amount)::text AS amount FROM reservations WHERE user_id=$1 GROUP BY asset`,
    [user],
  );
  const total = (a: string) =>
    BigInt(postings.find((x) => x.asset === a)?.amount ?? "0");
  const held = (a: string) =>
    BigInt(reservations.find((x) => x.asset === a)?.amount ?? "0");
  return {
    cash: total("USDC").toString(),
    reservedCash: held("USDC").toString(),
    availableCash: (total("USDC") - held("USDC")).toString(),
    units: total("DEMO_QQQ").toString(),
    reservedUnits: held("DEMO_QQQ").toString(),
    availableUnits: (total("DEMO_QQQ") - held("DEMO_QQQ")).toString(),
    investmentValue: (
      (total("DEMO_QQQ") * PRICE_CENTS) /
      SHARE_SCALE
    ).toString(),
  };
}
export async function audit(
  tx: SQL,
  user: string,
  message: string,
  intent: string | null = null,
) {
  await tx.query("INSERT INTO activity VALUES ($1,$2,$3,$4,$5)", [
    randomUUID(),
    user,
    intent,
    message,
    now(),
  ]);
}
export async function journal(
  tx: SQL,
  intent: Row,
  event: string,
  lines: [string, string, bigint][],
) {
  const sums = new Map<string, bigint>();
  for (const [, asset, amount] of lines)
    sums.set(asset, (sums.get(asset) ?? 0n) + amount);
  requireThat(
    [...sums.values()].every((a) => a === 0n),
    "Unbalanced posting",
    500,
  );
  const id = randomUUID();
  const inserted = await tx.query(
    "INSERT INTO journals VALUES ($1,$2,$3,$4) ON CONFLICT(intent_id,event) DO NOTHING RETURNING id",
    [id, intent.id, event, now()],
  );
  if (!inserted.length) return;
  for (const [account, asset, amount] of lines)
    await tx.query("INSERT INTO postings VALUES ($1,$2,$3,$4,$5)", [
      id,
      intent.user_id,
      account,
      asset,
      amount.toString(),
    ]);
}
export async function createQuote(
  tx: SQL,
  user: string,
  input: { kind: Kind; amount: string; all?: boolean; destinationId?: string },
) {
  const [account] = await tx.query("SELECT status FROM users WHERE id=$1", [
    user,
  ]);
  requireThat(
    account?.status === "active",
    "Complete sandbox onboarding before using the wallet.",
  );
  const b = await balances(tx, user);
  let amount: bigint;
  try {
    amount =
      input.all && input.kind === "sell"
        ? (BigInt(b.availableUnits) * PRICE_CENTS) / SHARE_SCALE
        : cents(input.amount);
  } catch (e) {
    throw new Problem(400, (e as Error).message);
  }
  let data;
  try {
    data = quoteNumbers(
      input.kind,
      amount,
      input.all && input.kind === "sell" ? BigInt(b.availableUnits) : undefined,
    );
  } catch (e) {
    throw new Problem(400, (e as Error).message);
  }
  if (input.kind === "buy" || input.kind === "payout")
    requireThat(
      BigInt(b.availableCash) >= BigInt(data.debit),
      "Not enough available USDC.",
    );
  if (input.kind === "sell")
    requireThat(
      BigInt(b.availableUnits) >= BigInt(data.units),
      "Not enough available investment units.",
    );
  if (input.kind === "payout") {
    requireThat(input.destinationId, "Choose a destination.", 400);
    requireThat(
      (
        await tx.query(
          "SELECT id FROM destinations WHERE id=$1 AND user_id=$2",
          [input.destinationId, user],
        )
      ).length,
      "Destination not found.",
      404,
    );
  }
  const id = randomUUID(),
    expiresAt = now() + 60_000;
  await tx.query(
    "INSERT INTO quotes (id,user_id,kind,data,destination_id,expires_at) VALUES ($1,$2,$3,$4,$5,$6)",
    [
      id,
      user,
      input.kind,
      JSON.stringify(data),
      input.kind === "payout" ? input.destinationId : null,
      expiresAt,
    ],
  );
  return {
    id,
    kind: input.kind,
    ...data,
    expiresAt,
    destinationId: input.destinationId ?? null,
    simulation: true,
  };
}
export async function createIntent(
  tx: SQL,
  user: string,
  quoteId: string,
  key: string,
  scenario: string,
) {
  const fingerprint = JSON.stringify({ quoteId, scenario });
  const [existing] = await tx.query(
    "SELECT * FROM intents WHERE user_id=$1 AND idempotency_key=$2",
    [user, key],
  );
  if (existing) {
    requireThat(
      existing.fingerprint === fingerprint,
      "Idempotency key was already used for a different request.",
    );
    return existing;
  }
  const [account] = await tx.query("SELECT status FROM users WHERE id=$1", [
    user,
  ]);
  requireThat(
    account?.status === "active",
    "Account is not enabled for new actions.",
  );
  const [q] = await tx.query(
    "SELECT * FROM quotes WHERE id=$1 AND user_id=$2",
    [quoteId, user],
  );
  requireThat(q, "Quote not found.", 404);
  requireThat(!q.used, "Quote has already been confirmed.");
  requireThat(
    Number(q.expires_at) > now(),
    "Quote expired. Request a fresh quote.",
  );
  const b = await balances(tx, user);
  if (q.kind === "buy" || q.kind === "payout")
    requireThat(
      BigInt(b.availableCash) >= BigInt(q.data.debit),
      "Not enough available USDC.",
    );
  if (q.kind === "sell")
    requireThat(
      BigInt(b.availableUnits) >= BigInt(q.data.units),
      "Not enough available investment units.",
    );
  const id = randomUUID();
  const state = q.kind === "fund" ? "awaiting_authorization" : "queued";
  const [intent] = await tx.query(
    `INSERT INTO intents VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11,$11) RETURNING *`,
    [
      id,
      user,
      q.kind,
      state,
      q.id,
      JSON.stringify({ ...q.data, filledUnits: "0", chargedFee: "0" }),
      q.destination_id,
      key,
      fingerprint,
      scenario,
      now(),
    ],
  );
  if (q.kind !== "fund")
    await tx.query("INSERT INTO reservations VALUES ($1,$2,$3,$4)", [
      id,
      user,
      q.kind === "sell" ? "DEMO_QQQ" : "USDC",
      q.kind === "sell" ? q.data.units : q.data.debit,
    ]);
  await tx.query("UPDATE quotes SET used=true WHERE id=$1", [q.id]);
  await audit(tx, user, `${q.kind}: ${state}`, id);
  return intent;
}
async function postFill(tx: SQL, i: Row, partial: boolean) {
  const q = i.data;
  const target = partial ? BigInt(q.units) / 2n : BigInt(q.units);
  const delta = target - BigInt(q.filledUnits);
  if (delta <= 0n) return;
  const filledValue = (target * PRICE_CENTS) / SHARE_SCALE;
  const oldValue = (BigInt(q.filledUnits) * PRICE_CENTS) / SHARE_SCALE;
  const value = filledValue - oldValue;
  const targetFee = partial
    ? (BigInt(q.fee) * target) / BigInt(q.units)
    : BigInt(q.fee);
  const cost = targetFee - BigInt(q.chargedFee);
  const cash = i.kind === "buy" ? -(value + cost) : value - cost;
  const units = i.kind === "buy" ? delta : -delta;
  await journal(tx, i, partial ? "partial" : "fill", [
    ["customer", "USDC", cash],
    ["market", "USDC", -cash - cost],
    ["fees", "USDC", cost],
    ["customer", "DEMO_QQQ", units],
    ["market", "DEMO_QQQ", -units],
  ]);
  q.filledUnits = target.toString();
  q.chargedFee = targetFee.toString();
  const remaining =
    i.kind === "buy"
      ? BigInt(q.debit) - filledValue - targetFee
      : BigInt(q.units) - target;
  await tx.query(
    "UPDATE reservations SET amount=$1 WHERE intent_id=$2 AND asset=$3",
    [remaining.toString(), i.id, i.kind === "sell" ? "DEMO_QQQ" : "USDC"],
  );
  // A partial sale has executed but its cash cannot fund another command until settlement.
  if (i.kind === "sell" && partial)
    await tx.query(
      "INSERT INTO reservations VALUES ($1,$2,'USDC',$3) ON CONFLICT(intent_id,asset) DO UPDATE SET amount=EXCLUDED.amount",
      [i.id, i.user_id, (filledValue - targetFee).toString()],
    );
  await tx.query("UPDATE intents SET data=$1 WHERE id=$2", [
    JSON.stringify(q),
    i.id,
  ]);
}
/** Deterministic provider. Commands are durably keyed by the intent; lookup precedes retries. */
export async function tick(db: Database) {
  await db.transaction(async (tx) => {
    const pending = await tx.query(
      `SELECT * FROM intents WHERE state IN ('queued','submitted','unknown','partially_filled','settlement_pending') AND due_at<=$1 ORDER BY created_at,id LIMIT 50`,
      [now()],
    );
    for (const i of pending) {
      let state = i.state;
      const [provider] = await tx.query(
        "SELECT * FROM provider_actions WHERE id=$1",
        [i.id],
      );
      if (
        !provider &&
        (await tx.query("SELECT status FROM users WHERE id=$1", [i.user_id]))[0]
          ?.status !== "active"
      ) {
        await tx.query(
          "UPDATE intents SET state='failed',updated_at=$1 WHERE id=$2",
          [now(), i.id],
        );
        await tx.query("DELETE FROM reservations WHERE intent_id=$1", [i.id]);
        await audit(
          tx,
          i.user_id,
          "Unsubmitted action stopped: account restricted.",
          i.id,
        );
        continue;
      }
      const observation = await simulator.observe(tx, i);
      if (observation.created) {
        state = i.scenario === "timeout" ? "unknown" : "submitted";
      } else if (observation.state === "rejected") {
        state = "failed";
        await tx.query("DELETE FROM reservations WHERE intent_id=$1", [i.id]);
        await tx.query(
          "UPDATE provider_actions SET status='rejected' WHERE id=$1",
          [i.id],
        );
      } else if (observation.state === "partial") {
        await postFill(tx, i, true);
        state = "partially_filled";
      } else if (i.kind === "sell" && state !== "settlement_pending") {
        // Sandbox sells reserve units until settlement; do not expose proceeds early.
        state = "settlement_pending";
      } else {
        if (i.kind === "buy" || i.kind === "sell") await postFill(tx, i, false);
        else {
          const amount = BigInt(i.data.gross) * (i.kind === "fund" ? 1n : -1n);
          await journal(tx, i, "complete", [
            ["customer", "USDC", amount],
            ["external", "USDC", -amount],
          ]);
        }
        state = "completed";
        await tx.query("DELETE FROM reservations WHERE intent_id=$1", [i.id]);
        await tx.query(
          "UPDATE provider_actions SET status='completed' WHERE id=$1",
          [i.id],
        );
      }
      await tx.query(
        "UPDATE intents SET state=$1,updated_at=$2,due_at=$3 WHERE id=$4",
        [state, now(), now() + 600, i.id],
      );
      await audit(tx, i.user_id, `${i.kind}: ${state}`, i.id);
    }
    await advanceFlows(tx);
    // Authorizations never move money and can safely expire without provider contact.
    await tx.query(
      "UPDATE intents SET state='expired',updated_at=$1 WHERE state='awaiting_authorization' AND created_at<$2",
      [now(), now() - 15 * 60_000],
    );
  });
}
export async function returnIntent(tx: SQL, user: string, id: string) {
  const [i] = await tx.query(
    "SELECT * FROM intents WHERE id=$1 AND user_id=$2",
    [id, user],
  );
  requireThat(i, "Action not found.", 404);
  if (i.state === "returned") return;
  requireThat(
    i.state === "completed" && ["fund", "payout"].includes(i.kind),
    "Only a completed funding or payout can be returned.",
  );
  const amount = BigInt(i.data.gross) * (i.kind === "fund" ? -1n : 1n);
  await journal(tx, i, "returned", [
    ["customer", "USDC", amount],
    ["external", "USDC", -amount],
  ]);
  await tx.query(
    "UPDATE intents SET state='returned',updated_at=$1 WHERE id=$2",
    [now(), id],
  );
  const b = await balances(tx, user);
  if (BigInt(b.availableCash) < 0n)
    await tx.query("UPDATE users SET status='restricted' WHERE id=$1", [user]);
  await audit(tx, user, "Provider return recorded; balances reconciled.", id);
}
export async function reconcile(db: Database) {
  return db.transaction(async (tx) => {
    const unbalanced = await tx.query(
      "SELECT journal_id,asset,SUM(amount)::text AS difference FROM postings GROUP BY journal_id,asset HAVING SUM(amount)<>0",
    );
    for (const broken of unbalanced)
      await tx.query(
        "UPDATE users SET status='restricted' WHERE status<>'closed' AND id IN (SELECT user_id FROM postings WHERE journal_id=$1)",
        [broken.journal_id],
      );
    const users = await tx.query("SELECT id FROM users");
    const negative: string[] = [];
    for (const u of users) {
      const b = await balances(tx, u.id);
      if (BigInt(b.availableCash) < 0n || BigInt(b.availableUnits) < 0n) {
        negative.push(u.id);
        await tx.query(
          "UPDATE users SET status='restricted' WHERE id=$1 AND status<>'closed'",
          [u.id],
        );
      }
    }
    const mismatches: string[] = [];
    const finished = await tx.query(
      "SELECT * FROM intents WHERE state IN ('completed','returned','failed','cancelled','expired')",
    );
    for (const i of finished) {
      const rows = await tx.query(
        "SELECT p.asset,SUM(p.amount)::text AS amount FROM postings p JOIN journals j ON j.id=p.journal_id WHERE j.intent_id=$1 AND p.account='customer' GROUP BY p.asset",
        [i.id],
      );
      let cash = 0n,
        units = 0n;
      if (i.state === "completed") {
        cash =
          i.kind === "fund"
            ? BigInt(i.data.gross)
            : i.kind === "payout"
              ? -BigInt(i.data.gross)
              : i.kind === "buy"
                ? -BigInt(i.data.debit)
                : BigInt(i.data.net);
        units =
          i.kind === "buy"
            ? BigInt(i.data.units)
            : i.kind === "sell"
              ? -BigInt(i.data.units)
              : 0n;
      }
      if (
        BigInt(rows.find((r) => r.asset === "USDC")?.amount ?? "0") !== cash ||
        BigInt(rows.find((r) => r.asset === "DEMO_QQQ")?.amount ?? "0") !==
          units
      ) {
        mismatches.push(i.id);
        await tx.query(
          "UPDATE users SET status='restricted' WHERE id=$1 AND status<>'closed'",
          [i.user_id],
        );
      }
    }
    const details = { unbalanced, negative, mismatches };
    const ok = !unbalanced.length && !negative.length && !mismatches.length;
    await tx.query("INSERT INTO reconciliation VALUES ($1,$2,$3,$4)", [
      randomUUID(),
      ok,
      JSON.stringify(details),
      now(),
    ]);
    return { ok, details };
  });
}

/** One user instruction; durable funding and investment stages survive client/worker restarts. */
export async function createFlow(
  tx: SQL,
  user: string,
  key: string,
  input: { kind: "fill" | "spark"; amount: string; all?: boolean },
) {
  const fingerprint = JSON.stringify({
    kind: input.kind,
    amount: input.amount,
    all: input.all ?? false,
  });
  const [existing] = await tx.query("SELECT * FROM flows WHERE id=$1", [key]);
  if (existing) {
    requireThat(
      existing.user_id === user && existing.fingerprint === fingerprint,
      "Instruction key already used.",
      409,
    );
    return existing;
  }
  requireThat(
    !(
      await tx.query(
        "SELECT id FROM flows WHERE user_id=$1 AND state IN ('funding','investing','selling')",
        [user],
      )
    ).length,
    "Your previous action is still processing.",
    409,
  );
  // Validate the complete Fill before accepting its deposit.
  if (input.kind === "fill") {
    try {
      quoteNumbers("buy", cents(input.amount));
    } catch (e) {
      throw new Problem(400, (e as Error).message);
    }
  }
  const q = await createQuote(tx, user, {
    kind: input.kind === "fill" ? "fund" : "sell",
    amount: input.amount,
    all: input.kind === "spark" && input.all,
  });
  const intent = await createIntent(tx, user, q.id, randomUUID(), "success");
  if (input.kind === "fill")
    await tx.query("UPDATE intents SET state='queued' WHERE id=$1", [
      intent.id,
    ]);
  const [flow] = await tx.query(
    "INSERT INTO flows VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,$8,$8) RETURNING *",
    [
      key,
      user,
      input.kind,
      input.amount,
      fingerprint,
      input.kind === "fill" ? "funding" : "selling",
      intent.id,
      now(),
    ],
  );
  await audit(
    tx,
    user,
    `${input.kind}: user authorized complete flow.`,
    intent.id,
  );
  return flow;
}
async function advanceFlows(tx: SQL) {
  const flows = await tx.query(
    "SELECT f.*,i.state AS intent_state FROM flows f JOIN intents i ON i.id=f.intent_id WHERE f.state IN ('funding','investing','selling') ORDER BY f.created_at LIMIT 50",
  );
  for (const f of flows) {
    if (
      ["failed", "cancelled", "expired", "returned"].includes(f.intent_state)
    ) {
      await tx.query(
        "UPDATE flows SET state='failed',error=$1,updated_at=$2 WHERE id=$3",
        [
          "Could not complete this action. Check your wallet balance and history.",
          now(),
          f.id,
        ],
      );
    } else if (f.intent_state === "completed") {
      if (f.state === "funding") {
        try {
          const q = await createQuote(tx, f.user_id, {
            kind: "buy",
            amount: f.amount,
          });
          const i = await createIntent(
            tx,
            f.user_id,
            q.id,
            randomUUID(),
            "success",
          );
          await tx.query(
            "UPDATE flows SET state='investing',intent_id=$1,updated_at=$2 WHERE id=$3",
            [i.id, now(), f.id],
          );
        } catch (e) {
          if (!(e instanceof Problem)) throw e;
          await tx.query(
            "UPDATE flows SET state='failed',error=$1,updated_at=$2 WHERE id=$3",
            [
              "Funds are in your wallet, but the investment could not complete.",
              now(),
              f.id,
            ],
          );
        }
      } else
        await tx.query(
          "UPDATE flows SET state='completed',updated_at=$1 WHERE id=$2",
          [now(), f.id],
        );
    }
  }
}
