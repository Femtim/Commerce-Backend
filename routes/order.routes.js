const express = require('express');
const router = express.Router();
const {
  verifyAndCreateOrder,
  getMyOrders,
  getAllOrdersForSeller,
  updateDeliveryStatus,
  paystackWebhook
} = require('../controllers/order.controller');
const { verifyToken, requireSeller } = require('../middleware/auth.middleware');

router.post('/verify-checkout', verifyToken, verifyAndCreateOrder);
router.get('/my-orders', verifyToken, getMyOrders);
router.get('/manage', verifyToken, requireSeller, getAllOrdersForSeller);
router.patch('/:id/status', verifyToken, requireSeller, updateDeliveryStatus);
router.post('/webhook', paystackWebhook);

module.exports = router;