# INTEGRATION_NOTES.md — UrbanThreads × Gameball

## APIs Used & Why

| Flow | Endpoint | Reason |
|---|---|---|
| Registration | `POST /customers` | Creates or updates the customer in Gameball. Idempotent — safe to call on every login. |
| Profile completed | `POST /events` (event: `profile_completed`) | Sends a named event with metadata; Gameball can trigger reward campaigns on this. |
| Write review | `POST /events` (event: `write_review`) | Same event API. `has_image: true/false` in metadata distinguishes photo vs. text reviews, enabling separate campaigns for each. |
| Points balance | `GET /customers/{id}/points` | Fetches available, pending, and redeemable values to show at checkout. |
| Hold points | `POST /transactions/hold` | Reserves points before the order is confirmed — like a credit card auth hold. Returns a `holdReference` valid for 10 minutes. |
| Place order + earn + redeem | `POST /orders` | Single call that (a) logs the order with line items, (b) awards cashback on `totalPaid`, and (c) redeems held points via `pointsHoldReference`. This is the correct e-commerce pattern — do not use the standalone cashback or redeem APIs for orders. |
| Tier & badges | `GET /customers/{id}/tier`, `GET /customers/{id}/campaigns` | Fetches VIP tier progress and reward campaign completion for the profile page. |

## Assumptions

- **No backend**: All API calls are made client-side (browser → Gameball). This is fine for a demo but not for production (see below).
- **Customer IDs**: Generated as `UT_{timestamp}` on registration. In production this would be your database user ID.
- **Secret Key**: Included in the Hold and Order calls as required. The UI accepts it as an input field.
- **Points redemption factor**: Assumed to be configured in the Gameball dashboard. The app passes a dollar `amount` to the Hold API; Gameball calculates the points deduction.
- **Campaigns/badges**: Returned from the campaigns API. Badges are shown with a progress bar based on `completionPercentage`.

## What I'd Do Differently in Production

1. **Move API calls server-side**: Never expose your Secret Key in client-side code. Proxy all Gameball calls through your backend (Node/Python/etc.), which holds the keys in environment variables.
2. **Use your real user ID**: Replace the `UT_{timestamp}` ID with your database's user primary key for a stable, lifetime identifier.
3. **Store holdReference server-side**: Keep the hold reference in your order session/DB, not just in React state. If the user refreshes mid-checkout, the hold is lost.
4. **Webhook handling**: Subscribe to Gameball webhooks (tier upgrades, badge earned) to trigger real-time UI notifications in your app.
5. **Error handling & retries**: Add retry logic with exponential backoff for transient Gameball API errors. Log failures to your observability stack.
6. **COD orders**: For cash-on-delivery, do not fire the Order API at checkout — fire it only after payment is confirmed (delivery + payment received), to avoid awarding points for unpaid orders.
7. **Refunds**: Use `POST /transactions/reverse` to cancel cashback if an order is refunded. Wire this into your refund flow.
8. **Points expiry**: Inform customers of upcoming point expiry dates (available in the balance API response) via email/push to drive re-engagement.
