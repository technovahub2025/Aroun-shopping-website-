// Run inside the configured backend environment. Never prints tokens or signed URLs.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const drive = require('./utils/googleDrive');
const { publicApiOrigin } = require('./utils/driveImageUrls');

async function run() {
  const id = process.argv[2];
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) throw new Error('Pass a Drive image file ID.');
  console.log({ publicApiOrigin: publicApiOrigin(),
    webhookSecretConfigured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
    webhookSecretIsUrl: /^https?:\/\//i.test(process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || '') });
  try {
    await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 });
    // Uses the same persisted-token precedence, refresh, 401 retry and download as the proxy.
    const response = await drive.readImage(id);
    const contentType = response.headers.get('content-type')?.split(';')[0];
    const reader = response.body.getReader();
    const { value } = await reader.read();
    await reader.cancel();
    console.log({ upstreamStatus: response.status, supportedImage: drive.imageTypes.includes(contentType),
      receivedBytes: value?.byteLength || 0 });
  } finally { await mongoose.disconnect(); }
}
run().catch(error => {
  drive.logImageError(error, 'operator-diagnostic');
  process.exitCode = 1;
});
