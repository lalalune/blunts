import { Connection, PublicKey } from "@solana/web3.js";
import { resolve } from "@bonfida/spl-name-service";

// Read-only qualification. Never writes the production fee configuration.
const name = process.argv[2];
if (!name) throw new Error("Provide the owner-approved SNS name or public key");
const connection = new Connection(
  process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  "confirmed",
);
const address =
  name.endsWith(".sol") || name.endsWith(".sns")
    ? await resolve(connection, name)
    : new PublicKey(name);
if (!PublicKey.isOnCurve(address.toBytes()))
  throw new Error("Fee recipient must be a normal wallet public key");
console.log(
  JSON.stringify(
    {
      input: name,
      address: address.toBase58(),
      checkedAt: new Date().toISOString(),
      activated: false,
    },
    null,
    2,
  ),
);
