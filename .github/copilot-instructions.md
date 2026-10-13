# GitHub Copilot Instructions

## Project Overview
Bu bir Node.js tabanlı sempozyum/kongre yönetim sistemidir. Express.js backend, HTML/CSS/JS frontend ve MongoDB veritabanı kullanır. Etkinlik yönetimi, konuşmacı atama ve katılımcı kayıt işlemlerini destekler.

## Architecture & Components

### Backend Structure
- **`server.js`** - Express server, middleware ve route bağlantıları
- **`models/`** - Mongoose şemaları: Event, Speaker, Participant, User
- **`routes/`** - API endpoints: auth, events, speakers, participants
- **MongoDB** - Ana veritabanı, Mongoose ODM ile bağlantı

### Frontend Structure
- **`public/index.html`** - Single-page application ana dosyası
- **`public/css/style.css`** - Responsive design, mobile-first CSS
- **`public/js/main.js`** - Vanilla JavaScript, API çağrıları ve DOM işlemleri

### Data Models
- **Event**: Etkinlik yönetimi, speakers ve participants ile ilişkili
- **Participant**: Kayıt sistemi, event ile bağlantılı, çift kayıt önleme
- **Speaker**: Konuşmacı profilleri, birden fazla etkinliğe atanabilir
- **User**: Kimlik doğrulama, JWT tabanlı auth sistemi

## Development Patterns

### API Design
```javascript
// Tutarlı error handling
res.status(400).json({ message: 'Hata mesajı', errors: [...] })

// Mongoose populate kullanımı
.populate('eventId', 'title date location')
.populate('speakers', 'name title organization')
```

### Frontend API Calls
```javascript
// Base URL pattern
const API_BASE_URL = '/api';
const response = await fetch(`${API_BASE_URL}/events`);
```

### Validation Pattern
```javascript
// express-validator ile input doğrulama
[
  body('email').isEmail().withMessage('Geçerli e-posta girin'),
  body('title').notEmpty().withMessage('Başlık gerekli')
]
```

## Quick Start
```bash
# Kurulum
npm install

# Geliştirme (nodemon ile)
npm run dev

# Production
npm start

# MongoDB bağlantısı gerekli (varsayılan: localhost:27017/sempozyumkongre)
```

## Key Development Notes

### Business Logic
- Etkinlik kapasitesi kontrolü: `Event.virtual('availableSpots')`
- Çift kayıt önleme: Email+EventId composite index
- Konuşmacı-Etkinlik ilişkisi: İki yönlü referans güncelleme

### Authentication
- JWT tabanlı auth (`routes/auth.js`)
- Middleware: `authenticateToken` function
- Role-based access: admin, organizer, user

### Error Handling
- Mongoose validation errors yakalanır ve user-friendly mesajlara çevrilir
- Duplicate key errors (11000) özel olarak handle edilir
- Frontend'de `showMessage(text, type)` ile user feedback

### Database Relations
- Event ↔ Speaker: Many-to-many (referans array)
- Event ↔ Participant: One-to-many 
- Cascade operations manuel olarak handle edilir

## Environment Variables
`.env` dosyasında: `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRE`, email config