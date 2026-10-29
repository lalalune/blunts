import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { atomic, decimal } from "../shared/decimal.js";
import {
  ProviderFault,
  providerCall,
  providerTransport,
} from "./provider-transport.js";

const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const identifier = z.string().uuid();
export const moonpayInstruction = z
  .object({
    id: identifier,
    customerId: identifier,
    side: z.enum(["buy", "sell"]),
    wallet: address,
    amount: z.string().max(24),
  })
  .strict()
  .refine((value) => {
    try {
      const units = atomic(value.amount, value.side === "buy" ? 0 : 6);
      return (
        units > 0n && units <= (value.side === "buy" ? 1000n : 1_000_000_000n)
      );
    } catch {
      return false;
    }
  }, "Unsupported sandbox amount or precision.");
export type MoonPayInstruction = z.infer<typeof moonpayInstruction>;
const transaction = z.object({
  id: identifier,
  externalTransactionId: identifier,
  externalCustomerId: identifier,
  status: z.enum([
    "waitingPayment",
    "pending",
    "waitingAuthorization",
    "failed",
    "completed",
  ]),
  updatedAt: z.string().datetime(),
  walletAddress: address.optional(),
  refundWalletAddress: address.optional(),
  currency: z.object({ code: z.string() }).optional(),
  baseCurrency: z.object({ code: z.string() }).optional(),
  quoteCurrency: z.object({ code: z.string() }).optional(),
  baseCurrencyAmount: z.number().finite().nonnegative(),
  cryptoTransactionId: z.string().max(256).nullable().optional(),
});

/** This adapter deliberately handles the public Sepolia ERC-20 sandbox leg.
 * It never describes its MoonPayToken delivery as native USDC or as Dinari
 * funding, never selects a live key, and never signs a caller-supplied URL.
 */
