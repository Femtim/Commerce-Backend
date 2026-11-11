const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true }
  },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Paid' },
  deliveryStatus: {
    type: String,
    enum: ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'],
    default: 'Processing'
  },
  orderReference: { type: String, unique: true, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);