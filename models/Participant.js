const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Ad soyad gerekli'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'E-posta adresi gerekli'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Geçerli e-posta adresi girin']
  },
  phone: {
    type: String,
    required: [true, 'Telefon numarası gerekli'],
    trim: true
  },
  organization: {
    type: String,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
    // Artık zorunlu değil - genel iletişim formu için
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['beklemede', 'onaylandı', 'iptal'],
    default: 'beklemede'
  },
  paymentStatus: {
    type: String,
    enum: ['beklemede', 'odendi', 'iptal'],
    default: 'beklemede'
  },
  specialRequirements: {
    type: String,
    maxlength: 500
  },
  certificateRequested: {
    type: Boolean,
    default: false
  },
  attendanceStatus: {
    type: String,
    enum: ['kayıtlı', 'katıldı', 'katılmadı'],
    default: 'kayıtlı'
  }
}, {
  timestamps: true
});

// Composite index - bir kişi aynı etkinliğe birden fazla kayıt olamaz
participantSchema.index({ email: 1, eventId: 1 }, { unique: true });

// Kayıt doğrulama middleware
participantSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

module.exports = mongoose.model('Participant', participantSchema);