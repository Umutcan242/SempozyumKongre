const jwt = require('jsonwebtoken');

// JWT token doğrulama middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Erişim token\'ı gerekli' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Geçersiz token' });
    }
    
    req.user = user;
    next();
  });
}

module.exports = { authenticateToken };

// Admin rolü kontrolü middleware
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Kimlik doğrulama gerekli' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bu işlem için yönetici yetkisi gerekli' });
  }

  next();
}

module.exports = { authenticateToken, requireAdmin };