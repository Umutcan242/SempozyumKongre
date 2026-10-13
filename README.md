# Sempozyum & Kongre Yönetim Sistemi

Node.js, Express.js ve MongoDB kullanarak geliştirilmiş kapsamlı bir etkinlik yönetim sistemi.

## Özellikler

- 📅 **Etkinlik Yönetimi**: Sempozyum, kongre, workshop organizasyonu
- 👥 **Katılımcı Kaydı**: Online kayıt sistemi ve kapasite kontrolü
- 🎤 **Konuşmacı Yönetimi**: Konuşmacı profilleri ve etkinlik atamaları
- 🔐 **Kullanıcı Kimlik Doğrulama**: JWT tabanlı güvenli giriş sistemi
- 📱 **Responsive Tasarım**: Mobil uyumlu arayüz
- 📊 **Raporlama**: Katılımcı ve etkinlik istatistikleri

## Teknoloji Stack

- **Backend**: Node.js, Express.js
- **Veritabanı**: MongoDB, Mongoose ODM
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Kimlik Doğrulama**: JSON Web Tokens (JWT)
- **Validation**: express-validator

## Kurulum

1. **Repository'yi klonlayın**
   ```bash
   git clone <repository-url>
   cd sempozyumkongre
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   ```

3. **Ortam değişkenlerini ayarlayın**
   ```bash
   cp .env.example .env
   # .env dosyasını düzenleyin
   ```

4. **MongoDB'yi başlatın**
   - MongoDB'nin çalıştığından emin olun (localhost:27017)

5. **Uygulamayı başlatın**
   ```bash
   # Geliştirme modu
   npm run dev
   
   # Production modu
   npm start
   ```

## API Endpoints

### Etkinlikler
- `GET /api/events` - Tüm etkinlikleri listele
- `POST /api/events` - Yeni etkinlik oluştur
- `GET /api/events/:id` - Tek etkinlik detayı
- `PUT /api/events/:id` - Etkinlik güncelle
- `DELETE /api/events/:id` - Etkinlik sil

### Katılımcılar
- `GET /api/participants` - Katılımcıları listele
- `POST /api/participants` - Yeni kayıt oluştur
- `GET /api/participants/:id` - Katılımcı detayı
- `PUT /api/participants/:id` - Katılımcı güncelle
- `DELETE /api/participants/:id` - Kayıt iptal et

### Konuşmacılar
- `GET /api/speakers` - Konuşmacıları listele
- `POST /api/speakers` - Yeni konuşmacı ekle
- `GET /api/speakers/:id` - Konuşmacı detayı
- `PUT /api/speakers/:id` - Konuşmacı güncelle
- `DELETE /api/speakers/:id` - Konuşmacı sil

### Kimlik Doğrulama
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/profile` - Profil bilgisi
- `PUT /api/auth/profile` - Profil güncelle

## Veri Modelleri

### Event (Etkinlik)
```javascript
{
  title: String,
  description: String,
  date: Date,
  location: String,
  capacity: Number,
  fee: Number,
  category: ['sempozyum', 'kongre', 'workshop', 'panel', 'konferans'],
  status: ['aktif', 'iptal', 'tamamlandi'],
  speakers: [ObjectId],
  participants: [ObjectId]
}
```

### Participant (Katılımcı)
```javascript
{
  fullName: String,
  email: String,
  phone: String,
  organization: String,
  eventId: ObjectId,
  status: ['beklemede', 'onaylandı', 'iptal'],
  paymentStatus: ['beklemede', 'odendi', 'iptal']
}
```

## Geliştirme

### Proje Yapısı
```
sempozyumkongre/
├── models/          # Mongoose şemaları
├── routes/          # Express route'ları
├── public/          # Frontend dosyaları
│   ├── css/
│   ├── js/
│   └── index.html
├── .env             # Ortam değişkenleri
├── server.js        # Ana server dosyası
└── package.json
```

### Kod Standartları
- ES6+ JavaScript kullanın
- Async/await pattern'ini tercih edin
- Error handling için try-catch blokları kullanın
- Mongoose populate ile ilişkili verileri getirin
- express-validator ile input doğrulama yapın

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add some amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## İletişim

Sorularınız için issue açabilir veya doğrudan iletişime geçebilirsiniz.