const mongoose = require('mongoose');

const speakerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Konuşmacı adı gerekli'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'E-posta adresi gerekli'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Geçerli e-posta adresi girin']
  },
  phone: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Unvan gerekli'],
    trim: true
  },
  organization: {
    type: String,
    required: [true, 'Kurum bilgisi gerekli'],
    trim: true
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  expertise: [String],
  socialMedia: {
    linkedin: String,
    twitter: String,
    website: String
  },
  photo: String,
  events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  status: {
    type: String,
    enum: ['aktif', 'pasif'],
    default: 'aktif'
  }
}, {
  timestamps: true
});

// E-posta doğrulama middleware
speakerSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

module.exports = mongoose.model('Speaker', speakerSchema);