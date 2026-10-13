const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createTestReferee = async () => {
    try {
        // MongoDB bağlantısı
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sempozyumkongre');
        console.log('✅ MongoDB bağlantısı başarılı');

        // Mevcut kullanıcıyı kontrol et
        const existingUser = await User.findOne({ email: 'hakemdeneme@gmail.com' });
        
        if (existingUser) {
            console.log('⚠️ Bu e-posta ile kullanıcı zaten var, siliniyor...');
            await User.deleteOne({ email: 'hakemdeneme@gmail.com' });
            console.log('🗑️ Eski hakem kullanıcısı silindi');
        }

        // Yeni hakem kullanıcısı oluştur
        // NOT: User model'deki pre('save') middleware şifreyi otomatik hash'leyecek
        const testReferee = new User({
            username: 'testhakem',
            email: 'hakemdeneme@gmail.com',
            password: '123456', // Ham şifre - middleware otomatik hash'leyecek
            role: 'referee',
            status: 'active',
            fullName: 'Test Hakem',
            phone: '+90 500 000 00 00',
            organization: 'Test Üniversitesi'
        });

        await testReferee.save();
        console.log('\n✅ Test hakem kullanıcısı başarıyla oluşturuldu!\n');
        console.log('📧 E-posta: hakemdeneme@gmail.com');
        console.log('🔐 Şifre: 123456');
        console.log('👤 Ad Soyad: Test Hakem');
        console.log('🏢 Kurum: Test Üniversitesi');
        console.log('📞 Telefon: +90 500 000 00 00');
        console.log('🔑 Rol: referee\n');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Hata oluştu:', error.message);
        process.exit(1);
    }
};

createTestReferee();
