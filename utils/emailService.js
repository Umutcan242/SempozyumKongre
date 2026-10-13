const nodemailer = require('nodemailer');

// Email transporter oluştur
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email gönderme fonksiyonu
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Sempozyum & Kongre'}" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email gönderildi:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email gönderme hatası:', error);
    throw error;
  }
};

// Şifre sıfırlama email'i
const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Şifre Sıfırlama</h2>
      <p>Merhaba,</p>
      <p>Şifre sıfırlama talebinde bulundunuz. Aşağıdaki linke tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Şifreyi Sıfırla</a>
      </p>
      <p><strong>Bu link 1 saat içinde geçerliliğini yitirecektir.</strong></p>
      <p>Eğer bu talebi siz yapmadıysanız, bu email'i görmezden gelebilirsiniz.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #7f8c8d; font-size: 12px;">Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Şifre Sıfırlama - Sempozyum & Kongre',
    html: html
  });
};

// Etkinlik kaydı onay email'i
const sendEventRegistrationEmail = async (email, eventData, participantData) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #27ae60;">Etkinlik Kaydınız Onaylandı</h2>
      <p>Merhaba <strong>${participantData.fullName}</strong>,</p>
      <p>Etkinlik kaydınız başarıyla gerçekleştirilmiştir. Detaylar aşağıda yer almaktadır:</p>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2c3e50;">${eventData.title}</h3>
        <p><strong>Tarih:</strong> ${new Date(eventData.date).toLocaleDateString('tr-TR')}</p>
        <p><strong>Yer:</strong> ${eventData.location}</p>
        <p><strong>Kategori:</strong> ${eventData.category}</p>
        ${eventData.description ? `<p><strong>Açıklama:</strong> ${eventData.description}</p>` : ''}
      </div>

      <p>Etkinlik hakkında daha fazla bilgi için web sitemizi ziyaret edebilirsiniz.</p>

      <p style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/events" style="background: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Etkinlikleri Görüntüle</a>
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #7f8c8d; font-size: 12px;">Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Etkinlik Kaydınız Onaylandı - ${eventData.title}`,
    html: html
  });
};

// Bilgilendirme email'i
const sendNotificationEmail = async (email, subject, content) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3498db;">Bilgilendirme</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        ${content}
      </div>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #7f8c8d; font-size: 12px;">Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: subject,
    html: html
  });
};

// Hoş geldin email'i
const sendWelcomeEmail = async (email, userData) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #27ae60;">Hoş Geldiniz!</h2>
      <p>Merhaba <strong>${userData.fullName || userData.username}</strong>,</p>
      <p>Sempozyum & Kongre platformumuza başarıyla kayıt oldunuz. Artık platformun tüm özelliklerinden yararlanabilirsiniz:</p>

      <ul style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <li>Etkinliklere katılma</li>
        <li>Konuşmacı profillerini görüntüleme</li>
        <li>Başvuru yapma</li>
        <li>Profil yönetimi</li>
      </ul>

      <p style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Platforma Giriş Yap</a>
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #7f8c8d; font-size: 12px;">Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Hoş Geldiniz - Sempozyum & Kongre Platformu',
    html: html
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendEventRegistrationEmail,
  sendNotificationEmail,
  sendWelcomeEmail
};