const API_BASE_URL = 'http://localhost:3000/api';

// DOM yüklendikten sonra çalış
document.addEventListener('DOMContentLoaded', function() {
    // Mobil menü toggle
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Navigation linkleri - artık gerçek sayfalar
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            // Eğer # ile başlayan bir link ise (eski sistem için uyumluluk)
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                showSection(targetId);
            }
            // Normal HTML sayfası linkleri için hiçbir şey yapmaya gerek yok
            // Browser otomatik olarak sayfayı yükleyecek
        });
    });

    // Sayfa yüklendiğinde etkinlikleri, konuşmacıları ve duyuruları getir
    loadEvents();
    loadSpeakers();
    loadAnnouncements();
    loadHomePageStats();

    // Ana sayfada etkinlikleri yükle
    loadHomeEvents();

    // Kayıt formu submit
    const registrationForm = document.getElementById('registration-form');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistration);
    }

    // Giriş formu submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Başvuru formu submit
    const applicationForm = document.getElementById('application-form');
    if (applicationForm) {
        applicationForm.addEventListener('submit', handleApplication);
    }

    // Katılma formu submit
    const participationForm = document.getElementById('participation-form');
    if (participationForm) {
        participationForm.addEventListener('submit', handleParticipation);
    }

    // Şifremi unuttum formu submit
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }

    // Şifre sıfırlama formu submit
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPassword);
    }

    // Çıkış butonu
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Sayfa yüklendiğinde kullanıcı durumunu kontrol et
    checkUserStatus();

    // URL parametrelerini kontrol et (şifre sıfırlama için)
    checkUrlParameters();

    // Başvuru formu için minimum tarih ayarla
    const requestedDateInput = document.getElementById('requestedDate');
    if (requestedDateInput) {
        const today = new Date().toISOString().split('T')[0];
        requestedDateInput.min = today;
    }

    // Admin form event'leri
    const eventForm = document.getElementById('event-form');
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const eventData = Object.fromEntries(formData);
            
            try {
                const response = await fetch(`${API_BASE_URL}/events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventData)
                });
                
                if (response.ok) {
                    showMessage('Etkinlik başarıyla eklendi', 'success');
                    hideAddEventForm();
                    loadAdminEvents();
                } else {
                    const result = await response.json();
                    showMessage(result.message || 'Etkinlik eklenemedi', 'error');
                }
            } catch (error) {
                showMessage('Etkinlik eklenemedi', 'error');
            }
        });
    }
    
    const speakerForm = document.getElementById('speaker-form');
    if (speakerForm) {
        speakerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const speakerData = Object.fromEntries(formData);
            
            try {
                const response = await fetch(`${API_BASE_URL}/speakers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(speakerData)
                });
                
                if (response.ok) {
                    showMessage('Konuşmacı başarıyla eklendi', 'success');
                    hideAddSpeakerForm();
                    loadAdminSpeakers();
                } else {
                    const result = await response.json();
                    showMessage(result.message || 'Konuşmacı eklenemedi', 'error');
                }
            } catch (error) {
                showMessage('Konuşmacı eklenemedi', 'error');
            }
        });
    }
});

// Section gösterme fonksiyonu
function showSection(sectionId) {
    // Tüm section'ları gizle
    document.querySelectorAll('.section, .hero').forEach(section => {
        section.style.display = 'none';
    });

    // Seçilen section'ı göster
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // Mobil menüyü kapat
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
        navMenu.classList.remove('active');
    }

    // Sayfayı yukarı kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
} 

