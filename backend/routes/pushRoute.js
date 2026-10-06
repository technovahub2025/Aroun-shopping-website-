const router = require('express').Router();
const { protect } = require('../middleware/authmiddleware');
const Device = require('../models/PushDevice');

router.use(protect);
router.use((req, res, next) => {
  if (!/^[a-f\d]{24}$/i.test(String(req.user._id))) return res.sendStatus(403);
  const token = req.body?.token;
  if (typeof token !== 'string' || token.length < 20 || token.length > 4096 || /\s/.test(token)) {
    return res.status(400).json({ message: 'Invalid device token' });
  }
  next();
});
router.post('/devices', async (req, res, next) => {
  try {
    // Unique token transfers to the currently authenticated account on a shared device.
    await Device.findOneAndUpdate({ token: req.body.token },
      { $set: { user: req.user._id } }, { upsert: true, runValidators: true });
    res.sendStatus(204);
  } catch (error) { next(error); }
});
router.delete('/devices', async (req, res, next) => {
  try {
    await Device.deleteOne({ token: req.body.token, user: req.user._id });
    res.sendStatus(204);
  } catch (error) { next(error); }
});
module.exports = router;
