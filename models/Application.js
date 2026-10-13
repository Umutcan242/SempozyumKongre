const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationType: {
    type: String,
    enum: ['makale', 'bildiri', 'poster'],
    required: [true, 'Başvuru türü gerekli']
  },
  speakerName: {
    type: String,
    required: [true, 'Konuşmacı adı gerekli'],
    trim: true
  },
  speakerTitle: {
    type: String,
    trim: true
  },
  speakerOrganization: {
    type: String,
    required: [true, 'Konuşmacı kurumu gerekli'],
    trim: true
  },
  presentationTitle: {
    type: String,
    required: [true, 'Sunum başlığı gerekli'],
    trim: true
  },
  presentationSummary: {
    type: String,
    required: [true, 'Sunum özeti gerekli']
  },
  requestedDate: {
    type: Date,
    required: [true, 'İstenilen tarih gerekli']
  },
  requestedTime: {
    type: String,
    required: [true, 'İstenilen saat gerekli'],
    enum: ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']
  },
  duration: {
    type: Number,
    required: [true, 'Sunum süresi gerekli'],
    enum: [15, 30, 45, 60]
  },
  additionalNotes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'reviewed'],
    default: 'pending'
  },
  reviewNotes: {
    type: String
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }
}, {
  timestamps: true
});

// İndeksler
applicationSchema.index({ userId: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ requestedDate: 1, requestedTime: 1 });
applicationSchema.index({ createdAt: -1 });

// Sanal alanlar
applicationSchema.virtual('statusText').get(function() {
  const statusMap = {
    'pending': 'Beklemede',
    'approved': 'Onaylandı',
    'rejected': 'Reddedildi',
    'reviewed': 'İncelendi'
  };
  return statusMap[this.status] || this.status;
});

applicationSchema.virtual('typeText').get(function() {
  const typeMap = {
    'makale': 'Makale Sunumu',
    'bildiri': 'Bildiri Sunumu',
    'poster': 'Poster Sunumu'
  };
  return typeMap[this.applicationType] || this.applicationType;
});

// JSON çıktısında sanal alanları dahil et
applicationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Application', applicationSchema);