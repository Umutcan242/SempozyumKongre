const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function createTestUsers() {
    try {
        // MongoDB'ye bağlan
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sempozyumkongre');
        console.log('✅ MongoDB bağlantısı başarılı');

        // Test kullanıcılarını tanımla
        const testUsers = [
            {
                username: 'testuser1',
                email: 'testuser1@gmail.com',
                password: '123456',
                role: 'user',
                fullName: 'Test Kullanıcı 1',
                phone: '+90 555 123 4567',
                organization: 'Test Üniversitesi'
            },
            {
                username: 'testuser2',
                email: 'testuser2@gmail.com',
                password: '123456',
                role: 'user',
                fullName: 'Test Kullanıcı 2',
                phone: '+90 555 234 5678',
                organization: 'Test Enstitüsü'
            },
            {
                username: 'organizer1',
                email: 'organizer1@gmail.com',
                password: '123456',
                role: 'organizer',
                fullName: 'Organizatör 1',
                phone: '+90 555 345 6789',
                organization: 'Etkinlik Organizasyonu A.Ş.'
            },
            {
                username: 'admin2',
                email: 'admin2@gmail.com',
                password: '123456',
                role: 'admin',
                fullName: 'Admin 2',
                phone: '+90 555 456 7890',
                organization: 'Sistem Yönetimi'
            }
        ];

        let createdCount = 0;
        let existingCount = 0;

        for (const userData of testUsers) {
            const existing = await User.findOne({ 
                $or: [
                    { email: userData.email },
                    { username: userData.username }
                ]
            });

            if (existing) {
                console.log(`⏭️  ${userData.email} zaten mevcut`);
                existingCount++;
            } else {
                const user = new User(userData);
                await user.save();
                console.log(`✅ ${userData.email} oluşturuldu - Rol: ${userData.role}`);
                createdCount++;
            }
        }

        console.log(`\n📊 Sonuç: ${createdCount} yeni kullanıcı oluşturuldu, ${existingCount} zaten mevcuttu`);

    } catch (error) {
        console.error('❌ Hata:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB bağlantısı kapatıldı');
    }
}

createTestUsers();
