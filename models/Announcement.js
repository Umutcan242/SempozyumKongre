const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'event'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Optional visible/scheduled date for the announcement
  date: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Güncelleme tarihini otomatik ayarla
announcementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // Eğer özel bir tarih verilmemişse createdAt tarihini kullan
  if (!this.date) {
    this.date = this.createdAt || Date.now();
  }
  next();
});

module.exports = mongoose.model('Announcement', announcementSchema);