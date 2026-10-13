const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB bağlantısı
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sempozyumkongre';
mongoose.connect(MONGODB_URI)
.then(() => console.log('MongoDB bağlantısı başarılı:', MONGODB_URI))
.catch(err => {
  console.error('MongoDB bağlantı hatası:', err.message);
  console.log('Yerel MongoDB kullanmayı deneyin: mongodb://localhost:27017/sempozyumkongre');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/speakers', require('./routes/speakers'));
app.use('/api/participants', require('./routes/participants'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/users', require('./routes/users'));
app.use('/api/email', require('./routes/email'));

// Ana sayfa route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Sayfa bulunamadı' });
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});

module.exports = app;