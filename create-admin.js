const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB bağlandı'))
.catch(err => console.error('Bağlantı hatası:', err));

// User modelini import et
const User = require('./models/User');

// Admin kullanıcı oluştur
async function createAdminUser() {
  try {
    // Mevcut admin var mı kontrol et
    const existingAdmin = await User.findOne({ email: 'admin@sempozyum.com' });
    
    if (existingAdmin) {
      console.log('Admin kullanıcısı zaten mevcut');
      console.log(`Email: admin@sempozyum.com`);
      console.log(`Şifre: admin123`);
      return;
    }

    // Yeni admin kullanıcı oluştur
    const adminUser = new User({
      username: 'admin',
      email: 'admin@sempozyum.com',
      password: 'admin123',
      role: 'admin',
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        organization: 'Sempozyum Yönetimi'
      }
    });

    await adminUser.save();
    
    console.log('✅ Admin kullanıcısı başarıyla oluşturuldu!');
    console.log('📧 Email: admin@sempozyum.com');
    console.log('🔑 Şifre: admin123');
    console.log('👨‍💼 Rol: admin');
    console.log('');
    console.log('Bu bilgilerle giriş yaparak Admin Panel\'e erişebilirsiniz.');

  } catch (error) {
    console.error('Admin kullanıcı oluşturulurken hata:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Script'i çalıştır
createAdminUser();