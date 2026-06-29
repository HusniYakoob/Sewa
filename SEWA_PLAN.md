# Sewa — Business & Build Plan (Working Draft)

> **Status:** Living document. Decisions locked as of this draft, but expect changes
> while building. The final version gets written **after** the app is built.
> Last updated during planning with Husni (Half Motion Ltd).

A peer-to-peer service marketplace for Sri Lanka (Airtasker/TaskRabbit-style),
focused on **one-time jobs**, built mobile-first, paid via PayHere.

---

## 1. The Business Idea (stripped down)

Connect buyers who need a service (cleaning, repairs, etc.) with local providers.
Capture payment up front, hold it in escrow, release to the provider after the job
is verified complete (start/end PINs). Monetize with a **15% take** + later
subscriptions/upgrades.

**Why one-time jobs:** for non-recurring work, neither side builds a relationship
worth taking off-platform — the buyer needs a *different* provider next time, and the
seller depends on the platform for a steady stream of new leads. This makes the
marketplace structurally stickier than a recurring-service model.

---

## 2. Fee Model (LOCKED)

**Total take: 15%, split across both sides.**

| Party | Charge |
|---|---|
| Buyer | +5% service fee |
| Seller | −12.5% (10% commission + 2.5% to cover PayHere gateway) |

**Worked example — LKR 5,000 job:**

| | Amount (LKR) |
|---|---|
| Buyer charged | 5,250 |
| Seller keeps | 4,375 |
| Platform gross | 875 |
| PayHere gateway (~131) | covered by seller's 2.5% |
| **Platform net** | **~745 (~15%)** |

Seller keeps **4,375** vs ~3,975 under the original flat-18%-on-seller model — a
deliberately friendlier split to reduce the incentive to go off-platform.

**Implementation note:** store a per-seller `commission_rate` field so loyalty/Pro
tiers become a config change, not a rebuild.

---

## 3. Monetization Roadmap

- **Phase 1 (launch):** transaction take only (15%). Free registration to maximize supply.
- **Phase 2:** Pro badge / seller subscription — lower commission, priority in lead feed,
  trust badge, more listing photos. (Recurring revenue + loyalty lock.)
- **Phase 3:** Company/business accounts — list multiple workers, featured placement,
  bulk leads. Higher margin.

---

## 4. The 4 Retention Locks (anti-disintermediation — ON from Day 1)

Both TaskRabbit and Airtasker use these. We copy all four:

1. **Payment + Guarantee in-app only** — leave the platform, lose payment protection
   and the Sewa Guarantee.
2. **Reputation lives on Sewa** — ratings/reviews/badges tied to the account; leaving
   resets you to zero.
3. **Contact hidden pre-booking** — no phone/WhatsApp exchange until a booking is paid;
   in-app chat only.
4. **Loyalty tiers punish leaving** (Phase 2) — commission drops the longer a seller
   stays and behaves; leaving forfeits the lower rate.

---

## 5. Cancellation Policy (anti "meet-then-cancel-for-cash")

The sharpest leak: seller arrives, both agree to cancel and do the job for cash.
Defense layers:

1. **Timing-based fees (Uber-style):**
   - >24h before: free
   - 2–24h before: partial fee (~25%)
   - <2h before, or after "Arrived": heavy fee
2. **The "Arrived" lock (key):** once the seller taps *I've arrived*, cancelling still
   **charges the platform's full cut** — so cancelling to go cash saves nothing.
3. **Pair detection:** same buyer+seller repeatedly cancelling = collusion fingerprint
   → auto-flag → warn → ban.
4. **Black marks:** cancellations drop a seller's lead-feed ranking (repeat = suspension);
   repeat-cancelling buyers lose Guarantee protection, then get banned.

**Honest limit:** you can't stop two determined people cheating *once*. The goal is to
make it pointless (Arrived lock) and catch the pattern (pair detection + strikes).

---

## 6. Payments, Escrow & the Hold Window (LOCKED)

- Payment **captured at booking** via PayHere; held in escrow.
- Service verified via **START PIN** (begin) and **END PIN** (complete).
- On completion, funds land in the seller's **in-app balance** — but become
  **withdrawable only after the dispute/hold window** (48–72h; shorter for trusted
  repeat sellers).
- **Why:** prevents the refund-fraud hole — a seller can never cash out before the
  buyer's dispute window closes, so a refund never leaves the platform out of pocket.
- Payouts can be **batched** (e.g. Mon/Thu) if PayHere payouts turn out to be manual.
- Pay out only to a **bank account whose name matches the verified NIC**.

---

## 7. Refunds (LOCKED)

- **Dispute window** (48–72h after END PIN) before the seller can withdraw.
- **Evidence required** for quality disputes: before/after photos + chat history
  (the PIN proves attendance, not quality).
- **Refund as in-app credit first** (instant, keeps money in-ecosystem); slow
  card/bank reversal only on request.
- **Claw-back waterfall:** within window → deduct from seller's held balance; if it
  slipped through → Guarantee fund covers buyer, recover from seller's future earnings.
- **Partial refunds** allowed (not binary). Track refund rate per buyer; serial
  refunders flagged/blocked.

---

## 8. Safety & Trust Plan (solo-founder reality)

Honest constraint: solo, you can't run background checks, underwrite insurance, or staff
a 24/7 desk. Built in layers — cheap deterrence first, real insurance grown into later.

