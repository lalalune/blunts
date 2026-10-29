import { qualifyDinariSandbox } from "./dinari-qualification.js";
import { qualifyMoonPaySandbox } from "./moonpay-sandbox.js";
import { providerCredentials } from "./provider-credentials.js";

try {
  const env = await providerCredentials();
  const [result, moonpay] = await Promise.all([
    qualifyDinariSandbox({
      keyId: env.DINARI_API_KEY_ID,
      secretKey: env.DINARI_API_SECRET_KEY,
    }),
    qualifyMoonPaySandbox(env),
  ]);
  console.log(JSON.stringify({ dinari: result, moonpay }));
  if (
    result.status !== "sandbox_reads_verified" ||
    moonpay.status !== "sandbox_quote_verified"
  )
    process.exitCode = 2;
} catch {
  console.error(
    JSON.stringify({ error: "configuration", realMoneyEnabled: false }),
  );
  process.exitCode = 2;
}
