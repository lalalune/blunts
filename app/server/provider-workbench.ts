import { readFile, writeFile } from "node:fs/promises";
import { openSandboxDatabase } from "./provider-sandbox-database.js";
import { SandboxStore, sandboxCommand } from "./provider-sandbox-store.js";
import { DinariSandbox } from "./dinari-sandbox.js";
import { MoonPaySandbox, moonpaySandboxConfig } from "./moonpay-sandbox.js";
import { ProviderFault } from "./provider-transport.js";
import { providerCredentials } from "./provider-credentials.js";

const [action, argument, signatureFile] = process.argv.slice(2);
let journal: Awaited<ReturnType<typeof openSandboxDatabase>> | undefined;
let env: NodeJS.ProcessEnv = {};
const dinari = () =>
  new DinariSandbox({
    keyId: env.DINARI_API_KEY_ID,
    secretKey: env.DINARI_API_SECRET_KEY,
  });
const moonpay = () =>
  new MoonPaySandbox({
    publishableKey: env.MOONPAY_PUBLISHABLE_KEY ?? "",
    secretKey: env.MOONPAY_SECRET_KEY ?? "",
    webhookKey: env.MOONPAY_WEBHOOK_KEY,
  });
try {
  if (process.env.NODE_ENV === "production")
    throw new ProviderFault("configuration");
  env = await providerCredentials();
  journal = await openSandboxDatabase();
  const { root, db } = journal;
  const store = new SandboxStore(db);
  await store.init();
  if (action === "prepare" && argument) {
    const command = sandboxCommand.safeParse(
      JSON.parse(await readFile(argument, "utf8")),
    );
    if (!command.success) throw new ProviderFault("invalid_input");
    // Construct before claiming so missing/invalid keys cause zero I/O and do
    // not poison a prepared command. Constructors never make network calls.
    const adapter = command.data.provider === "dinari" ? dinari() : moonpay();
    const id = await store.remember(command.data);
    const result = await store.prepare(id, async (value) =>
      value.provider === "dinari"
        ? (adapter as DinariSandbox).prepare(value.instruction)
        : {
            checkoutUrl: (adapter as MoonPaySandbox).checkout(
              value.instruction,
            ),
            settled: false,
          },
    );
    let artifact: string | undefined;
    if (result.artifact) {
      artifact = `${root}/${id}-${Date.now()}.json`;
      await writeFile(artifact, JSON.stringify(result.artifact), {
        mode: 0o600,
        flag: "wx",
      });
    }
    console.log(
      JSON.stringify({
        id,
        state: result.state,
        failure: result.failure,
        artifact,
        realMoneyEnabled: false,
        providerAcceptance: false,
      }),
    );
  } else if (action === "observe" && argument) {
    const record = await store.load(argument);
    const value = record.payload;
    const observation =
      value.provider === "dinari"
        ? await dinari().observe(value.instruction)
        : await moonpay().observe(value.instruction);
    const result = await store.reconcile(argument, observation);
    console.log(
      JSON.stringify({
        id: argument,
        state: result.state,
        providerState: observation.state,
        settled: false,
      }),
    );
  } else if (action === "event" && argument && signatureFile) {
    const event = moonpay().event(
      await readFile(argument),
      (await readFile(signatureFile, "utf8")).trim(),
    );
    console.log(JSON.stringify(await store.event(event)));
  } else if (action === "status") {
    console.log(
      JSON.stringify({
        moonpay: moonpaySandboxConfig(env),
        dinari: {
          configured: !!env.DINARI_API_KEY_ID && !!env.DINARI_API_SECRET_KEY,
          providerAcceptance: false,
        },
        commands: await db.query(
          "SELECT id,provider,state,failure,created_at,updated_at FROM sandbox_commands ORDER BY created_at DESC LIMIT 100",
        ),
        realMoneyEnabled: false,
      }),
    );
  } else {
    console.error(
      "Usage: npm run providers:workbench -- status|prepare input.json|observe id|event body.json signature.txt",
    );
    process.exitCode = 2;
  }
} catch (error) {
  // Never print input files, provider errors, keys, signatures or response bodies.
  console.error(
    JSON.stringify({
      error: error instanceof ProviderFault ? error.kind : "invalid_input",
      realMoneyEnabled: false,
    }),
  );
  process.exitCode = 2;
} finally {
  await journal?.close();
}