**Layer 1 — Identity & traceability (Day 1, free, manual):**
- Manual **NIC verification** (NIC front+back + selfie holding NIC). Store NIC number.
- **Phone OTP both sides** (buyers verified too).
- **Permanent ban by NIC number** — banned providers can't re-register.
- Log **who + who + GPS + time at PIN** on every job. Market the traceability.

**Layer 2 — In-app safety features (in MVP):**
- **"Share my job"** — live status + provider identity to a trusted contact.
- **SOS button** → dials **119 (Police) / 1990 (Suwa Seriya ambulance) first**, then
  alerts admin with job + GPS. Emergency routing must not depend on the founder being awake.
- **In-app chat only**, two-way ratings, report button.

**Layer 3 — Policy & process:**
- Providers 18+, NIC-verified, code of conduct.
- Manually review first 1–2 jobs of every new seller.
- Incident protocol: report → immediate suspend → freeze balance → preserve logs →
  cooperate with police. Keep an **incident log from Day 1**.

**Layer 4 — Money protection: "Sewa Guarantee" (NOT insurance):**
- Discretionary goodwill pool, **self-funded** by carving ~2% of each booking into reserve.
- Covers capped theft/damage on a **verified** booking, **only** with police report +
  evidence, within a few days, at discretion. **Cap low** (e.g. up to LKR 25,000/incident).
- Do **not** call it "insurance" (not underwritten/licensed).

**Layer 5 — Real insurance (later, at volume):**
- Partner with a Sri Lankan insurer (Sri Lanka Insurance, Ceylinco, Fairfirst, AIA) for a
  group accident/liability policy once volume justifies it.

**Legal shield (do early, cheap):**
- Operate via **Half Motion Ltd**; ToS positions Sewa as a **marketplace/intermediary** —
  providers are **independent**, not employees.
- **Get a Sri Lankan lawyer to review ToS + Guarantee wording once** before launch.

**NIC verification note:** the DRP (Department for Registration of Persons) runs an
official online NIC-verification web service for *registered organizations*
(niclookup.ccu@drp.lk / 0115226164). Worth registering for — stronger than the manual
photo-review that PickMe/Uber SL rely on. Manual review is the Day-1 fallback.

---

## 9. Build Plan (phased — validate before code)

### Phase 0 — Verify deal-breakers (Week 0, no code)
1. **PayHere** — confirm programmatic payments, refunds, payouts work.
2. **DRP** — ask about org registration for NIC verification (+ cost).
3. **Lawyer** — review ToS + Guarantee wording.
4. **Pick ONE category + ONE Colombo suburb** to own first.

### Phase 1 — Concierge test (Weeks 1–2, almost no code)
- Landing page + WhatsApp number = the "app".
- Recruit **10–15 sellers** in person; take bookings on WhatsApp; collect via
  **PayHere payment link**; pay sellers manually.
- **Goal: 30 paid bookings + repeats.** If you can't, stop and rethink.

### Phase 2 — Thin app MVP (Weeks 3–6)
Build only the spine. **Founder = admin** (Supabase table view, no dashboard).
- Buyer: browse → book → pay (capture) → START PIN → rate.
- Seller: NIC upload (manual review) → lead → accept → START/END PIN → in-app balance.
- Bake in: 5%/12.5% fees, hold window, in-app chat, GPS+time at PIN, SOS, Guarantee
  reserve, cancellation policy.
- **Skip for now:** native apps, admin dashboard, NIC encryption ceremony, 40-component
  design system, audit logs, Pro tiers. (Keep `commission_rate` field for later.)

### Phase 3 — Launch in one suburb (Weeks 7–10)
- Go live to recruited sellers + real buyers.
- **Support = founder on WhatsApp, 8am–10pm.**
- **Marketing = hustle:** on-foot recruiting, local WhatsApp/FB groups, small promo.
- Keep the incident log. **Goal: prove repeat bookings + real GMV in one suburb.**

### Phase 4 — Raise & scale (Month 3+)
- Build **demo + pitch deck with traction numbers**.
- Raise to a **milestone**: "$X for support team + marketing to hit Z suburbs."
- Then add: native apps, Pro/subscriptions, company accounts, automated payouts,
  real insurance partner, first support hire. Expand suburb by suburb.

**The one rule:** every phase must *prove something* before spending on the next.

---

## 10. Costs (solo, early)

- **One-time/small:** lawyer (ToS review), Google Play ($25), Apple Developer ($99/yr),
  domain (~$10/yr), DRP registration (TBD). Company already exists ✅.
- **Ongoing (low at first):** hosting (Supabase/Vercel free tier early), **SMS OTP**
  (per-message cost — real recurring item), PayHere 2.5–3.3%/txn.
- **The ones that hurt:** acquisition (free if hustled), Guarantee reserve (capital at
  risk), founder's time.
- **Bottom line:** MVP launchable for **under ~$200 cash** + lawyer fee. The expensive
  currency is time and hustle.

---

## 11. Fundraising Stance

- **Don't raise to launch** — self-fund the cheap launch.
- Raise **after** proving repeat bookings, for **support team + marketing to scale**
  (growth costs, not survival costs).
- Demo + pitch deck come **after** traction, sized to a clear milestone.
- A silent/"sleeping" investor is fine — keep control, give equity only for money that
  buys *proven* growth.

---

## 12. Open Items / To Confirm

- [ ] PayHere: programmatic refunds + payouts confirmed?
- [ ] DRP: org registration process + cost?
- [ ] Lawyer: ToS + Guarantee wording reviewed?
- [ ] Final category + suburb chosen?
- [ ] Hold window: 48h or 72h?
- [ ] Guarantee cap per incident confirmed?
