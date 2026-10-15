const express = require('express');
const router = express.Router();
const { provider } = require('../storage/repositories');

router.get('/status', (req, res) => res.json({ provider: provider() }));

module.exports = router;