// Etkinlikleri yükle
async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        
        if (response.ok) {
            const result = await response.json();
            const events = result.events || result; // API'den gelen format kontrolü
            
            const eventsContainer = document.getElementById('events-list');
            if (eventsContainer) {
                if (events && events.length > 0) {
                    eventsContainer.innerHTML = events.map(event => `
                        <div class="event-card" data-event-id="${event._id}" data-event-type="${event.type || 'sempozyum'}">
                            <div class="event-date">${formatDate(event.date)}</div>
                            <h3>${event.title}</h3>
                            <p>${event.description}</p>
                            <p><strong>${getTranslation('Konum:')}:</strong> ${event.location}</p>
                            <p><strong>${getTranslation('Kapasite:')}:</strong> ${event.capacity} ${getTranslation('kişi')}</p>
                            <p><strong>${getTranslation('Ücret:')}:</strong> ${event.fee ? event.fee + ' ₺' : getTranslation('Ücretsiz')}</p>
                            <div class="event-actions">
                                <button onclick="goToParticipation('${event._id}')" class="event-btn event-btn-primary">
                                    ${getTranslation('Katıl')}
                                </button>
                                <button onclick="showEventDetails('${event._id}')" class="event-btn event-btn-outline">
                                    ${getTranslation('Detayları Gör')}
                                </button>
                            </div>
                        </div>
                    `).join('');
                } else {
                    eventsContainer.innerHTML = `
                        <div class="empty-state">
                            <h3>${getTranslation('Henüz etkinlik bulunmuyor')}</h3>
                            <p>${getTranslation('Yakında yeni etkinlikler eklenecek!')}</p>
                        </div>
                    `;
                }
            }
            
            // Ana sayfada da etkinlikleri göster (son 3 etkinlik)
            loadHomeEvents(events);
            
        } else {
            console.log('Etkinlikler yüklenirken sorun oluştu, boş liste gösteriliyor');
        }
    } catch (error) {
        console.log('Etkinlik API\'sine bağlanılamadı, boş liste gösteriliyor');
        const eventsContainer = document.getElementById('events-list');
        if (eventsContainer) {
            eventsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>${getTranslation('Etkinlikler yüklenemedi')}</h3>
                    <p>${getTranslation('Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.')}</p>
                </div>
            `;
        }
    }
}

// Ana sayfada etkinlikleri yükle (son 3 etkinlik)
async function loadHomeEvents(events = null) {
    try {
        let eventsData = events;
        
        // Eğer events parametre olarak verilmemişse API'den çek
        if (!eventsData) {
            const response = await fetch(`${API_BASE_URL}/events`);
            if (response.ok) {
                const result = await response.json();
                eventsData = result.events || result;
            }
        }
        
        const homeEventsContainer = document.getElementById('home-events-list');
        if (homeEventsContainer && eventsData) {
            if (eventsData.length > 0) {
                // Son 3 etkinliği al (tarihe göre sıralanmış)
                const recentEvents = eventsData
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .slice(0, 3);
                
                homeEventsContainer.innerHTML = recentEvents.map(event => `
                    <div class="event-card" style="background: white; border: 1px solid #ddd; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.2s;">
                        <div class="event-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <div class="event-date" style="background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 0.5rem 1rem; border-radius: 6px; font-weight: bold; font-size: 0.9em;">
                                ${formatDate(event.date)}
                            </div>
                            <div class="event-category" style="background: #ecf0f1; color: #2c3e50; padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.8em; font-weight: 500;">
                                ${event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                            </div>
                        </div>
                        
                        <h3 style="color: #2c3e50; margin-bottom: 0.8rem; font-size: 1.2em; line-height: 1.3;">${event.title}</h3>
                        <p style="color: #666; margin-bottom: 1.2rem; line-height: 1.5;">${event.description}</p>
                        
                        <div class="event-details" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.8rem; font-size: 0.9em; border-top: 1px solid #ecf0f1; padding-top: 1rem;">
                            <div style="display: flex; align-items: center; color: #555;">
                                <div>
                                    <strong>${getTranslation('Konum:')}:</strong><br>
                                    <span style="color: #666;">${event.location}</span>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; color: #555;">
                                <div>
                                    <strong>${getTranslation('Kapasite:')}:</strong><br>
                                    <span style="color: #666;">${event.capacity} ${getTranslation('kişi')}</span>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; color: #555;">
                                <div>
                                    <strong>${getTranslation('Organizatör:')}:</strong><br>
                                    <span style="color: #666;">${event.organizer}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div style="margin-top: 1rem; display: flex; gap: 0.8rem;">
                            <button onclick="showEventDetails('${event._id}')" style="flex: 1; background: transparent; color: #667eea; border: 1.5px solid #667eea; padding: 0.8rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(102, 126, 234, 0.05)'; this.style.transform='translateY(-1px)'" onmouseout="this.style.background='transparent'; this.style.transform='translateY(0)'">
                                ${getTranslation('Detayları Gör')}
                            </button>
                            <button onclick="goToParticipation('${event._id}')" style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 0.8rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 3px 12px rgba(102, 126, 234, 0.3);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 18px rgba(102, 126, 234, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 3px 12px rgba(102, 126, 234, 0.3)'">
                                ${getTranslation('Katıl')}
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                homeEventsContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #666; background: white; border-radius: 8px; border: 1px solid #ddd;">
                        <h3 style="color: #2c3e50; margin-bottom: 1rem;">${getTranslation('Henüz etkinlik bulunmuyor')}</h3>
                        <p>${getTranslation('Yakında yeni etkinlikler eklenecek!')}</p>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.log('Ana sayfa etkinlikleri yüklenirken hata:', error);
        const homeEventsContainer = document.getElementById('home-events-list');
        if (homeEventsContainer) {
            homeEventsContainer.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #e74c3c; background: white; border-radius: 8px; border: 1px solid #ddd;">
                    <h3>${getTranslation('Etkinlikler yüklenemedi')}</h3>
                    <p>${getTranslation('Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.')}</p>
                </div>
            `;
        }
    }
}

// Konuşmacıları yükle
async function loadSpeakers() {
    try {
        const response = await fetch(`${API_BASE_URL}/speakers`);
        
        if (response.ok) {
            const result = await response.json();
            const speakers = result.speakers || result; // API'den gelen format kontrolü
            
            const speakersContainer = document.getElementById('speakers-list');
            if (speakersContainer) {
                if (speakers && speakers.length > 0) {
                    speakersContainer.innerHTML = speakers.map(speaker => `
                        <div class="speaker-card" data-speaker-title="${speaker.title || ''}">
                            <div class="speaker-avatar">${speaker.name.charAt(0)}</div>
                            <h3>${speaker.name}</h3>
                            <p><strong>${speaker.title}</strong></p>
                            <p>${speaker.organization}</p>
                            <p>${speaker.bio}</p>
                        </div>
                    `).join('');
                } else {
                    speakersContainer.innerHTML = `
                        <div class="empty-state">
                            <h3>${getTranslation('Henüz konuşmacı bulunmuyor')}</h3>
                            <p>${getTranslation('Yakında konuşmacı bilgileri eklenecek!')}</p>
                        </div>
                    `;
                }
            }
        } else {
            console.log('Konuşmacılar yüklenirken sorun oluştu, boş liste gösteriliyor');
        }
    } catch (error) {
        console.log('Konuşmacı API\'sine bağlanılamadı, boş liste gösteriliyor');
        const speakersContainer = document.getElementById('speakers-list');
        if (speakersContainer) {
            speakersContainer.innerHTML = `
                <div class="empty-state">
                    <h3>${getTranslation('Konuşmacılar yüklenemedi')}</h3>
                    <p>${getTranslation('Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.')}</p>
                </div>
            `;
        }
    }
}

// Kayıt formu işleyici
async function handleRegistration(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const registrationData = Object.fromEntries(formData);

    // Şifre kontrolü
    if (registrationData.password !== registrationData.confirmPassword) {
        showMessage('Şifreler eşleşmiyor!', 'error');
        return;
    }

    if (registrationData.password.length < 6) {
        showMessage('Şifre en az 6 karakter olmalı!', 'error');
        return;
    }

    try {
        // Form verilerini users tablosu için hazırla
        const userData = {
            username: registrationData.email.split('@')[0], // Email'den username oluştur
            email: registrationData.email,
            password: registrationData.password, // Kullanıcının girdiği şifre
            fullName: registrationData.fullName || '',
            phone: registrationData.phone || '',
            organization: registrationData.organization || ''
        };

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (response.ok) {
            // URL'den gelen event ID'yi kontrol et
            const eventId = registrationData.eventId || localStorage.getItem('pendingParticipationEventId');
            
            if (eventId) {
                showMessage('Kayıt başarılı! Şimdi giriş yaparak etkinliğe katılabilirsiniz.', 'success');
                // Event ID'yi giriş sonrası için sakla
                localStorage.setItem('pendingParticipationEventId', eventId);
            } else {
                showMessage('Kayıt başarılı! Kullanıcı hesabınız oluşturuldu. Giriş yapabilirsiniz.', 'success');
            }
            
            e.target.reset();
            
            // Giriş sayfasına yönlendir
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showMessage(result.message || 'Kayıt sırasında hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Kayıt hatası:', error);
        showMessage('Kayıt sırasında hata oluştu', 'error');
    }
}

// Tarih formatlama
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
}

// Etkinlik detaylarını göster
function showEventDetails(eventId) {
    // Etkinlikler sekmesine geç ve ilgili etkinliği vurgula
    showSection('events');
    
    // Kısa bir gecikme sonrası etkinliği vurgula
    setTimeout(() => {
        const eventCards = document.querySelectorAll('.event-card');
        eventCards.forEach(card => {
            card.style.border = '1px solid #ddd';
            card.style.transform = 'scale(1)';
        });
        
        // İlgili etkinlik kartını bul ve vurgula (basit bir yaklaşım)
        const targetCard = Array.from(eventCards).find(card => 
            card.innerHTML.includes(eventId) || card.querySelector(`[data-event-id="${eventId}"]`)
        );
        
        if (targetCard) {
            targetCard.style.border = '2px solid #3498db';
            targetCard.style.transform = 'scale(1.02)';
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 300);
}

// Mesaj gösterme
function showMessage(text, type = 'success') {
    // Mevcut mesajları temizle
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());

    // Yeni mesaj oluştur
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;

    // Aktif section'ı bul ve mesajı ekle
    const activeSection = document.querySelector('.section:not([style*="display: none"])');
    if (activeSection) {
        const form = activeSection.querySelector('form') || activeSection.querySelector('.container');
        if (form) {
            form.insertBefore(messageDiv, form.firstChild);
        } else {
            activeSection.appendChild(messageDiv);
        }
        
        // 5 saniye sonra mesajı kaldır
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Scroll to top fonksiyonu
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Giriş formu işleyici
async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = Object.fromEntries(formData);

    // Kullanıcı tipi kontrolü
    if (!loginData.userType) {
        showMessage('Lütfen giriş türünü seçiniz', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usernameOrEmail: loginData.email,
                password: loginData.password
            })
        });

        const result = await response.json();

        if (response.ok) {
            // Kullanıcının gerçek rolü ile seçilen giriş türünü karşılaştır
            const userRole = result.user.role || 'user';
            
            if (loginData.userType === 'admin' && userRole !== 'admin') {
                showMessage('Yönetici girişi için yetkiniz bulunmamaktadır', 'error');
                return;
            }
            
            if (loginData.userType === 'referee' && userRole !== 'referee') {
                showMessage('Hakem girişi için yetkiniz bulunmamaktadır', 'error');
                return;
            }
            
            // Token'ı localStorage'a kaydet
            localStorage.setItem('token', result.token);
            localStorage.setItem('userRole', userRole);
            localStorage.setItem('userData', JSON.stringify(result.user));
            
            showMessage('Giriş başarılı!', 'success');
            e.target.reset();
            
            // Kullanıcı bilgilerini güncelle
            updateUserInterface(result.user);
            
            // Seçilen giriş türüne göre yönlendirme
            if (loginData.userType === 'admin' && userRole === 'admin') {
                // Yönetici girişi - Admin paneline yönlendir
                window.location.href = 'admin.html';
            } else if (loginData.userType === 'referee' && userRole === 'referee') {
                // Hakem girişi - Hakem paneline yönlendir
                window.location.href = 'hakempage.html';
            } else {
                // Üye girişi - Bekleyen katılma isteği var mı kontrol et
                const pendingEventId = localStorage.getItem('pendingParticipationEventId');
                if (pendingEventId) {
                    // Bekleyen katılma isteğini temizle ve katılma işlemini yap
                    localStorage.removeItem('pendingParticipationEventId');
                    await handleEventParticipation(pendingEventId);
                } else {
                    // Ana sayfaya yönlendir
                    window.location.href = 'index.html';
                }
            }
        } else {
            showMessage(result.message || 'Giriş sırasında hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Giriş hatası:', error);
        showMessage('Giriş sırasında hata oluştu', 'error');
    }
}

// Çıkış yapma
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    
    // Giriş yap ve kayıt ol linklerini tekrar göster
    const loginLink = document.querySelector('a[href="login.html"]');
    if (loginLink) {
        loginLink.parentElement.style.display = 'block';
    }
    
    const registerLink = document.querySelector('a[href="register.html"]');
    if (registerLink) {
        registerLink.parentElement.style.display = 'block';
    }
    
    showMessage('Çıkış yapıldı', 'success');
    updateUserInterface(null);
    
    // Ana sayfaya yönlendir
    window.location.href = 'index.html';
}

// Kullanıcı durumunu kontrol et
function checkUserStatus() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
        try {
            const user = JSON.parse(userData);
            updateUserInterface(user);
        } catch (error) {
            console.error('Kullanıcı verisi parse edilemedi:', error);
            handleLogout();
        }
    }
}

// Kullanıcı arayüzünü güncelle
function updateUserInterface(user) {
    const navMenu = document.querySelector('.nav-menu');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');
    
    if (user) {
        // Kullanıcı giriş yapmış
        const fullName = user.profile?.firstName && user.profile?.lastName 
            ? `${user.profile.firstName} ${user.profile.lastName}`
            : user.username;
        
        userName.textContent = `Hoş geldin, ${fullName}`;
        userInfo.style.display = 'flex';
        
        // Giriş yap ve kayıt ol linklerini gizle
        const loginLink = document.querySelector('a[href="login.html"]');
        if (loginLink) {
            loginLink.parentElement.style.display = 'none'; // li elementini gizle
        }
        
        const registerLink = document.querySelector('a[href="register.html"]');
        if (registerLink) {
            registerLink.parentElement.style.display = 'none'; // li elementini gizle
        }

        // Admin panel erişimini kontrol et
        const adminNav = document.getElementById('admin-nav');
        if (adminNav) {
            // Sadece admin ve organizer rolü admin paneli görebilir
            if (user.role === 'admin' || user.role === 'organizer') {
                adminNav.style.display = 'block';
            } else {
                adminNav.style.display = 'none';
            }
        }

        // Normal kullanıcılar için katılım linklerini göster
        const myParticipationsNav = document.getElementById('my-participations-nav');
        if (myParticipationsNav) {
            myParticipationsNav.style.display = 'inline-block';
        }

        const myApplicationsNav = document.getElementById('my-applications-nav');
        if (myApplicationsNav) {
            myApplicationsNav.style.display = 'inline-block';
        }

        const applicationNav = document.getElementById('application-nav');
        if (applicationNav) {
            applicationNav.style.display = 'inline-block';
        }
    } else {
        // Kullanıcı giriş yapmamış
        userInfo.style.display = 'none';
        
        // Giriş yap ve kayıt ol linklerini göster
        const loginLink = document.querySelector('a[href="login.html"]');
        if (loginLink) {
            loginLink.parentElement.style.display = 'block';
        }
        
        const registerLink = document.querySelector('a[href="register.html"]');
        if (registerLink) {
            registerLink.parentElement.style.display = 'block';
        }

        // Admin paneli gizle
        const adminNav = document.getElementById('admin-nav');
        if (adminNav) {
            adminNav.style.display = 'none';
        }

        // Başvuru linkini gizle
        const applicationNav = document.getElementById('application-nav');
        if (applicationNav) {
            applicationNav.style.display = 'none';
        }
    }
}

// ==================== ADMIN PANEL FUNCTIONS ====================



// Etkinlik form göster/gizle
function showAddEventForm() {
    document.getElementById('add-event-form').style.display = 'block';
}

function hideAddEventForm() {
    document.getElementById('add-event-form').style.display = 'none';
    document.getElementById('event-form').reset();
}

// Konuşmacı form göster/gizle
function showAddSpeakerForm() {
    document.getElementById('add-speaker-form').style.display = 'block';
}

function hideAddSpeakerForm() {
    document.getElementById('add-speaker-form').style.display = 'none';
    document.getElementById('speaker-form').reset();
}

// Admin etkinlikleri yükle
async function loadAdminEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        if (response.ok) {
            const result = await response.json();
            const events = result.events || result;
            
            const tableContainer = document.getElementById('events-table');
            if (events && events.length > 0) {
                tableContainer.innerHTML = `
                    <table>
                        <thead>
                            <tr>
                                <th>Başlık</th>
                                <th>Kategori</th>
                                <th>Tarih</th>
                                <th>Konum</th>
                                <th>Kapasite</th>
                                <th>Ücret</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${events.map(event => `
                                <tr>
                                    <td>${event.title}</td>
                                    <td>${event.category}</td>
                                    <td>${formatDate(event.date)}</td>
                                    <td>${event.location}</td>
                                    <td>${event.capacity}</td>
                                    <td>${event.fee ? event.fee + ' ₺' : 'Ücretsiz'}</td>
                                    <td class="actions">
                                        <button class="btn-edit" onclick="editEvent('${event._id}')">Düzenle</button>
                                        <button class="btn-danger" onclick="deleteEvent('${event._id}')">Sil</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } else {
                tableContainer.innerHTML = '<div class="empty-state"><h3>Henüz etkinlik bulunmuyor</h3></div>';
            }
        }
    } catch (error) {
        console.error('Admin etkinlikler yüklenemedi:', error);
    }
}

// Admin konuşmacıları yükle
async function loadAdminSpeakers() {
    try {
        const response = await fetch(`${API_BASE_URL}/speakers`);
        if (response.ok) {
            const result = await response.json();
            const speakers = result.speakers || result;
            
            const tableContainer = document.getElementById('speakers-table');
            if (speakers && speakers.length > 0) {
                tableContainer.innerHTML = `
                    <table>
                        <thead>
                            <tr>
                                <th>Ad Soyad</th>
                                <th>E-posta</th>
                                <th>Unvan</th>
                                <th>Kurum</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${speakers.map(speaker => `
                                <tr>
                                    <td>${speaker.name}</td>
                                    <td>${speaker.email}</td>
                                    <td>${speaker.title}</td>
                                    <td>${speaker.organization}</td>
                                    <td class="actions">
                                        <button class="btn-edit" onclick="editSpeaker('${speaker._id}')">Düzenle</button>
                                        <button class="btn-danger" onclick="deleteSpeaker('${speaker._id}')">Sil</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } else {
                tableContainer.innerHTML = '<div class="empty-state"><h3>Henüz konuşmacı bulunmuyor</h3></div>';
            }
        }
    } catch (error) {
        console.error('Admin konuşmacılar yüklenemedi:', error);
    }
}

// Admin katılımcıları yükle
async function loadAdminParticipants() {
    try {
        const response = await fetch(`${API_BASE_URL}/participants`);
        if (response.ok) {
            const result = await response.json();
            const participants = result.participants || result;
            
            const tableContainer = document.getElementById('participants-table');
            if (participants && participants.length > 0) {
                tableContainer.innerHTML = `
                    <table>
                        <thead>
                            <tr>
                                <th>Ad Soyad</th>
                                <th>E-posta</th>
                                <th>Telefon</th>
                                <th>Kurum</th>
                                <th>Kayıt Tarihi</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${participants.map(participant => `
                                <tr>
                                    <td>${participant.fullName}</td>
                                    <td>${participant.email}</td>
                                    <td>${participant.phone}</td>
                                    <td>${participant.organization || '-'}</td>
                                    <td>${formatDate(participant.registrationDate)}</td>
                                    <td class="actions">
                                        <button class="btn-danger" onclick="deleteParticipant('${participant._id}')">Sil</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } else {
                tableContainer.innerHTML = '<div class="empty-state"><h3>Henüz katılımcı bulunmuyor</h3></div>';
            }
        }
    } catch (error) {
        console.error('Admin katılımcılar yüklenemedi:', error);
    }
}

// Admin kullanıcıları yükle  
async function loadAdminUsers() {
    const tableContainer = document.getElementById('users-table');
    tableContainer.innerHTML = '<div class="empty-state"><h3>Kullanıcı listesi yakında eklenecek</h3></div>';
}

// Silme fonksiyonları
async function deleteEvent(eventId) {
    if (!confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, { method: 'DELETE' });
        if (response.ok) {
            showMessage('Etkinlik başarıyla silindi', 'success');
            loadAdminEvents();
        }
    } catch (error) {
        showMessage('Etkinlik silinemedi', 'error');
    }
}

async function deleteSpeaker(speakerId) {
    if (!confirm('Bu konuşmacıyı silmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/speakers/${speakerId}`, { method: 'DELETE' });
        if (response.ok) {
            showMessage('Konuşmacı başarıyla silindi', 'success');
            loadAdminSpeakers();
        }
    } catch (error) {
        showMessage('Konuşmacı silinemedi', 'error');
    }
}

async function deleteParticipant(participantId) {
    if (!confirm('Bu katılımcıyı silmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/participants/${participantId}`, { method: 'DELETE' });
        if (response.ok) {
            showMessage('Katılımcı başarıyla silindi', 'success');
            loadAdminParticipants();
        }
    } catch (error) {
        showMessage('Katılımcı silinemedi', 'error');
    }
}

// === ADMIN FONKSİYONLARI ===
// Admin etkinlik yükleme
async function loadAdminEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        const result = await response.json();
        const events = result.events || result;
        
        const tbody = document.querySelector('#events-table tbody');
        if (!tbody) return; // Admin sayfasında değilsek çık
        
        tbody.innerHTML = '';
        if (events && events.length > 0) {
            events.forEach(event => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${event.title}</td>
                    <td>${event.description.length > 50 ? event.description.substring(0, 50) + '...' : event.description}</td>
                    <td>${formatDate(event.date)}</td>
                    <td>${event.location}</td>
                    <td>${event.capacity}</td>
                    <td>${event.category}</td>
                    <td>${event.fee || 0}</td>
                    <td>${event.organizer}</td>
                    <td class="admin-actions">
                        <button onclick="deleteEvent('${event._id}')">Sil</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="9">Etkinlik yok</td></tr>';
        }
    } catch (error) {
        showAdminMessage('event-message', 'Etkinlikler yüklenemedi', 'error');
    }
}

// Admin etkinlik formu
async function handleEventForm(e) {
    console.log('🎪 handleEventForm çalıştı!', e);
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    console.log('📝 Form verisi:', data);
    
    try {
        console.log('📡 API çağrısı başlatılıyor...');
        const response = await fetch(`${API_BASE_URL}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        console.log('📡 Response alındı:', response.status, response.ok);
        
        if (response.ok) {
            console.log('✅ Etkinlik başarıyla eklendi!');
            showAdminMessage('event-message', 'Etkinlik eklendi', 'success');
            form.reset();
            loadAdminEvents();
            // Ana sayfadaki etkinlikleri de güncelle
            if (typeof loadEvents === 'function') {
                loadEvents();
            }
        } else {
            const result = await response.json();
            console.error('❌ Server hatası:', result);
            showAdminMessage('event-message', result.message || 'Hata oluştu', 'error');
        }
    } catch (error) {
        console.error('❌ Network hatası:', error);
        showAdminMessage('event-message', 'Etkinlik eklenemedi: ' + error.message, 'error');
    }
}

// Etkinlik silme
async function deleteEvent(id) {
    if (!confirm('Etkinliği silmek istediğinize emin misiniz?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/events/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showAdminMessage('event-message', 'Etkinlik silindi', 'success');
            loadAdminEvents();
            // Ana sayfadaki etkinlikleri de güncelle
            loadEvents();
        } else {
            showAdminMessage('event-message', 'Silme işlemi başarısız', 'error');
        }
    } catch (error) {
        showAdminMessage('event-message', 'Etkinlik silinemedi', 'error');
    }
}

// Admin konuşmacı yükleme
async function loadAdminSpeakers() {
    try {
        const response = await fetch(`${API_BASE_URL}/speakers`);
        const result = await response.json();
        const speakers = result.speakers || result;
        
        const tbody = document.querySelector('#speakers-table tbody');
        if (!tbody) return; // Admin sayfasında değilsek çık
        
        tbody.innerHTML = '';
        if (speakers && speakers.length > 0) {
            speakers.forEach(speaker => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${speaker.name}</td>
                    <td>${speaker.email}</td>
                    <td>${speaker.title}</td>
                    <td>${speaker.organization}</td>
                    <td>${speaker.bio || ''}</td>
                    <td class="admin-actions">
                        <button onclick="deleteSpeaker('${speaker._id}')">Sil</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6">Konuşmacı yok</td></tr>';
        }
    } catch (error) {
        showAdminMessage('speaker-message', 'Konuşmacılar yüklenemedi', 'error');
    }
}

// Admin konuşmacı formu
async function handleSpeakerForm(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    try {
        const response = await fetch(`${API_BASE_URL}/speakers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            showAdminMessage('speaker-message', 'Konuşmacı eklendi', 'success');
            form.reset();
            loadAdminSpeakers();
            // Ana sayfadaki konuşmacıları da güncelle
            loadSpeakers();
        } else {
            const result = await response.json();
            showAdminMessage('speaker-message', result.message || 'Hata oluştu', 'error');
        }
    } catch (error) {
        showAdminMessage('speaker-message', 'Konuşmacı eklenemedi', 'error');
    }
}

// Konuşmacı silme
async function deleteSpeaker(id) {
    if (!confirm('Konuşmacıyı silmek istediğinize emin misiniz?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/speakers/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showAdminMessage('speaker-message', 'Konuşmacı silindi', 'success');
            loadAdminSpeakers();
            // Ana sayfadaki konuşmacıları da güncelle
            loadSpeakers();
        } else {
            showAdminMessage('speaker-message', 'Silme işlemi başarısız', 'error');
        }
    } catch (error) {
        showAdminMessage('speaker-message', 'Konuşmacı silinemedi', 'error');
    }
}

// Admin mesaj gösterme
function showAdminMessage(id, text, type) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = text;
        el.className = `admin-message ${type}`;
        el.style.display = 'block';
        setTimeout(() => { el.style.display = 'none'; }, 4000);
    }
}

// --- BAŞVURU SİSTEMİ ---

// Başvuru formu işleyici
async function handleApplication(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const applicationData = Object.fromEntries(formData);

    // Token kontrolü
    const token = localStorage.getItem('token');
    if (!token) {
        showApplicationMessage('Başvuru yapmak için giriş yapmalısınız', 'error');
        showSection('login');
        return;
    }

    // Form validasyonu
    if (!validateApplicationForm(applicationData)) {
        return;
    }

    try {
        console.log('Başvuru gönderiliyor:', applicationData);
        console.log('URL:', `${API_BASE_URL}/applications`);
        console.log('Token:', token);
        
        const response = await fetch(`${API_BASE_URL}/applications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(applicationData)
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        const result = await response.json();
        console.log('Response result:', result);

        if (response.ok) {
            showApplicationMessage('🎉 Başvurunuz başarıyla gönderildi! En kısa sürede değerlendirilecek ve size bilgi verilecektir.', 'success');
            e.target.reset();
            
            // Bugünün tarihini minimum tarih olarak ayarla
            const today = new Date().toISOString().split('T')[0];
            const dateInput = document.getElementById('requestedDate');
            if (dateInput) {
                dateInput.min = today;
            }
        } else {
            console.error('Server hatası:', result);
            const errorMessage = result.message || 'Başvuru gönderilirken hata oluştu';
            showApplicationMessage('❌ ' + errorMessage, 'error');
            
            // Eğer validation hatası varsa ayrıntıları göster
            if (result.errors && result.errors.length > 0) {
                console.error('Validation errors:', result.errors);
                const firstError = result.errors[0];
                showApplicationMessage('❌ ' + (firstError.msg || firstError.message || errorMessage), 'error');
            }
        }
    } catch (error) {
        console.error('Network veya parsing hatası:', error);
        showApplicationMessage('❌ Bağlantı hatası: ' + error.message, 'error');
        
        // Network hatası mı kontrol et
        if (error instanceof TypeError && error.message.includes('fetch')) {
            showApplicationMessage('❌ Sunucuya bağlanılamıyor. Lütfen server\'ın çalıştığından emin olun.', 'error');
        }
    }
}

// Başvuru form validasyonu
function validateApplicationForm(data) {
    // Sunum özeti boş olmamalı
    if (!data.presentationSummary.trim()) {
        showApplicationMessage('Sunum özeti boş bırakılamaz', 'error');
        return false;
    }

    // Tarih kontrolü
    const selectedDate = new Date(data.requestedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showApplicationMessage('İstenilen tarih bugünden eski olamaz', 'error');
        return false;
    }

    return true;
}

// Başvuru mesaj gösterme
function showApplicationMessage(text, type) {
    console.log('Mesaj gösterilmeye çalışılıyor:', text, type);
    const messageDiv = document.getElementById('application-message');
    console.log('Message div bulundu:', messageDiv);
    
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        // Sayfanın başına scroll yap ki mesaj görünür olsun
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 6000);
    } else {
        console.error('application-message div\'i bulunamadı!');
        // Fallback olarak alert göster
        alert(text);
    }
}

// ==================== ADMİN BAŞVURU FONKSİYONLARI ====================

let currentApplicationId = null;

// Admin başvuruları yükle
async function loadAdminApplications() {
    console.log('loadAdminApplications çalışıyor');

    try {
        console.log('Başvurular getiriliyor...');
        const response = await fetch(`${API_BASE_URL}/applications`);
        
        if (response.ok) {
            const result = await response.json();
            console.log('Başvuru response:', result);
            console.log('Applications array:', result.applications);
            displayAdminApplications(result.applications || []);
        } else {
            console.error('Başvurular yüklenemedi:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Başvuru yükleme hatası:', error);
    }
}

// Başvuruları tabloda göster
function displayAdminApplications(applications) {
    console.log('displayAdminApplications çalıştırılıyor, applications:', applications);
    const tbody = document.getElementById('applications-table-body');
    console.log('Table body element:', tbody);
    
    if (!tbody) {
        console.error('applications-table-body element bulunamadı!');
        return;
    }

    tbody.innerHTML = '';

    if (!applications || applications.length === 0) {
        console.log('Başvuru bulunamadı, boş mesaj gösteriliyor');
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Henüz başvuru bulunmamaktadır</td></tr>';
        return;
    }

    applications.forEach(application => {
        const row = document.createElement('tr');
        
        const statusClass = `status-${application.status}`;
        const statusText = getStatusText(application.status);
        
        row.innerHTML = `
            <td>${getTypeText(application.applicationType)}</td>
            <td>${application.speakerName}</td>
            <td>${application.presentationTitle}</td>
            <td>${application.speakerOrganization}</td>
            <td>${formatDate(application.requestedDate)} ${application.requestedTime}</td>
            <td>${application.duration} dk</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>${formatDate(application.createdAt)}</td>
            <td>
                <button onclick="viewApplication('${application._id}')" style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">Görüntüle</button>
                <button onclick="deleteApplication('${application._id}')" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Sil</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Başvuru türü metni
function getTypeText(type) {
    const typeMap = {
        'makale': 'Makale Sunumu',
        'bildiri': 'Bildiri Sunumu',
        'poster': 'Poster Sunumu'
    };
    return typeMap[type] || type;
}

// Durum metni
function getStatusText(status) {
    const statusMap = {
        'pending': 'Beklemede',
        'approved': 'Onaylandı',
        'rejected': 'Reddedildi',
        'reviewed': 'İncelendi'
    };
    return statusMap[status] || status;
}

// Başvuru detayını görüntüle
async function viewApplication(applicationId) {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/applications`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            const application = result.applications.find(app => app._id === applicationId);
            
            if (application) {
                showApplicationModal(application);
            }
        }
    } catch (error) {
        console.error('Başvuru detay hatası:', error);
    }
}

// Başvuru modalini göster
function showApplicationModal(application) {
    currentApplicationId = application._id;
    
    const modal = document.getElementById('application-modal');
    const content = document.getElementById('modal-content');
    const statusSelect = document.getElementById('review-status');
    const notesTextarea = document.getElementById('review-notes');
    
    content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div><strong>Başvuru Türü:</strong> ${getTypeText(application.applicationType)}</div>
            <div><strong>Durum:</strong> <span class="status-badge status-${application.status}">${getStatusText(application.status)}</span></div>
            <div><strong>Konuşmacı:</strong> ${application.speakerName}</div>
            <div><strong>Unvan:</strong> ${application.speakerTitle || 'Belirtilmemiş'}</div>
            <div><strong>Kurum:</strong> ${application.speakerOrganization}</div>
            <div><strong>İstenilen Tarih:</strong> ${formatDate(application.requestedDate)}</div>
            <div><strong>İstenilen Saat:</strong> ${application.requestedTime}</div>
            <div><strong>Süre:</strong> ${application.duration} dakika</div>
        </div>
        
        <div style="margin-bottom: 1rem;">
            <strong>Sunum Başlığı:</strong><br>
            ${application.presentationTitle}
        </div>
        
        <div style="margin-bottom: 1rem;">
            <strong>Sunum Özeti:</strong><br>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; white-space: pre-wrap;">${application.presentationSummary}</div>
        </div>
        
        ${application.additionalNotes ? `
        <div style="margin-bottom: 1rem;">
            <strong>Ek Notlar:</strong><br>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px;">${application.additionalNotes}</div>
        </div>
        ` : ''}
        
        <div style="margin-bottom: 1rem;">
            <strong>Başvuru Tarihi:</strong> ${formatDate(application.createdAt)}
        </div>
        
        ${application.reviewNotes ? `
        <div style="margin-bottom: 1rem;">
            <strong>Önceki Değerlendirme:</strong><br>
            <div style="background: #e3f2fd; padding: 1rem; border-radius: 4px;">${application.reviewNotes}</div>
        </div>
        ` : ''}
    `;
    
    statusSelect.value = application.status;
    notesTextarea.value = application.reviewNotes || '';
    
    modal.style.display = 'block';
}

// Modal kapat
function closeApplicationModal() {
    const modal = document.getElementById('application-modal');
    modal.style.display = 'none';
    currentApplicationId = null;
}

// Başvuru değerlendirmesini kaydet
async function saveApplicationReview() {
    if (!currentApplicationId) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const status = document.getElementById('review-status').value;
    const reviewNotes = document.getElementById('review-notes').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/applications/${currentApplicationId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status,
                reviewNotes
            })
        });
        
        if (response.ok) {
            showAdminMessage('application-message', 'Başvuru değerlendirmesi kaydedildi', 'success');
            closeApplicationModal();
            loadAdminApplications(); // Tabloyu yenile
        } else {
            const result = await response.json();
            showAdminMessage('application-message', result.message || 'Kaydetme hatası', 'error');
        }
    } catch (error) {
        console.error('Değerlendirme kaydetme hatası:', error);
        showAdminMessage('application-message', 'Kaydetme sırasında hata oluştu', 'error');
    }
}

// Başvuru sil
async function deleteApplication(applicationId) {
    if (!confirm('Bu başvuruyu silmek istediğinizden emin misiniz?')) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            showAdminMessage('application-message', 'Başvuru silindi', 'success');
            loadAdminApplications(); // Tabloyu yenile
        } else {
            const result = await response.json();
            showAdminMessage('application-message', result.message || 'Silme hatası', 'error');
        }
    } catch (error) {
        console.error('Başvuru silme hatası:', error);
        showAdminMessage('application-message', 'Silme sırasında hata oluştu', 'error');
    }
}

// Admin tab değiştirme (showAdminTab fonksiyonunu güncelle)
function showAdminTab(tabName) {
    // Tüm tab buttonlarından active class'ı kaldır
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Tüm admin content'leri gizle
    document.querySelectorAll('.admin-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Seçilen tab'ı aktif yap
    const activeButton = document.querySelector(`[onclick="showAdminTab('${tabName}')"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Seçilen content'i göster
    const activeContent = document.getElementById(`admin-${tabName}`);
    if (activeContent) {
        activeContent.style.display = 'block';
    }
    
    // Tab'a göre veri yükle
    if (tabName === 'applications') {
        loadAdminApplications();
    } else if (tabName === 'events') {
        loadAdminEvents();
    } else if (tabName === 'speakers') {
        loadAdminSpeakers();
    }
}

// ==================== DİL ÇEVİRİ SİSTEMİ ====================

// Çeviri metinleri
const translations = {
    tr: {
        // Navigation
        'Ana Sayfa': 'Ana Sayfa',
        'Etkinlikler': 'Etkinlikler',
        'Konuşmacılar': 'Konuşmacılar',
        'İletişim': 'İletişim',
        'Kayıt Ol': 'Kayıt Ol',
        'Giriş Yap': 'Giriş Yap',
        'Yeni Başvuru': 'Yeni Başvuru',
        'Çıkış': 'Çıkış',
        
        // Ana Sayfa
        'Sempozyum & Kongre Yönetim Sistemi': 'Sempozyum & Kongre Yönetim Sistemi',
        'Akademik etkinliklerinizi kolayca organize edin': 'Akademik etkinliklerinizi kolayca organize edin',
        'Güncel Etkinlikler': 'Güncel Etkinlikler',
        'Tüm Etkinlikleri Gör': 'Tüm Etkinlikleri Gör',
        
        // Formlar
        'Giriş Türü:': 'Giriş Türü:',
        'Giriş Türü': 'Giriş Türü',
        'Seçiniz': 'Seçiniz',
        'Üye Girişi': 'Üye Girişi',
        'Yönetici Girişi': 'Yönetici Girişi',
        'Hakem Girişi': 'Hakem Girişi',
        'E-posta:': 'E-posta:',
        'E-posta': 'E-posta',
        'Şifre:': 'Şifre:',
        'Şifre': 'Şifre',
        
        // Başvuru Formu
        'Başvuru Türü:': 'Başvuru Türü:',
        'Makale Sunumu': 'Makale Sunumu',
        'Bildiri Sunumu': 'Bildiri Sunumu',
        'Poster Sunumu': 'Poster Sunumu',
        'Konuşmacı Adı Soyadı:': 'Konuşmacı Adı Soyadı:',
        'Konuşmacı Unvanı:': 'Konuşmacı Unvanı:',
        'Konuşmacı Kurumu:': 'Konuşmacı Kurumu:',
        'Sunum Başlığı:': 'Sunum Başlığı:',
        'Sunum Özeti:': 'Sunum Özeti:',
        'İstenilen Tarih:': 'İstenilen Tarih:',
        'İstenilen Saat:': 'İstenilen Saat:',
        'Sunum Süresi (dakika):': 'Sunum Süresi (dakika):',
        'Ek Notlar:': 'Ek Notlar:',
        'Başvuru Gönder': 'Başvuru Gönder',
        
        // Kayıt Formu
        'Kayıt Formu': 'Kayıt Formu',
        'Ad Soyad': 'Ad Soyad',
        'Ad Soyad:': 'Ad Soyad:',
        'E-posta': 'E-posta',
        'Şifre Tekrar': 'Şifre Tekrar',
        'Telefon': 'Telefon',
        'Telefon:': 'Telefon:',
        'Kurum/Organizasyon': 'Kurum/Organizasyon',
        'Ünvan': 'Ünvan',
        'Kurum/Organizasyon:': 'Kurum/Organizasyon:',
        
        // Event Card Labels
        'Konum:': 'Konum:',
        'Kapasite:': 'Kapasite:',
        'Organizatör:': 'Organizatör:',
        'kişi': 'kişi',
        'Detayları Gör': 'Detayları Gör',
        'Katıl': 'Katıl',
        'Henüz etkinlik bulunmuyor': 'Henüz etkinlik bulunmuyor',
        'Yakında yeni etkinlikler eklenecek!': 'Yakında yeni etkinlikler eklenecek!',
        'Etkinlikler yüklenemedi': 'Etkinlikler yüklenemedi',
        'Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.': 'Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.',
        
        // Speaker Labels
        'Henüz konuşmacı bulunmuyor': 'Henüz konuşmacı bulunmuyor',
        'Yakında konuşmacı bilgileri eklenecek!': 'Yakında konuşmacı bilgileri eklenecek!',
        'Konuşmacılar yüklenemedi': 'Konuşmacılar yüklenemedi',
        
        // My Applications Page
        'Başvurularım': 'Başvurularım',
        'Başvuru yaptığınız etkinlikleri yönetin': 'Başvuru yaptığınız etkinlikleri yönetin',
        'Duruma Göre Filtrele': 'Duruma Göre Filtrele',
        'Tümü': 'Tümü',
        'Bekleme': 'Bekleme',
        'Onaylandı': 'Onaylandı',
        'Reddedildi': 'Reddedildi',
        'Başvurular yükleniyor': 'Başvurular yükleniyor',
        'Henüz başvuru bulunmamaktadır': 'Henüz başvuru bulunmamaktadır.',
        'Etkinlikleri Gör': 'Etkinlikleri Gör',
        'Başvuru Detayları': 'Başvuru Detayları',
        'Kapat': 'Kapat',
        'Sunum Türü': 'Sunum Türü',
        'Etkinlik': 'Etkinlik',
        'Başvuru Tarihi': 'Başvuru Tarihi',
        'Durum': 'Durum',
        'İptal Et': 'İptal Et',
        'Sunum Başlığı': 'Sunum Başlığı',
        'Konuşmacı Adı': 'Konuşmacı Adı',
        'Konuşmacı Ünvanı': 'Konuşmacı Ünvanı',
        'Konuşmacı Kurumu': 'Konuşmacı Kurumu',
        'Sunum Özeti': 'Sunum Özeti',
        'İstenilen Tarih': 'İstenilen Tarih',
        'İstenilen Saat': 'İstenilen Saat',
        'Sunum Süresi (dakika)': 'Sunum Süresi (dakika)',
        'dakika': 'dakika',
        'Ek Notlar': 'Ek Notlar',
        'Reddetme Sebebi': 'Reddetme Sebebi',
        'Başvuruyu iptal etmek istediğinize emin misiniz?': 'Başvuruyu iptal etmek istediğinize emin misiniz?',
        'Başvuru başarıyla iptal edildi': 'Başvuru başarıyla iptal edildi',
        'Başvuru iptal edilemedi': 'Başvuru iptal edilemedi',
        'Başvurular yüklenemedi': 'Başvurular yüklenemedi',
        
        // My Participations Page
        'Katılımlarım': 'Katılımlarım',
        'Kayıt yaptığınız etkinlikleri yönetin': 'Kayıt yaptığınız etkinlikleri yönetin',
        'Yaklaşan': 'Yaklaşan',
        'Devam Eden': 'Devam Eden',
        'Tamamlanan': 'Tamamlanan',
        'Katılımlar yükleniyor': 'Katılımlar yükleniyor',
        'Henüz etkinlik katılımı bulunmamaktadır': 'Henüz etkinlik katılımı bulunmamaktadır.',
        'Etkinlik Detayları': 'Etkinlik Detayları',
        'Tarih': 'Tarih',
        'Konum': 'Konum',
        'Kapasite': 'Kapasite',
        'Organizatör': 'Organizatör',
        'Detayları Gör': 'Detayları Gör',
        'Katılımdan Vazgeç': 'Katılımdan Vazgeç',
        'Etkinlik Adı': 'Etkinlik Adı',
        'Tarihi': 'Tarihi',
        'Açıklama': 'Açıklama',
        'Kayıt Tarihi': 'Kayıt Tarihi',
        'Bu etkinlikten katılımınızı iptal etmek istediğinize emin misiniz?': 'Bu etkinlikten katılımınızı iptal etmek istediğinize emin misiniz?',
        'Katılım başarıyla iptal edildi': 'Katılım başarıyla iptal edildi',
        'Katılım iptal edilemedi': 'Katılım iptal edilemedi',
        'Katılımlar yüklenemedi': 'Katılımlar yüklenemedi',
        
        // Announcement Labels
        'Normal': 'Normal',
        'Yüksek': 'Yüksek',
        'Acil': 'Acil',
        'Henüz duyuru bulunmamaktadır.': 'Henüz duyuru bulunmamaktadır.',
        
        // Events Page
        'Ücret:': 'Ücret:',
        'Ücretsiz': 'Ücretsiz',
        'Tümü': 'Tümü',
        'Sempozyum': 'Sempozyum',
        'Kongre': 'Kongre',
        
        // Login Page
        'Beni hatırla': 'Beni hatırla',
        'Şifremi Unuttum': 'Şifremi Unuttum',
        'Hesabınız yok mu?': 'Hesabınız yok mu?',
        'Kayıt Olun': 'Kayıt Olun',
        'Sosyal Medya': 'Sosyal Medya',
        'E-posta adresinizi girin': 'E-posta adresinizi girin',
        'Şifrenizi girin': 'Şifrenizi girin',
        
        // Şifre ve formlardaki ek metinler
        'Şifre': 'Şifre',
        'Şifre Tekrar': 'Şifre Tekrar',
        'Güçlü bir şifre oluşturun': 'Güçlü bir şifre oluşturun',
        'Şifrenizi tekrar girin': 'Şifrenizi tekrar girin',
        'Telefon': 'Telefon',
        'Telefon numaranızı girin': 'Telefon numaranızı girin',
        'Kurum/Organizasyon': 'Kurum/Organizasyon',
        'Çalıştığınız kurumu girin': 'Çalıştığınız kurumu girin',
        'Ünvan': 'Ünvan',
        'Ünvanınızı girin': 'Ünvanınızı girin'
    },
    
    en: {
        // Navigation
        'Ana Sayfa': 'Home',
        'Etkinlikler': 'Events',
        'Konuşmacılar': 'Speakers',
        'İletişim': 'Contact',
        'Kayıt Ol': 'Register',
        'Giriş Yap': 'Login',
        'Yeni Başvuru': 'New Application',
        'Çıkış': 'Logout',
        
        // Ana Sayfa
        'Sempozyum & Kongre Yönetim Sistemi': 'Symposium & Congress Management System',
        'Akademik etkinliklerinizi kolayca organize edin': 'Organize your academic events easily',
        'Güncel Etkinlikler': 'Current Events',
        'Tüm Etkinlikleri Gör': 'View All Events',
        'Konferans Salonu Açıklaması': 'Our university\'s Battalgazi Campus has a 260-person Battalgazi Conference Hall and Arslantepe Meeting Hall suitable for organizing conferences, symposiums, panels, exhibitions, concerts, stage arts, and all visual and auditory events for our students and academic staff.',
        'Konferans Salonu Kiralama': 'Conference Hall Rental',
        'Ücret Tarifesi İçin Tıklayınız': 'Click for Price List',
        'Etkinlikler Yükleniyor': 'Loading events...',
        'Duyurular': 'Announcements',
        'Duyurular Yükleniyor': 'Loading announcements...',
        'Yaklaşan Etkinlikler': 'Upcoming Events',
        'Uzman Konuşmacılar': 'Expert Speakers',
        'Tüm Hakları Saklıdır': '© 2025 Symposium & Congress. All rights reserved.',
        
        // Formlar
        'Giriş Türü:': 'Login Type:',
        'Giriş Türü': 'Login Type',
        'Seçiniz': 'Select',
        'Üye Girişi': 'Member Login',
        'Yönetici Girişi': 'Admin Login',
        'Hakem Girişi': 'Referee Login',
        'E-posta:': 'Email:',
        'E-posta': 'Email',
        'Şifre:': 'Password:',
        'Şifre': 'Password',
        
        // Başvuru Formu
        'Başvuru Türü:': 'Application Type:',
        'Makale Sunumu': 'Paper Presentation',
        'Bildiri Sunumu': 'Abstract Presentation',
        'Poster Sunumu': 'Poster Presentation',
        'Konuşmacı Adı Soyadı:': 'Speaker Name:',
        'Konuşmacı Unvanı:': 'Speaker Title:',
        'Konuşmacı Kurumu:': 'Speaker Institution:',
        'Sunum Başlığı:': 'Presentation Title:',
        'Sunum Özeti:': 'Presentation Abstract:',
        'İstenilen Tarih:': 'Requested Date:',
        'İstenilen Saat:': 'Requested Time:',
        'Sunum Süresi (dakika):': 'Presentation Duration (minutes):',
        'Ek Notlar:': 'Additional Notes:',
        'Başvuru Gönder': 'Submit Application',
        
        // Kayıt Formu
        'Kayıt Formu': 'Registration Form',
        'Ad Soyad': 'Full Name',
        'Ad Soyad:': 'Full Name:',
        'E-posta': 'Email',
        'Şifre Tekrar': 'Confirm Password',
        'Telefon': 'Phone',
        'Telefon:': 'Phone:',
        'Kurum/Organizasyon': 'Institution/Organization',
        'Ünvan': 'Title',
        'Kurum/Organizasyon:': 'Institution/Organization:',
        'Ünvan': 'Title',
        'Hesap Oluştur': 'Create Account',
        'Adınızı ve soyadınızı girin': 'Enter your name and surname',
        'E-posta adresinizi girin': 'Enter your email address',
        'Güçlü bir şifre oluşturun': 'Create a strong password',
        'Şifrenizi tekrar girin': 'Re-enter your password',
        'Telefon numaranızı girin': 'Enter your phone number',
        'Çalıştığınız kurumu girin': 'Enter your organization',
        'Ünvanınızı girin': 'Enter your title',
        'Kullanım şartlarını kabul ediyorum': 'I accept the terms of use',
        'Zaten hesabınız var mı?': 'Already have an account?',
        'Giriş Yapın': 'Login',
        
        // Event Card Labels
        'Konum:': 'Location:',
        'Kapasite:': 'Capacity:',
        'Organizatör:': 'Organizer:',
        'kişi': 'people',
        'Detayları Gör': 'View Details',
        'Katıl': 'Attend',
        'Henüz etkinlik bulunmuyor': 'No events yet',
        'Yakında yeni etkinlikler eklenecek!': 'New events will be added soon!',
        'Etkinlikler yüklenemedi': 'Failed to load events',
        'Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.': 'Please refresh the page or try again later.',
        
        // Speaker Labels
        'Henüz konuşmacı bulunmuyor': 'No speakers yet',
        'Yakında konuşmacı bilgileri eklenecek!': 'Speaker information will be added soon!',
        'Konuşmacılar yüklenemedi': 'Failed to load speakers',
        
        // My Applications Page
        'Başvurularım': 'Мои Заявки',
        'Başvuru yaptığınız etkinlikleri yönetin': 'Управляйте событиями, на которые вы подали заявку',
        'Duruma Göre Filtrele': 'Фильтр по статусу',
        'Tümü': 'Все',
        'Bekleme': 'На рассмотрении',
        'Onaylandı': 'Одобрено',
        'Reddedildi': 'Отклонено',
        'Başvurular yükleniyor': 'Загрузка заявок...',
        'Henüz başvuru bulunmamaktadır': 'Заявок нет.',
        'Etkinlikleri Gör': 'Просмотр событий',
        'Başvuru Detayları': 'Детали заявки',
        'Kapat': 'Закрыть',
        'Sunum Türü': 'Тип презентации',
        'Etkinlik': 'Событие',
        'Başvuru Tarihi': 'Дата заявки',
        'Durum': 'Статус',
        'İptal Et': 'Отменить',
        'Sunum Başlığı': 'Название презентации',
        'Konuşmacı Adı': 'Имя докладчика',
        'Konuşmacı Ünvanı': 'Должность докладчика',
        'Konuşmacı Kurumu': 'Учреждение докладчика',
        'Sunum Özeti': 'Резюме презентации',
        'İstenilen Tarih': 'Требуемая дата',
        'İstenilen Saat': 'Требуемое время',
        'Sunum Süresi (dakika)': 'Продолжительность презентации (минуты)',
        'dakika': 'минуты',
        'Ek Notlar': 'Дополнительные замечания',
        'Reddetme Sebebi': 'Причина отказа',
        'Başvuruyu iptal etmek istediğinize emin misiniz?': 'Вы уверены, что хотите отменить эту заявку?',
        'Başvuru başarıyla iptal edildi': 'Заявка успешно отменена',
        'Başvuru iptal edilemedi': 'Заявка не могла быть отменена',
        'Başvurular yüklenemedi': 'Не удалось загрузить заявки',
        
        // My Participations Page
        'Katılımlarım': 'Мои Участия',
        'Kayıt yaptığınız etkinlikleri yönetin': 'Управляйте событиями, на которые вы зарегистрировались',
        'Yaklaşan': 'Предстоящие',
        'Devam Eden': 'Текущие',
        'Tamamlanan': 'Завершенные',
        'Katılımlar yükleniyor': 'Загрузка участий...',
        'Henüz etkinlik katılımı bulunmamaktadır': 'Участий нет.',
        'Etkinlik Detayları': 'Детали события',
        'Tarih': 'Дата',
        'Konum': 'Место проведения',
        'Kapasite': 'Вместимость',
        'Organizatör': 'Организатор',
        'Detayları Gör': 'Просмотр деталей',
        'Katılımdan Vazgeç': 'Отказаться от участия',
        'Etkinlik Adı': 'Название события',
        'Tarihi': 'Дата',
        'Açıklama': 'Описание',
        'Kayıt Tarihi': 'Дата регистрации',
        'Bu etkinlikten katılımınızı iptal etmek istediğinize emin misiniz?': 'Вы уверены, что хотите отказаться от участия в этом событии?',
        'Katılım başarıyla iptal edildi': 'Участие успешно отменено',
        'Katılım iptal edilemedi': 'Участие не могло быть отменено',
        'Katılımlar yüklenemedi': 'Не удалось загрузить участия',
        
        // Announcement Labels
        'Normal': 'Normal',
        'Yüksek': 'High',
        'Acil': 'Urgent',
        'Henüz duyuru bulunmamaktadır.': 'No announcements yet.',
        
        // Events Page
        'Ücret:': 'Fee:',
        'Ücretsiz': 'Free',
        'Tümü': 'All',
        'Sempozyum': 'Symposium',
        'Kongre': 'Congress',
        
        // Login Page
        'Beni hatırla': 'Remember me',
        'Şifremi Unuttum': 'Forgot my password',
        'Hesabınız yok mu?': 'Don\'t have an account?',
        'Kayıt Olun': 'Sign Up',
        'Sosyal Medya': 'Social Media',
        'E-posta adresinizi girin': 'Enter your email address',
        'Şifrenizi girin': 'Enter your password',
        
        // Şifre ve formlardaki ek metinler
        'Şifre': 'Password',
        'Şifre Tekrar': 'Confirm Password',
        'Güçlü bir şifre oluşturun': 'Create a strong password',
        'Şifrenizi tekrar girin': 'Re-enter your password',
        'Telefon': 'Phone',
        'Telefon numaranızı girin': 'Enter your phone number',
        'Kurum/Organizasyon': 'Institution/Organization',
        'Çalıştığınız kurumu girin': 'Enter your organization',
        'Ünvan': 'Title',
        'Ünvanınızı girin': 'Enter your title'
        
    },
    
    fr: {
        // Navigation
        'Ana Sayfa': 'Accueil',
        'Etkinlikler': 'Événements',
        'Konuşmacılar': 'Conférenciers',
        'İletişim': 'Contact',
        'Kayıt Ol': 'S\'inscrire',
        'Giriş Yap': 'Se connecter',
        'Yeni Başvuru': 'Nouvelle Candidature',
        'Çıkış': 'Déconnexion',
        
        // Ana Sayfa
        'Sempozyum & Kongre Yönetim Sistemi': 'Système de Gestion des Symposiums et Congrès',
        'Akademik etkinliklerinizi kolayca organize edin': 'Organisez facilement vos événements académiques',
        'Güncel Etkinlikler': 'Événements Actuels',
        'Tüm Etkinlikleri Gör': 'Voir Tous les Événements',
        'Konferans Salonu Açıklaması': 'Le campus Battalgazi de notre université dispose d\'une salle de conférence Battalgazi de 260 places et d\'une salle de réunion Arslantepe adaptées à l\'organisation de conférences, symposiums, panels, expositions, concerts, arts de la scène et tous les événements visuels et auditifs pour nos étudiants et notre personnel académique.',
        'Konferans Salonu Kiralama': 'Location de Salle de Conférence',
        'Ücret Tarifesi İçin Tıklayınız': 'Cliquez pour la Liste des Prix',
        'Etkinlikler Yükleniyor': 'Chargement des événements...',
        'Duyurular': 'Annonces',
        'Duyurular Yükleniyor': 'Chargement des annonces...',
        'Yaklaşan Etkinlikler': 'Événements à Venir',
        'Uzman Konuşmacılar': 'Conférenciers Experts',
        'Tüm Hakları Saklıdır': '© 2025 Symposium et Congrès. Tous droits réservés.',
        
        // Formlar
        'Giriş Türü:': 'Type de Connexion:',
        'Giriş Türü': 'Type de Connexion',
        'Seçiniz': 'Sélectionner',
        'Üye Girişi': 'Connexion Membre',
        'Yönetici Girişi': 'Connexion Admin',
        'Hakem Girişi': 'Connexion Arbitre',
        'E-posta:': 'E-mail:',
        'E-posta': 'E-mail',
        'Şifre:': 'Mot de passe:',
        'Şifre': 'Mot de passe',
        
        // Başvuru Formu
        'Başvuru Türü:': 'Type de Candidature:',
        'Makale Sunumu': 'Présentation d\'Article',
        'Bildiri Sunumu': 'Présentation d\'Abstract',
        'Poster Sunumu': 'Présentation de Poster',
        'Konuşmacı Adı Soyadı:': 'Nom du Conférencier:',
        'Konuşmacı Unvanı:': 'Titre du Conférencier:',
        'Konuşmacı Kurumu:': 'Institution du Conférencier:',
        'Sunum Başlığı:': 'Titre de la Présentation:',
        'Sunum Özeti:': 'Résumé de la Présentation:',
        'İstenilen Tarih:': 'Date Demandée:',
        'İstenilen Saat:': 'Heure Demandée:',
        'Sunum Süresi (dakika):': 'Durée de la Présentation (minutes):',
        'Ek Notlar:': 'Notes Supplémentaires:',
        'Başvuru Gönder': 'Soumettre la Candidature',
        
        // Kayıt Formu
        'Kayıt Formu': 'Formulaire d\'Inscription',
        'Ad Soyad': 'Nom Complet',
        'Ad Soyad:': 'Nom Complet:',
        'E-posta': 'E-mail',
        'Şifre Tekrar': 'Confirmer le mot de passe',
        'Telefon': 'Téléphone',
        'Telefon:': 'Téléphone:',
        'Kurum/Organizasyon': 'Institution/Organisation',
        'Ünvan': 'Titre',
        'Kurum/Organizasyon:': 'Institution/Organisation:',
        'Ünvan': 'Titre',
        'Hesap Oluştur': 'Créer un Compte',
        'Adınızı ve soyadınızı girin': 'Entrez votre nom et prénom',
        'E-posta adresinizi girin': 'Entrez votre adresse e-mail',
        'Güçlü bir şifre oluşturun': 'Créez un mot de passe fort',
        'Şifrenizi tekrar girin': 'Retapez votre mot de passe',
        'Telefon numaranızı girin': 'Entrez votre numéro de téléphone',
        'Çalıştığınız kurumu girin': 'Entrez votre organisation',
        'Ünvanınızı girin': 'Entrez votre titre',
        'Kullanım şartlarını kabul ediyorum': 'J\'accepte les conditions d\'utilisation',
        'Zaten hesabınız var mı?': 'Vous avez déjà un compte?',
        'Giriş Yapın': 'Se connecter',
        
        // Event Card Labels
        'Konum:': 'Lieu:',
        'Kapasite:': 'Capacité:',
        'Organizatör:': 'Organisateur:',
        'kişi': 'personnes',
        'Detayları Gör': 'Voir Détails',
        'Katıl': 'Participer',
        'Henüz etkinlik bulunmuyor': 'Aucun événement pour le moment',
        'Yakında yeni etkinlikler eklenecek!': 'De nouveaux événements seront bientôt ajoutés!',
        'Etkinlikler yüklenemedi': 'Échec du chargement des événements',
        'Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.': 'Veuillez actualiser la page ou réessayer plus tard.',
        
        // Speaker Labels
        'Henüz konuşmacı bulunmuyor': 'Aucun conférencier pour le moment',
        'Yakında konuşmacı bilgileri eklenecek!': 'Les informations sur les conférenciers seront bientôt ajoutées!',
        'Konuşmacılar yüklenemedi': 'Échec du chargement des conférenciers',
        
        // My Applications Page
        'Başvurularım': 'Mes Candidatures',
        'Başvuru yaptığınız etkinlikleri yönetin': 'Gérez les événements auxquels vous avez postulé',
        'Duruma Göre Filtrele': 'Filtrer par Statut',
        'Tümü': 'Tous',
        'Bekleme': 'En attente',
        'Onaylandı': 'Approuvé',
        'Reddedildi': 'Rejeté',
        'Başvurular yükleniyor': 'Chargement des candidatures...',
        'Henüz başvuru bulunmamaktadır': 'Aucune candidature pour le moment.',
        'Etkinlikleri Gör': 'Voir les Événements',
        'Başvuru Detayları': 'Détails de la Candidature',
        'Kapat': 'Fermer',
        'Sunum Türü': 'Type de Présentation',
        'Etkinlik': 'Événement',
        'Başvuru Tarihi': 'Date de Candidature',
        'Durum': 'Statut',
        'İptal Et': 'Annuler',
        'Sunum Başlığı': 'Titre de la Présentation',
        'Konuşmacı Adı': 'Nom du Conférencier',
        'Konuşmacı Ünvanı': 'Titre du Conférencier',
        'Konuşmacı Kurumu': 'Institution du Conférencier',
        'Sunum Özeti': 'Résumé de la Présentation',
        'İstenilen Tarih': 'Date Demandée',
        'İstenilen Saat': 'Heure Demandée',
        'Sunum Süresi (dakika)': 'Durée de la Présentation (minutes)',
        'dakika': 'minutes',
        'Ek Notlar': 'Notes Supplémentaires',
        'Reddetme Sebebi': 'Raison du Rejet',
        'Başvuruyu iptal etmek istediğinize emin misiniz?': 'Êtes-vous sûr de vouloir annuler cette candidature?',
        'Başvuru başarıyla iptal edildi': 'Candidature annulée avec succès',
        'Başvuru iptal edilemedi': 'La candidature ne pouvait pas être annulée',
        'Başvurular yüklenemedi': 'Échec du chargement des candidatures',
        
        // Announcement Labels
        'Normal': 'Normal',
        'Yüksek': 'Élevée',
        'Acil': 'Urgent',
        'Henüz duyuru bulunmamaktadır.': 'Aucune annonce pour le moment.',
        
        // Events Page
        'Ücret:': 'Frais:',
        'Ücretsiz': 'Gratuit',
        'Tümü': 'Tous',
        'Sempozyum': 'Symposium',
        'Kongre': 'Congrès',
        
        // Login Page
        'Beni hatırla': 'Se souvenir de moi',
        'Şifremi Unuttum': 'J\'ai oublié mon mot de passe',
        'Hesabınız yok mu?': 'Vous n\'avez pas de compte?',
        'Kayıt Olun': 'S\'inscrire',
        'Sosyal Medya': 'Médias Sociaux',
        'E-posta adresinizi girin': 'Entrez votre adresse e-mail',
        'Şifrenizi girin': 'Entrez votre mot de passe',
        
        // Şifre ve formlardaki ek metinler
        'Şifre': 'Mot de passe',
        'Şifre Tekrar': 'Confirmer le mot de passe',
        'Güçlü bir şifre oluşturun': 'Créez un mot de passe fort',
        'Şifrenizi tekrar girin': 'Retapez votre mot de passe',
        'Telefon': 'Téléphone',
        'Telefon numaranızı girin': 'Entrez votre numéro de téléphone',
        'Kurum/Organizasyon': 'Institution/Organisation',
        'Çalıştığınız kurumu girin': 'Entrez votre organisation',
        'Ünvan': 'Titre',
        'Ünvanınızı girin': 'Entrez votre titre'
        
    },
    
    de: {
        // Navigation
        'Ana Sayfa': 'Startseite',
        'Etkinlikler': 'Veranstaltungen',
        'Konuşmacılar': 'Referenten',
        'İletişim': 'Kontakt',
        'Kayıt Ol': 'Registrieren',
        'Giriş Yap': 'Anmelden',
        'Yeni Başvuru': 'Neue Bewerbung',
        'Çıkış': 'Abmelden',
        
        // Ana Sayfa
        'Sempozyum & Kongre Yönetim Sistemi': 'Symposium und Kongress-Managementsystem',
        'Akademik etkinliklerinizi kolayca organize edin': 'Organisieren Sie Ihre akademischen Veranstaltungen einfach',
        'Güncel Etkinlikler': 'Aktuelle Veranstaltungen',
        'Tüm Etkinlikleri Gör': 'Alle Veranstaltungen Anzeigen',
        'Konferans Salonu Açıklaması': 'Unser Universitäts-Campus Battalgazi verfügt über einen 260-Personen-Konferenzsaal Battalgazi und einen Konferenzsaal Arslantepe, die für die Organisation von Konferenzen, Symposiumen, Panels, Ausstellungen, Konzerten, Bühnenkünsten und allen visuellen und auditiven Veranstaltungen für unsere Studenten und akademisches Personal geeignet sind.',
        'Konferans Salonu Kiralama': 'Konferenzsaal-Miete',
        'Ücret Tarifesi İçin Tıklayınız': 'Für Preisliste Klicken',
        'Etkinlikler Yükleniyor': 'Veranstaltungen werden geladen...',
        'Duyurular': 'Ankündigungen',
        'Duyurular Yükleniyor': 'Ankündigungen werden geladen...',
        'Yaklaşan Etkinlikler': 'Kommende Veranstaltungen',
        'Uzman Konuşmacılar': 'Fachreferenten',
        'Tüm Hakları Saklıdır': '© 2025 Symposium und Kongress. Alle Rechte vorbehalten.',
        
        // Formlar
        'Giriş Türü:': 'Anmeldetyp:',
        'Giriş Türü': 'Anmeldetyp',
        'Seçiniz': 'Auswählen',
        'Üye Girişi': 'Mitgliederanmeldung',
        'Yönetici Girişi': 'Admin-Anmeldung',
        'Hakem Girişi': 'Schiedsrichter-Anmeldung',
        'E-posta:': 'E-Mail:',
        'E-posta': 'E-Mail',
        'Şifre:': 'Passwort:',
        'Şifre': 'Passwort',
        
        // Başvuru Formu
        'Başvuru Türü:': 'Bewerbungsart:',
        'Makale Sunumu': 'Artikelpräsentation',
        'Bildiri Sunumu': 'Abstract-Präsentation',
        'Poster Sunumu': 'Posterpräsentation',
        'Konuşmacı Adı Soyadı:': 'Name des Referenten:',
        'Konuşmacı Unvanı:': 'Titel des Referenten:',
        'Konuşmacı Kurumu:': 'Institution des Referenten:',
        'Sunum Başlığı:': 'Titel der Präsentation:',
        'Sunum Özeti:': 'Zusammenfassung der Präsentation:',
        'İstenilen Tarih:': 'Gewünschtes Datum:',
        'İstenilen Saat:': 'Gewünschte Uhrzeit:',
        'Sunum Süresi (dakika):': 'Präsentationsdauer (Minuten):',
        'Ek Notlar:': 'Zusätzliche Notizen:',
        'Başvuru Gönder': 'Bewerbung Einreichen',
        
        // Kayıt Formu
        'Kayıt Formu': 'Registrierungsformular',
        'Ad Soyad': 'Vollständiger Name',
        'Ad Soyad:': 'Vollständiger Name:',
        'E-posta': 'E-Mail',
        'Şifre Tekrar': 'Passwort Bestätigen',
        'Telefon': 'Telefon',
        'Telefon:': 'Telefon:',
        'Kurum/Organizasyon': 'Institution/Organisation',
        'Ünvan': 'Titel',
        'Kurum/Organizasyon:': 'Institution/Organisation:',
        'Ünvan': 'Titel',
        'Hesap Oluştur': 'Konto Erstellen',
        'Adınızı ve soyadınızı girin': 'Geben Sie Ihren Namen und Nachnamen ein',
        'E-posta adresinizi girin': 'Geben Sie Ihre E-Mail-Adresse ein',
        'Güçlü bir şifre oluşturun': 'Erstellen Sie ein starkes Passwort',
        'Şifrenizi tekrar girin': 'Geben Sie Ihr Passwort erneut ein',
        'Telefon numaranızı girin': 'Geben Sie Ihre Telefonnummer ein',
        'Çalıştığınız kurumu girin': 'Geben Sie Ihre Organisation ein',
        'Ünvanınızı girin': 'Geben Sie Ihren Titel ein',
        'Kullanım şartlarını kabul ediyorum': 'Ich akzeptiere die Nutzungsbedingungen',
        'Zaten hesabınız var mı?': 'Haben Sie bereits ein Konto?',
        'Giriş Yapın': 'Anmelden',
        
        // Event Card Labels
        'Konum:': 'Standort:',
        'Kapasite:': 'Kapazität:',
        'Organizatör:': 'Organisator:',
        'kişi': 'Personen',
        'Detayları Gör': 'Details Anzeigen',
        'Katıl': 'Teilnehmen',
        'Henüz etkinlik bulunmuyor': 'Keine Veranstaltungen vorhanden',
        'Yakında yeni etkinlikler eklenecek!': 'Bald werden neue Veranstaltungen hinzugefügt!',
        'Etkinlikler yüklenemedi': 'Fehler beim Laden von Veranstaltungen',
        'Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.': 'Bitte aktualisieren Sie die Seite oder versuchen Sie es später erneut.',
        
        // Speaker Labels
        'Henüz konuşmacı bulunmuyor': 'Keine Referenten vorhanden',
        'Yakında konuşmacı bilgileri eklenecek!': 'Referenteninformationen werden bald hinzugefügt!',
        'Konuşmacılar yüklenemedi': 'Fehler beim Laden von Referenten',
        
        // My Applications Page
        'Başvurularım': 'Meine Bewerbungen',
        'Başvuru yaptığınız etkinlikleri yönetin': 'Verwalten Sie die Veranstaltungen, auf die Sie sich beworben haben',
        'Duruma Göre Filtrele': 'Nach Status Filtern',
        'Tümü': 'Alle',
        'Bekleme': 'Ausstehend',
        'Onaylandı': 'Genehmigt',
        'Reddedildi': 'Abgelehnt',
        'Başvurular yükleniyor': 'Bewerbungen werden geladen...',
        'Henüz başvuru bulunmamaktadır': 'Noch keine Bewerbungen.',
        'Etkinlikleri Gör': 'Veranstaltungen Anzeigen',
        'Başvuru Detayları': 'Bewerbungsdetails',
        'Kapat': 'Schließen',
        'Sunum Türü': 'Präsentationstyp',
        'Etkinlik': 'Veranstaltung',
        'Başvuru Tarihi': 'Bewerbungsdatum',
        'Durum': 'Status',
        'İptal Et': 'Abbrechen',
        'Sunum Başlığı': 'Präsentationstitel',
        'Konuşmacı Adı': 'Name des Referenten',
        'Konuşmacı Ünvanı': 'Titel des Referenten',
        'Konuşmacı Kurumu': 'Institution des Referenten',
        'Sunum Özeti': 'Präsentationszusammenfassung',
        'İstenilen Tarih': 'Gewünschtes Datum',
        'İstenilen Saat': 'Gewünschte Uhrzeit',
        'Sunum Süresi (dakika)': 'Präsentationsdauer (Minuten)',
        'dakika': 'Minuten',
        'Ek Notlar': 'Zusätzliche Notizen',
        'Reddetme Sebebi': 'Grund der Ablehnung',
        'Başvuruyu iptal etmek istediğinize emin misiniz?': 'Sind Sie sicher, dass Sie diese Bewerbung abbrechen möchten?',
        'Başvuru başarıyla iptal edildi': 'Bewerbung erfolgreich abgebrochen',
        'Başvuru iptal edilemedi': 'Bewerbung konnte nicht abgebrochen werden',
        'Başvurular yüklenemedi': 'Fehler beim Laden von Bewerbungen',
        
        // Announcement Labels
        'Normal': 'Normal',
        'Yüksek': 'Hoch',
        'Acil': 'Dringend',
        'Henüz duyuru bulunmamaktadır.': 'Keine Ankündigungen vorhanden.',
        
        // Events Page
        'Ücret:': 'Gebühr:',
        'Ücretsiz': 'Kostenlos',
        'Tümü': 'Alle',
        'Sempozyum': 'Symposium',
        'Kongre': 'Kongress',
        
        // Login Page
        'Beni hatırla': 'Erinnere dich an mich',
        'Şifremi Unuttum': 'Ich habe mein Passwort vergessen',
        'Hesabınız yok mu?': 'Hast du kein Konto?',
        'Kayıt Olun': 'Jetzt anmelden',
        'Sosyal Medya': 'Soziale Medien',
        'E-posta adresinizi girin': 'Geben Sie Ihre E-Mail-Adresse ein',
        'Şifrenizi girin': 'Geben Sie Ihr Passwort ein',
        
        // Şifre ve formlardaki ek metinler
        'Şifre': 'Passwort',
        'Şifre Tekrar': 'Passwort Bestätigen',
        'Güçlü bir şifre oluşturun': 'Erstellen Sie ein starkes Passwort',
        'Şifrenizi tekrar girin': 'Geben Sie Ihr Passwort erneut ein',
        'Telefon': 'Telefon',
        'Telefon numaranızı girin': 'Geben Sie Ihre Telefonnummer ein',
        'Kurum/Organizasyon': 'Institution/Organisation',
        'Çalıştığınız kurumu girin': 'Geben Sie Ihre Organisation ein',
        'Ünvan': 'Titel',
        'Ünvanınızı girin': 'Geben Sie Ihren Titel ein'
        
    },
    
    ru: {
        // Navigation
        'Ana Sayfa': 'Главная',
        'Etkinlikler': 'Мероприятия',
        'Konuşmacılar': 'Докладчики',
        'İletişim': 'Контакты',
        'Kayıt Ol': 'Регистрация',
        'Giriş Yap': 'Войти',
        'Yeni Başvuru': 'Новая Заявка',
        'Çıkış': 'Выйти',
        
        // Ana Sayfa
        'Sempozyum & Kongre Yönetim Sistemi': 'Система Управления Симпозиумами и Конгрессами',
        'Akademik etkinliklerinizi kolayca organize edin': 'Легко организуйте свои академические мероприятия',
        'Güncel Etkinlikler': 'Текущие Мероприятия',
        'Tüm Etkinlikleri Gör': 'Посмотреть Все Мероприятия',
        'Konferans Salonu Açıklaması': 'Кампус Баттальгази нашего университета имеет конференц-зал Баттальгази на 260 человек и зал заседаний Арслантепе, подходящие для организации конференций, симпозиумов, панелей, выставок, концертов, сценических искусств и всех визуальных и слуховых мероприятий для наших студентов и академического персонала.',
        'Konferans Salonu Kiralama': 'Аренда Конференц-Зала',
        'Ücret Tarifesi İçin Tıklayınız': 'Нажмите для Прайс-Листа',
        'Etkinlikler Yükleniyor': 'Загрузка мероприятий...',
        'Duyurular': 'Объявления',
        'Duyurular Yükleniyor': 'Загрузка объявлений...',
        'Yaklaşan Etkinlikler': 'Предстоящие Мероприятия',
        'Uzman Konuşmacılar': 'Экспертные Докладчики',
        'Tüm Hakları Saklıdır': '© 2025 Симпозиум и Конгресс. Все права защищены.',
        
        // Formlar
        'Giriş Türü:': 'Тип Входа:',
        'Giriş Türü': 'Тип Входа',
        'Seçiniz': 'Выбрать',
        'Üye Girişi': 'Вход для Участников',
        'Yönetici Girişi': 'Вход Администратора',
        'Hakem Girişi': 'Вход Арбитра',
        'E-posta:': 'Электронная почта:',
        'E-posta': 'Электронная почта',
        'Şifre:': 'Пароль:',
        'Şifre': 'Пароль',
        
        // Başvuru Formu
        'Başvuru Türü:': 'Тип Заявки:',
        'Makale Sunumu': 'Презентация Статьи',
        'Bildiri Sunumu': 'Презентация Тезисов',
        'Poster Sunumu': 'Презентация Постера',
        'Konuşmacı Adı Soyadı:': 'Имя Докладчика:',
        'Konuşmacı Unvanı:': 'Должность Докладчика:',
        'Konuşmacı Kurumu:': 'Организация Докладчика:',
        'Sunum Başlığı:': 'Название Доклада:',
        'Sunum Özeti:': 'Резюме Доклада:',
        'İstenilen Tarih:': 'Желаемая Дата:',
        'İstenilen Saat:': 'Желаемое Время:',
        'Sunum Süresi (dakika):': 'Длительность Доклада (минуты):',
        'Ek Notlar:': 'Дополнительные Заметки:',
        'Başvuru Gönder': 'Отправить Заявку',
        
        // Kayıt Formu
        'Kayıt Formu': 'Форма Регистрации',
        'Ad Soyad': 'Полное Имя',
        'Ad Soyad:': 'Полное Имя:',
        'E-posta': 'Электронная почта',
        'Şifre Tekrar': 'Подтверждение Пароля',
        'Telefon': 'Телефон',
        'Telefon:': 'Телефон:',
        'Kurum/Organizasyon': 'Организация/Учреждение',
        'Ünvan': 'Должность',
        'Kurum/Organizasyon:': 'Организация/Учреждение:',
        'Ünvan': 'Должность',
        'Hesap Oluştur': 'Создать Аккаунт',
        'Adınızı ve soyadınızı girin': 'Введите ваше имя и фамилию',
        'E-posta adresinizi girin': 'Введите ваш адрес электронной почты',
        'Güçlü bir şifre oluşturun': 'Создайте надежный пароль',
        'Şifrenizi tekrar girin': 'Повторно введите ваш пароль',
        'Telefon numaranızı girin': 'Введите ваш номер телефона',
        'Çalıştığınız kurumu girin': 'Введите вашу организацию',
        'Ünvanınızı girin': 'Введите вашу должность',
        'Kullanım şartlarını kabul ediyorum': 'Я принимаю условия использования',
        'Zaten hesabınız var mı?': 'У вас уже есть аккаунт?',
        'Giriş Yapın': 'Войти',
        
        // Event Card Labels
        'Konum:': 'Местоположение:',
        'Kapasite:': 'Вместимость:',
        'Organizatör:': 'Организатор:',
        'kişi': 'человек',
        'Detayları Gör': 'Посмотреть Детали',
        'Katıl': 'Присоединиться',
        'Henüz etkinlik bulunmuyor': 'Событий пока нет',
        'Yakında yeni etkinlikler eklenecek!': 'Вскоре будут добавлены новые мероприятия!',
        'Etkinlikler yüklenemedi': 'Ошибка загрузки событий',
        'Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.': 'Пожалуйста, обновите страницу или попробуйте позже.',
        
        // Speaker Labels
        'Henüz konuşmacı bulunmuyor': 'Докладчиков пока нет',
        'Yakında konuşmacı bilgileri eklenecek!': 'Информация о докладчиках будет добавлена вскоре!',
        'Konuşmacılar yüklenemedi': 'Ошибка загрузки докладчиков',
        
        // My Applications Page
        'Başvurularım': 'Мои Заявки',
        'Başvuru yaptığınız etkinlikleri yönetin': 'Управляйте мероприятиями, на которые вы подали заявку',
        'Duruma Göre Filtrele': 'Фильтр по Статусу',
        'Tümü': 'Все',
        'Bekleme': 'На рассмотрении',
        'Onaylandı': 'Одобрено',
        'Reddedildi': 'Отклонено',
        'Başvurular yükleniyor': 'Загрузка заявок...',
        'Henüz başvuru bulunmamaktadır': 'Пока нет заявок.',
        'Etkinlikleri Gör': 'Посмотреть Мероприятия',
        'Başvuru Detayları': 'Детали Заявки',
        'Kapat': 'Закрыть',
        'Sunum Türü': 'Тип Презентации',
        'Etkinlik': 'Мероприятие',
        'Başvuru Tarihi': 'Дата Заявки',
        'Durum': 'Статус',
        'İptal Et': 'Отменить',
        'Sunum Başlığı': 'Название Доклада',
        'Konuşmacı Adı': 'Имя Докладчика',
        'Konuşmacı Ünvanı': 'Должность Докладчика',
        'Konuşmacı Kurumu': 'Организация Докладчика',
        'Sunum Özeti': 'Резюме Доклада',
        'İstenilen Tarih': 'Желаемая Дата',
        'İstenilen Saat': 'Желаемое Время',
        'Sunum Süresi (dakika)': 'Длительность Доклада (минуты)',
        'dakika': 'минут',
        'Ek Notlar': 'Дополнительные Заметки',
        'Reddetme Sebebi': 'Причина Отклонения',
        'Başvuruyu iptal etmek istediğinize emin misiniz?': 'Вы уверены, что хотите отменить эту заявку?',
        'Başvuru başarıyla iptal edildi': 'Заявка успешно отменена',
        'Başvuru iptal edilemedi': 'Не удалось отменить заявку',
        'Başvurular yüklenemedi': 'Ошибка загрузки заявок',
        
        // Announcement Labels
        'Normal': 'Обычный',
        'Yüksek': 'Высокий',
        'Acil': 'Срочно',
        'Henüz duyuru bulunmamaktadır.': 'Объявлений пока нет.',
        
        // Events Page
        'Ücret:': 'Сбор:',
        'Ücretsiz': 'Бесплатно',
        'Tümü': 'Все',
        'Sempozyum': 'Симпозиум',
        'Kongre': 'Конгресс',
        
        // Login Page
        'Beni hatırla': 'Запомнить меня',
        'Şifremi Unuttum': 'Забыли пароль',
        'Hesabınız yok mu?': 'Нет учетной записи?',
        'Kayıt Olun': 'Зарегистрироваться',
        'Sosyal Medya': 'Социальные сети',
        'E-posta adresinizi girin': 'Введите свой адрес электронной почты',
        'Şifrenizi girin': 'Введите ваш пароль',
        
        // Şifre ve formlardaki ek metinler
        'Şifre': 'Пароль',
        'Şifre Tekrar': 'Подтверждение Пароля',
        'Güçlü bir şifre oluşturun': 'Создайте надежный пароль',
        'Şifrenizi tekrar girin': 'Повторно введите ваш пароль',
        'Telefon': 'Телефон',
        'Telefon numaranızı girin': 'Введите ваш номер телефона',
        'Kurum/Organizasyon': 'Организация/Учреждение',
        'Çalıştığınız kurumu girin': 'Введите вашу организацию',
        'Ünvan': 'Должность',
        'Ünvanınızı girin': 'Введите вашу должность'
        
    }
};

// Mevcut dil
let currentLanguage = localStorage.getItem('language') || 'tr';

// Dil değiştirme dropdown'ını aç/kapat
function toggleLanguageDropdown() {
    const dropdown = document.getElementById('language-dropdown');
    const isVisible = dropdown.classList.contains('show');
    
    // Tüm dropdown'ları kapat
    document.querySelectorAll('.language-dropdown').forEach(d => {
        d.classList.remove('show');
    });
    
    // Tıklanan dropdown'ı aç/kapat
    if (!isVisible) {
        dropdown.classList.add('show');
    }
}

// Sayfa dışına tıklandığında dropdown'ı kapat
document.addEventListener('click', function(e) {
    if (!e.target.closest('.language-switcher')) {
        document.querySelectorAll('.language-dropdown').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
});

// Dil değiştirme fonksiyonu
function switchLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Ana buton metnini güncelle
    const currentLangSpan = document.querySelector('.current-lang');
    if (currentLangSpan) {
        currentLangSpan.textContent = lang.toUpperCase();
    }
    
    // Dropdown seçeneklerini güncelle
    document.querySelectorAll('.lang-option').forEach(option => {
        option.classList.remove('active');
        if (option.getAttribute('data-lang') === lang) {
            option.classList.add('active');
        }
    });
    
    // Dropdown'ı kapat
    document.querySelectorAll('.language-dropdown').forEach(dropdown => {
        dropdown.classList.remove('show');
    });
    
    // Sayfadaki metinleri çevir
    translatePage(lang);
}

// Sayfayı çevir
function translatePage(lang) {
    // Normal çeviriler
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translations[lang][key];
            } else if (element.tagName === 'INPUT' && element.placeholder) {
                element.placeholder = translations[lang][key];
            } else if (element.tagName === 'OPTION') {
                element.textContent = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });
    
    // Placeholder çevirileri
    const placeholderElements = document.querySelectorAll('[data-translate-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (translations[lang] && translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
    
    // Sayfada focus varsa çıkar
    document.activeElement.blur();
    
    // Etkinlikleri, duyuruları, konuşmacıları ve home events'leri yeniden yükle
    const eventsContainer = document.getElementById('events-list');
    const announcementsContainer = document.querySelector('.announcements-container');
    const homeEventsContainer = document.getElementById('home-events-list');
    const speakersContainer = document.getElementById('speakers-list');
    
    if (eventsContainer) {
        loadEvents();
    }
    if (announcementsContainer) {
        loadAnnouncements();
    }
    if (homeEventsContainer) {
        loadHomeEvents();
    }
    if (speakersContainer) {
        loadSpeakers();
    }
}

// Çeviri helper fonksiyonu
function getTranslation(key) {
    if (translations[currentLanguage] && translations[currentLanguage][key]) {
        return translations[currentLanguage][key];
    }
    return key; // Eğer çeviri bulunamazsa orijinal metni döndür
}

// Katılma formuna yönlendirme
// Katılma formu submit handler
async function handleParticipation(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const participationData = Object.fromEntries(formData);

    // Form validasyonu - required alanları kontrol et
    const nameField = e.target.querySelector('#participant-name');
    const emailField = e.target.querySelector('#participant-email');
    const phoneField = e.target.querySelector('#participant-phone');
    const termsField = e.target.querySelector('#participation-terms');
    const eventIdField = e.target.querySelector('#participation-event-id');

    if (!nameField.value.trim()) {
        showMessage('Lütfen ad soyad alanını doldurun', 'error');
        nameField.focus();
        return;
    }

    if (!emailField.value.trim()) {
        showMessage('Lütfen e-posta alanını doldurun', 'error');
        emailField.focus();
        return;
    }

    if (!phoneField.value.trim()) {
        showMessage('Lütfen telefon numarası alanını doldurun', 'error');
        phoneField.focus();
        return;
    }

    if (!termsField.checked) {
        showMessage('Katılım şartlarını kabul etmeniz gerekiyor', 'error');
        termsField.focus();
        return;
    }

    if (!eventIdField.value) {
        showMessage('Etkinlik bilgisi bulunamadı', 'error');
        return;
    }

    try {
        // Form loading state
        const form = e.target;
        form.classList.add('form-loading');

        const response = await fetch(`${API_BASE_URL}/participants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                eventId: eventIdField.value,
                name: nameField.value.trim(),
                email: emailField.value.trim(),
                phone: phoneField.value.trim(),
                organization: e.target.querySelector('#participant-organization').value.trim() || ''
            })
        });

        const result = await response.json();

        if (response.ok) {
            // Başarı mesajı göster
            showMessage('Etkinliğe başarıyla kaydoldunuz! Katılım bilgileriniz e-posta adresinize gönderildi.', 'success');
            
            // Formu temizle
            e.target.reset();
            
            // 3 saniye sonra etkinlikler sayfasına yönlendir
            setTimeout(() => {
                window.location.href = 'events.html';
            }, 3000);
            
        } else {
            if (result.message.includes('already registered') || result.message.includes('zaten kayıtlı')) {
                showMessage('Bu etkinliğe zaten kayıtlısınız!', 'warning');
            } else if (result.message.includes('capacity') || result.message.includes('kapasite')) {
                showMessage('Etkinlik kapasitesi dolmuş! Kayıt alınamıyor.', 'error');
            } else {
                showMessage(result.message || 'Kayıt sırasında hata oluştu', 'error');
            }
        }
    } catch (error) {
        console.error('Katılma hatası:', error);
        showMessage('Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.', 'error');
    } finally {
        // Loading state'i kaldır
        const form = e.target;
        form.classList.remove('form-loading');
    }
}

