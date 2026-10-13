const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sempozyumkongre');
        console.log('✅ MongoDB bağlantısı başarılı\n');

        const users = await User.find({}).select('-password');
        
        console.log(`📊 Toplam ${users.length} kullanıcı:\n`);
        users.forEach(user => {
            console.log(`
ID: ${user._id}
E-posta: ${user.email}
Kullanıcı Adı: ${user.username}
Ad Soyadı: ${user.fullName || 'BOŞ'}
Telefon: ${user.phone || 'BOŞ'}
Kurum: ${user.organization || 'BOŞ'}
Rol: ${user.role}
Durum: ${user.status}
---`);
        });

    } catch (error) {
        console.error('❌ Hata:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkUsers();
