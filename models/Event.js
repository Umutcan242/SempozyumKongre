const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Etkinlik başlığı gerekli'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Etkinlik açıklaması gerekli'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Etkinlik tarihi gerekli']
  },
  endDate: {
    type: Date
  },
  location: {
    type: String,
    required: [true, 'Etkinlik konumu gerekli'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Kapasite bilgisi gerekli'],
    min: 1
  },
  fee: {
    type: Number,
    default: 0,
    min: 0
  },
  category: {
    type: String,
    enum: ['sempozyum', 'kongre', 'workshop', 'panel', 'konferans'],
    default: 'sempozyum'
  },
  status: {
    type: String,
    enum: ['aktif', 'iptal', 'tamamlandi'],
    default: 'aktif'
  },
  organizer: {
    type: String,
    required: true
  },
  speakers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Speaker'
  }],
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  }],
  registrationDeadline: {
    type: Date
  },
  tags: [String],
  image: String
}, {
  timestamps: true
});

// Etkinlik kapasitesi kontrolü
eventSchema.virtual('availableSpots').get(function() {
  return this.capacity - this.participants.length;
});

eventSchema.virtual('isFull').get(function() {
  return this.participants.length >= this.capacity;
});

module.exports = mongoose.model('Event', eventSchema);