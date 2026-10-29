import { createSolanaApp } from "./solana-app.js";

// Mainnet preview stays separate and loopback-only.
const app = await createSolanaApp();
await app.listen({ host: "127.0.0.1", port: 8753 });
process.once("SIGTERM", () => void app.close());
process.once("SIGINT", () => void app.close());
