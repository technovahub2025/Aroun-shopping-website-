const router = require('express').Router();
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const drive = require('../utils/googleDrive');
const { randomUUID } = require('node:crypto');

// Only URLs signed by this server can expose a Drive file to storefront visitors.
router.get('/:id', async (req, res) => {
  const requestId = randomUUID();
  res.set({ 'X-Request-ID': requestId, 'Cache-Control': 'no-store' });
  try {
    if (!drive.validSignature(req.params.id, req.query.signature)) return res.status(403).json({ message: 'Forbidden.', code: 'FORBIDDEN' });
    const image = await drive.readImage(req.params.id);
    const type = image.headers.get('content-type')?.split(';')[0];
    if (!drive.imageTypes.includes(type)) {
      await image.body?.cancel();
      console.error('drive_image_error', { requestId, code: 'UNSUPPORTED_MEDIA_TYPE' });
      return res.status(415).json({ message: 'Unsupported image.', code: 'UNSUPPORTED_MEDIA_TYPE' });
    }
    res.set({ 'Content-Type': type, 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' });
    await pipeline(Readable.fromWeb(image.body), res);
  } catch (error) {
    drive.logImageError(error, requestId);
    if (!res.headersSent) res.status([404, 503].includes(error.status) ? error.status : 502)
      .set('Cache-Control', 'no-store').json({ message: 'Image temporarily unavailable', requestId });
    else res.destroy();
  }
});

module.exports = router;
