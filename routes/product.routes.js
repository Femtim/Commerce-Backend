const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  addProductReview
} = require('../controllers/product.controller');
const { verifyToken, requireSeller } = require('../middleware/auth.middleware');
const { upload } = require('../config/cloudinary');

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', verifyToken, requireSeller, upload.single('imageFile'), createProduct);
router.post('/:id/reviews', verifyToken, addProductReview);

module.exports = router;