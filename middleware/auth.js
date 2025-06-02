const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// Middleware assumes you injected req.models.User earlier in your routes
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.cookies.jwt ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
  ) {
    token = req.cookies.jwt || req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ PostgreSQL: Use your custom model method
    const user = await req.models.User.findById(decoded.id);

    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

const admin = (req, res, next) => {
  if (req.user && req.user.isadmin) { // 🧠 `isadmin` should match your DB column name
    return next();
  }
  res.status(401);
  throw new Error('Not authorized as admin');
};

module.exports = { protect, admin };
