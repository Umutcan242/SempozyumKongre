const express = require('express');
const router = express.Router();
const { sendEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/emailService');

// Email test route'u (geliştirme için)
router.post('/test', async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    await sendEmail({
      to: to || 'test@example.com',
      subject: subject || 'Test Email',
      html: html || '<h1>Test Email</h1><p>This is a test email from Sempozyum & Kongre platform.</p>'
    });

    res.json({ message: 'Test email gönderildi' });
  } catch (error) {
    console.error('Email test hatası:', error);
    res.status(500).json({ message: 'Email gönderilemedi', error: error.message });
  }
});

// Şifre sıfırlama email'i gönderme
router.post('/password-reset', async (req, res) => {
  try {
    const { email, resetToken } = req.body;

    await sendPasswordResetEmail(email, resetToken);

    res.json({ message: 'Şifre sıfırlama emaili gönderildi' });
  } catch (error) {
    console.error('Şifre sıfırlama email hatası:', error);
    res.status(500).json({ message: 'Email gönderilemedi', error: error.message });
  }
});

// Hoş geldin email'i gönderme
router.post('/welcome', async (req, res) => {
  try {
    const { email, userData } = req.body;

    await sendWelcomeEmail(email, userData);

    res.json({ message: 'Hoş geldin emaili gönderildi' });
  } catch (error) {
    console.error('Hoş geldin email hatası:', error);
    res.status(500).json({ message: 'Email gönderilemedi', error: error.message });
  }
});

module.exports = router;