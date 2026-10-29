import Dinari from "@dinari/api-sdk";
import { z } from "zod";
import { dinariSandboxClient } from "./provider-transport.js";

const entitySchema = z.object({
  id: z.string().min(1),
  entity_type: z.enum(["ORGANIZATION", "INDIVIDUAL"]),
  is_kyc_complete: z.boolean(),
});
const stocksSchema = z.object({
  data: z
    .array(
      z.object({
        id: z.string().min(1),
        symbol: z.string(),
        is_tradable: z.boolean(),
        is_fractionable: z.boolean(),
        tokens: z.array(z.string()),
      }),
    )
    .max(20),
});

export type DinariQualification = {
  provider: "dinari";
  environment: "sandbox";
  status:
    | "missing_credentials"
    | "access_rejected"
    | "unavailable"
    | "invalid_response"
    | "not_partner"
    | "instrument_unavailable"
    | "instrument_restricted"
    | "sandbox_reads_verified";
  realMoneyEnabled: false;
  providerAcceptance: false;
  missing?: string[];
  partnerKycComplete?: boolean;
  instrument?: {
    symbol: "QQQ";
    tradable: boolean;
    fractionable: boolean;
    arbitrumSepoliaTokenPresent: boolean;
    supportedTestChains: string[];
  };
};

/** Cost: zero I/O without both credentials, otherwise at most two sandbox GETs.
 * One partner-identity read plus one narrowly filtered instrument read. No
 * pagination, prices, order submission, account creation, faucet or signing.
 * This is qualification evidence, never customer eligibility or live approval.
 */
export async function qualifyDinariSandbox(
  credentials: { keyId?: string; secretKey?: string },
  transport: typeof fetch = fetch,
): Promise<DinariQualification> {
  const base = {
    provider: "dinari",
    environment: "sandbox",
    realMoneyEnabled: false,
    providerAcceptance: false,
  } as const;
  const missing = [
    ...(!credentials.keyId?.trim() ? ["DINARI_API_KEY_ID"] : []),
    ...(!credentials.secretKey?.trim() ? ["DINARI_API_SECRET_KEY"] : []),
  ];
  if (missing.length)
    return { ...base, status: "missing_credentials", missing };
  const client = dinariSandboxClient(credentials, transport);
  try {
    const entity = entitySchema.safeParse(
      await client.v2.entities.retrieveCurrent(),
    );
    if (!entity.success) return { ...base, status: "invalid_response" };
    if (entity.data.entity_type !== "ORGANIZATION")
      return { ...base, status: "not_partner" };
    const partner = {
      ...base,
      partnerKycComplete: entity.data.is_kyc_complete,
    };
    const response = stocksSchema.safeParse(
      await client.v2.marketData.stocks.list({ symbols: ["QQQ"], limit: 20 }),
    );
    if (!response.success) return { ...partner, status: "invalid_response" };
    const matches = response.data.data.filter(
      (stock) => stock.symbol === "QQQ",
    );
    if (!matches.length)
      return { ...partner, status: "instrument_unavailable" };
    if (matches.length !== 1) return { ...partner, status: "invalid_response" };
    const stock = matches[0];
    const instrument = {
      symbol: "QQQ" as const,
      tradable: stock.is_tradable,
      fractionable: stock.is_fractionable,
      arbitrumSepoliaTokenPresent: stock.tokens.some((token) =>
        /^eip155:421614:0x[0-9a-fA-F]{40}$/.test(token),
      ),
      supportedTestChains: ["eip155:11155111", "eip155:421614"].filter(
        (chain) =>
          stock.tokens.some((token) =>
            new RegExp(`^${chain}:0x[0-9a-fA-F]{40}$`).test(token),
          ),
      ),
    };
    return {
      ...partner,
      instrument,
      status:
        instrument.tradable &&
        instrument.fractionable &&
        instrument.supportedTestChains.length > 0
          ? "sandbox_reads_verified"
          : "instrument_restricted",
    };
  } catch (error) {
    // SDK errors may contain request headers, account data or provider bodies.
    // Expose only a classification; never print the error object/message.
    return {
      ...base,
      status:
        error instanceof Dinari.APIError &&
        [401, 403].includes(error.status ?? 0)
          ? "access_rejected"
          : "unavailable",
    };
  }
}
