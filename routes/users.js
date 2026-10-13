const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Tüm kullanıcıları listele (sadece admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Kullanıcılar listeleniyor...');
    console.log('👤 User info:', req.user);

    const users = await User.find({})
      .select('-password') // Şifreyi hariç tut
      .sort({ createdAt: -1 }); // En yeni önce

    console.log(`📋 ${users.length} kullanıcı bulundu`);
    res.json(users);

  } catch (error) {
    console.error('❌ Kullanıcı listeleme hatası:', error);
    res.status(500).json({ message: 'Kullanıcılar yüklenirken hata oluştu' });
  }
});

// Kullanıcı rolünü değiştir (sadece admin)
router.put('/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    console.log('🔄 Kullanıcı rolü değiştiriliyor:', id, role);

    // Geçerli roller kontrolü
    const validRoles = ['user', 'organizer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Geçersiz rol' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    console.log('✅ Kullanıcı rolü değiştirildi:', user.email, role);
    res.json({
      message: 'Kullanıcı rolü başarıyla değiştirildi',
      user
    });

  } catch (error) {
    console.error('❌ Rol değiştirme hatası:', error);
    res.status(500).json({ message: 'Rol değiştirilirken hata oluştu' });
  }
});

// Kullanıcı durumunu değiştir (sadece admin)
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('🔄 Kullanıcı durumu değiştiriliyor:', id, status);

    // Geçerli durumlar kontrolü
    const validStatuses = ['active', 'inactive', 'banned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Geçersiz durum' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    console.log('✅ Kullanıcı durumu değiştirildi:', user.email, status);
    res.json({
      message: 'Kullanıcı durumu başarıyla değiştirildi',
      user
    });

  } catch (error) {
    console.error('❌ Durum değiştirme hatası:', error);
    res.status(500).json({ message: 'Durum değiştirilirken hata oluştu' });
  }
});

// Kullanıcıyı sil (sadece admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Kullanıcı siliniyor:', id);

    // Kendisini silmeye çalışıyorsa engelle
    if (req.user.userId === id) {
      return res.status(400).json({ message: 'Kendinizi silemezsiniz' });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    console.log('✅ Kullanıcı silindi:', user.email);
    res.json({
      message: 'Kullanıcı başarıyla silindi',
      user: { email: user.email, name: user.name }
    });

  } catch (error) {
    console.error('❌ Kullanıcı silme hatası:', error);
    res.status(500).json({ message: 'Kullanıcı silinirken hata oluştu' });
  }
});

module.exports = router;