const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  const headerValue = req.header('Authorization') || req.headers['authorization'];
  const token = headerValue ? headerValue.replace(/^Bearer\s+/i, '').trim() : null;
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};