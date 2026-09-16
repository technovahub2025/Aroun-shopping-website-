# Google Drive product images

Requires Node.js 22 or newer. No additional npm dependencies are needed.

1. In [Google Cloud Console](https://console.cloud.google.com/), enable the Google Drive API. Configure the OAuth consent screen and add the shop owner's Google account as a test user while testing.
2. Create an OAuth client of type **Web application**. For the one-time setup below, add `https://developers.google.com/oauthplayground` as an authorized redirect URI.
3. Open [OAuth Playground](https://developers.google.com/oauthplayground/). In settings, enable **Use your own OAuth credentials** and enter your client ID and secret. Use offline access. Authorize `https://www.googleapis.com/auth/drive.file` as the account that should store product images, then exchange the authorization code for tokens. Copy the refresh token into the backend environment. Do not send credentials or tokens to the frontend or commit them.
4. Copy the variables from `.env.drive.example` into `backend/.env` (keep existing database/auth settings). Set the client ID, client secret, refresh token, and a long random `DRIVE_IMAGE_SIGNING_SECRET`. Generate a secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
5. Set `PUBLIC_API_URL` to the backend origin, e.g. `http://localhost:5000` locally or `https://api.your-shop.com` in production. It must be reachable by shoppers. Keep this origin and the signing secret stable: saved image URLs depend on both.
6. Leave `GOOGLE_DRIVE_FOLDER_ID` empty to upload into My Drive. An optional folder must be accessible to this OAuth client: `drive.file` does not grant access to arbitrary existing folders. Use a folder created by the same OAuth app or explicitly selected through Google Picker; otherwise leave this setting empty.
7. Restart the backend. Send authenticated admin multipart requests to the product endpoints below with `imageStorage=google-drive`. Frontend upload controls are a separate change. Cloudinary remains available with its existing configuration.

Google OAuth apps in external Testing status can issue refresh tokens that expire after seven days for Drive scopes. Complete the appropriate production consent configuration for persistent use. See [Google's OAuth documentation](https://developers.google.com/identity/protocols/oauth2/web-server).

The existing admin-only `POST /api/products` and `PUT /api/products/:id` endpoints accept multipart `images` (up to five JPEG/PNG/WebP/GIF files, 10 MB each), `imageStorage=google-drive`, and an optional JSON `imageOrder` array (`{ "type": "file", "index": 0 }` or `{ "type": "url", "url": "https://..." }`). Clients can send this order, including an empty array to remove all product images.

The backend uploads with [Drive multipart upload](https://developers.google.com/workspace/drive/api/guides/manage-uploads), saves signed backend image URLs in the product, and serves image bytes using [Drive downloads](https://developers.google.com/workspace/drive/api/guides/manage-downloads). Drive files remain private; anyone with the signed storefront URL can view that product image. No Google credentials are exposed in those URLs. Invalid signatures cannot retrieve other account files.

Failed product saves attempt to delete only the Drive files uploaded by that request. Removing an existing image or deleting a product leaves the original Drive file intact. Check server logs if cleanup fails. Drive quotas and backend availability affect image delivery; the image endpoint supplies a one-day browser cache header.

Validation: run `node --test tests/googleDrive.test.js tests/productImages.test.js` from `backend`. A live smoke test requires a configured Google account: create a product with two images through the admin API, open its signed image URLs, reorder and replace an image, then remove all images and save. Confirm an invalid image URL signature returns 403 and a non-admin cannot upload.