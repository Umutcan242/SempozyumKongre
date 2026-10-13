const mongoose = require('mongoose');
const Application = require('./models/Application');
const User = require('./models/User');
require('dotenv').config();

async function createTestApplication() {
    try {
        // MongoDB'ye bağlan
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sempozyumkongre');
        console.log('MongoDB bağlantısı başarılı');

        // Test kullanıcısı bul veya oluştur
        let testUser = await User.findOne({ email: 'test@test.com' });
        if (!testUser) {
            testUser = new User({
                username: 'testuser',
                email: 'test@test.com',
                password: 'test123'
            });
            await testUser.save();
            console.log('Test kullanıcısı oluşturuldu');
        }

        // Test başvurusu oluştur
        const testApplication = new Application({
            userId: testUser._id,
            applicationType: 'makale',
            speakerName: 'Test Konuşmacı',
            speakerTitle: 'Dr.',
            speakerOrganization: 'Test Üniversitesi',
            presentationTitle: 'Test Sunumu',
            presentationSummary: 'Bu bir test sunumudur. Başvuru sisteminin çalışıp çalışmadığını kontrol etmek için oluşturulmuştur.',
            requestedDate: new Date('2025-12-01'),
            requestedTime: '10:00',
            duration: 30,
            additionalNotes: 'Test notu'
        });

        await testApplication.save();
        console.log('✅ Test başvurusu başarıyla oluşturuldu!');
        console.log('Başvuru ID:', testApplication._id);
        
        // Tüm başvuruları listele
        const allApplications = await Application.find({}).populate('userId', 'username email');
        console.log('\n📋 Veritabanındaki tüm başvurular:');
        allApplications.forEach((app, index) => {
            console.log(`${index + 1}. ${app.speakerName} - ${app.presentationTitle} (${app.status})`);
        });

    } catch (error) {
        console.error('❌ Hata:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB bağlantısı kapatıldı');
    }
}

// Script'i çalıştır
createTestApplication();