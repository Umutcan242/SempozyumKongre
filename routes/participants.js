const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Participant = require('../models/Participant');
const Event = require('../models/Event');
const { sendEventRegistrationEmail } = require('../utils/emailService');
const { authenticateToken } = require('../middleware/auth');

// Tüm katılımcıları getir
router.get('/', async (req, res) => {
  try {
    const { eventId, status, paymentStatus, page = 1, limit = 10 } = req.query;
    const query = {};

    if (eventId) query.eventId = eventId;
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const participants = await Participant.find(query)
      .populate('eventId', 'title date location')
      .sort({ registrationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Participant.countDocuments(query);

    res.json({
      participants,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Katılımcılar getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Oturum açan kullanıcının katılımlarını getir
router.get('/my-participations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    const participations = await Participant.find({ userId: userId })
      .populate('eventId', 'title date location capacity organizer description')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Kullanıcının katılımları listelendi',
      participations: participations
    });
  } catch (error) {
    console.error('Katılımlar getirilirken hata:', error);
    res.status(500).json({ message: 'Katılımlar yüklenemedi' });
  }
});

// Tek katılımcı getir
router.get('/:id', async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id)
      .populate('eventId', 'title date location fee');

    if (!participant) {
      return res.status(404).json({ message: 'Katılımcı bulunamadı' });
    }

    res.json(participant);
  } catch (error) {
    console.error('Katılımcı getirilirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni katılımcı kaydı (genel iletişim formu)
router.post('/', [
  body('fullName').notEmpty().withMessage('Ad soyad gerekli'),
  body('email').isEmail().withMessage('Geçerli e-posta adresi girin'),
  body('phone').notEmpty().withMessage('Telefon numarası gerekli')
  // eventId artık zorunlu değil
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validasyon hatası',
        errors: errors.array() 
      });
    }

    let event = null;
    
    // Oturum açan kullanıcının ID'sini al
    const userId = req.user.id || req.user.userId;
    
    // Eğer eventId varsa etkinlik kontrolü yap
    if (req.body.eventId) {
      event = await Event.findById(req.body.eventId);
      if (!event) {
        return res.status(404).json({ message: 'Etkinlik bulunamadı' });
      }

      // Etkinlik durumu kontrolü
      if (event.status !== 'aktif') {
        return res.status(400).json({ 
          message: 'Bu etkinlik için kayıt alınmıyor' 
        });
      }

      // Kapasite kontrolü
      const currentParticipants = await Participant.countDocuments({ 
        eventId: req.body.eventId,
        status: { $in: ['beklemede', 'onaylandı'] }
      });

      if (currentParticipants >= event.capacity) {
        return res.status(400).json({ 
          message: 'Etkinlik kapasitesi dolu' 
        });
      }

      // Kayıt son tarihi kontrolü
      if (event.registrationDeadline && new Date() > event.registrationDeadline) {
        return res.status(400).json({ 
          message: 'Kayıt son tarihi geçmiş' 
        });
      }

      // Çift kayıt kontrolü (sadece eventId varsa) - aynı kullanıcının aynı etkinliğe iki kez kayıt olmasını önle
      const existingParticipant = await Participant.findOne({
        email: req.body.email,
        eventId: req.body.eventId,
        userId: userId
      });

      if (existingParticipant) {
        return res.status(400).json({ 
          message: 'Bu e-posta ile zaten kayıt yapılmış' 
        });
      }
    } else {
      // EventId yoksa genel e-posta kontrolü
      const existingParticipant = await Participant.findOne({
        email: req.body.email,
        eventId: { $exists: false }
      });

      if (existingParticipant) {
        return res.status(400).json({ 
          message: 'Bu e-posta ile zaten iletişim kurulmuş' 
        });
      }
    }

    const participant = new Participant({
      ...req.body,
      userId: userId
    });
    await participant.save();

    // Etkinliğin participants listesini güncelle (sadece eventId varsa)
    if (req.body.eventId) {
      await Event.findByIdAndUpdate(req.body.eventId, {
        $push: { participants: participant._id }
      });
    }

    // Populate edilmiş veriyi döndür
    const populatedParticipant = await Participant.findById(participant._id)
      .populate('eventId', 'title date location fee category description');

    // Email gönderme işlemi (arka planda, kullanıcıyı bekletmeden)
    if (req.body.eventId && populatedParticipant.eventId) {
      try {
        await sendEventRegistrationEmail(
          participant.email,
          populatedParticipant.eventId,
          {
            fullName: participant.fullName,
            email: participant.email,
            phone: participant.phone,
            organization: participant.organization
          }
        );
        console.log('✅ Etkinlik kayıt emaili gönderildi:', participant.email);
      } catch (emailError) {
        console.error('❌ Etkinlik kayıt emaili gönderilemedi:', emailError);
        // Email hatası kullanıcı deneyimini etkilemesin
      }
    }

    res.status(201).json({
      message: 'Kayıt başarılı! Onay e-postanızı kontrol edin.',
      participant: populatedParticipant
    });
  } catch (error) {
    console.error('Katılımcı kaydedilirken hata:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validasyon hatası',
        errors: validationErrors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Bu e-posta ile zaten kayıt yapılmış'
      });
    }

    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Katılımcı güncelle
router.put('/:id', [
  body('fullName').optional().notEmpty().withMessage('Ad soyad boş olamaz'),
  body('email').optional().isEmail().withMessage('Geçerli e-posta adresi girin'),
  body('phone').optional().notEmpty().withMessage('Telefon numarası boş olamaz')
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
      const currentParticipant = await Participant.findById(req.params.id);
      if (currentParticipant) {
        const existingParticipant = await Participant.findOne({
          email: req.body.email,
          eventId: currentParticipant.eventId,
          _id: { $ne: req.params.id }
        });
        
        if (existingParticipant) {
          return res.status(400).json({ 
            message: 'Bu e-posta ile zaten kayıt var' 
          });
        }
      }
    }

    const participant = await Participant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('eventId', 'title date location fee');

    if (!participant) {
      return res.status(404).json({ message: 'Katılımcı bulunamadı' });
    }

    res.json({
      message: 'Katılımcı başarıyla güncellendi',
      participant
    });
  } catch (error) {
    console.error('Katılımcı güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Katılımcı sil
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);
    
    if (!participant) {
      return res.status(404).json({ message: 'Katılımcı bulunamadı' });
    }

    // Kullanıcının kendi katılımını silip silemeyeceğini kontrol et
    const userId = req.user.id || req.user.userId;
    if (participant.userId && participant.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Bu katılımı silemezsiniz' });
    }

    // Etkinlikten katılımcıyı çıkar
    if (participant.eventId) {
      await Event.findByIdAndUpdate(participant.eventId, {
        $pull: { participants: participant._id }
      });
    }

    await Participant.findByIdAndDelete(req.params.id);

    res.json({ message: 'Katılım başarıyla iptal edildi' });
  } catch (error) {
    console.error('Katılımcı silinirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Katılımcı durumunu güncelle
router.patch('/:id/status', [
  body('status').isIn(['beklemede', 'onaylandı', 'iptal'])
    .withMessage('Geçerli durum değeri girin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validasyon hatası',
        errors: errors.array() 
      });
    }

    const participant = await Participant.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('eventId', 'title date location');

    if (!participant) {
      return res.status(404).json({ message: 'Katılımcı bulunamadı' });
    }

    res.json({
      message: 'Katılımcı durumu güncellendi',
      participant
    });
  } catch (error) {
    console.error('Durum güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Ödeme durumunu güncelle
router.patch('/:id/payment', [
  body('paymentStatus').isIn(['beklemede', 'odendi', 'iptal'])
    .withMessage('Geçerli ödeme durumu değeri girin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validasyon hatası',
        errors: errors.array() 
      });
    }

    const participant = await Participant.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: req.body.paymentStatus },
      { new: true }
    ).populate('eventId', 'title date location fee');

    if (!participant) {
      return res.status(404).json({ message: 'Katılımcı bulunamadı' });
    }

    res.json({
      message: 'Ödeme durumu güncellendi',
      participant
    });
  } catch (error) {
    console.error('Ödeme durumu güncellenirken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Etkinlik katılımcıları raporu
router.get('/report/:eventId', async (req, res) => {
  try {
    const participants = await Participant.find({ eventId: req.params.eventId })
      .populate('eventId', 'title date location capacity fee')
      .sort({ registrationDate: -1 });

    const stats = {
      totalRegistrations: participants.length,
      confirmedParticipants: participants.filter(p => p.status === 'onaylandı').length,
      pendingParticipants: participants.filter(p => p.status === 'beklemede').length,
      cancelledParticipants: participants.filter(p => p.status === 'iptal').length,
      paidParticipants: participants.filter(p => p.paymentStatus === 'odendi').length,
      pendingPayments: participants.filter(p => p.paymentStatus === 'beklemede').length
    };

    res.json({
      participants,
      statistics: stats
    });
  } catch (error) {
    console.error('Rapor oluşturulurken hata:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;