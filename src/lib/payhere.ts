import crypto from "crypto";

/**
 * PayHere integration helpers. Sandbox by default until the merchant account
 * (BR pending) is live. Never expose the merchant secret to the client; all
 * hashing happens server-side.
 *
 * Hash (initiation):
 *   upper(md5( merchant_id + order_id + amount + currency + upper(md5(secret)) ))
 * Signature (notify_url):
 *   upper(md5( merchant_id + order_id + payhere_amount + payhere_currency
 *              + status_code + upper(md5(secret)) ))
 */

const md5 = (s: string) =>
  crypto.createHash("md5").update(s).digest("hex").toUpperCase();

export function payhereEnv() {
  const base = process.env.PAYHERE_PAYMENT_URL || "https://sandbox.payhere.lk/pay";
  return {
    merchantId: process.env.PAYHERE_MERCHANT_ID || "",
    merchantSecret: process.env.PAYHERE_MERCHANT_SECRET || "",
    checkoutUrl: `${base.replace(/\/$/, "")}/checkout`,
    appUrl:
      process.env.NEXT_PUBLIC_SITE_URL || "https://sewa-two.vercel.app",
    configured: Boolean(
      process.env.PAYHERE_MERCHANT_ID && process.env.PAYHERE_MERCHANT_SECRET,
    ),
  };
}

/** Amount formatted the way PayHere expects: 2 decimals, no thousands sep. */
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/** Hash for initiating a checkout. */
export function generateCheckoutHash(
  orderId: string,
  amount: number,
  currency = "LKR",
): string {
  const { merchantId, merchantSecret } = payhereEnv();
  const secretHash = md5(merchantSecret);
  return md5(merchantId + orderId + formatAmount(amount) + currency + secretHash);
}

/** Verify the signature PayHere sends to the notify_url. */
export function verifyNotifySignature(params: {
  merchant_id: string;
  order_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
}): boolean {
  const { merchantSecret } = payhereEnv();
  const secretHash = md5(merchantSecret);
  const local = md5(
    params.merchant_id +
      params.order_id +
      params.payhere_amount +
      params.payhere_currency +
      params.status_code +
      secretHash,
  );
  return local === params.md5sig;
}

/** PayHere status codes. 2 = success. */
export const PAYHERE_STATUS = {
  SUCCESS: "2",
  PENDING: "0",
  CANCELED: "-1",
  FAILED: "-2",
  CHARGEDBACK: "-3",
} as const;
