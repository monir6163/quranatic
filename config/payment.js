/* UddoktaPay configuration.

   The API key is read here and used ONLY on the server — it must never be sent
   to the browser. `payment_base_url` in .env already includes the `/api` root
   (e.g. https://sandbox.uddoktapay.com/api), so the endpoint paths below are
   appended directly to it. */

const rawBase = (process.env.payment_base_url || "").trim().replace(/\/+$/, "");
const apiKey = (process.env.payment_api_key || "").trim();
const publicUrl = (process.env.PUBLIC_URL || "").trim().replace(/\/+$/, "");

const isConfigured = Boolean(rawBase && apiKey);

module.exports = {
  baseUrl: rawBase,
  apiKey,
  publicUrl,
  isConfigured,
  // Informational only (shown in the admin Payments page).
  mode: /sandbox/i.test(rawBase) ? "sandbox" : "live",
  endpoints: {
    checkout: `${rawBase}/checkout-v2`,
    verify: `${rawBase}/verify-payment`
  }
};
