# Order management and admin email

## Architecture and changes

The existing React checkout calls `POST /api/orders`. Express stores a single MongoDB
`Order` containing product snapshots, shipping details, payment data, total and status.
Both customer and admin views read this same collection. Existing JWT `protect` and
`admin` middleware still secure the APIs; the frontend admin route now also requires
the admin role.

The dashboard has an Orders navigation entry at `/admin/orders`, a paginated table,
Refresh/Retry controls and a detail page at `/admin/orders/:id`. Details show the full
order ID, customer name/email/phone, products and quantities, total, payment status,
address, local date/time and current status. The dropdown saves through the existing
API, replaces UI data only after success, disables duplicate saves and shows a toast.
Admin list responses are fetched fresh instead of cached in session storage.

Creation validates shipping, product IDs, quantities and payment method. Product names,
images and prices are taken from the catalog; the server computes the total. State and
country are now retained in the existing shipping subdocument. Customer cancellation
continues to work for Pending, Confirmed and Processing, including legacy records.

## Environment and runtime

Use Node.js 20 or later. Install backend dependencies with `npm.cmd ci` from `backend`.
Copy the variable names from `.env.orders.example` into the existing `backend/.env`:

```dotenv
ADMIN_EMAIL=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
```

Set the recipient and a sender accepted by your SMTP provider. Provide both SMTP_USER
and SMTP_PASSWORD for authenticated SMTP; omit both only for a configured relay that
does not require authentication. Port 465 uses immediate TLS; other ports use
Nodemailer's STARTTLS behavior. Certificate verification remains enabled.
See the [Nodemailer SMTP documentation](https://nodemailer.com/smtp).
Restart the backend after changing environment variables. Existing MONGO_URL, JWT_SECRET
and payment configuration remain required as before. No real credentials are in the example.

## Email behavior

`utils/orderEmail.js` adds the project's first SMTP email service using Nodemailer.
It reads environment variables lazily (the server loads dotenv after importing routes).
After the order saves and the 201 response is sent, it attempts one plain-text admin
email. The message contains the saved order ID, customer contact details, products,
quantities, INR total, payment status, complete address, order date in IST and status.
Missing configuration and SMTP errors log the order ID and an error code, without
credentials. They never roll back an order or change checkout success. Cart cleanup
failure likewise no longer turns a saved order into a failed checkout response.

Delivery is best effort within the existing long-running Express process, with bounded
SMTP timeouts. There is no durable queue or automatic retry; process termination after
the response can lose a notification. An SMTP acceptance is not proof of inbox delivery.

## Database compatibility

The existing `status` field now defaults to Pending and accepts exactly:
Pending, Confirmed, Processing, Shipped, Delivered, Cancelled.
No new collection or duplicate order data is introduced.

A model getter translates legacy `created` to Pending and lowercase statuses to their
new labels on reads. An idempotent migration persists those conversions and supplies
Pending for missing/null/empty statuses, without deleting records or changing order
timestamps. Existing state/country data that was previously discarded cannot be recovered.

After deploying the updated backend, run from `backend` against the intended database:

```powershell
node migrateOrderStatuses.js
```

This migration has not been run against your database by this implementation session.

## Existing APIs (no new endpoints)

| Endpoint | Behavior |
| --- | --- |
| POST /api/orders | Authenticated creation; validated data, default Pending, post-save email |
| GET /api/orders | Admin-only list; same order collection, customer fallback fields |
| GET /api/orders/my | Authenticated customer's own orders; new status labels |
| GET /api/orders/:id | Owner or admin details; malformed ID 400, missing record 404 |
| PUT /api/orders/:id | Admin only; body `{ "status": "Processing" }`; changes status only |
| PATCH /api/orders/:id/cancel | Owner cancellation before shipping, compatible with new statuses |

Invalid status values return 400; missing records return 404. Database failures return
safe generic 500 responses. Unauthenticated requests return 401; non-admin access to
the admin list/update returns 403. The PUT endpoint no longer accepts payment mutations.

Payment processing was not redesigned. In particular, the pre-existing order creation
flow trusts a supplied `paymentResult` when setting Paid, and Razorpay amount creation
accepts a client amount. These remain limitations of payment integrity; this work does
not certify the existing payment flow. Admin order status updates cannot alter payment
status. If a catalog price changes during checkout, the saved total uses the latest
catalog price; payment reconciliation is outside this feature.

## Verification performed

```powershell
# In backend
node --test tests/*.test.js controllers/*.test.js utils/*.test.js
# In frontend
npm.cmd run build
npx.cmd eslint src/pages/admin/Orders.jsx src/pages/admin/OrderDetails.jsx src/utils/orderStatus.js api/orderApi.js src/components/NumberedPagination.jsx
```

The backend suite uses mocked database operations and SMTP transport. It verifies
schema defaults/validation, compatibility, trusted product snapshots, invalid inputs,
post-save email ordering, SMTP/database/cleanup failures, middleware protection,
ownership, all six status saves, customer cancellation, shared list data and email
contents/configuration. Live database persistence, real mail delivery and interactive
browser behavior require the following checks.

## Exact end-to-end test steps

1. Configure the existing MongoDB/auth settings and the SMTP variables above. For initial
   mail testing, use an SMTP capture service or a test mailbox under your control.
2. In one terminal, `cd backend` and run `npm.cmd start`. In another, `cd frontend` and run
   `npm.cmd run dev`. Open the local URL printed by Vite.
3. Sign in as a customer, add a catalog product, go to Checkout, fill every address/contact
   field and place a Cash on Delivery order. Confirm success and that My Orders shows
   Pending, payment pending, correct quantities and server-calculated total.
4. Sign in as an admin in a separate browser profile. Open `/admin/orders` and press
   Refresh if the page was already open. Verify the new order ID and table fields.
5. Click View. Compare customer name/email/phone, each product and quantity, total,
   payment, full address (including state/country), date/time and status with checkout.
6. Select and save each of Pending, Confirmed, Processing, Shipped, Delivered and
   Cancelled. Verify success toast/current label, refresh the detail page, and verify
   persistence. Return to the list and verify the matching status.
7. Check ADMIN_EMAIL's inbox or SMTP capture. Compare every field with the saved order.
   Confirm it received one new-order notification and no notification for status changes.
8. In the customer profile, reload My Orders and confirm the latest status. Place another
   order and cancel it while Pending/Confirmed/Processing; confirm cancellation persists.
   Confirm Shipped/Delivered orders do not expose customer cancellation.
9. Logged out, request GET `/api/orders` and expect 401. As a customer, GET `/api/orders`
   and PUT `/api/orders/<id>` must return 403; opening `/admin/orders` should redirect.
   Accessing another customer's order detail must return 403.
10. As admin, PUT `/api/orders/<id>` with `{ "status": "invalid" }` and expect 400.
    Try a malformed ID (400) and a valid 24-digit hex ID that is absent (404). Include
    paymentStatus/totalPrice in a valid status update and verify those fields do not change.
11. Temporarily set SMTP_HOST to an unreachable test host and restart the backend.
    Place another COD order. Verify successful checkout, saved order in both views, and
    an `Admin order email failed` log; restore SMTP configuration and restart afterward.
12. Test the existing Razorpay checkout with your configured test keys and confirm its
    resulting order still appears in both views. Never use live payment credentials for
    this test unless you intend to make a real transaction.
13. Stop the backend while opening the admin list/detail or saving a status. Verify a
    friendly error, no false success and a working retry after restarting it. A fresh
    database with no orders should show the empty state.

## Files changed by this feature

Modified:
- backend/controllers/orderController.js
- backend/models/Order.js
- backend/package.json
- backend/package-lock.json
- frontend/api/orderApi.js
- frontend/src/App.jsx
- frontend/src/components/ProtectedRoute.jsx
- frontend/src/components/NumberedPagination.jsx
- frontend/src/pages/Orders.jsx
- frontend/src/pages/admin/Routes.jsx
- frontend/src/pages/admin/LayoutDashboard.jsx

Created:
- backend/.env.orders.example
- backend/ORDER_MANAGEMENT.md
- backend/migrateOrderStatuses.js
- backend/utils/orderStatus.js
- backend/utils/orderEmail.js
- backend/tests/orders.test.js
- backend/tests/orderEmail.test.js
- frontend/src/utils/orderStatus.js
- frontend/src/pages/admin/Orders.jsx
- frontend/src/pages/admin/OrderDetails.jsx

Pre-existing workspace changes were preserved.
