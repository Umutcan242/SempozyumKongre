const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function updateUsersFullName() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sempozyumkongre');
        console.log('✅ MongoDB bağlantısı başarılı\n');

        // fullName boş olanları bul
        const usersWithoutFullName = await User.find({ 
            $or: [
                { fullName: { $exists: false } },
                { fullName: null },
                { fullName: '' }
            ]
        });

        console.log(`📊 ${usersWithoutFullName.length} kullanıcının fullName alanı boş\n`);

        let updatedCount = 0;

        for (const user of usersWithoutFullName) {
            // fullName'i username veya email'den oluştur
            const fullName = user.username || user.email.split('@')[0];
            
            user.fullName = fullName;
            await user.save();
            updatedCount++;
            
            console.log(`✅ Güncellendi: ${user.email} -> fullName: "${fullName}"`);
        }

        console.log(`\n📈 Toplam ${updatedCount} kullanıcı güncellendi`);

    } catch (error) {
        console.error('❌ Hata:', error);
    } finally {
        await mongoose.connection.close();
    }
}

updateUsersFullName();
