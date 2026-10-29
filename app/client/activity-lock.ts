/** One same-origin Web Lock per wallet/chain journal. Unsupported browsers may
 * still view/export records, but mutations fail closed instead of racing. */
export async function withActivityLock<T>(
  key: string,
  operation: () => Promise<T>,
  locks: LockManager | undefined = navigator.locks,
): Promise<T> {
  if (!locks)
    throw Error("This browser cannot safely update activity across tabs.");
  return locks.request(
    `blunts:activity:${key}`,
    { mode: "exclusive" },
    operation,
  );
}
