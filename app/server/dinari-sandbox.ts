import { z } from "zod";
import { atomic, providerNumber } from "../shared/decimal.js";
import {
  dinariSandboxClient,
  ProviderFault,
  providerCall,
} from "./provider-transport.js";

const id = z.string().uuid();
const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
export const dinariInstruction = z
  .object({
    id,
    customerId: id,
    entityId: id,
    accountId: id,
    stockId: id,
    wallet: address,
    paymentToken: address,
    side: z.enum(["BUY", "SELL"]),
    amount: z
      .string()
      .max(24)
      .refine((value) => {
        try {
          const units = atomic(value);
          return units > 0n && units <= 1_000_000_000_000n;
        } catch {
          return false;
        }
      }, "Choose a positive amount with at most six decimals, up to 1,000,000."),
    chainId: z.enum(["eip155:11155111", "eip155:421614"]),
  })
  .strict();
export type DinariInstruction = z.infer<typeof dinariInstruction>;
const requestSchema = z.object({
  id,
  account_id: id,
  client_order_id: id,
  status: z.enum([
    "QUOTED",
    "PENDING",
    "PENDING_BRIDGE",
    "SUBMITTED",
    "ERROR",
    "CANCELLED",
    "EXPIRED",
    "REJECTED",
  ]),
  order_id: id.nullable().optional(),
  order_side: z.enum(["BUY", "SELL"]),
});

/** External-wallet sandbox path only. Never uses managed-order endpoints,
 * requests a wallet signature, submits a signed permit, or credits the ledger.
 * Customer onboarding/disclosures and an approved signer remain separate gates.
 */
export class DinariSandbox {
  private readonly client;
  constructor(
    credentials: { keyId?: string; secretKey?: string },
    transport: typeof fetch = fetch,
  ) {
    this.client = dinariSandboxClient(credentials, transport, true);
  }
  async prepare(instruction: DinariInstruction) {
    const input = dinariInstruction.safeParse(instruction);
    if (!input.success) throw new ProviderFault("invalid_input");
    const value = input.data;
    let amount: number;
    try {
      const units = atomic(value.amount);
      if (units <= 0n || units > 1_000_000_000_000n) throw new Error();
      amount = providerNumber(value.amount);
    } catch {
      throw new ProviderFault("invalid_input");
    }
    return providerCall(async () => {
      const account = await this.client.v2.accounts.retrieve(value.accountId);
      if (
        account.id !== value.accountId ||
        account.entity_id !== value.entityId ||
        account.is_active !== true ||
        account.jurisdiction !== "US"
      )
        throw new ProviderFault("mismatch");
      const entity = await this.client.v2.entities.retrieveByID(value.entityId);
      if (
        entity.id !== value.entityId ||
        entity.entity_type !== "INDIVIDUAL" ||
        entity.is_kyc_complete !== true ||
        entity.reference_id !== value.customerId
      )
        throw new ProviderFault("mismatch");
      const wallet = await this.client.v2.accounts.wallet.get(value.accountId);
      if (
        wallet.address?.toLowerCase() !== value.wallet.toLowerCase() ||
        wallet.is_managed_wallet !== false ||
        wallet.is_aml_flagged !== false ||
        !["eip155:0", value.chainId].includes(wallet.chain_id)
      )
        throw new ProviderFault("mismatch");
      const stocks = await this.client.v2.marketData.stocks.list({
        symbols: ["QQQ"],
        limit: 20,
      });
      if (!Array.isArray(stocks.data) || stocks.data.length !== 1)
        throw new ProviderFault("invalid_response");
      const stock = stocks.data[0];
      if (
        stock.id !== value.stockId ||
        stock.symbol !== "QQQ" ||
        stock.is_tradable !== true ||
        stock.is_fractionable !== true ||
        !stock.tokens?.some((token) =>
          new RegExp(`^${value.chainId}:0x[0-9a-fA-F]{40}$`).test(token),
        )
      )
        throw new ProviderFault("mismatch");
      const response =
        await this.client.v2.accounts.orderRequests.eip155.createPermit(
          value.accountId,
          {
            chain_id: value.chainId,
            order_side: value.side,
            order_tif: "DAY",
            order_type: "MARKET",
            stock_id: value.stockId,
            payment_token: value.paymentToken,
            client_order_id: value.id,
            ...(value.side === "BUY"
              ? { payment_token_quantity: amount }
              : { asset_token_quantity: amount }),
          },
        );
      const parsed = z
        .object({
          order_request_id: id,
          permit: z.record(z.string(), z.unknown()),
        })
        .safeParse(response);
      if (!parsed.success) throw new ProviderFault("invalid_response");
      return {
        requestId: parsed.data.order_request_id,
        unsignedPermit: parsed.data.permit,
        signingApproved: false as const,
        settled: false as const,
      };
    });
  }
  async observe(instruction: DinariInstruction) {
    const parsed = dinariInstruction.safeParse(instruction);
    if (!parsed.success) throw new ProviderFault("invalid_input");
    const input = parsed.data;
    return providerCall(async () => {
      const result = await this.client.v2.accounts.orderRequests.list(
        input.accountId,
        { client_order_id: input.id, limit: 20 },
      );
      if (!Array.isArray(result.data) || result.data.length > 1)
        throw new ProviderFault("ambiguous");
      if (!result.data.length)
        return { state: "not_found" as const, settled: false as const };
      const response = requestSchema.safeParse(result.data[0]);
      if (!response.success) throw new ProviderFault("invalid_response");
      const req = response.data;
      if (
        req.account_id !== input.accountId ||
        req.client_order_id !== input.id ||
        req.order_side !== input.side
      )
        throw new ProviderFault("mismatch");
      if (!req.order_id)
        return {
          state: req.status,
          requestId: req.id,
          settled: false as const,
        };
      const order = await this.client.v2.accounts.orders.retrieve(
        req.order_id,
        { account_id: input.accountId },
      );
      if (
        order.id !== req.order_id ||
        order.client_order_id !== input.id ||
        order.order_request_id !== req.id ||
        order.chain_id !== input.chainId ||
        order.stock_id !== input.stockId ||
        order.order_side !== input.side ||
        order.payment_token?.toLowerCase() !== input.paymentToken.toLowerCase()
      )
        throw new ProviderFault("mismatch");
      const status = z
        .enum([
          "PENDING_SUBMIT",
          "PENDING_CANCEL",
          "PENDING_ESCROW",
          "PENDING_FILL",
          "ESCROWED",
          "SUBMITTED",
          "CANCELLED",
          "PARTIALLY_FILLED",
          "FILLED",
          "REJECTED",
          "REQUIRING_CONTACT",
          "ERROR",
        ])
        .safeParse(order.status);
      if (!status.success) throw new ProviderFault("invalid_response");
      return {
        state: status.data,
        requestId: req.id,
        orderId: order.id,
        // FILLED is a brokerage state. Chain receipts/finality and fulfillment
        // amounts still need independent validation before spendable credit.
        settled: false as const,
      };
    });
  }
}
