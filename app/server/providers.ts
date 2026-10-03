/** Provider boundary. This release deliberately selects only the simulator.
 * A remote adapter must persist submit intent before I/O, and reconcile unknown
 * results through its provider identifier before retrying any financial command.
 */
import type { SQL, Row } from "./database.js";
export type ProviderObservation =
  "accepted" | "partial" | "rejected" | "settled";
export interface ExecutionProvider {
  observe(
    tx: SQL,
    intent: Row,
  ): Promise<{ created: boolean; state: ProviderObservation }>;
}
export const simulator: ExecutionProvider = {
  async observe(tx, intent) {
    const [existing] = await tx.query(
      "SELECT * FROM provider_actions WHERE id=$1",
      [intent.id],
    );
    if (!existing) {
      await tx.query("INSERT INTO provider_actions VALUES ($1,$2,0,$3,$4)", [
        intent.id,
        "accepted",
        intent.scenario,
        Date.now(),
      ]);
      return { created: true, state: "accepted" };
    }
    if (existing.scenario === "reject")
      return { created: false, state: "rejected" };
    if (
      existing.scenario === "partial" &&
      existing.polls === 0 &&
      ["buy", "sell"].includes(intent.kind)
    ) {
      await tx.query("UPDATE provider_actions SET polls=1 WHERE id=$1", [
        intent.id,
      ]);
      return { created: false, state: "partial" };
    }
    return { created: false, state: "settled" };
  },
};
