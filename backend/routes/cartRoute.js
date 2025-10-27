const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateItem, removeItem, clearCart } = require('../controllers/cartController');
const { protect } = require('../middleware/authmiddleware');

router.use(protect);
router.get('/', getCart);
router.post('/', addToCart); // { productId, quantity }
router.put('/', updateItem); // { productId, quantity }
router.delete('/:productId', removeItem);
router.delete('/', clearCart);

module.exports = router;
