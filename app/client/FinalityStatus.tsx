import type { SwapAttempt } from "../shared/swap-journal";
export function FinalityStatus({ record }: { record: SwapAttempt }) {
  const target =
    record.state === "replaced" ? record.replacement?.hash : record.hash;
  const receipt = record.state === "replaced" ? record.replacement : record;
  const usable =
    record.finality?.transactionHash.toLowerCase() === target?.toLowerCase() &&
    record.finality?.blockHash.toLowerCase() ===
      receipt?.blockHash?.toLowerCase() &&
    record.finality?.blockNumber === receipt?.blockNumber &&
    ["included", "reverted", "replaced"].includes(record.state) &&
    record.finalityCheck?.status !== "canonical_mismatch";
  return (
    <div className="evm-finality" aria-label="Receipt finality">
      <p>
        {usable && record.finality
          ? record.finality.level === "rpc_finalized"
            ? "RPC reports finalized"
            : record.finality.level === "rpc_safe"
              ? "RPC reports safe"
              : "Sequencer inclusion only"
          : "Finality not verified"}
      </p>
      {record.finalityCheck && record.finalityCheck.status !== "verified" && (
        <p>
          {record.finalityCheck.status === "unavailable"
            ? "Latest finality check unavailable. Prior proof is preserved."
            : record.finalityCheck.status === "canonical_mismatch"
              ? "Receipt block changed; reconciliation is required."
              : "RPC finality data is inconsistent; no new finality claim was made."}
        </p>
      )}
      {usable && record.finality && (
        <small>
          Node report verified{" "}
          {new Date(record.finality.verifiedAt).toLocaleString()}
        </small>
      )}
      <p>
        Based on this RPC’s block tags. Independent Ethereum batch/finality
        proof and bank or bridge settlement are not verified.
      </p>
    </div>
  );
}
