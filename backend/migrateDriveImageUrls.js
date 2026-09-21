require('dotenv').config();

const mongoose = require('mongoose');
const crypto = require('node:crypto');
const Product = require('./models/productModel');

const OLD_HOST = 'https://aroun-shopping-website-fekt.onrender.com';
const NEW_HOST = 'https://aroun-shopping-website-ysi0.onrender.com';
const DRY_RUN = process.env.DRY_RUN !== 'false';

function generateSignature(id) {
  if (!process.env.DRIVE_IMAGE_SIGNING_SECRET) {
    throw new Error(
      'DRIVE_IMAGE_SIGNING_SECRET is missing from environment variables.'
    );
  }

  return crypto
    .createHmac(
      'sha256',
      process.env.DRIVE_IMAGE_SIGNING_SECRET
    )
    .update(id)
    .digest('hex');
}

function migrateImageUrl(url) {
  if (typeof url !== 'string') {
    return {
      changed: false,
      url,
    };
  }

  if (!url.startsWith(`${OLD_HOST}/api/drive-images/`)) {
    return {
      changed: false,
      url,
    };
  }

  const match = url.match(
    /\/api\/drive-images\/([a-zA-Z0-9_-]+)/
  );

  if (!match) {
    return {
      changed: false,
      url,
    };
  }

  const driveFileId = match[1];

  const signature = generateSignature(driveFileId);

  const newUrl =
    `${NEW_HOST}/api/drive-images/${driveFileId}?signature=${signature}`;

  return {
    changed: true,
    oldUrl: url,
    url: newUrl,
    driveFileId,
  };
}

async function run() {
  try {
    console.log('');
    console.log('==============================================');
    console.log(' AROUN STORES DRIVE IMAGE URL MIGRATION');
    console.log('==============================================');
    console.log('');

    console.log(`Mode: ${DRY_RUN ? 'DRY RUN - NO DATABASE CHANGES' : 'LIVE - DATABASE WILL BE UPDATED'}`);
    console.log(`Old backend: ${OLD_HOST}`);
    console.log(`New backend: ${NEW_HOST}`);
    console.log('');

    if (!process.env.MONGO_URL) {
      throw new Error('MONGO_URL is missing.');
    }

    if (!process.env.DRIVE_IMAGE_SIGNING_SECRET) {
      throw new Error('DRIVE_IMAGE_SIGNING_SECRET is missing.');
    }

    await mongoose.connect(process.env.MONGO_URL);

    console.log('MongoDB connected.');
    console.log('');

    const products = await Product.find({});

    console.log(`Products scanned: ${products.length}`);
    console.log('');

    let productsChanged = 0;
    let imagesChanged = 0;

    const updates = [];

    for (const product of products) {
      if (!Array.isArray(product.images) || !product.images.length) {
        continue;
      }

      let productChanged = false;

      const newImages = product.images.map((imageUrl) => {
        const result = migrateImageUrl(imageUrl);

        if (!result.changed) {
          return imageUrl;
        }

        productChanged = true;
        imagesChanged++;

        return result.url;
      });

      if (productChanged) {
        productsChanged++;

        updates.push({
          productId: product._id.toString(),
          title: product.title,
          oldImages: product.images,
          newImages,
        });
      }
    }

    console.log('----------------------------------------------');
    console.log(`Products containing old URLs: ${productsChanged}`);
    console.log(`Image URLs to migrate: ${imagesChanged}`);
    console.log('----------------------------------------------');
    console.log('');

    if (!updates.length) {
      console.log('No old A2HE image URLs were found.');
      return;
    }

    console.log('Sample migrations:');
    console.log('');

    updates.slice(0, 5).forEach((item, index) => {
      console.log(`Product ${index + 1}: ${item.title}`);
      console.log(`ID: ${item.productId}`);

      item.oldImages.forEach((oldImage, imageIndex) => {
        const newImage = item.newImages[imageIndex];

        if (oldImage !== newImage) {
          console.log('');
          console.log('OLD:');
          console.log(oldImage);
          console.log('');
          console.log('NEW:');
          console.log(newImage);
        }
      });

      console.log('');
      console.log('----------------------------------------------');
    });

    if (DRY_RUN) {
      console.log('');
      console.log('DRY RUN COMPLETE.');
      console.log('No database records were changed.');
      console.log('');
      console.log('If the numbers and URLs look correct, run:');
      console.log('');
      console.log('$env:DRY_RUN="false"');
      console.log('node migrateDriveImageUrls.js');
      console.log('');
      return;
    }

    console.log('');
    console.log('Starting LIVE database migration...');
    console.log('');

    let updatedProducts = 0;

    for (const item of updates) {
      await Product.updateOne(
        { _id: item.productId },
        {
          $set: {
            images: item.newImages,
          },
        }
      );

      updatedProducts++;

      if (
        updatedProducts % 100 === 0 ||
        updatedProducts === updates.length
      ) {
        console.log(
          `Updated ${updatedProducts}/${updates.length} products`
        );
      }
    }

    console.log('');
    console.log('==============================================');
    console.log(' MIGRATION COMPLETE');
    console.log('==============================================');
    console.log('');
    console.log(`Products updated: ${updatedProducts}`);
    console.log(`Image URLs migrated: ${imagesChanged}`);
    console.log('');
    console.log('Google Drive files were NOT uploaded or deleted.');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('==============================================');
    console.error(' MIGRATION FAILED');
    console.error('==============================================');
    console.error('');
    console.error(error);
    console.error('');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();