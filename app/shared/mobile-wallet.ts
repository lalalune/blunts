/** Mobile dapp-browser entry only, never a send/buy/approve deeplink. Strip all
 * route/query/fragment state; hand off only a verified HTTPS app origin. */
export function mobileWalletHandoff(origin: string | undefined): string | null {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      !host.includes(".") ||
      /[^a-z0-9.-]/.test(host) ||
      host.endsWith(".") ||
      host.endsWith(".home.arpa") ||
      host.endsWith(".onion") ||
      host
        .split(".")
        .some(
          (label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label),
        ) ||
      /^\d+(\.\d+){3}$/.test(host) ||
      ["localhost", "local", "internal", "test", "invalid"].some(
        (suffix) => host === suffix || host.endsWith(`.${suffix}`),
      )
    )
      return null;
    return `https://link.metamask.io/dapp/${host}/`;
  } catch {
    return null;
  }
}
