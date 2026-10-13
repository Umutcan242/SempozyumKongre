const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Announcement = require('../models/Announcement');

// Tüm duyuruları getir
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find({})
      .populate('createdBy', 'username email')
      .sort({ 
        priority: -1,           // Önce öncelik (urgent > high > normal)
        date: -1,              // Sonra duyuru tarihi (yeni > eski)  
        createdAt: -1          // Son olarak oluşturulma tarihi
      }); // Öncelik ve tarihe göre sırala

    res.json(announcements); // Sadece array döndür
  } catch (error) {
    console.error('Duyuru listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Aktif duyuruları getir (Ana sayfa için)
router.get('/active', async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .populate('createdBy', 'username email')
      .sort({ 
        priority: -1,           // Önce öncelik (urgent > high > normal)
        date: -1,              // Sonra duyuru tarihi (yeni > eski)
        createdAt: -1          // Son olarak oluşturulma tarihi
      })
      .limit(5); // Son 5 aktif duyuru

    res.json(announcements); // Sadece array döndür, wrapper yok

  } catch (error) {
    console.error('Aktif duyuru listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tek duyuru getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const announcement = await Announcement.findById(id)
      .populate('createdBy', 'username email');

    if (!announcement) {
      return res.status(404).json({ message: 'Duyuru bulunamadı' });
    }

    res.json(announcement);
  } catch (error) {
    console.error('Duyuru detay hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni duyuru oluştur
router.post('/', [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Başlık 3-200 karakter olmalı'),
  body('content').trim().isLength({ min: 5, max: 2000 }).withMessage('İçerik 5-2000 karakter olmalı'),
  body('type').isIn(['info', 'warning', 'success', 'event']).withMessage('Geçerli tür seçin'),
  body('priority').isIn(['normal', 'high', 'urgent']).withMessage('Geçerli öncelik seçin'),
  body('date').optional().isISO8601().withMessage('Geçerli tarih formatı girin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validasyon hataları:', errors.array());
      return res.status(400).json({
        message: 'Validasyon hatası',
        errors: errors.array()
      });
    }

    const { title, content, type, priority, date } = req.body;
    console.log('Gelen veriler:', { title, content, type, priority, date });

    const announcementData = {
      title,
      content,
      type,
      priority,
      // createdBy alanını şimdilik boş bırakıyoruz (auth olmadığı için)
    };

    // Eğer tarih verilmişse ekle
    if (date) {
      announcementData.date = new Date(date);
    }

    console.log('Kaydedilecek veri:', announcementData);

    const announcement = new Announcement(announcementData);

    await announcement.save();

    console.log('Duyuru başarıyla kaydedildi:', announcement._id);

    res.status(201).json({
      message: 'Duyuru başarıyla oluşturuldu',
      announcement
    });

  } catch (error) {
    console.error('Duyuru oluşturma hatası:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.log('Mongoose validasyon hataları:', validationErrors);
      return res.status(400).json({
        message: 'Mongoose validasyon hatası',
        errors: validationErrors
      });
    }

    res.status(500).json({ message: 'Duyuru oluşturulurken hata oluştu', error: error.message });
  }
});

// Duyuru güncelle
router.patch('/:id', [
  body('title').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Başlık 5-200 karakter olmalı'),
  body('content').optional().trim().isLength({ min: 10, max: 2000 }).withMessage('İçerik 10-2000 karakter olmalı'),
  body('type').optional().isIn(['info', 'warning', 'success', 'event']).withMessage('Geçerli tür seçin'),
  body('priority').optional().isIn(['normal', 'high', 'urgent']).withMessage('Geçerli öncelik seçin'),
  body('isActive').optional().isBoolean().withMessage('Durum boolean olmalı')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validasyon hatası',
        errors: errors.array()
      });
    }

    const updateData = req.body;
    updateData.updatedAt = new Date();

    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('createdBy', 'username email');

    if (!announcement) {
      return res.status(404).json({ message: 'Duyuru bulunamadı' });
    }

    res.json({
      message: 'Duyuru güncellendi',
      announcement
    });

  } catch (error) {
    console.error('Duyuru güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Duyuru sil
router.delete('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Duyuru bulunamadı' });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.json({ message: 'Duyuru silindi' });

  } catch (error) {
    console.error('Duyuru silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;