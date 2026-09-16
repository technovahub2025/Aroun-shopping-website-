const router = require('express').Router();
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const drive = require('../utils/googleDrive');

// Only URLs signed by this server can expose a Drive file to storefront visitors.
router.get('/:id', async (req, res) => {
  try {
    if (!drive.validSignature(req.params.id, req.query.signature)) return res.status(403).json({ message: 'Forbidden.', code: 'FORBIDDEN' });
    const image = await drive.readImage(req.params.id);
    const type = image.headers.get('content-type')?.split(';')[0];
    if (!drive.imageTypes.includes(type)) return res.status(415).json({ message: 'Unsupported image.', code: 'UNSUPPORTED_MEDIA_TYPE' });
    res.set({ 'Content-Type': type, 'Cache-Control': 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' });
    await pipeline(Readable.fromWeb(image.body), res);
  } catch {
    if (!res.headersSent) res.status(502).json({ message: 'Image temporarily unavailable' });
    else res.destroy();
  }
});

module.exports = router;
