const express = require('express');
const path = require('path');

const router = express.Router();

router.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.set('Referrer-Policy', 'no-referrer');
  res.sendFile(path.join(__dirname, '../public/reset-password.html'));
});

module.exports = router;
