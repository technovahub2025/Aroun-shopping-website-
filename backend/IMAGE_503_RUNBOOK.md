# Product image recovery

## Findings and limits

Uploads pass through `productController.uploadProductImages` to `googleDrive.uploadImage`. Google returns a file ID; the backend creates an HMAC-SHA256 signature over that ID using `DRIVE_IMAGE_SIGNING_SECRET`, then stores an absolute signed URL in MongoDB `Product.images`. Existing URLs submitted by admins are also stored there. The host is not part of the HMAC. The image route verifies the signature in constant time, retrieves a Google access token, and streams the private file using Drive `files.get?alt=media`.

Previously, product APIs returned stored hosts verbatim. Now the product router canonicalizes known legacy Drive URLs in all product responses, including lean catalog/admin lists and category previews. It preserves signatures and query parameters without changing stored records or signing arbitrary submitted IDs. Upload generation uses the same validated `PUBLIC_API_URL` origin. The React resolver now also recognizes the legacy hosts for locally persisted products, carts and orders. Absolute URLs to unrelated services stay unchanged.

The old hostname occurs in the backend legacy-origin allowlist, frontend compatibility resolver/tests, and the ignored local `backend/.env` variable `FRONTEND_URL`. The migration previously hardcoded old and new hosts; it now reads `PUBLIC_API_URL`. `FRONTEND_URL` is a browser destination for redirects, not the backend image origin; set it to the actual storefront. No offline product data dump was found. Production MongoDB has not been directly queried or modified; the live product API was inspected as described below.

The local backend `.env` lacks `PUBLIC_API_URL`, all Drive settings, and `RAZORPAY_WEBHOOK_SECRET`. Render's environment values are unavailable here. Initial sandbox requests failed with `EACCES`; an approved read-only network check then produced these results on October 17, 2026:

| Live request | Result |
| --- | --- |
| Intended `5nnj` service `/api/products` | 200; 4,036 products, 4,039 image references to `ysi0`, one Cloudinary reference. |
| Old `ysi0` service `/api/products` | 503. |
| Sampled signed image on old `ysi0` host | 503, `text/html; charset=utf-8`. |
| Exact same image path and signature on intended `5nnj` host | 200, `image/png`. |

This reproduces the reported 503 at the stale host and verifies that preserving the signature while changing origins fixes the sampled request. Authentication and access to that file work on the intended service; no Google credential repair was needed for that sample. The old service's HTML 503 for both products and images indicates service-level unavailability rather than a demonstrated Drive-specific failure. Its precise Render failure/deployment state still requires Render logs. In the previous repository code, the image route swallowed exceptions and returned 502, further distinguishing that implementation from the observed HTML 503. The check does not prove all 4,039 image references are readable. Changing a host cannot repair revoked OAuth consent, inaccessible files, quota failures, or an unavailable service; use the diagnostic below for remaining failures.

## Render configuration and deployment

On the intended backend service set:

```dotenv
PUBLIC_API_URL=https://aroun-shopping-website-5nnj.onrender.com
GOOGLE_DRIVE_CLIENT_ID=<existing OAuth client ID>
GOOGLE_DRIVE_CLIENT_SECRET=<server-side OAuth client secret>
GOOGLE_DRIVE_REDIRECT_URI=https://aroun-shopping-website-5nnj.onrender.com/api/google-drive/callback
GOOGLE_DRIVE_REFRESH_TOKEN=<server-side fallback token if used>
DRIVE_IMAGE_SIGNING_SECRET=<same existing image signing key>
MONGO_URL=<same product and Drive-connection database>
FRONTEND_URL=<actual storefront origin>
GOOGLE_DRIVE_FOLDER_ID=<optional accessible upload folder ID>
RAZORPAY_WEBHOOK_SECRET=<random webhook signing secret matching Razorpay dashboard>
```

Keep the existing signing key during this host migration; replacing it invalidates saved image signatures. Signature verification now needs only the signing key, rather than unrelated upload configuration. Backend credentials belong only on the backend. Never put these values in Flutter, `VITE_*`, source control, or a support transcript.

Deploy this repository revision to that Render service and verify it is the running revision. Add the exact callback URI to the OAuth client's authorized redirect URIs in Google Cloud. Reconnect through the existing admin flow as the account that owns or can access the original image files if the diagnostic reports revoked credentials. The MongoDB connection record keyed by OAuth client ID takes precedence over the environment refresh token; updating only `GOOGLE_DRIVE_REFRESH_TOKEN` will not override a saved revoked token. Retain database access across deployments.

In Razorpay, the **webhook endpoint URL** is `https://aroun-shopping-website-5nnj.onrender.com/api/payment/webhook`; it is separate from the secret. No local webhook secret was configured, so there is no evidence here that Render's secret is a URL. The webhook now refuses URL-shaped secrets with a safe log and 503. Check Render and the dashboard manually. Razorpay signs the raw request body with HMAC-SHA256 using the shared secret: [official validation guide](https://razorpay.com/docs/webhooks/validate-test/).

