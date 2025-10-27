const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authmiddleware');
const { createOrder, getMyOrders, getOrder, getAllOrders, updateOrderStatus } = require('../controllers/orderController');

router.post('/', protect, createOrder);
router.get('/my', protect, getMyOrders);
router.get('/:id', protect, getOrder);

// Admin routes
router.get('/', protect, admin, getAllOrders);
router.put('/:id', protect, admin, updateOrderStatus);

module.exports = router;
