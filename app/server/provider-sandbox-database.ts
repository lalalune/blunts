import { mkdir, open, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { openDatabase, type Database } from "./database.js";
import { ProviderFault } from "./provider-transport.js";

/** PGlite is single-process. The CLI and HTTP sandbox must not concurrently
 * open the same command journal. A crash leaves the lock for explicit recovery;
 * never remove financial history or automatically replay an uncertain command.
 */
export async function openSandboxDatabase(
  root = resolve("data/provider-sandbox"),
) {
  await mkdir(root, { recursive: true, mode: 0o700 });
  const path = `${root}/process.lock`;
  const lock = await open(path, "wx", 0o600).catch(() => {
    throw new ProviderFault("configuration");
  });
  let db: Database | undefined;
  try {
    await lock.writeFile(
      JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }),
    );
    db = await openDatabase(`${root}/database`);
    await db.query("SELECT 1");
    return {
      db,
      root,
      close: async () => {
        await db!.close();
        await lock.close();
        await unlink(path);
      },
    };
  } catch (error) {
    await db?.close();
    await lock.close();
    await unlink(path);
    throw error;
  }
}
