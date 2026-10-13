const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB bağlandı'))
.catch(err => console.error('Bağlantı hatası:', err));

// Event modelini import et
const Event = require('./models/Event');

// Örnek etkinlikler
const sampleEvents = [
  {
    title: "Manuel Sempozyum",
    description: "Script ile eklenen test etkinliği",
    date: new Date("2025-11-20T10:00:00.000Z"),
    location: "Ankara Üniversitesi",
    capacity: 80,
    organizer: "Manual Organizer",
    category: "sempozyum",
    fee: 0
  },
  {
    title: "Teknoloji Konferansı", 
    description: "Geliştiriciler için teknoloji sunumları",
    date: new Date("2025-12-05T09:30:00.000Z"),
    location: "ODTÜ Kültür Merkezi",
    capacity: 300,
    organizer: "Tech Community",
    category: "konferans",
    fee: 75
  }
];

// Toplu ekleme fonksiyonu
async function addEvents() {
  try {
    const result = await Event.insertMany(sampleEvents);
    console.log(`${result.length} etkinlik başarıyla eklendi:`);
    result.forEach(event => {
      console.log(`- ${event.title}`);
    });
  } catch (error) {
    console.error('Ekleme hatası:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Script'i çalıştır
addEvents();