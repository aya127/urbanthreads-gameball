# INTEGRATION_NOTES.md — UrbanThreads × Gameball

## APIs Used & Why

| Flow | Endpoint | Reason |
|---|---|---|
| Registration | `POST /customers` | Creates or updates the customer in Gameball. Idempotent — safe to call on every login. |
| Profile completed | `POST /events` (`profile_completed`) | Named event with metadata; Gameball can trigger reward campaigns on this. |
| Write review | `POST /events` (`write_review`) | `has_image: true/false` in metadata distinguishes photo vs. text reviews, enabling separate reward campaigns for each type. |
| Hold points | `POST /transactions/hold` | Reserves points before order is confirmed — like a card auth hold. Returns a `holdReference` valid for 10 min. |
| Cancel hold | `DELETE /transactions/hold/{id}` | Releases the hold if the customer cancels redemption before placing the order. |
| Cashback preview | `POST /orders/cashback` | Calculates expected points earned before order placement. Recalculates live as cart/city/redemption changes. |
| Place order | `POST /orders` | Single call that logs the order, awards cashback on `totalPaid`, and redeems held points via `pointsHoldReference`. |
| Points balance | `GET /customers/{id}/balance` | Fetches available points and redeemable value for checkout and profile. Requires Secret Key. |
| Tier progress | `GET /customers/{id}/tier-progress` | Returns current tier, next tier, and progress score for the profile page. |
| Badges | `GET /customers/{id}/reward-campaigns-progress` | Returns all reward campaigns with `achievedCount` and `completionPercentage` — covers EventBased, HighScore, Mission, and Streak types in one call. |

## Demo-Only: Session Switching

A fake "Login" page was added purely for demo convenience. It accepts any customer ID and sets it as the active session — all subsequent API calls (checkout, profile, events) run against that customer in Gameball. This makes it easy to test multiple customer journeys without re-registering. It is not a real authentication flow and has no equivalent in production.

## Assumptions

- **No backend** — All calls are made client-side. Acceptable for a demo; not for production (see below).
- **Customer IDs** — Generated as `ut_{uuid}` on registration. In production this would be your database user ID.
- **Secret Key in client** — Required for hold, order, and balance endpoints. Entered via UI config bar. In production this must move server-side.
- **Full points redemption** — The app holds the customer's full available balance. Partial redemption is not supported in this demo.
- **Shipping not excluded from points** — Points are calculated on `totalPaid` which includes shipping. Whether shipping earns points depends on the Gameball dashboard configuration.
- **Streak/stamp detail** — `reward-campaigns-progress` is used for all badge types. The dedicated `/streaks/{id}` and `/stamps/{id}` endpoints (which expose milestone badges and step-level progress) are not called, as the top-level response satisfies the display requirements.

## Known Issues / API Behavior

- **Typo in balance response** — `GET /customers/{id}/balance` returns `avaliablePointsBalance` and `avaliablePointsValue` (`avaliable` instead of `available`). Any client code using the documented field names receives `undefined`, which silently falls back to 0 — making it appear the customer has no redeemable balance even when they do. Worked around in code by using the misspelled field names directly.

- **Typo in tier-progress response** — `GET /customers/{id}/tier-progress` returns `minPorgress` (misspelled) on both the `current` and `next` tier objects. Expected field name is `minProgress`. Worked around in code by reading `minPorgress` directly.

- **Cashback preview ignores redemption discount** — The `POST /orders/cashback` endpoint documents that points are calculated on `totalPaid`. In practice, the API appears to compute points per line item using `price` and adds `totalShipping` separately, returning the full pre-discount amount regardless of `totalPaid`. For example, an order with subtotal $29 + shipping $5 − $11 redemption (totalPaid: $23) still returns 34 pts instead of 23 pts. The fix would be to distribute `totalDiscount` proportionally across line items using the line item `discount` field. This is noted as a discrepancy between the documentation and observed API behavior and should be verified with Gameball support.

## What I'd Do Differently in Production

1. **Move API calls server-side** — Never expose the Secret Key in client code. Proxy all Gameball calls through your backend, which holds keys in environment variables.
2. **Use your real user ID** — Replace the generated ID with your database's user primary key for a stable, lifetime identifier.
3. **Persist holdReference server-side** — Store the hold reference in your order session or database. A browser refresh mid-checkout should not lose the hold.
4. **Webhook handling** — Subscribe to Gameball webhooks (tier upgrade, badge earned) to trigger real-time notifications in your app.
5. **COD orders** — Do not fire `POST /orders` at checkout for cash-on-delivery. Fire it only after payment is confirmed to avoid awarding points for unpaid orders.
6. **Refunds** — Wire `POST /transactions/reverse` into your refund flow to cancel cashback when an order is refunded.
7. **Error handling & retries** — Add retry logic with exponential backoff for transient errors. Log failures to your observability stack.
8. **Points expiry** — Surface upcoming expiry dates from the balance API to customers via email or push notifications to drive re-engagement.
9. **Partial points redemption** — The Gameball Hold API supports redeeming any amount up to the available balance via `amountToHold`. This demo always holds the full balance for simplicity. In production, let customers choose how many points to redeem at checkout.
10. **OTP verification** — The demo passes `ignoreOTP: true` in the hold request to bypass the one-time password flow. In production, implement the OTP challenge so customers confirm redemption via SMS or email before points are held.
11. **Customer ID hashing** — Gameball recommends passing a hashed customer ID in some flows to prevent ID enumeration. The demo passes the raw ID directly.
12. **Hold expiry awareness** — The hold reference expires after 10 minutes. In production, track the expiry time and proactively warn the customer or auto-release the hold before they attempt to place the order and receive an error.
13. **Multi-currency support** — The demo hardcodes USD. If operating in multiple markets, pass the currency explicitly in order and balance calls.
14. **Rate limiting** — Gameball enforces per-second and per-30s limits per endpoint (e.g. Orders: 30 req/s / 360 per 30s; Events: 100 req/s / 1200 per 30s). Exceeding limits returns a 429 response. In production, implement client-side throttling to pace requests proactively rather than reacting to 429s — especially during flash sales or bulk operations.
15. **Queuing & batch processing** — During high-traffic events (flash sales, seasonal promotions), Gameball API calls should be placed on a message queue (e.g. Redis + BullMQ, SQS) rather than fired synchronously per request. This prevents order placement from blocking on loyalty calls, protects against rate limiting, and ensures no events or orders are dropped under load. Failed jobs can be retried automatically without impacting the customer experience.