## Diagnose the actual image failure

From the Render shell, in the backend directory, run:

```sh
node diagnoseDriveImage.js <fileId-from-an-affected-product>
```

This read-only diagnostic uses the production database/token selection and downloads the first chunk of the actual file. It prints no credentials, file URL, signed URL, or upstream response text. Check an affected signed image privately in a browser too; correlate `X-Request-ID` with `drive_image_error` logs. Do not paste full signed URLs into logs or tickets. No request ID or application log can indicate a request rejected by Render before reaching Node; check Render service/deploy logs in that case.

| Safe diagnostic/log result | Required investigation |
| --- | --- |
| `IMAGE_SIGNING_NOT_CONFIGURED`, `STORAGE_NOT_CONFIGURED`, `INVALID_PUBLIC_API_URL` | Correct backend environment settings; confirm correct Render service. |
| `DRIVE_CREDENTIAL_STORE_UNAVAILABLE` | Check MongoDB reachability and permissions for reading the Drive connection record. |
| OAuth `invalid_grant` | Reconnect the original Google account; inspect revoked/expired consent and token publishing status. |
| OAuth `invalid_client` | Match the client ID and secret to the OAuth client that issued the refresh token. |
| Drive 401 after automatic refresh retry | Check authorization, scopes and account policies. |
| Drive 403 `insufficientPermissions` / `appNotAuthorizedToFile` | Check account/file access and OAuth scope. `drive.file` cannot access every pre-existing file. Folder access alone does not prove access to each image. |
| Drive 404 | Check the original file ID and whether it was deleted or is inaccessible to this account. |
| Drive 403 quota reason / 429 | Inspect the reported quota and API usage. |
| Google 5xx / `DRIVE_TIMEOUT` / `DRIVE_NETWORK_FAILED` | Check Google availability and network access, then retry. |
| Unsupported image / no bytes | Check the actual file format/content. |
| Proxy 403 without an upstream call | Compare signing keys across deployments; inspect cached signatures. A hostname change preserves a valid HMAC. |

Failures use `Cache-Control: no-store`. The proxy retains its existing successful image cache of one day. It logs controlled error categories, upstream HTTP status/reason, and a server-generated request ID, with no raw upstream bodies, URLs, tokens, headers or credentials. File access/auth failures and transient upstream errors remain distinct in the logs. See [Google Drive error guidance](https://developers.google.com/workspace/drive/api/guides/handle-errors) and [Google token expiration rules](https://developers.google.com/identity/protocols/oauth2#expiration).

## Stored-data review before migration

The response compatibility fix does not require changing MongoDB immediately. To audit the actual stored origins and invalid signatures, run in the configured backend environment:

```sh
node migrateDriveImageUrls.js
```

The default is read-only, even if an old `DRY_RUN=false` setting exists. Review the counts and `sourceOrigins`; the report omits signed URLs. It counts invalid signatures but does not silently regenerate them. Recover the original signing key or separately review a trusted-data re-signing migration if keys were changed. Take a database backup before any approved application. After reviewing the dry run, an operator may explicitly run:

```sh
node migrateDriveImageUrls.js --apply
```

This changes only known legacy backend origins and relative proxy references, preserving file IDs, signatures, extra parameters and array order. It neither uploads nor deletes files. Updates compare the previous image array and skip concurrent edits, reported as conflicts. Re-run the dry run afterward. This migration has **not** been applied or run against production.

## Flutter and verification

No Flutter source is present in this repository. Keep Flutter's products API base at the intended backend, refetch products after deployment, and replace persisted product/cart/order snapshots containing old URLs. Clear the app's in-memory image cache (`imageCache.clear()` and `imageCache.clearLiveImages()` when using Flutter's image cache) and any persistent image cache used by the app (for example `DefaultCacheManager().emptyCache()` if that package is already used). Restart and reload products. These steps require a Flutter change or an existing cache-reset flow; do not add backend keys to the app. Avoid clearing all app storage unless the user accepts losing local session/cart data.

Verify that fresh `/api/products` responses contain the intended host, an existing signed image loads with an image content type and bytes, invalid signatures return 403 without contacting Google, and the same result survives a backend restart. Test an original file, not just a newly uploaded image. A fresh host and a valid signature do not guarantee Google file access.

## Credential exposure assessment

No confirmed leaked credential values were found in the inspected tracked configuration/code. The local `.env` is ignored and not tracked in the inspected history. It contains sensitive settings named `MONGO_URL` (database password), `JWT_SECRET`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `TWILIO_AUTH_TOKEN`. Rotate those if that file or its contents were shared externally; their presence in a local ignored file alone does not establish exposure. If Render configuration or prior logs were shared, also rotate exposed `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`/persisted refresh tokens, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` as applicable. A leaked `DRIVE_IMAGE_SIGNING_SECRET` requires rotation plus a separately reviewed re-signing plan for trusted stored references. Signed image URLs are bearer access to those images, not Google credentials. No secret values were printed during this investigation.
