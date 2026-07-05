/**
 * Sewa fee model — the single source of truth for money math.
 * Locked decisions:
 *   Buyer pays  +5% service fee on top of the listing price.
 *   Seller pays -12.5% (10% platform commission + 2.5% to cover PayHere).
 *   ~2% of the listing price is set aside into the Sewa Guarantee reserve.
 * The 10% commission is per-seller (Pro/loyalty tiers lower it later); the
 * 2.5% gateway share and the 5% buyer fee are fixed.
 * All amounts are LKR, rounded to 2 decimals.
 */

export const BUYER_FEE_RATE = 0.05;
export const DEFAULT_COMMISSION_RATE = 0.1; // platform commission, per-seller
export const GATEWAY_RATE = 0.025; // PayHere share, passed to the seller
export const GUARANTEE_RESERVE_RATE = 0.02;

/** Hold window before completed earnings become withdrawable (hours). */
export const HOLD_WINDOW_HOURS = 72;

/** Active service listings a seller may have: 3 on the free plan, 10 on Pro. */
export const FREE_SERVICE_LIMIT = 3;
export const PRO_SERVICE_LIMIT = 10;

export function serviceLimitFor(isPro: boolean): number {
  return isPro ? PRO_SERVICE_LIMIT : FREE_SERVICE_LIMIT;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface FeeBreakdown {
  serviceAmount: number; // listing price * quantity
  buyerFee: number; // 5% of serviceAmount
  totalCharged: number; // what the buyer pays
  sellerCommission: number; // total deducted from the seller (commission + gateway)
  sellerNet: number; // what the seller keeps
  guaranteeReserve: number; // set aside into the Guarantee pool
  gatewayFee: number; // estimated PayHere cost
  platformNet: number; // what Sewa actually retains
}

/**
 * Compute the full fee breakdown for a booking.
 * @param serviceAmount listing price times quantity/hours, in LKR
 * @param commissionRate platform commission for this seller (default 10%)
 */
export function computeFees(
  serviceAmount: number,
  commissionRate: number = DEFAULT_COMMISSION_RATE,
): FeeBreakdown {
  const buyerFee = round2(serviceAmount * BUYER_FEE_RATE);
  const totalCharged = round2(serviceAmount + buyerFee);
  const sellerCommission = round2(serviceAmount * (commissionRate + GATEWAY_RATE));
  const sellerNet = round2(serviceAmount - sellerCommission);
  const guaranteeReserve = round2(serviceAmount * GUARANTEE_RESERVE_RATE);
  const gatewayFee = round2(totalCharged * GATEWAY_RATE);
  const platformNet = round2(
    buyerFee + sellerCommission - guaranteeReserve - gatewayFee,
  );

  return {
    serviceAmount: round2(serviceAmount),
    buyerFee,
    totalCharged,
    sellerCommission,
    sellerNet,
    guaranteeReserve,
    gatewayFee,
    platformNet,
  };
}

/**
 * Cancellation fee retained on a paid booking. Buyer-initiated fees scale with
 * lateness; once the seller has arrived the fee is heavy so a "meet then cancel
 * for cash" costs the same as staying on-platform. A seller-initiated cancel
 * is free to the buyer (full refund) and penalized separately.
 */
export function cancellationFee(
  totalCharged: number,
  scheduledAtMs: number,
  opts: { arrived: boolean; bySeller: boolean },
): number {
  if (opts.bySeller) return 0;
  if (opts.arrived) return round2(totalCharged * 0.5);
  const hours = (scheduledAtMs - Date.now()) / 3_600_000;
  if (hours >= 24) return 0;
  if (hours >= 2) return round2(totalCharged * 0.25);
  return round2(totalCharged * 0.5);
}

/** Format an LKR amount for display, e.g. 5000 -> "LKR 5,000.00". */
export function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
