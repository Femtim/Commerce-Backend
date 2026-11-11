const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, trim: true }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Workspace', 'Fashion', 'Accessories']
  },
  image: { type: String, required: true },
  stock: { type: Number, required: true, min: 0, default: 10 },
  rating: { type: Number, default: 4.8 },
  numReviews: { type: Number, default: 0 },
  reviews: [reviewSchema],
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);