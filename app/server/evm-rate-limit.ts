import type { FastifyRequest } from "fastify";
/** Static assets must remain loadable while API reads are throttled. This
 * loopback server still applies the same 90/minute budget to every API path. */
export const evmRateLimit = {
  max: 90,
  timeWindow: "1 minute",
  allowList: (request: FastifyRequest) => !request.url.startsWith("/api/"),
};
