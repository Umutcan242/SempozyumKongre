const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createAdmin() {
    try {
        // MongoDB'ye bağlan
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sempozyumkongre');
        console.log('MongoDB bağlantısı başarılı');

        // Admin kullanıcı verilerini tanımla
        const adminData = {
            username: 'umutcanadmin',
            email: 'umutcanadmin@gmail.com',
            password: '123456',
            role: 'admin',
            profile: {
                firstName: 'Umutcan',
                lastName: 'Admin'
            }
        };

        // Mevcut admin var mı kontrol et
        const existingAdmin = await User.findOne({ 
            $or: [
                { email: adminData.email },
                { username: adminData.username }
            ]
        });

        if (existingAdmin) {
            console.log('Admin kullanıcı zaten mevcut:');
            console.log('- Kullanıcı adı:', existingAdmin.username);
            console.log('- E-posta:', existingAdmin.email);
            console.log('- Rol:', existingAdmin.role);
        } else {
            // Admin kullanıcı oluştur
            const admin = new User(adminData);
            await admin.save();

            console.log('Admin kullanıcı başarıyla oluşturuldu!');
            console.log('- Kullanıcı adı:', adminData.username);
            console.log('- E-posta:', adminData.email);
            console.log('- Şifre:', adminData.password);
            console.log('- Rol:', adminData.role);
        }

    } catch (error) {
        console.error('Admin oluşturma hatası:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB bağlantısı kapatıldı');
    }
}

// Script'i çalıştır
createAdmin();