export class MoonPaySandbox {
  private readonly request: typeof fetch;
  constructor(
    private readonly keys: {
      publishableKey: string;
      secretKey: string;
      webhookKey?: string;
    },
    transport: typeof fetch = fetch,
  ) {
    if (
      !/^pk_test_[A-Za-z0-9]+$/.test(keys.publishableKey) ||
      !/^sk_test_[A-Za-z0-9]+$/.test(keys.secretKey)
    )
      throw new ProviderFault("configuration");
    this.request = providerTransport("https://api.moonpay.com", transport);
  }
  async quote(amount: string) {
    try {
      const units = atomic(amount, 0);
      if (units <= 0n || units > 1000n) throw new Error();
    } catch {
      throw new ProviderFault("invalid_input");
    }
    return providerCall(async () => {
      const url = new URL(
        "https://api.moonpay.com/v3/currencies/usdc/buy_quote",
      );
      url.search = new URLSearchParams({
        apiKey: this.keys.publishableKey,
        baseCurrencyCode: "usd",
        baseCurrencyAmount: amount,
        paymentMethod: "credit_debit_card",
        areFeesIncluded: "false",
        extraFeePercentage: "0",
      }).toString();
      const response = await this.request(url, { method: "GET" });
      if (!response.ok)
        throw new ProviderFault(
          [401, 403].includes(response.status) ? "rejected" : "unavailable",
        );
      const finite = z.number().finite().nonnegative();
      const parsed = z
        .object({
          baseCurrencyCode: z.literal("usd"),
          baseCurrencyAmount: finite,
          baseCurrency: z.object({ code: z.literal("usd") }),
          quoteCurrency: z.object({ code: z.literal("usdc") }),
          quoteCurrencyAmount: finite,
          feeAmount: finite,
          extraFeeAmount: finite,
          networkFeeAmount: finite,
          totalAmount: finite,
          // The public buy-quote API can omit expiry. Such a response is an
          // estimate, never a locked execution price or permission to pay.
          expiresAt: z.string().datetime().optional(),
        })
        .safeParse(await response.json());
      if (!parsed.success) throw new ProviderFault("invalid_response");
      const quote = parsed.data;
      try {
        const base = atomic(String(quote.baseCurrencyAmount), 2),
          fee = atomic(String(quote.feeAmount), 2),
          extra = atomic(String(quote.extraFeeAmount), 2),
          network = atomic(String(quote.networkFeeAmount), 2),
          total = atomic(String(quote.totalAmount), 2);
        const crypto = atomic(String(quote.quoteCurrencyAmount), 6);
        if (
          base !== atomic(amount, 2) ||
          total !== base + fee + extra + network ||
          crypto <= 0n ||
          (quote.expiresAt !== undefined &&
            Date.parse(quote.expiresAt) <= Date.now())
        )
          throw new ProviderFault("mismatch");
        return {
          fiatCurrency: "usd" as const,
          cryptoCurrency: "usdc" as const,
          base: decimal(base, 2),
          total: decimal(total, 2),
          providerFee: decimal(fee, 2),
          extraFee: decimal(extra, 2),
          networkFee: decimal(network, 2),
          quotedCrypto: decimal(crypto),
          expiresAt: quote.expiresAt ?? null,
          receivedAt: new Date().toISOString(),
          indicative: true as const,
          deliveryAsset: "MoonPayToken on Sepolia" as const,
          settled: false as const,
        };
      } catch (error) {
        if (error instanceof ProviderFault) throw error;
        throw new ProviderFault("invalid_response");
      }
    });
  }
  checkout(input: MoonPayInstruction): string {
    const parsed = moonpayInstruction.safeParse(input);
    if (!parsed.success) throw new ProviderFault("invalid_input");
    const value = parsed.data;
    try {
      const units = atomic(value.amount, value.side === "buy" ? 0 : 6);
      if (
        units <= 0n ||
        units > (value.side === "buy" ? 1000n : 1_000_000_000n)
      )
        throw new Error();
    } catch {
      throw new ProviderFault("invalid_input");
    }
    const params: Record<string, string> = { apiKey: this.keys.publishableKey };
    if (value.side === "buy")
      Object.assign(params, {
        currencyCode: "usdc",
        baseCurrencyCode: "usd",
        baseCurrencyAmount: value.amount,
        walletAddress: value.wallet,
      });
    else
      Object.assign(params, {
        baseCurrencyCode: "usdc",
        quoteCurrencyCode: "usd",
        baseCurrencyAmount: value.amount,
        refundWalletAddress: value.wallet,
        lockAmount: "true",
      });
    Object.assign(params, {
      externalTransactionId: value.id,
      externalCustomerId: value.customerId,
    });
    const url = new URL(
      value.side === "buy"
        ? "https://buy.moonpay.com/"
        : "https://sell-sandbox.moonpay.com/",
    );
    // Encode individual values first, sign precisely the bytes being returned.
    url.search = Object.entries(params)
      .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
      .join("&");
    const signature = signMoonPayQuery(url.search, this.keys.secretKey);
    return `${url.href}&signature=${encodeURIComponent(signature)}`;
  }
  async observe(instruction: MoonPayInstruction) {
    const input = moonpayInstruction.parse(instruction);
    return providerCall(async () => {
      const path =
        input.side === "buy" ? "v1/transactions" : "v3/sell_transactions";
      const url = new URL(`https://api.moonpay.com/${path}/ext/${input.id}`);
      url.searchParams.set("apiKey", this.keys.publishableKey);
      const response = await this.request(url, { method: "GET" });
      if (response.status === 404)
        return { state: "not_found" as const, settled: false as const };
      if (!response.ok)
        throw new ProviderFault(
          [401, 403].includes(response.status) ? "rejected" : "unavailable",
        );
      const body: unknown = await response.json();
      // MoonPay explicitly does not guarantee uniqueness of external IDs.
      if (!Array.isArray(body) || body.length > 1)
        throw new ProviderFault("ambiguous");
      if (!body.length)
        return { state: "not_found" as const, settled: false as const };
      const parsed = transaction.safeParse(body[0]);
      if (!parsed.success) throw new ProviderFault("invalid_response");
      const tx = parsed.data;
      const wallet =
        input.side === "buy" ? tx.walletAddress : tx.refundWalletAddress;
      const currency =
        input.side === "buy" ? tx.currency?.code : tx.baseCurrency?.code;
      const fiat =
        input.side === "buy" ? tx.baseCurrency?.code : tx.quoteCurrency?.code;
      let sameAmount = false;
      try {
        sameAmount =
          atomic(
            String(tx.baseCurrencyAmount),
            input.side === "buy" ? 0 : 6,
          ) === atomic(input.amount, input.side === "buy" ? 0 : 6);
      } catch {
        /* No rounding or inferred amounts. */
      }
      if (
        tx.externalTransactionId !== input.id ||
        tx.externalCustomerId !== input.customerId ||
        wallet?.toLowerCase() !== input.wallet.toLowerCase() ||
        currency !== "usdc" ||
        fiat !== "usd" ||
        !sameAmount
      )
        throw new ProviderFault("mismatch");
      return {
        state: tx.status,
        id: tx.id,
        updatedAt: tx.updatedAt,
        transactionHash: tx.cryptoTransactionId ?? null,
        // Provider completion alone is not a chain/ledger reconciliation.
        settled: false as const,
      };
    });
  }
  event(
    rawBody: Buffer,
    header: string,
    nowSeconds = Math.floor(Date.now() / 1000),
  ) {
    const key = this.keys.webhookKey;
    if (!key || key.length < 16) throw new ProviderFault("configuration");
    if (rawBody.length > 131_072 || header.length > 200)
      throw new ProviderFault("invalid_input");
    const match = /^t=(\d{10}),s=([0-9a-f]{64})$/.exec(header);
    if (!match || Math.abs(nowSeconds - Number(match[1])) > 300)
      throw new ProviderFault("rejected");
    const actual = Buffer.from(match[2], "hex");
    const expected = createHmac("sha256", key)
      .update(`${match[1]}.`)
      .update(rawBody)
      .digest();
    if (!timingSafeEqual(actual, expected)) throw new ProviderFault("rejected");
    let body: unknown;
    try {
      body = JSON.parse(rawBody.toString("utf8"));
    } catch {
      throw new ProviderFault("invalid_response");
    }
    const parsed = z
      .object({
        type: z.enum([
          "transaction_created",
          "transaction_updated",
          "transaction_failed",
          "sell_transaction_created",
          "sell_transaction_updated",
          "sell_transaction_failed",
        ]),
        data: z.object({
          id: identifier,
          externalTransactionId: identifier,
          updatedAt: z.string().datetime(),
        }),
      })
      .safeParse(body);
    if (!parsed.success) throw new ProviderFault("invalid_response");
    return {
      digest: createHash("sha256").update(rawBody).digest("hex"),
      type: parsed.data.type,
      transactionId: parsed.data.data.id,
      instructionId: parsed.data.data.externalTransactionId,
      updatedAt: parsed.data.data.updatedAt,
    };
  }
}

