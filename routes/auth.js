const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Kullanıcı kayıt
router.post('/register', [
  body('username').isLength({ min: 3, max: 20 }).withMessage('Kullanıcı adı 3-20 karakter olmalı'),
  body('email').isEmail().withMessage('Geçerli e-posta adresi girin'),
  body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validasyon hatası',
        errors: errors.array() 
      });
    }

    const { username, email, password, role = 'user', profile } = req.body;

    // Kullanıcı var mı kontrolü
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'Bu e-posta veya kullanıcı adı zaten kayıtlı' 
      });
    }

    const user = new User({
      username,
      email,
      password,
      role,
      profile: profile || {}
    });

    await user.save();

    // JWT token oluştur
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Hoş geldin emaili gönderme (arka planda)
    try {
      await sendWelcomeEmail(user.email, {
        username: user.username,
        fullName: user.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName}` : user.username,
        email: user.email
      });
      console.log('✅ Hoş geldin emaili gönderildi:', user.email);
    } catch (emailError) {
      console.error('❌ Hoş geldin emaili gönderilemedi:', emailError);
      // Email hatası kayıt işlemini etkilemesin
    }

    res.status(201).json({
      message: 'Kayıt başarılı',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validasyon hatası',
        errors: validationErrors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Bu e-posta veya kullanıcı adı zaten kayıtlı'
      });
    }

    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı giriş
router.post('/login', [
  body('usernameOrEmail').notEmpty().withMessage('Kullanıcı adı veya e-posta gerekli'),
  body('password').notEmpty().withMessage('Şifre gerekli')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validasyon hatası',
        errors: errors.array() 
      });
    }

    const { usernameOrEmail, password } = req.body;

    // Kullanıcıyı bul (e-posta veya kullanıcı adı ile)
    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail.toLowerCase() },
        { username: usernameOrEmail }
      ]
    });

    if (!user) {
      return res.status(401).json({ 
        message: 'Kullanıcı adınız veya şifreniz yanlış' 
      });
    }

    // Aktif kullanıcı kontrolü
    if (user.status !== 'active') {
      return res.status(401).json({
        message: 'Hesabınız aktif değil'
      });
    }

    // Şifre kontrolü
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Kullanıcı adınız veya şifreniz yanlış' 
      });
    }

    // Son giriş tarihini güncelle
    user.lastLogin = new Date();
    await user.save();

    // JWT token oluştur
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'Giriş başarılı',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Token doğrulama middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Token gerekli' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Geçersiz token' });
    }
    req.user = user;
    next();
  });
};

// Profil bilgisi getir
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profil getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Profil güncelle
router.put('/profile', authenticateToken, [
  body('email').optional().isEmail().withMessage('Geçerli e-posta adresi girin'),
  body('username').optional().isLength({ min: 3, max: 20 }).withMessage('Kullanıcı adı 3-20 karakter olmalı')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validasyon hatası',
        errors: errors.array() 
      });
    }

    const allowedUpdates = ['username', 'email', 'profile'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // E-posta veya kullanıcı adı çakışma kontrolü
    if (updates.email || updates.username) {
      const existingUser = await User.findOne({
        $or: [
          ...(updates.email ? [{ email: updates.email }] : []),
          ...(updates.username ? [{ username: updates.username }] : [])
        ],
        _id: { $ne: req.user.userId }
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: 'Bu e-posta veya kullanıcı adı zaten kullanılıyor' 
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json({
      message: 'Profil başarıyla güncellendi',
      user
    });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Şifre değiştir
router.put('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Mevcut şifre gerekli'),
  body('newPassword').isLength({ min: 6 }).withMessage('Yeni şifre en az 6 karakter olmalı')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validasyon hatası',
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Mevcut şifre kontrolü
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Mevcut şifre yanlış' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Şifre başarıyla değiştirildi' });
  } catch (error) {
    console.error('Şifre değiştirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Token doğrulama endpoint'i
router.post('/verify', authenticateToken, (req, res) => {
  res.json({ 
    message: 'Token geçerli',
    user: req.user 
  });
});

// Şifre sıfırlama e-postası gönder
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Geçerli e-posta adresi girin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validasyon hatası',
        errors: errors.array() 
      });
    }

    const { email } = req.body;

    // Kullanıcıyı bul
    const user = await User.findOne({ email });
    if (!user) {
      // Güvenlik açısından kullanıcı olmasa bile başarılı mesaj döndür
      return res.json({ message: 'E-posta gönderildi' });
    }

    // Şifre sıfırlama token'ı oluştur
    const resetToken = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' } // 1 saat geçerli
    );

    // Gerçek uygulamada burada e-posta gönderme servisi kullanılır
    // Şimdilik konsola log yazdırıyoruz
    console.log(`Şifre sıfırlama bağlantısı: http://localhost:3000/reset-password?token=${resetToken}`);
    console.log(`E-posta: ${email} için şifre sıfırlama token'ı: ${resetToken}`);

    res.json({ 
      message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi',
      // Geliştirme amaçlı - production'da kaldırılmalı
      resetToken: resetToken 
    });

  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Şifre sıfırlama (token ile)
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token gerekli'),
  body('newPassword').isLength({ min: 6 }).withMessage('Yeni şifre en az 6 karakter olmalı')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validasyon hatası',
        errors: errors.array() 
      });
    }

    const { token, newPassword } = req.body;

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Kullanıcıyı bul
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: 'Geçersiz token' });
    }

    // Şifreyi güncelle
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Şifre başarıyla güncellendi' });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş token' });
    }
    
    console.error('Şifre sıfırlama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Şifre sıfırlama emaili gönderme
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Geçerli e-posta adresi girin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validasyon hatası',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Kullanıcıyı bul
    const user = await User.findOne({ email });
    if (!user) {
      // Güvenlik için gerçek durumu göstermeyiz
      return res.json({ message: 'Şifre sıfırlama emaili gönderildi (eğer hesap varsa)' });
    }

    // Reset token oluştur (JWT ile)
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password_reset' },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '1h' }
    );

    // Email gönder
    try {
      await sendPasswordResetEmail(user.email, resetToken);
      console.log('✅ Şifre sıfırlama emaili gönderildi:', user.email);
    } catch (emailError) {
      console.error('❌ Şifre sıfırlama emaili gönderilemedi:', emailError);
      return res.status(500).json({ message: 'Email gönderilemedi' });
    }

    res.json({ message: 'Şifre sıfırlama emaili gönderildi' });

  } catch (error) {
    console.error('Şifre sıfırlama emaili gönderme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Şifre sıfırlama (token ile)
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token gerekli'),
  body('newPassword').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validasyon hatası',
        errors: errors.array()
      });
    }

    const { token, newPassword } = req.body;

    // Token'ı doğrula
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');

    // Token'ın şifre sıfırlama için olduğunu kontrol et (eski token'lar için type alanı olmayabilir)
    if (decoded.type && decoded.type !== 'password_reset') {
      return res.status(400).json({ message: 'Geçersiz token tipi' });
    }

    // Kullanıcıyı bul
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Şifreyi güncelle
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Şifre başarıyla güncellendi' });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş token' });
    }

    console.error('Şifre sıfırlama hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;