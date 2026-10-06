# Android order and payment notifications

This checkout includes authenticated FCM device registration, a MongoDB notification
queue, captured-payment verification, and a signed Razorpay webhook. Flutter carts
are validated against catalog prices and saved as Confirmed orders on capture.
The existing web checkout continues saving its own orders. Admin confirmation of
an order also queues an order-confirmed alert. No alert is sent by the dummy gateway.

## Deployment

1. Review and deploy this backend checkout, including package-lock.json; run `npm ci`.
2. In Firebase project `arounstore-2b00e`, enable Cloud Messaging API and obtain
   server credentials from Project settings > Service accounts. Store the JSON
   as the Render secret environment variable `FIREBASE_SERVICE_ACCOUNT_JSON`.
   Never put it in Flutter, Git, or a chat message. Alternatively use a mounted
   secret file and `GOOGLE_APPLICATION_CREDENTIALS`.
3. Set `PUSH_ENABLED=true` and `RAZORPAY_WEBHOOK_SECRET` to a new secret used only
   for this webhook. Keep the existing Razorpay API credentials and MongoDB URL.
4. Configure Razorpay's `payment.captured` webhook to
   `https://aroun-shopping-website-ysi0.onrender.com/api/payment/webhook`, using
   that same webhook secret. Configure the matching test/live account and capture
   settings; authorized but uncaptured payments do not generate success alerts.
5. Ensure MongoDB creates the unique indexes on PushDevice.token, PushEvent.key,
   PaymentAttempt.razorpayOrderId, and Order.razorpayOrderId (sparse). Mongoose's
   default autoIndex does this; if disabled, create them during deployment.
6. Rebuild the Android app, allow notifications, and log in. It registers its FCM
   token with `POST /api/push/devices` using the existing Bearer login token.
   Logout uses DELETE on that endpoint and invalidates the FCM token.

## Test

Run `node --test tests/*.test.js`. Use Razorpay test-mode credentials in both the
backend and Flutter (`--dart-define=RAZORPAY_KEY_ID=...`), and a matching test-mode
webhook. Verify a captured payment creates one server order and two notification
events, including when Flutter is closed. Repeat the webhook; event keys and order
IDs must remain unchanged. Invalid signatures, another customer's payment, and
uncaptured/mismatched payments must not generate alerts. Check two separate users
and logout/account switching on one device.

For a delivery-only smoke test, inspect
`PushNotificationService.instance.token.value` in the Flutter debugger, then use
Firebase Console's test-message function. Avoid posting tokens in shared logs.

## Behavior and limits

Android receives system notifications while backgrounded and shows an in-app
banner while foregrounded or after tapping an alert. Notification payloads are
generic and never used as proof of payment. iOS/web push are not enabled here.
Orders are available in the backend's admin/customer API; Flutter's existing
order-history page still uses local history and does not fetch server orders.

The worker runs every 30 seconds while the Node server is awake. Render sleep can
delay delivery. Events retry after five minutes on temporary errors. This is
at-least-once delivery: a crash after FCM accepts a message, or a partial multicast
failure, can cause a duplicate; Android tags replace the same tray notification.
No registered devices means the event is completed without delivery. Notifications
disabled by OS permissions or a force-stopped app cannot be guaranteed delivery.
Keep PUSH_ENABLED enabled before accepting payments that require notifications.
Pre-deployment Razorpay orders have no PaymentAttempt ownership record and cannot
be confirmed by the new verifier; finish/reconcile outstanding payments before
rollout. Enablement/deployment does not retroactively notify old payments.