export function signMoonPayQuery(query: string, secret: string) {
  if (!query.startsWith("?") || !/^sk_test_[A-Za-z0-9]+$/.test(secret))
    throw new ProviderFault("invalid_input");
  return createHmac("sha256", secret).update(query).digest("base64");
}

export async function qualifyMoonPaySandbox(
  env: NodeJS.ProcessEnv = process.env,
  transport: typeof fetch = fetch,
) {
  const config = moonpaySandboxConfig(env);
  if (config.status !== "configured_unverified") return config;
  try {
    const adapter = new MoonPaySandbox(
      {
        publishableKey: env.MOONPAY_PUBLISHABLE_KEY!,
        secretKey: env.MOONPAY_SECRET_KEY!,
        webhookKey: env.MOONPAY_WEBHOOK_KEY,
      },
      transport,
    );
    await adapter.quote("100");
    return {
      ...config,
      status: "sandbox_quote_verified",
      secretKeyPairVerified: false,
    };
  } catch (error) {
    return {
      ...config,
      status: error instanceof ProviderFault ? error.kind : "unavailable",
    };
  }
}

export function moonpaySandboxConfig(env: NodeJS.ProcessEnv = process.env) {
  const missing = [
    "MOONPAY_PUBLISHABLE_KEY",
    "MOONPAY_SECRET_KEY",
    "MOONPAY_WEBHOOK_KEY",
  ].filter((key) => !env[key]?.trim());
  return {
    provider: "moonpay" as const,
    environment: "sandbox" as const,
    status: missing.length
      ? "missing_credentials"
      : /^pk_test_/.test(env.MOONPAY_PUBLISHABLE_KEY!) &&
          /^sk_test_/.test(env.MOONPAY_SECRET_KEY!)
        ? "configured_unverified"
        : "invalid_environment",
    missing,
    providerAcceptance: false,
    realMoneyEnabled: false,
  };
}
