const mongoose = require('mongoose');
const Application = require('./models/Application');
require('dotenv').config();

async function checkApplications() {
    try {
        // MongoDB'ye bağlan
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sempozyumkongre');
        console.log('MongoDB bağlantısı başarılı');

        // Tüm başvuruları getir
        const applications = await Application.find({});
        console.log('Toplam başvuru sayısı:', applications.length);
        
        if (applications.length > 0) {
            console.log('\n--- BAŞVURULAR ---');
            applications.forEach((app, index) => {
                console.log(`${index + 1}. Başvuru:`);
                console.log('  - ID:', app._id);
                console.log('  - Konuşmacı:', app.speakerName);
                console.log('  - Başlık:', app.presentationTitle);
                console.log('  - Durum:', app.status);
                console.log('  - Tarih:', app.createdAt);
                console.log('  - Kullanıcı ID:', app.userId);
                console.log('---');
            });
        } else {
            console.log('Veritabanında hiç başvuru yok!');
        }

    } catch (error) {
        console.error('Hata:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB bağlantısı kapatıldı');
    }
}

// Script'i çalıştır
checkApplications();