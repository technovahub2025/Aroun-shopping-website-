// Dry run by default. Review counts and take a database backup before --apply.
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const Product = require('./models/productModel');
const { canonicalImageUrl, publicApiOrigin } = require('./utils/driveImageUrls');
const drive = require('./utils/googleDrive');

function migrateImageUrl(url) {
  const next = canonicalImageUrl(url);
  return { changed: next !== url, url: next };
}

async function run() {
  const apply = process.argv.includes('--apply');
  const summary = { mode: apply ? 'apply' : 'dry-run', target: publicApiOrigin(),
    productsScanned: 0, productsChanged: 0, imagesChanged: 0, invalidSignatures: 0,
    conflicts: 0, sourceOrigins: {} };
  if (!process.env.MONGO_URL || !process.env.DRIVE_IMAGE_SIGNING_SECRET) {
    throw new Error('MONGO_URL and DRIVE_IMAGE_SIGNING_SECRET are required.');
  }
  try {
    await mongoose.connect(process.env.MONGO_URL, { serverSelectionTimeoutMS: 10000 });
    for await (const product of Product.find({}).select('_id images').lean().cursor()) {
      summary.productsScanned++;
      const original = product.images || [];
      const images = original.map(url => {
        const result = migrateImageUrl(url);
        let parsed;
        try { parsed = new URL(url); } catch { /* relative or external reference */ }
        if (parsed && /^\/api\/drive-images\/[A-Za-z0-9_-]+$/.test(parsed.pathname)) {
          summary.sourceOrigins[parsed.origin] = (summary.sourceOrigins[parsed.origin] || 0) + 1;
          if (!drive.validSignature(parsed.pathname.split('/').at(-1), parsed.searchParams.get('signature'))) summary.invalidSignatures++;
        }
        if (result.changed) summary.imagesChanged++;
        return result.url;
      });
      if (!images.some((url, index) => url !== original[index])) continue;
      summary.productsChanged++;
      if (apply) {
        // Skip concurrent edits instead of overwriting them.
        const result = await Product.updateOne({ _id: product._id, images: original }, { $set: { images } });
        if (!result.matchedCount) summary.conflicts++;
      }
    }
    console.log(JSON.stringify(summary, null, 2));
    if (!apply) console.log('No data changed. Review this report and a database backup before running with --apply.');
    if (summary.invalidSignatures) console.log('Invalid signatures require investigation of the original signing key; changing hosts does not repair them.');
  } finally { await mongoose.disconnect(); }
}

if (require.main === module) run().catch(() => {
  // Raw database errors can include connection credentials.
  console.error('Migration failed. Verify PUBLIC_API_URL, signing key and database access.');
  process.exitCode = 1;
});
module.exports = { migrateImageUrl, run };
