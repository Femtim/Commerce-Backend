const Product = require('../models/Product.model');

const DEFAULT_SEED_PRODUCTS = [
  {
    name: 'Keychron Q1 Pro Wireless Mechanical Keyboard',
    category: 'Workspace',
    price: 195000,
    rating: 4.9,
    numReviews: 1,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80',
    description: 'Full metal QMK/VIA wireless custom mechanical keyboard with double-gasket design and hot-swappable switches.',
    reviews: [
      {
        user: '65f1a2b3c4d5e6f7a8b9c0d1',
        fullName: 'Tunde Bakare',
        rating: 5,
        comment: 'Solid aluminum build and incredible tactile acoustics right out of the box.'
      }
    ]
  },
  {
    name: 'Sony WH-1000XM5 Noise Canceling Headphones',
    category: 'Electronics',
    price: 420000,
    rating: 4.8,
    numReviews: 0,
    stock: 5,
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80',
    description: 'Industry-leading noise cancellation with 8 microphones, Auto NC Optimizer, and 30-hour battery life.',
    reviews: []
  },
  {
    name: 'Minimalist Matte Black Chronograph Watch',
    category: 'Accessories',
    price: 85000,
    rating: 4.6,
    numReviews: 0,
    stock: 12,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    description: 'Sapphire crystal glass with waterproof Italian leather strap and Japanese quartz movement.',
    reviews: []
  },
  {
    name: 'Ergonomic Aluminium Laptop Stand',
    category: 'Workspace',
    price: 45000,
    rating: 4.7,
    numReviews: 0,
    stock: 20,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
    description: 'Heat-dissipating anodized aluminum stand for 13-17 inch laptops with non-slip silicone pads.',
    reviews: []
  },
  {
    name: 'Streetwear Heavyweight Oversized Hoodie',
    category: 'Fashion',
    price: 38000,
    rating: 4.5,
    numReviews: 0,
    stock: 4,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80',
    description: '450GSM 100% organic cotton fleece with drop-shoulder cut.',
    reviews: []
  },
  {
    name: 'Ultra-Wide 34" Curved WQHD Monitor',
    category: 'Electronics',
    price: 580000,
    rating: 4.9,
    numReviews: 0,
    stock: 3,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    description: '144Hz refresh rate, 1ms response time, USB-C hub display.',
    reviews: []
  }
];

exports.getProducts = async (req, res) => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(DEFAULT_SEED_PRODUCTS);
    }

    const { category, search } = req.query;
    const filter = {};

    if (category && category !== 'All') filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ status: true, data: products });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ status: false, message: 'Product not found' });
    }
    res.status(200).json({ status: true, data: product });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const imageUrl = req.file ? req.file.path : req.body.image;
    if (!imageUrl) {
      return res.status(400).json({ status: false, message: 'Product image file or URL is required' });
    }

    const product = await Product.create({
      name: req.body.name,
      category: req.body.category,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
      description: req.body.description,
      image: imageUrl,
      seller: req.user.id
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('product:created', product);
    }

    res.status(201).json({ status: true, message: 'Product published', data: product });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
};

exports.addProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ status: false, message: 'Product not found' });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user.id.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({ status: false, message: 'You have already reviewed this product' });
    }

    const review = {
      user: req.user.id,
      fullName: req.user.fullName,
      rating: Number(rating),
      comment
    };

    product.reviews.unshift(review);
    product.numReviews = product.reviews.length;
    product.rating = Number(
      (product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length).toFixed(1)
    );

    await product.save();
    res.status(201).json({ status: true, message: 'Review added', data: product });
  } catch (error) {
    res.status(400).json({ status: false, message: error.message });
  }
};