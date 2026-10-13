const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Application = require('../models/Application');
const { authenticateToken } = require('../middleware/auth');

// Tüm başvuruları getir (Admin için)
router.get('/', async (req, res) => {
  try {
    // Tüm başvuruları göster
    const applications = await Application.find({})
      .populate('userId', 'username email')
      .populate('eventId', 'title date')
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Başvurular listelendi',
      applications
    });
  } catch (error) {
    console.error('Başvuru listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Oturum açan kullanıcının başvurularını getir
router.get('/my-applications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const applications = await Application.find({ userId })
      .populate('eventId', 'title date location')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Kullanıcının başvuruları listelendi',
      applications
    });
  } catch (error) {
    console.error('Başvuru listeleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tek başvuru detayını getir (Admin için)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const application = await Application.findById(id)
      .populate('userId', 'username email')
      .populate('eventId', 'title date')
      .populate('reviewedBy', 'username');

    if (!application) {
      return res.status(404).json({ message: 'Başvuru bulunamadı' });
    }

    res.json(application);
  } catch (error) {
    console.error('Başvuru detay hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni başvuru oluştur
router.post('/', [
  body('applicationType').isIn(['makale', 'bildiri', 'poster']).withMessage('Geçerli başvuru türü seçin'),
  body('speakerName').trim().isLength({ min: 2, max: 100 }).withMessage('Konuşmacı adı 2-100 karakter olmalı'),
  body('speakerOrganization').trim().isLength({ min: 2, max: 200 }).withMessage('Kurum adı 2-200 karakter olmalı'),
  body('presentationTitle').trim().isLength({ min: 5, max: 200 }).withMessage('Sunum başlığı 5-200 karakter olmalı'),
  body('presentationSummary').trim().isLength({ min: 1, max: 2000 }).withMessage('Sunum özeti en az 1 karakter olmalı'),
  body('requestedDate').isISO8601().toDate().withMessage('Geçerli tarih girin'),
  body('requestedTime').isIn(['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']).withMessage('Geçerli saat seçin'),
  body('duration').isInt({ min: 15, max: 60 }).withMessage('Geçerli süre seçin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validasyon hatası',
        errors: errors.array()
      });
    }

    const {
      applicationType,
      speakerName,
      speakerTitle,
      speakerOrganization,
      presentationTitle,
      presentationSummary,
      requestedDate,
      requestedTime,
      duration,
      additionalNotes
    } = req.body;

    // İstenilen tarih geçmiş tarih olmasın
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reqDate = new Date(requestedDate);
    
    if (reqDate < today) {
      return res.status(400).json({
        message: 'İstenilen tarih bugünden eski olamaz'
      });
    }

    // Aynı tarih ve saatte başka başvuru var mı kontrol et
    const existingApplication = await Application.findOne({
      requestedDate: reqDate,
      requestedTime,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingApplication) {
      return res.status(400).json({
        message: 'Bu tarih ve saatte başka bir başvuru bulunmaktadır'
      });
    }

    const application = new Application({
      userId: req.user.userId,
      applicationType,
      speakerName,
      speakerTitle,
      speakerOrganization,
      presentationTitle,
      presentationSummary,
      requestedDate: reqDate,
      requestedTime,
      duration: parseInt(duration),
      additionalNotes
    });

    await application.save();
    await application.populate('userId', 'username email');

    res.status(201).json({
      message: 'Başvuru başarıyla gönderildi',
      application
    });

  } catch (error) {
    console.error('Başvuru oluşturma hatası:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validasyon hatası',
        errors: validationErrors
      });
    }

    res.status(500).json({ message: 'Başvuru gönderilirken hata oluştu' });
  }
});

// Başvuru durumunu güncelle (Admin için)
router.patch('/:id', [
  body('status').isIn(['pending', 'sent_to_referee', 'rejected']).withMessage('Geçerli durum seçin')
], async (req, res) => {
  try {
    // Admin kontrolünü kaldırdık - herkes güncelleyebilir

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validasyon hatası',
        errors: errors.array()
      });
    }

    const { status, reviewNotes } = req.body;

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewNotes,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'username email');

    if (!application) {
      return res.status(404).json({ message: 'Başvuru bulunamadı' });
    }

    res.json({
      message: 'Başvuru durumu güncellendi',
      application
    });

  } catch (error) {
    console.error('Başvuru güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Başvuru sil
router.delete('/:id', async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Başvuru bulunamadı' });
    }

    // Yetki kontrolünü kaldırdık - herkes silebilir

    // Sadece beklemede olan başvurular silinebilir
    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Sadece beklemede olan başvurular silinebilir' });
    }

    await Application.findByIdAndDelete(req.params.id);

    res.json({ message: 'Başvuru silindi' });

  } catch (error) {
    console.error('Başvuru silme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;