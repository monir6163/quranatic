const axios = require("axios");
const crypto = require("crypto");
const payment = require("../config/payment");

/* Thin client for the UddoktaPay REST API. The API key travels only in these
   server-to-server request headers and is never logged. */

function headers() {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "RT-UDDOKTAPAY-API-KEY": payment.apiKey
  };
}

// POST /checkout-v2 -> { status, message, payment_url }
async function createCharge(payload) {
  const { data } = await axios.post(payment.endpoints.checkout, payload, {
    headers: headers(),
    timeout: 15000
  });
  return data;
}

// POST /verify-payment -> { status, amount, invoice_id, metadata, transaction_id, ... }
async function verifyPayment(invoiceId) {
  const { data } = await axios.post(
    payment.endpoints.verify,
    { invoice_id: invoiceId },
    { headers: headers(), timeout: 15000 }
  );
  return data;
}

/* Constant-time comparison of the webhook's RT-UDDOKTAPAY-API-KEY header against
   our own key, to authenticate that a webhook genuinely came from UddoktaPay. */
function apiKeyMatches(headerValue) {
  if (!payment.apiKey) return false;
  const received = Buffer.from(String(headerValue || ""));
  const expected = Buffer.from(payment.apiKey);
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(received, expected);
}

module.exports = { createCharge, verifyPayment, apiKeyMatches };
