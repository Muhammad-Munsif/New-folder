// authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

const protect = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  let decoded;
  try {
    decoded = jwt.verify(authorization.slice(7), process.env.JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }

  req.user = await User.findById(decoded.id).select('-password');
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized, user no longer exists');
  }
  next();
});

module.exports = { protect };

