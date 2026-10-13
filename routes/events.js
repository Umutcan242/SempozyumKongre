const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');

// Tüm etkinlikleri getir
router.get('/', async (req, res) => {
  try {
    const { category, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;

    const events = await Event.find(query)
      .populate('speakers', 'name title organization')
      .sort({ date: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Etkinlikler getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tek etkinlik getir
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('speakers', 'name title organization bio')
      .populate('participants', 'fullName email organization');

    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }

    res.json(event);
  } catch (error) {
    console.error('Etkinlik getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni etkinlik oluştur
router.post('/', [
  body('title').notEmpty().withMessage('Başlık gerekli'),
  body('description').notEmpty().withMessage('Açıklama gerekli'),
  body('date').isISO8601().withMessage('Geçerli tarih girin'),
  body('location').notEmpty().withMessage('Konum gerekli'),
  body('capacity').isInt({ min: 1 }).withMessage('Geçerli kapasite girin'),
  body('organizer').notEmpty().withMessage('Organizatör gerekli')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validasyon hatası',
        errors: errors.array() 
      });
    }

    const event = new Event(req.body);
    await event.save();

    res.status(201).json({
      message: 'Etkinlik başarıyla oluşturuldu',
      event
    });
  } catch (error) {
    console.error('Etkinlik oluşturulurken hata:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validasyon hatası',
        errors: validationErrors
      });
    }

    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Etkinlik güncelle
router.put('/:id', [
  body('title').optional().notEmpty().withMessage('Başlık boş olamaz'),
  body('description').optional().notEmpty().withMessage('Açıklama boş olamaz'),
  body('date').optional().isISO8601().withMessage('Geçerli tarih girin'),
  body('location').optional().notEmpty().withMessage('Konum boş olamaz'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Geçerli kapasite girin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validasyon hatası',
        errors: errors.array() 
      });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('speakers', 'name title organization');

    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }

    res.json({
      message: 'Etkinlik başarıyla güncellendi',
      event
    });
  } catch (error) {
    console.error('Etkinlik güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Etkinlik sil
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }

    res.json({ message: 'Etkinlik başarıyla silindi' });
  } catch (error) {
    console.error('Etkinlik silinirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Etkinlik istatistikleri
router.get('/:id/stats', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('participants', 'status paymentStatus attendanceStatus');

    if (!event) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı' });
    }

    const stats = {
      totalRegistrations: event.participants.length,
      availableSpots: event.capacity - event.participants.length,
      occupancyRate: ((event.participants.length / event.capacity) * 100).toFixed(2),
      confirmedParticipants: event.participants.filter(p => p.status === 'onaylandı').length,
      paidParticipants: event.participants.filter(p => p.paymentStatus === 'odendi').length,
      attendedParticipants: event.participants.filter(p => p.attendanceStatus === 'katıldı').length
    };

    res.json(stats);
  } catch (error) {
    console.error('İstatistikler getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;