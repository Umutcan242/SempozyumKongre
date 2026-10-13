const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Speaker = require('../models/Speaker');

// Tüm konuşmacıları getir
router.get('/', async (req, res) => {
  try {
    const { status, organization, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (organization) query.organization = new RegExp(organization, 'i');

    const speakers = await Speaker.find(query)
      .populate('events', 'title date')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Speaker.countDocuments(query);

    res.json({
      speakers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Konuşmacılar getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tek konuşmacı getir
router.get('/:id', async (req, res) => {
  try {
    const speaker = await Speaker.findById(req.params.id)
      .populate('events', 'title date location');

    if (!speaker) {
      return res.status(404).json({ message: 'Konuşmacı bulunamadı' });
    }

    res.json(speaker);
  } catch (error) {
    console.error('Konuşmacı getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni konuşmacı oluştur
router.post('/', [
  body('name').notEmpty().withMessage('Ad gerekli'),
  body('email').isEmail().withMessage('Geçerli e-posta adresi girin'),
  body('title').notEmpty().withMessage('Unvan gerekli'),
  body('organization').notEmpty().withMessage('Kurum gerekli')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validasyon hatası',
        errors: errors.array() 
      });
    }

    // E-posta kontrolü
    const existingSpeaker = await Speaker.findOne({ email: req.body.email });
    if (existingSpeaker) {
      return res.status(400).json({ 
        message: 'Bu e-posta adresi zaten kayıtlı' 
      });
    }

    const speaker = new Speaker(req.body);
    await speaker.save();

    res.status(201).json({
      message: 'Konuşmacı başarıyla oluşturuldu',
      speaker
    });
  } catch (error) {
    console.error('Konuşmacı oluşturulurken hata:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validasyon hatası',
        errors: validationErrors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Bu e-posta adresi zaten kayıtlı'
      });
    }

    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Konuşmacı güncelle
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Ad boş olamaz'),
  body('email').optional().isEmail().withMessage('Geçerli e-posta adresi girin'),
  body('title').optional().notEmpty().withMessage('Unvan boş olamaz'),
  body('organization').optional().notEmpty().withMessage('Kurum boş olamaz')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validasyon hatası',
        errors: errors.array() 
      });
    }

    // E-posta değişikliği kontrolü
    if (req.body.email) {
      const existingSpeaker = await Speaker.findOne({ 
        email: req.body.email,
        _id: { $ne: req.params.id }
      });
      if (existingSpeaker) {
        return res.status(400).json({ 
          message: 'Bu e-posta adresi zaten kullanılıyor' 
        });
      }
    }

    const speaker = await Speaker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('events', 'title date');

    if (!speaker) {
      return res.status(404).json({ message: 'Konuşmacı bulunamadı' });
    }

    res.json({
      message: 'Konuşmacı başarıyla güncellendi',
      speaker
    });
  } catch (error) {
    console.error('Konuşmacı güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Konuşmacı sil
router.delete('/:id', async (req, res) => {
  try {
    const speaker = await Speaker.findByIdAndDelete(req.params.id);

    if (!speaker) {
      return res.status(404).json({ message: 'Konuşmacı bulunamadı' });
    }

    res.json({ message: 'Konuşmacı başarıyla silindi' });
  } catch (error) {
    console.error('Konuşmacı silinirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Konuşmacıyı etkinliğe ata
router.post('/:speakerId/events/:eventId', async (req, res) => {
  try {
    const { speakerId, eventId } = req.params;

    const speaker = await Speaker.findById(speakerId);
    const Event = require('../models/Event');
    const event = await Event.findById(eventId);

    if (!speaker || !event) {
      return res.status(404).json({ 
        message: 'Konuşmacı veya etkinlik bulunamadı' 
      });
    }

    // Çift atama kontrolü
    if (!speaker.events.includes(eventId)) {
      speaker.events.push(eventId);
      await speaker.save();
    }

    if (!event.speakers.includes(speakerId)) {
      event.speakers.push(speakerId);
      await event.save();
    }

    res.json({ 
      message: 'Konuşmacı etkinliğe başarıyla atandı' 
    });
  } catch (error) {
    console.error('Konuşmacı atanırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Konuşmacıyı etkinlikten çıkar
router.delete('/:speakerId/events/:eventId', async (req, res) => {
  try {
    const { speakerId, eventId } = req.params;

    const speaker = await Speaker.findById(speakerId);
    const Event = require('../models/Event');
    const event = await Event.findById(eventId);

    if (!speaker || !event) {
      return res.status(404).json({ 
        message: 'Konuşmacı veya etkinlik bulunamadı' 
      });
    }

    speaker.events = speaker.events.filter(id => id.toString() !== eventId);
    event.speakers = event.speakers.filter(id => id.toString() !== speakerId);

    await Promise.all([speaker.save(), event.save()]);

    res.json({ 
      message: 'Konuşmacı etkinlikten başarıyla çıkarıldı' 
    });
  } catch (error) {
    console.error('Konuşmacı çıkarılırken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;