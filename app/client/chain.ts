import { createPublicClient, http } from "viem";
import { robinhood } from "../shared/robinhood";
export const chainReader = createPublicClient({
  transport: http(robinhood.rpcUrls.default.http[0], {
    retryCount: 0,
    timeout: 10000,
  }),
});
