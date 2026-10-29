// Invalid placeholder keys for local URL/HMAC rehearsals only. No test sends
// these credentials to MoonPay or treats them as an enabled partner project.
export const localProviderKeys = {
  publishableKey: "pk_test_BluntsLocalAcceptance",
  secretKey: "sk_test_BluntsLocalAcceptance",
  webhookKey: "BluntsLocalAcceptanceWebhookOnly",
};