// Etkinlik bilgilerini yükle (katılma formu için)
async function loadEventInfo(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
        
        if (response.ok) {
            const event = await response.json();
            
            // Etkinlik bilgilerini forma yaz
            document.getElementById('event-title').textContent = event.title;
            document.getElementById('event-date').textContent = formatDate(event.date);
            document.getElementById('event-location').textContent = event.location;
            document.getElementById('event-capacity').textContent = `${event.capacity} kişi kapasiteli`;
            
            // Loading state'i kaldır
            const eventInfo = document.getElementById('event-info');
            if (eventInfo) {
                eventInfo.classList.remove('loading');
            }
        } else {
            console.error('Etkinlik bilgileri yüklenemedi');
            document.getElementById('event-title').textContent = 'Etkinlik bilgileri yüklenemedi';
        }
    } catch (error) {
        console.error('Etkinlik bilgileri yüklenirken hata:', error);
        document.getElementById('event-title').textContent = 'Etkinlik bilgileri yüklenemedi';
    }
}

// Etkinliğe katılma işlemini doğrudan yap
async function handleEventParticipation(eventId) {
    try {
        const token = localStorage.getItem('token');
        const userData = JSON.parse(localStorage.getItem('userData'));
        
        if (!token || !userData) {
            showMessage('Giriş bilgileri bulunamadı', 'error');
            return;
        }
        
        // Katılımcı olarak kayıt ol
        const participantData = {
            eventId: eventId,
            name: userData.profile?.firstName + ' ' + userData.profile?.lastName || userData.username,
            email: userData.email,
            phone: userData.profile?.phone || '',
            organization: userData.profile?.organization || ''
        };
        
        const response = await fetch(`${API_BASE_URL}/participants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(participantData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('Etkinliğe başarıyla kaydoldunuz!', 'success');
            setTimeout(() => {
                window.location.href = 'events.html';
            }, 2000);
        } else {
            showMessage(result.message || 'Katılma işlemi sırasında hata oluştu', 'error');
            setTimeout(() => {
                window.location.href = 'events.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Katılma hatası:', error);
        showMessage('Katılma işlemi sırasında hata oluştu', 'error');
        setTimeout(() => {
            window.location.href = 'events.html';
        }, 2000);
    }
}

// Etkinlik filtreleme fonksiyonu
function filterEvents(category) {
    const eventCards = document.querySelectorAll('.event-card');
    const filterBtns = document.querySelectorAll('.event-filters .filter-btn');
    
    // Aktif buton stilini güncelle
    filterBtns.forEach(btn => btn.classList.remove('active'));
    // Tıklanan kategoriyi aktif yap
    const activeBtn = document.querySelector(`.event-filters .filter-btn[onclick="filterEvents('${category}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Etkinlikleri filtrele
    eventCards.forEach(card => {
        if (category === 'all') {
            card.style.display = 'block';
        } else {
            const eventType = card.dataset.eventType || '';
            if (eventType.toLowerCase().includes(category.toLowerCase())) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });
    
    // Animasyon ekle
    setTimeout(() => {
        eventCards.forEach(card => {
            if (card.style.display !== 'none') {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }
        });
    }, 100);
}

// Konuşmacı filtreleme fonksiyonu
function filterSpeakers(category) {
    const speakerCards = document.querySelectorAll('.speaker-card');
    const filterBtns = document.querySelectorAll('.speaker-filters .filter-btn');
    
    // Aktif buton stilini güncelle
    filterBtns.forEach(btn => btn.classList.remove('active'));
    // Tıklanan kategoriyi aktif yap
    const activeBtn = document.querySelector(`.speaker-filters .filter-btn[onclick="filterSpeakers('${category}')"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Konuşmacıları filtrele
    speakerCards.forEach(card => {
        if (category === 'all') {
            card.style.display = 'block';
        } else {
            const speakerTitle = card.dataset.speakerTitle || '';
            if (speakerTitle.toLowerCase().includes(category.toLowerCase())) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });
    
    // Animasyon ekle
    setTimeout(() => {
        speakerCards.forEach(card => {
            if (card.style.display !== 'none') {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }
        });
    }, 100);
}

// Etkinlik detaylarını göster
function showEventDetails(eventId) {
    // Modal açmak yerine basit alert ile detayları göster
    // İleride modal eklenebilir
    fetch(`${API_BASE_URL}/events/${eventId}`)
        .then(response => response.json())
        .then(event => {
            const details = `
${event.title}

Tarih: ${formatDate(event.date)}
Konum: ${event.location}
Kapasite: ${event.capacity} kişi
Ücret: ${event.fee ? event.fee + ' ₺' : 'Ücretsiz'}

Açıklama:
${event.description}

${event.speakers && event.speakers.length > 0 ? 
  `Konuşmacılar: ${event.speakers.map(s => s.name).join(', ')}` : 
  ''
}
            `;
            alert(details.trim());
        })
        .catch(error => {
            console.error('Etkinlik detayları yüklenemedi:', error);
            alert('Etkinlik detayları yüklenirken bir hata oluştu.');
        });
}

function goToParticipation(eventId) {
    // Kullanıcı giriş yapmış mı kontrol et
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');

    if (!token || !userData) {
        // Kullanıcı giriş yapmamış - login sayfasına yönlendir
        // Event ID'yi localStorage'a kaydet ki giriş sonrası kullanılabilsin
        localStorage.setItem('pendingParticipationEventId', eventId);
        showMessage('Etkinliğe katılabilmek için önce giriş yapmanız gerekiyor.', 'info');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    // Kullanıcı giriş yapmış - katılma formuna yönlendir
    window.location.href = `katilmaformu.html?eventId=${eventId}`;
}

// Katılma formu submit handler'ını ekle
document.addEventListener('DOMContentLoaded', function() {
    // URL parametrelerini kontrol et
    checkUrlParameters();
    
    // Diğer event listener'lar...
    
    // Katılma formu submit
    const participationForm = document.getElementById('participation-form');
    if (participationForm) {
        participationForm.addEventListener('submit', handleParticipation);
    }
});

// Katılma formu işleyici
async function handleParticipation(e) {
    e.preventDefault();
    
    // Form element'lerini direkt al
    const nameField = e.target.querySelector('#participant-name, input[name="name"]');
    const surnameField = e.target.querySelector('input[name="surname"]');
    const emailField = e.target.querySelector('#participant-email, input[name="email"]');
    const phoneField = e.target.querySelector('#participant-phone, input[name="phone"]');
    const termsField = e.target.querySelector('#participation-terms, input[name="terms"]');
    const eventIdField = e.target.querySelector('#participation-event-id, input[name="eventId"]');
    const organizationField = e.target.querySelector('#participant-organization, input[name="organization"]');
    
    // Form validasyonu - alanların var olup olmadığını kontrol et
    if (nameField && !nameField.value.trim()) {
        showMessage('Lütfen ad alanını doldurun', 'error');
        nameField.focus();
        return;
    }
    
    if (surnameField && !surnameField.value.trim()) {
        showMessage('Lütfen soyad alanını doldurun', 'error');
        surnameField.focus();
        return;
    }
    
    if (emailField && !emailField.value.trim()) {
        showMessage('Lütfen e-posta alanını doldurun', 'error');
        emailField.focus();
        return;
    }
    
    if (phoneField && !phoneField.value.trim()) {
        showMessage('Lütfen telefon numarası alanını doldurun', 'error');
        phoneField.focus();
        return;
    }
    
    if (termsField && !termsField.checked) {
        showMessage('Katılım şartlarını kabul etmeniz gerekiyor', 'error');
        termsField.focus();
        return;
    }
    
    // Email validasyonu
    if (emailField) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value.trim())) {
            showMessage('Lütfen geçerli bir e-posta adresi girin!', 'error');
            emailField.focus();
            return;
        }
    }
    
    try {
        // API'ye katılım verisi gönder
        const fullName = surnameField 
            ? `${nameField.value.trim()} ${surnameField.value.trim()}`
            : nameField.value.trim();
        
        // Token'ı al
        const token = localStorage.getItem('token');
        
        const headers = {
            'Content-Type': 'application/json',
        };
        
        // Eğer token varsa, Authorization header'ına ekle
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
            
        const response = await fetch(`${API_BASE_URL}/participants`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                fullName: fullName,
                name: nameField.value.trim(),
                email: emailField.value.trim(),
                phone: phoneField.value.trim(),
                organization: organizationField ? organizationField.value.trim() : '',
                eventId: eventIdField ? eventIdField.value : ''
            })
        });

        const result = await response.json();

        if (response.ok) {
            showMessage('Katılımınız başarıyla kaydedildi! Yakında e-posta ile bilgilendirme alacaksınız.', 'success');
            e.target.reset();
            
            // 3 saniye sonra ana sayfaya yönlendir
            setTimeout(() => {
                showSection('home');
            }, 3000);
        } else {
            showMessage(result.message || 'Katılım kaydı sırasında hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Katılım hatası:', error);
        showMessage('Katılım kaydı sırasında hata oluştu', 'error');
    }
}

// Sayfa yüklendiğinde dili ayarla
document.addEventListener('DOMContentLoaded', function() {
    // Kaydedilen dili uygula
    switchLanguage(currentLanguage);
});

// ===========================================
// DUYURU YÖNETİMİ FONKSİYONLARI
// ===========================================

// Ana sayfada duyuruları yükle
async function loadAnnouncements() {
    try {
        console.log('📢 Ana sayfa duyuruları yükleniyor...');
        
        const response = await fetch(`${API_BASE_URL}/announcements/active`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const announcements = await response.json();
        console.log('📢 Duyurular alındı:', announcements.length);
        
        // Ana sayfada duyuru container'ını bul
        const announcementsContainer = document.querySelector('.announcements-container') || 
                                     document.querySelector('[style*="📢 Duyurular"]')?.parentElement ||
                                     document.querySelector('.hero').querySelector('[style*="flex: 1"]');
        
        if (!announcementsContainer) {
            console.warn('⚠️ Duyuru container bulunamadı');
            return;
        }
        
        // Duyuru başlığını koru, sadece içeriği değiştir
        let announcementsHTML = `
            <h3 class="announcements-title" data-translate="Duyurular">${getTranslation('Duyurular')}</h3>
            <div id="announcements-list">
        `;
        
        if (announcements && announcements.length > 0) {
            // Duyuruları tarih sırasına göre sırala (en yeni önce)
            const sortedAnnouncements = announcements.sort((a, b) => {
                const dateA = new Date(a.date || a.createdAt);
                const dateB = new Date(b.date || b.createdAt);
                return dateB - dateA; // Yeni tarihler önce (descending)
            });
            
            sortedAnnouncements.slice(0, 3).forEach((announcement, index) => {
                const typeColors = {
                    'info': 'linear-gradient(135deg, #3498db, #2980b9)',
                    'warning': 'linear-gradient(135deg, #f39c12, #e67e22)',
                    'success': 'linear-gradient(135deg, #27ae60, #229954)',
                    'event': 'linear-gradient(135deg, #9b59b6, #8e44ad)'
                };
                
                const typeLabels = {
                    'info': 'ℹ️',
                    'warning': '⚠️',
                    'success': '✅',
                    'event': '🎫'
                };
                
                const priorityColors = {
                    'normal': 'rgba(108, 117, 125, 0.1)',
                    'high': 'rgba(253, 126, 20, 0.1)',
                    'urgent': 'rgba(220, 53, 69, 0.1)'
                };
                
                const priorityLabels = {
                    'normal': getTranslation('Normal'),
                    'high': getTranslation('Yüksek'),
                    'urgent': getTranslation('Acil')
                };
                
                const dateToShow = announcement.date || announcement.createdAt;
                const formattedDate = dateToShow ? new Date(dateToShow).toLocaleDateString('tr-TR') : '';
                
                announcementsHTML += `
                    <div style="background: #f8f9fa; border-left: 4px solid ${typeColors[announcement.type] || '#3498db'}; padding: 1.5rem; margin-bottom: 1.5rem; border-radius: 0 8px 8px 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h4 style="color: #2c3e50; margin: 0; font-size: 1.1em;">
                                ${typeLabels[announcement.type] || 'ℹ️'} ${announcement.title}
                            </h4>
                            <span style="background: ${priorityColors[announcement.priority] || '#6c757d'}; color: white; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.8em;">
                                ${priorityLabels[announcement.priority] || getTranslation('Normal')}
                            </span>
                        </div>
                        <p style="color: #555; margin-bottom: 0.8rem; line-height: 1.4;">
                            ${announcement.content}
                        </p>
                        <div style="font-size: 0.9em; color: #666;">
                            <span>📅 ${formattedDate}</span>
                        </div>
                    </div>
                `;
            });
            announcementsHTML += `
                </div>
            `;
        } else {
            announcementsHTML += `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <div style="margin-bottom: 0.5rem; font-size: 1.2rem;">📭</div>
                    <div style="font-size: 0.9rem;">${getTranslation('Henüz duyuru bulunmamaktadır.')}</div>
                </div>
            `;
        }
        
        announcementsContainer.innerHTML = announcementsHTML;
        
    } catch (error) {
        console.error('❌ Ana sayfa duyuruları yüklenirken hata:', error);
        
        // Hata durumunda varsayılan mesaj göster
        const announcementsContainer = document.querySelector('.announcements-container') || 
                                     document.querySelector('.hero').querySelector('[style*="flex: 1"]');
        if (announcementsContainer) {
            announcementsContainer.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 2rem;">
                    <div style="background: linear-gradient(135deg, #e74c3c, #c0392b); width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 1rem;">
                        <span style="font-size: 1.3rem;">📢</span>
                    </div>
                    <h3 style="color: #2c3e50; margin: 0; font-size: 1.5rem; font-weight: 600;">Duyurular</h3>
                </div>
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <div style="margin-bottom: 0.5rem; font-size: 1.2rem;">❌</div>
                    <div style="font-size: 0.9rem;">Duyurular yüklenirken hata oluştu.</div>
                </div>
            `;
        }
    }
}

// Ana sayfa istatistiklerini yükle
async function loadHomePageStats() {
    try {
        console.log('📊 Ana sayfa istatistikleri yükleniyor...');
        
        // Etkinlikler ve başvuruları paralel olarak yükle
        const [eventsResponse, applicationsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/events`),
            fetch(`${API_BASE_URL}/applications`)
        ]);
        
        let totalEvents = 0;
        let totalApplications = 0;
        
        if (eventsResponse.ok) {
            const events = await eventsResponse.json();
            totalEvents = events.length;
        }
        
        if (applicationsResponse.ok) {
            const applications = await applicationsResponse.json();
            totalApplications = applications.length;
        }
        
        // İstatistikleri güncelle
        const totalEventsElement = document.getElementById('total-events');
        const totalApplicationsElement = document.getElementById('total-applications');
        
        if (totalEventsElement) {
            // Animasyonlu sayaç efekti
            animateNumber(totalEventsElement, totalEvents);
        }
        
        if (totalApplicationsElement) {
            animateNumber(totalApplicationsElement, totalApplications);
        }
        
        console.log(`📊 İstatistikler güncellendi - Etkinlikler: ${totalEvents}, Başvurular: ${totalApplications}`);
        
    } catch (error) {
        console.error('❌ Ana sayfa istatistikleri yüklenirken hata:', error);
        
        // Hata durumunda varsayılan değerler
        const totalEventsElement = document.getElementById('total-events');
        const totalApplicationsElement = document.getElementById('total-applications');
        
        if (totalEventsElement) totalEventsElement.textContent = '0';
        if (totalApplicationsElement) totalApplicationsElement.textContent = '0';
    }
}

// Sayı animasyonu fonksiyonu
function animateNumber(element, targetNumber) {
    const startNumber = 0;
    const duration = 1500; // 1.5 saniye
    const startTime = Date.now();
    
    function updateNumber() {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentNumber = Math.floor(startNumber + (targetNumber - startNumber) * easeOut);
        
        element.textContent = currentNumber;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        } else {
            element.textContent = targetNumber; // Son değeri garanti et
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// ===========================================
// ŞİFRE SIFIRLAMA FONKSİYONLARI
// ===========================================

// Şifremi unuttum formu işleyici
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    
    try {
        console.log('📧 Şifre sıfırlama e-postası gönderiliyor:', email);
        
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Başarılı durumda formu gizle ve başarı mesajını göster
            document.getElementById('forgot-password-form-container').style.display = 'none';
            document.getElementById('forgot-password-success').style.display = 'block';
            
            // Geliştirme amaçlı - token'ı konsola yazdır
            if (result.resetToken) {
                console.log('🔑 Reset token:', result.resetToken);
                showMessage('Şifre sıfırlama token\'ı console\'da görüntülendi (geliştirme modu)', 'info');
            }
            
            console.log('✅ Şifre sıfırlama e-postası gönderildi');
        } else {
            showMessage(result.message || 'E-posta gönderilirken hata oluştu', 'error');
        }
        
    } catch (error) {
        console.error('❌ Şifre sıfırlama hatası:', error);
        showMessage('E-posta gönderilirken hata oluştu', 'error');
    }
}

// Yeni şifre oluşturma fonksiyonu
async function handleResetPassword(event) {
    event.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Şifre eşleşme kontrolü
    if (newPassword !== confirmPassword) {
        showMessage('Şifreler eşleşmiyor', 'error');
        return;
    }
    
    // URL'den token'ı al
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        showMessage('Geçersiz sıfırlama bağlantısı', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, newPassword })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('reset-password-form-section').style.display = 'none';
            document.getElementById('reset-password-success').style.display = 'block';
            showMessage('Şifre başarıyla güncellendi', 'success');
            
            // URL'den token parametresini temizle
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            showMessage(data.message || 'Bir hata oluştu', 'error');
        }
    } catch (error) {
        console.error('Şifre sıfırlama hatası:', error);
        showMessage('Bağlantı hatası', 'error');
    }
}

// URL parametrelerini kontrol et (şifre sıfırlama için)
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const eventId = urlParams.get('eventId');
    
    if (token) {
        // Şifre sıfırlama token'ı varsa, şifre sıfırlama sayfasını göster
        showResetPassword();
    }
    
    if (eventId) {
        // Event ID parametresi varsa
        const eventIdInput = document.getElementById('reg-event-id');
        if (eventIdInput) {
            // Kayıt formundaki gizli alana yaz
            eventIdInput.value = eventId;
            console.log('Event ID set for registration:', eventId);
        }
        
        const participationEventIdInput = document.getElementById('participation-event-id');
        if (participationEventIdInput) {
            // Katılma formundaki gizli alana yaz
            participationEventIdInput.value = eventId;
            console.log('Event ID set for participation:', eventId);
            // Etkinlik bilgilerini yükle
            loadEventInfo(eventId);
        }
    }
}

// Şifre sıfırlama sayfasını göster
function showResetPassword() {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    document.getElementById('reset-password-page').style.display = 'block';
}

// Şifremi unuttum formu işleyici
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = e.target.querySelector('#forgot-email').value.trim();
    
    if (!email) {
        showMessage('Lütfen e-posta adresinizi girin', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi', 'success');
            e.target.reset();
        } else {
            showMessage(result.message || 'E-posta gönderilemedi', 'error');
        }
    } catch (error) {
        console.error('Şifre sıfırlama hatası:', error);
        showMessage('Şifre sıfırlama sırasında hata oluştu', 'error');
    }
}

// Şifre sıfırlama formu işleyici
async function handleResetPassword(e) {
    e.preventDefault();
    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const newPassword = e.target.querySelector('#new-password').value;
    const confirmPassword = e.target.querySelector('#confirm-password').value;
    
    if (!token) {
        showMessage('Geçersiz sıfırlama bağlantısı', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage('Şifreler eşleşmiyor', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('Şifre en az 6 karakter olmalı', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, newPassword })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('Şifreniz başarıyla güncellendi', 'success');
            e.target.reset();
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showMessage(result.message || 'Şifre güncellenemedi', 'error');
        }
    } catch (error) {
        console.error('Şifre sıfırlama hatası:', error);
        showMessage('Şifre sıfırlama sırasında hata oluştu', 'error');
    }
}

// URL parametrelerini kontrol et (şifre sıfırlama ve etkinlik katılımı için)
function checkUrlParameters() {
    console.log('checkUrlParameters çağrıldı');
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const eventId = urlParams.get('eventId');
    
    console.log('URL params - token:', token, 'eventId:', eventId);
    
    if (token && window.location.pathname.includes('reset-password')) {
        // Reset password sayfası için token'ı sakla
        localStorage.setItem('resetToken', token);
    }
    
    if (eventId) {
        console.log('Event ID bulundu, formlara set ediliyor');
        
        // Kısa bir gecikme ile elementlerin yüklenmesini bekle
        setTimeout(() => {
            const participationEventIdInput = document.getElementById('participation-event-id');
            if (participationEventIdInput) {
                // Katılma formundaki gizli alana yaz
                participationEventIdInput.value = eventId;
                console.log('Event ID set for participation:', eventId);
                // Etkinlik bilgilerini yükle
                loadEventInfo(eventId);
            } else {
                console.log('participation-event-id elementi bulunamadı, tekrar denenecek');
                // Eğer element bulunamadıysa 1 saniye sonra tekrar dene
                setTimeout(() => {
                    const retryInput = document.getElementById('participation-event-id');
                    if (retryInput) {
                        retryInput.value = eventId;
                        console.log('Event ID set for participation (retry):', eventId);
                        loadEventInfo(eventId);
                    } else {
                        console.error('participation-event-id elementi hala bulunamadı');
                    }
                }, 1000);
            }
        }, 100);
    } else {
        console.log('Event ID bulunamadı');
    }
}

// Etkinlik bilgilerini yükle (katılma formu için)
async function loadEventInfo(eventId) {
    console.log('loadEventInfo çağrıldı, eventId:', eventId);
    
    if (!eventId) {
        console.error('Event ID bulunamadı');
        document.getElementById('event-title').textContent = 'Etkinlik ID bulunamadı';
        return;
    }
    
    try {
        console.log('API çağrısı yapılıyor:', `${API_BASE_URL}/events/${eventId}`);
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`);
        console.log('API response:', response.status, response.ok);
        
        if (response.ok) {
            const event = await response.json();
            console.log('Event verisi:', event);
            
            // Etkinlik bilgilerini forma yaz
            if (event && event.title) {
                document.getElementById('event-title').textContent = event.title;
                document.getElementById('event-date').textContent = formatDate(event.date);
                document.getElementById('event-location').textContent = event.location;
                document.getElementById('event-capacity').textContent = `${event.capacity} kişi kapasiteli`;
                
                console.log('Etkinlik bilgileri başarıyla yüklendi');
            } else {
                console.error('Event verisi eksik veya yanlış format');
                document.getElementById('event-title').textContent = 'Etkinlik verisi hatalı';
            }
            
            // Loading state'i kaldır
            const eventInfo = document.getElementById('event-info');
            if (eventInfo) {
                eventInfo.classList.remove('loading');
            }
        } else {
            console.error('Etkinlik bilgileri yüklenemedi, status:', response.status);
            const errorText = await response.text();
            console.error('Error response:', errorText);
            document.getElementById('event-title').textContent = 'Etkinlik bilgileri yüklenemedi';
        }
    } catch (error) {
        console.error('Etkinlik bilgileri yüklenirken hata:', error);
        document.getElementById('event-title').textContent = 'Bağlantı hatası';
    }
}
