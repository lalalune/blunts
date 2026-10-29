import Dinari from "@dinari/api-sdk";

export class ProviderFault extends Error {
  constructor(
    public readonly kind:
      | "configuration"
      | "invalid_input"
      | "rejected"
      | "unavailable"
      | "invalid_response"
      | "mismatch"
      | "ambiguous",
  ) {
    super(`Provider operation failed (${kind}).`);
  }
}

/** Fixed origins, bounded bodies and no redirects/retries. Never log request
 * headers, URLs (which can contain keys), response bodies or upstream errors.
 */
export function providerTransport(
  origin: string,
  transport: typeof fetch = fetch,
  methods = ["GET"],
) {
  return (async (input, init = {}) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    if (
      url.origin !== origin ||
      url.username ||
      url.password ||
      !methods.includes((init.method ?? "GET").toUpperCase())
    )
      throw new ProviderFault("invalid_input");
    const deadline = AbortSignal.timeout(10_000);
    const response = await transport(input, {
      ...init,
      signal: init.signal ? AbortSignal.any([init.signal, deadline]) : deadline,
      redirect: "error",
    });
    if (response.status >= 300 && response.status < 400)
      throw new ProviderFault("unavailable");
    if (!response.body) return response;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 131_072) throw new ProviderFault("invalid_response");
        chunks.push(value);
      }
    } catch (error) {
      await reader.cancel();
      throw error;
    } finally {
      reader.releaseLock();
    }
    return new Response(Buffer.concat(chunks), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }) as typeof fetch;
}

export function dinariSandboxClient(
  credentials: { keyId?: string; secretKey?: string },
  transport: typeof fetch = fetch,
  prepare = false,
) {
  if (!credentials.keyId?.trim() || !credentials.secretKey?.trim())
    throw new ProviderFault("configuration");
  return new Dinari({
    apiKeyID: credentials.keyId,
    apiSecretKey: credentials.secretKey,
    baseURL: null,
    environment: "sandbox",
    maxRetries: 0,
    timeout: 10000,
    logLevel: "off",
    fetch: providerTransport(
      "https://api-enterprise.sandbox.dinari.com",
      transport,
      prepare ? ["GET", "POST"] : ["GET"],
    ),
  });
}

export async function providerCall<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ProviderFault) throw error;
    if (
      error instanceof Dinari.APIError &&
      [400, 401, 403, 422].includes(error.status ?? 0)
    )
      throw new ProviderFault("rejected");
    throw new ProviderFault("unavailable");
  }
}
