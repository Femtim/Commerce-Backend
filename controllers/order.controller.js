const axios = require('axios');
const crypto = require('crypto');
const Order = require('../models/Order.model');
const Product = require('../models/Product.model');
const { sendOrderReceiptEmail } = require('../utils/sendEmail');

exports.verifyAndCreateOrder = async (req, res) => {
  try {
    const { reference, customer, items, totalAmount } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ status: false, message: 'Cart cannot be empty' });
    }

    if (
      process.env.PAYSTACK_SECRET_KEY &&
      !process.env.PAYSTACK_SECRET_KEY.includes('your_paystack')
    ) {
      const paystackRes = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
      );
      const paymentData = paystackRes.data.data;
      if (paymentData.status !== 'success' || paymentData.amount < totalAmount * 100) {
        return res.status(400).json({ status: false, message: 'Paystack verification failed' });
      }
    }

    const updatedProducts = [];

    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        return res.status(400).json({
          status: false,
          message: `${item.name} is out of stock or has insufficient quantity`
        });
      }
      updatedProducts.push(updated);
    }

    const order = await Order.create({
      buyer: req.user.id,
      customer,
      items,
      totalAmount,
      paymentStatus: 'Paid',
      deliveryStatus: 'Processing',
      orderReference: reference
    });

    sendOrderReceiptEmail(order);

    const io = req.app.get('io');
    if (io) {
      io.to('sellers').emit('order:created', order);
      io.to(`user_${req.user.id}`).emit('order:created', order);
      io.emit('inventory:updated', updatedProducts);
    }

    res.status(201).json({ status: true, message: 'Order created', data: order });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ status: true, data: orders });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

exports.getAllOrdersForSeller = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ status: true, data: orders });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryStatus } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryStatus },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({ status: false, message: 'Order not found' });
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.buyer.toString()}`).emit('order:statusUpdated', order);
      io.to('sellers').emit('order:statusUpdated', order);
    }

    res.status(200).json({ status: true, message: 'Delivery status updated', data: order });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
};

exports.paystackWebhook = async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      return res.sendStatus(400);
    }

    const event = req.body;
    if (event.event === 'charge.success') {
      await Order.findOneAndUpdate(
        { orderReference: event.data.reference },
        { paymentStatus: 'Paid' }
      );
    }
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  }
};