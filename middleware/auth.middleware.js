const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: false, message: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(403).json({ status: false, message: 'Invalid or expired token' });
  }
};

exports.requireSeller = (req, res, next) => {
  if (!req.user || req.user.role !== 'seller') {
    return res.status(403).json({ status: false, message: 'Forbidden: Seller access required' });
  }
  next();
};