const API_BASE_URL = 'http://localhost:3000/api';

// ===========================================
// ADMİN ETKİNLİK YÖNETİMİ FONKSİYONLARI
// ===========================================

// Admin etkinlikleri yükle
async function loadAdminEvents() {
    try {
        console.log('🎪 Admin etkinlikleri yükleniyor...');
        
        const response = await fetch(`${API_BASE_URL}/events`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📅 API response:', result);
        
        // API'den gelen response formatını kontrol et
        const events = result.events || result; 
        console.log('📅 Etkinlikler alındı:', Array.isArray(events) ? events.length : 'Array değil');
        
        const tableBody = document.querySelector('#events-table tbody');
        if (!tableBody) {
            console.warn('⚠️ Etkinlik tablosu bulunamadı');
            return;
        }
        
        tableBody.innerHTML = '';
        
        if (events && Array.isArray(events) && events.length > 0) {
            events.forEach(event => {
                const row = document.createElement('tr');
                const eventDate = new Date(event.date).toLocaleString('tr-TR');
                
                row.innerHTML = `
                    <td>${event.title}</td>
                    <td>${event.description.substring(0, 50)}${event.description.length > 50 ? '...' : ''}</td>
                    <td>${eventDate}</td>
                    <td>${event.location}</td>
                    <td>${event.capacity}</td>
                    <td>${event.category}</td>
                    <td>${event.fee}₺</td>
                    <td>${event.organizer}</td>
                    <td class="admin-actions">
                        <button onclick="viewEventParticipants('${event._id}')" class="btn-small">Katılımcılar</button>
                        <button onclick="deleteEvent('${event._id}')" class="btn-small btn-danger">Sil</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Henüz etkinlik bulunmamaktadır</td></tr>';
        }
        
    } catch (error) {
        console.error('❌ Admin etkinlikleri yüklenirken hata:', error);
        showAdminMessage('event-message', 'Etkinlikler yüklenirken hata oluştu: ' + error.message, 'error');
    }
}

// Etkinlik formu işleyici
async function handleEventForm(e) {
    console.log('🎪 handleEventForm çalıştı!', e);
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('eventTitle').value,
        description: document.getElementById('eventDescription').value,
        date: document.getElementById('eventDate').value,
        location: document.getElementById('eventLocation').value,
        capacity: parseInt(document.getElementById('eventCapacity').value),
        category: document.getElementById('eventCategory').value,
        fee: parseInt(document.getElementById('eventFee').value) || 0,
        organizer: document.getElementById('eventOrganizer').value
    };
    
    console.log('📝 Form verisi:', formData);
    
    try {
        console.log('📡 API çağrısı başlatılıyor...');
        
        const response = await fetch(`${API_BASE_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('📡 Response alındı:', response.status, response.ok);
        
        if (response.ok) {
            console.log('✅ Etkinlik başarıyla eklendi!');
            showAdminMessage('event-message', 'Etkinlik başarıyla eklendi!', 'success');
            document.getElementById('event-form').reset();
            loadAdminEvents(); // Tabloyu güncelle
        } else {
            const result = await response.json();
            console.error('❌ Server hatası:', result);
            showAdminMessage('event-message', 'Etkinlik eklenirken hata: ' + (result.message || 'Bilinmeyen hata'), 'error');
        }
        
    } catch (error) {
        console.error('❌ Network hatası:', error);
        showAdminMessage('event-message', 'Etkinlik eklenirken hata oluştu: ' + error.message, 'error');
    }
}

// Etkinlik sil
async function deleteEvent(eventId) {
    if (!confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAdminMessage('event-message', 'Etkinlik başarıyla silindi!', 'success');
            loadAdminEvents(); // Tabloyu güncelle
        } else {
            const result = await response.json();
            showAdminMessage('event-message', 'Etkinlik silinirken hata: ' + (result.message || 'Bilinmeyen hata'), 'error');
        }
        
    } catch (error) {
        console.error('❌ Etkinlik silme hatası:', error);
        showAdminMessage('event-message', 'Etkinlik silinirken hata oluştu: ' + error.message, 'error');
    }
}

// ===========================================
// ADMİN KONUŞMACI YÖNETİMİ FONKSİYONLARI
// ===========================================

// Admin konuşmacıları yükle
async function loadAdminSpeakers() {
    try {
        console.log('🎤 Admin konuşmacıları yükleniyor...');
        
        const response = await fetch(`${API_BASE_URL}/speakers`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('👥 API response:', result);
        
        const speakers = result.speakers || result;
        console.log('👥 Konuşmacılar alındı:', Array.isArray(speakers) ? speakers.length : 'Array değil');
        
        const tableBody = document.querySelector('#speakers-table tbody');
        if (!tableBody) {
            console.warn('⚠️ Konuşmacı tablosu bulunamadı');
            return;
        }
        
        tableBody.innerHTML = '';
        
        if (speakers && Array.isArray(speakers) && speakers.length > 0) {
            speakers.forEach(speaker => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${speaker.name}</td>
                    <td>${speaker.email}</td>
                    <td>${speaker.title}</td>
                    <td>${speaker.organization}</td>
                    <td>${speaker.bio ? speaker.bio.substring(0, 50) + (speaker.bio.length > 50 ? '...' : '') : 'Yok'}</td>
                    <td class="admin-actions">
                        <button onclick="deleteSpeaker('${speaker._id}')" class="btn-small btn-danger">Sil</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Henüz konuşmacı bulunmamaktadır</td></tr>';
        }
        
    } catch (error) {
        console.error('❌ Admin konuşmacıları yüklenirken hata:', error);
        showAdminMessage('speaker-message', 'Konuşmacılar yüklenirken hata oluştu: ' + error.message, 'error');
    }
}

// Konuşmacı formu işleyici
async function handleSpeakerForm(e) {
    console.log('🎤 handleSpeakerForm çalıştı!', e);
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('speakerName').value,
        email: document.getElementById('speakerEmail').value,
        title: document.getElementById('speakerTitle').value,
        organization: document.getElementById('speakerOrganization').value,
        bio: document.getElementById('speakerBio').value
    };
    
    console.log('👤 Form verisi:', formData);
    
    try {
        console.log('📡 API çağrısı başlatılıyor...');
        
        const response = await fetch(`${API_BASE_URL}/speakers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('📡 Response alındı:', response.status, response.ok);
        
        if (response.ok) {
            console.log('✅ Konuşmacı başarıyla eklendi!');
            showAdminMessage('speaker-message', 'Konuşmacı başarıyla eklendi!', 'success');
            document.getElementById('speaker-form').reset();
            loadAdminSpeakers(); // Tabloyu güncelle
        } else {
            const result = await response.json();
            console.error('❌ Server hatası:', result);
            showAdminMessage('speaker-message', 'Konuşmacı eklenirken hata: ' + (result.message || 'Bilinmeyen hata'), 'error');
        }
        
    } catch (error) {
        console.error('❌ Network hatası:', error);
        showAdminMessage('speaker-message', 'Konuşmacı eklenirken hata oluştu: ' + error.message, 'error');
    }
}

// Konuşmacı sil
async function deleteSpeaker(speakerId) {
    if (!confirm('Bu konuşmacıyı silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/speakers/${speakerId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAdminMessage('speaker-message', 'Konuşmacı başarıyla silindi!', 'success');
            loadAdminSpeakers(); // Tabloyu güncelle
        } else {
            const result = await response.json();
            showAdminMessage('speaker-message', 'Konuşmacı silinirken hata: ' + (result.message || 'Bilinmeyen hata'), 'error');
        }
        
    } catch (error) {
        console.error('❌ Konuşmacı silme hatası:', error);
        showAdminMessage('speaker-message', 'Konuşmacı silinirken hata oluştu: ' + error.message, 'error');
    }
}

// ===========================================
// BAŞVURU YÖNETİMİ FONKSİYONLARI
// ===========================================

// Admin başvuruları yükle
async function loadAdminApplications() {
    try {
        console.log('📝 Admin başvuruları yükleniyor...');
        
        const response = await fetch(`${API_BASE_URL}/applications`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📋 Applications API response:', result);
        
        const applications = result.applications || result;
        console.log('📋 Başvurular alındı:', Array.isArray(applications) ? applications.length : 'Array değil');
        
        const tableBody = document.getElementById('applications-table-body');
        if (!tableBody) {
            console.warn('⚠️ Başvuru tablosu bulunamadı');
            return;
        }
        
        tableBody.innerHTML = '';
        
        if (applications && Array.isArray(applications) && applications.length > 0) {
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
                        <button onclick="viewApplication('${application._id}')" class="btn-small">Görüntüle</button>
                        <button onclick="deleteApplication('${application._id}')" class="btn-small btn-danger">Sil</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Henüz başvuru bulunmamaktadır</td></tr>';
        }
        
    } catch (error) {
        console.error('❌ Admin başvuruları yüklenirken hata:', error);
        showAdminMessage('application-message', 'Başvurular yüklenirken hata oluştu: ' + error.message, 'error');
    }
}

// Başvuru sil
async function deleteApplication(applicationId) {
    if (!confirm('Bu başvuruyu silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAdminMessage('application-message', 'Başvuru başarıyla silindi!', 'success');
            loadAdminApplications(); // Tabloyu güncelle
        } else {
            const result = await response.json();
            showAdminMessage('application-message', 'Başvuru silinirken hata: ' + (result.message || 'Bilinmeyen hata'), 'error');
        }
        
    } catch (error) {
        console.error('❌ Başvuru silme hatası:', error);
        showAdminMessage('application-message', 'Başvuru silinirken hata oluştu: ' + error.message, 'error');
    }
}

// ===========================================
// ADMİN YARDIMCI FONKSİYONLARI
// ===========================================

// Admin mesaj gösterici
function showAdminMessage(elementId, message, type) {
    console.log('💬 Mesaj gösteriliyor:', elementId, message, type);
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `admin-message ${type}`;
        messageElement.style.display = 'block';
        
        // 5 saniye sonra mesajı gizle
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 5000);
    } else {
        console.warn('⚠️ Mesaj elementi bulunamadı:', elementId);
    }
}

// Admin tab gösterici
function showAdminTab(tabName) {
    console.log('🔄 Tab değiştiriliyor:', tabName);
    
    // Tüm içerikleri gizle
    document.querySelectorAll('.admin-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Tüm butonları pasif yap
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Seçili içeriği göster
    const selectedContent = document.getElementById(`admin-${tabName}`);
    if (selectedContent) {
        selectedContent.style.display = 'block';
    }
    
    // Seçili butonu aktif yap
    const selectedButton = document.querySelector(`[onclick="showAdminTab('${tabName}')"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    // İlgili verileri yükle
    switch (tabName) {
        case 'events':
            loadAdminEvents();
            loadInlineAnnouncements(); // Inline duyuruları da yükle
            break;
        case 'speakers':
            loadAdminSpeakers();
            break;
        case 'applications':
            loadAdminApplications();
            break;
        case 'announcements':
            loadAdminAnnouncements();
            break;
        case 'users':
            loadAdminUsers();
            break;
    }
}

// Tarih formatla
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
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
        'sent_to_referee': 'Hakeme İlet',
        'rejected': 'Reddedildi'
    };
    return statusMap[status] || status;
}

// Başvuru görüntüle (placeholder)
function viewApplication(applicationId) {
    alert('Başvuru detayları: ' + applicationId);
}

// Inline konuşmacı formu işleyici
async function handleSpeakerFormInline(e) {
    console.log('🎤 handleSpeakerFormInline çalıştı!', e);
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('speakerNameInline').value,
        email: document.getElementById('speakerEmailInline').value,
        title: document.getElementById('speakerTitleInline').value,
        organization: document.getElementById('speakerOrganizationInline').value,
        bio: document.getElementById('speakerBioInline').value
    };
    
    console.log('👤 Inline Form verisi:', formData);
    
    try {
        console.log('📡 API çağrısı başlatılıyor...');
        
        const response = await fetch(`${API_BASE_URL}/speakers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('📡 Response alındı:', response.status, response.ok);
        
        if (response.ok) {
            console.log('✅ Konuşmacı başarıyla eklendi!');
            showAdminMessage('speaker-message-inline', 'Konuşmacı başarıyla eklendi!', 'success');
            document.getElementById('speaker-form-inline').reset();
            loadAdminSpeakersInline(); // Inline tabloyu güncelle
            loadAdminSpeakers(); // Ana konuşmacı tablosunu da güncelle
        } else {
            const result = await response.json();
            console.error('❌ Server hatası:', result);
            showAdminMessage('speaker-message-inline', 'Konuşmacı eklenirken hata: ' + (result.message || 'Bilinmeyen hata'), 'error');
        }
        
    } catch (error) {
        console.error('❌ Network hatası:', error);
        showAdminMessage('speaker-message-inline', 'Konuşmacı eklenirken hata oluştu: ' + error.message, 'error');
    }
}

// Inline konuşmacıları yükle
async function loadAdminSpeakersInline() {
    try {
        console.log('🎤 Inline konuşmacıları yükleniyor...');
        
        const response = await fetch(`${API_BASE_URL}/speakers`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('👥 Inline API response:', result);
        
        const speakers = result.speakers || result;
        console.log('👥 Inline konuşmacılar alındı:', Array.isArray(speakers) ? speakers.length : 'Array değil');
        
        const tableBody = document.querySelector('#speakers-table-inline tbody');
        if (!tableBody) {
            console.warn('⚠️ Inline konuşmacı tablosu bulunamadı');
            return;
        }
        
        tableBody.innerHTML = '';
        
        if (speakers && Array.isArray(speakers) && speakers.length > 0) {
            speakers.forEach(speaker => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${speaker.name}</td>
                    <td>${speaker.email}</td>
                    <td>${speaker.title}</td>
                    <td>${speaker.organization}</td>
                    <td>${speaker.bio ? speaker.bio.substring(0, 30) + (speaker.bio.length > 30 ? '...' : '') : 'Yok'}</td>
                    <td class="admin-actions">
                        <button onclick="deleteSpeaker('${speaker._id}')" class="btn-small btn-danger">Sil</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Henüz konuşmacı bulunmamaktadır</td></tr>';
        }
        
    } catch (error) {
        console.error('❌ Inline konuşmacıları yüklenirken hata:', error);
        showAdminMessage('speaker-message-inline', 'Konuşmacılar yüklenirken hata oluştu: ' + error.message, 'error');
    }
}

// loadAdminEvents fonksiyonunu güncelleyelim ki inline konuşmacıları da yüklesin
const originalLoadAdminEvents = loadAdminEvents;
loadAdminEvents = function() {
    originalLoadAdminEvents();
    loadAdminSpeakersInline();
};

// ===========================================
// BAŞVURU DETAY MODAL FONKSİYONLARI
// ===========================================

// Başvuru detaylarını görüntüle
async function viewApplication(applicationId) {
    try {
        console.log('👁️ Başvuru detayları görüntüleniyor:', applicationId);
        
        const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const application = await response.json();
        console.log('📋 Başvuru detayı:', application);
        
        // Modal içeriğini doldur
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');
        const reviewStatus = document.getElementById('review-status');
        const reviewNotes = document.getElementById('review-notes');
        
        modalTitle.textContent = `${application.presentationTitle} - Başvuru Detayları`;
        
        modalContent.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <strong>Başvuru Türü:</strong><br>
                    <span>${getTypeText(application.applicationType)}</span>
                </div>
                <div>
                    <strong>Durum:</strong><br>
                    <span class="status-badge status-${application.status}">${getStatusText(application.status)}</span>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <strong>Konuşmacı:</strong><br>
                    <span>${application.speakerName}</span>
                </div>
                <div>
                    <strong>Unvan:</strong><br>
                    <span>${application.speakerTitle || 'Belirtilmemiş'}</span>
                </div>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <strong>Kurum:</strong><br>
                <span>${application.speakerOrganization}</span>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <strong>Sunum Başlığı:</strong><br>
                <span>${application.presentationTitle}</span>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <strong>Sunum Özeti:</strong><br>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; border-left: 4px solid #3498db;">
                    ${application.presentationSummary}
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div>
                    <strong>İstenilen Tarih:</strong><br>
                    <span>${formatDate(application.requestedDate)}</span>
                </div>
                <div>
                    <strong>İstenilen Saat:</strong><br>
                    <span>${application.requestedTime}</span>
                </div>
                <div>
                    <strong>Süre:</strong><br>
                    <span>${application.duration} dakika</span>
                </div>
            </div>
            
            ${application.additionalNotes ? `
                <div style="margin-bottom: 1rem;">
                    <strong>Ek Notlar:</strong><br>
                    <div style="background: #fff3cd; padding: 1rem; border-radius: 4px; border-left: 4px solid #ffc107;">
                        ${application.additionalNotes}
                    </div>
                </div>
            ` : ''}
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; padding-top: 1rem; border-top: 1px solid #eee;">
                <div>
                    <strong>Başvuru Tarihi:</strong><br>
                    <span>${formatDate(application.createdAt)}</span>
                </div>
                <div>
                    <strong>Son Güncelleme:</strong><br>
                    <span>${formatDate(application.updatedAt)}</span>
                </div>
            </div>
        `;
        
        // Mevcut durumu ve notları doldur
        reviewStatus.value = application.status || 'pending';
        reviewNotes.value = application.reviewNotes || '';
        
        // Modalı göster
        document.getElementById('application-modal').style.display = 'block';
        
        // Global değişkene kaydet (kaydetmek için)
        window.currentApplicationId = applicationId;
        
    } catch (error) {
        console.error('❌ Başvuru detayları yüklenirken hata:', error);
        showAdminMessage('application-message', 'Başvuru detayları yüklenemedi', 'error');
    }
}

// Modal kapatma
function closeApplicationModal() {
    document.getElementById('application-modal').style.display = 'none';
    window.currentApplicationId = null;
}

// Başvuru değerlendirmesini kaydet
async function saveApplicationReview() {
    if (!window.currentApplicationId) {
        return;
    }
    
    try {
        const status = document.getElementById('review-status').value;
        const notes = document.getElementById('review-notes').value;
        
        const response = await fetch(`${API_BASE_URL}/applications/${window.currentApplicationId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: status,
                reviewNotes: notes
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        showAdminMessage('application-message', 'Başvuru değerlendirmesi kaydedildi', 'success');
        closeApplicationModal();
        loadAdminApplications(); // Tabloyu yenile
        
    } catch (error) {
        console.error('❌ Değerlendirme kaydedilirken hata:', error);
        showAdminMessage('application-message', 'Değerlendirme kaydedilemedi', 'error');
    }
}

// Başvuruyu hakeme ilet
async function sendToReferee() {
    if (!window.currentApplicationId) {
        return;
    }
    
    if (!confirm('Bu başvuruyu hakeme göndermek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const notes = document.getElementById('review-notes').value;
        
        const response = await fetch(`${API_BASE_URL}/applications/${window.currentApplicationId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'sent_to_referee',
                reviewNotes: notes
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        showAdminMessage('application-message', 'Başvuru hakeme gönderildi', 'success');
        closeApplicationModal();
        loadAdminApplications(); // Tabloyu yenile
        
    } catch (error) {
        console.error('❌ Hakeme gönderme hatası:', error);
        showAdminMessage('application-message', 'Başvuru gönderilemedi', 'error');
    }
}

// Modal dışına tıklanınca kapat
document.addEventListener('click', function(e) {
    const modal = document.getElementById('application-modal');
    if (e.target === modal) {
        closeApplicationModal();
    }
});

// ESC tuşu ile kapat
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeApplicationModal();
    }
});

// ===========================================
// DUYURU YÖNETİMİ FONKSİYONLARI
// ===========================================

// Admin duyuruları yükle
async function loadAdminAnnouncements() {
    try {
        console.log('📢 Admin duyuruları yükleniyor...');
        
        const response = await fetch(`${API_BASE_URL}/announcements`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('📋 Announcements API response:', result);
        
        const announcements = result.announcements || result;
        console.log('📋 Duyurular alındı:', Array.isArray(announcements) ? announcements.length : 'Array değil');
        
        const tableBody = document.getElementById('announcements-table-body');
        if (!tableBody) {
            console.warn('⚠️ Duyuru tablosu bulunamadı');
            return;
        }
        
        tableBody.innerHTML = '';
        
        if (announcements && Array.isArray(announcements) && announcements.length > 0) {
            announcements.forEach(announcement => {
                const row = document.createElement('tr');
                const priorityClass = `priority-${announcement.priority}`;
                const typeClass = `type-${announcement.type}`;
                
                row.innerHTML = `
                    <td>${announcement.title}</td>
                    <td>${announcement.content.substring(0, 100)}${announcement.content.length > 100 ? '...' : ''}</td>
                    <td><span class="type-badge ${typeClass}">${getTypeDisplayText(announcement.type)}</span></td>
                    <td><span class="priority-badge ${priorityClass}">${getPriorityDisplayText(announcement.priority)}</span></td>
                    <td>${formatDate(announcement.createdAt)}</td>
                    <td><span class="status-badge ${announcement.isActive ? 'status-active' : 'status-inactive'}">${announcement.isActive ? 'Aktif' : 'Pasif'}</span></td>
                    <td>
                        <button onclick="editAnnouncement('${announcement._id}')" class="btn-small" style="background: #17a2b8; color: white; margin-right: 5px;">Düzenle</button>
                        <button onclick="toggleAnnouncementStatus('${announcement._id}', ${!announcement.isActive})" class="btn-small ${announcement.isActive ? 'btn-warning' : 'btn-success'}">
                            ${announcement.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                        </button>
                        <button onclick="deleteAnnouncement('${announcement._id}')" class="btn-small btn-danger">Sil</button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Henüz duyuru bulunmamaktadır</td></tr>';
        }
        
    } catch (error) {
        console.error('❌ Admin duyuruları yüklenirken hata:', error);
        showAdminMessage('announcement-message', 'Duyurular yüklenemedi', 'error');
    }
}

// Duyuru türü görüntü metni
function getTypeDisplayText(type) {
    const typeMap = {
        'info': '📘 Bilgi',
        'warning': '⚠️ Uyarı',
        'success': '✅ Başarılı',
        'event': '🎪 Etkinlik'
    };
    return typeMap[type] || type;
}

// Öncelik görüntü metni
function getPriorityDisplayText(priority) {
    const priorityMap = {
        'normal': '📋 Normal',
        'high': '🔶 Yüksek',
        'urgent': '🔴 Acil'
    };
    return priorityMap[priority] || priority;
}

// Inline tablosu için helper fonksiyonlar
function getTypeLabel(type) {
    const typeMap = {
        'info': 'Bilgi',
        'warning': 'Uyarı',
        'success': 'Başarı',
        'event': 'Etkinlik'
    };
    return typeMap[type] || type;
}

function getPriorityLabel(priority) {
    const priorityMap = {
        'normal': 'Normal',
        'high': 'Yüksek',
        'urgent': 'Acil'
    };
    return priorityMap[priority] || priority;
}

// ===========================================
// DUYURU DÜZENLEME FONKSİYONLARI
// ===========================================

// Duyuru düzenleme modalını aç
async function editAnnouncement(announcementId) {
    try {
        const response = await fetch(`${API_BASE_URL}/announcements/${announcementId}`);
        if (!response.ok) {
            throw new Error('Duyuru bulunamadı');
        }
        
        const announcement = await response.json();
        
        // Modal formunu doldur
        document.getElementById('editAnnouncementId').value = announcement._id;
        document.getElementById('editAnnouncementTitle').value = announcement.title;
        document.getElementById('editAnnouncementContent').value = announcement.content;
        document.getElementById('editAnnouncementType').value = announcement.type;
        document.getElementById('editAnnouncementPriority').value = announcement.priority;
        document.getElementById('editAnnouncementActive').checked = announcement.isActive;
        
        if (announcement.date) {
            const date = new Date(announcement.date);
            const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
            document.getElementById('editAnnouncementDate').value = localDate.toISOString().slice(0, 16);
        }
        
        // Modalı göster
        document.getElementById('editAnnouncementModal').style.display = 'block';
        
    } catch (error) {
        console.error('❌ Duyuru düzenleme hatası:', error);
        showAdminMessage('announcement-message', 'Duyuru bilgileri alınamadı', 'error');
    }
}

// Inline duyuru düzenleme
async function editInlineAnnouncement(announcementId) {
    editAnnouncement(announcementId); // Aynı modalı kullan
}

// Düzenleme modalını kapat
function closeEditAnnouncementModal() {
    document.getElementById('editAnnouncementModal').style.display = 'none';
}

// Düzenleme formu submit
async function handleEditAnnouncementForm(e) {
    e.preventDefault();
    
    const announcementId = document.getElementById('editAnnouncementId').value;
    const formData = new FormData(e.target);
    
    const updateData = {
        title: formData.get('title'),
        content: formData.get('content'),
        type: formData.get('type'),
        priority: formData.get('priority'),
        isActive: formData.has('isActive')
    };
    
    const dateVal = formData.get('date');
    if (dateVal) {
        updateData.date = new Date(dateVal).toISOString();
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/announcements/${announcementId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Duyuru güncellenemedi');
        }
        
        showAdminMessage('announcement-message', 'Duyuru başarıyla güncellendi', 'success');
        closeEditAnnouncementModal();
        loadAdminAnnouncements();
        loadInlineAnnouncements();
        
    } catch (error) {
        console.error('❌ Duyuru güncelleme hatası:', error);
        showAdminMessage('announcement-message', `Duyuru güncellenemedi: ${error.message}`, 'error');
    }
}

// Duyuru formu submit işleyici
async function handleAnnouncementForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const announcementData = Object.fromEntries(formData);
    
    try {
        console.log('📢 Duyuru ekleniyor:', announcementData);
        
        const response = await fetch(`${API_BASE_URL}/announcements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(announcementData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Duyuru eklenemedi');
        }
        
        const result = await response.json();
        console.log('✅ Duyuru eklendi:', result);
        
        showAdminMessage('announcement-message', 'Duyuru başarıyla eklendi', 'success');
        e.target.reset(); // Formu temizle
        loadAdminAnnouncements(); // Tabloyu güncelle
        
    } catch (error) {
        console.error('❌ Duyuru ekleme hatası:', error);
        showAdminMessage('announcement-message', error.message || 'Duyuru eklenemedi', 'error');
    }
}

// Duyuru durumunu değiştir (aktif/pasif)
async function toggleAnnouncementStatus(announcementId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/announcements/${announcementId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                isActive: newStatus
            })
        });
        
        if (!response.ok) {
            throw new Error('Durum değiştirilemedi');
        }
        
        showAdminMessage('announcement-message', `Duyuru ${newStatus ? 'aktifleştirildi' : 'pasifleştirildi'}`, 'success');
        loadAdminAnnouncements();
        
    } catch (error) {
        console.error('❌ Duyuru durum değiştirme hatası:', error);
        showAdminMessage('announcement-message', 'Durum değiştirilemedi', 'error');
    }
}

// Duyuru sil
async function deleteAnnouncement(announcementId) {
    if (!confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/announcements/${announcementId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Duyuru silinemedi');
        }
        
        showAdminMessage('announcement-message', 'Duyuru başarıyla silindi', 'success');
        loadAdminAnnouncements();
        
    } catch (error) {
        console.error('❌ Duyuru silme hatası:', error);
        showAdminMessage('announcement-message', 'Duyuru silinemedi', 'error');
    }
}

// Sayfa yüklendiğinde dili ayarla
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Main.js yüklendi - Admin paneli hazır!');
    
    // Duyuru formu event listener
    const announcementForm = document.getElementById('announcement-form');
    if (announcementForm) {
        announcementForm.addEventListener('submit', handleAnnouncementForm);
    }
    
    // Inline duyuru formu event listener
    const announcementFormInline = document.getElementById('announcement-form-inline');
    if (announcementFormInline) {
        announcementFormInline.addEventListener('submit', handleAnnouncementFormInline);
    }
    
    // Düzenleme formu event listener
    const editAnnouncementForm = document.getElementById('editAnnouncementForm');
    if (editAnnouncementForm) {
        editAnnouncementForm.addEventListener('submit', handleEditAnnouncementForm);
    }
    
    // Inline duyuruları yükle (konuşmacı altındaki bölüm için)
    if (typeof loadInlineAnnouncements === 'function') {
        loadInlineAnnouncements();
    }
});

// ===========================================
// INLINE DUYURU YÖNETİMİ FONKSİYONLARI
// ===========================================

// Inline duyuru formu submit handler
async function handleAnnouncementFormInline(e) {
    e.preventDefault();
    
    console.log('📢 Duyuru formu gönderiliyor...');
    
    const formData = new FormData(e.target);
    const announcementData = {
        title: formData.get('title'),
        content: formData.get('content'),
        type: formData.get('type'),
        priority: formData.get('priority')
    };
    
    // Eğer tarih girilmişse ISO string ekle
    const dateVal = formData.get('date');
    if (dateVal) {
        // datetime-local input values are already in a format parsable by Date
        announcementData.date = new Date(dateVal).toISOString();
    }
    
    console.log('📝 Gönderilecek veri:', announcementData);
    
    try {
        const response = await fetch(`${API_BASE_URL}/announcements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(announcementData)
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Server hatası:', errorData);
            
            let errorMessage = errorData.message || 'Duyuru eklenemedi';
            if (errorData.errors && errorData.errors.length > 0) {
                errorMessage += '\n' + errorData.errors.map(err => `• ${err.msg || err.message || err}`).join('\n');
            }
            
            throw new Error(errorMessage);
        }
        
        const result = await response.json();
        console.log('✅ Başarılı:', result);
        
        showAdminMessage('announcement-message-inline', 'Duyuru başarıyla eklendi', 'success');
        e.target.reset();
        loadInlineAnnouncements();
        
    } catch (error) {
        console.error('❌ Duyuru ekleme hatası:', error);
        showAdminMessage('announcement-message-inline', `Duyuru eklenemedi: ${error.message}`, 'error');
    }
}

// Inline duyuruları yükle
async function loadInlineAnnouncements() {
    try {
        const response = await fetch(`${API_BASE_URL}/announcements`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const announcements = await response.json();
        
        const tableBody = document.querySelector('#announcements-table-inline tbody');
        if (!tableBody) {
            console.warn('⚠️ Inline duyuru tablosu bulunamadı');
            return;
        }
        
        tableBody.innerHTML = '';
        
        if (announcements && announcements.length > 0) {
            // Duyuruları tarih sırasına göre sırala (öncelik, tarih, oluşturulma)
            const sortedAnnouncements = announcements.sort((a, b) => {
                // Önce öncelik sıralaması
                const priorityOrder = { urgent: 3, high: 2, normal: 1 };
                const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                if (priorityDiff !== 0) return priorityDiff;
                
                // Sonra tarih sıralaması (yeni önce)
                const dateA = new Date(a.date || a.createdAt);
                const dateB = new Date(b.date || b.createdAt);
                return dateB - dateA;
            });
            
            sortedAnnouncements.forEach(announcement => {
                const row = document.createElement('tr');
                const dateToShow = announcement.date || announcement.createdAt;
                const createdDate = dateToShow ? new Date(dateToShow).toLocaleString('tr-TR') : '-';
                
                row.innerHTML = `
                    <td>${announcement.title}</td>
                    <td><span class="type-badge type-${announcement.type}">${getTypeLabel(announcement.type)}</span></td>
                    <td><span class="priority-badge priority-${announcement.priority}">${getPriorityLabel(announcement.priority)}</span></td>
                    <td><span class="status-badge ${announcement.isActive ? 'status-active' : 'status-inactive'}">${announcement.isActive ? 'Aktif' : 'Pasif'}</span></td>
                    <td>${createdDate}</td>
                    <td class="admin-actions">
                        <button onclick="editInlineAnnouncement('${announcement._id}')" class="btn-small" style="background: #17a2b8; color: white; margin-right: 5px;">Düzenle</button>
                        <button onclick="toggleInlineAnnouncementStatus('${announcement._id}', ${!announcement.isActive})" 
                                class="btn-small ${announcement.isActive ? 'btn-warning' : 'btn-success'}">
                            ${announcement.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                        </button>
                        <button onclick="deleteInlineAnnouncement('${announcement._id}')" class="btn-small btn-danger">Sil</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #666;">Henüz duyuru bulunmuyor</td></tr>';
        }
        
    } catch (error) {
        console.error('❌ Inline duyuru yükleme hatası:', error);
    }
}

// Inline duyuru durumu değiştir
async function toggleInlineAnnouncementStatus(announcementId, newStatus) {
    try {
        const response = await fetch(`${API_BASE_URL}/announcements/${announcementId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                isActive: newStatus
            })
        });
        
        if (!response.ok) {
            throw new Error('Durum değiştirilemedi');
        }
        
        showAdminMessage('announcement-message-inline', `Duyuru ${newStatus ? 'aktifleştirildi' : 'pasifleştirildi'}`, 'success');
        loadInlineAnnouncements();
        
    } catch (error) {
        console.error('❌ Inline duyuru durum değiştirme hatası:', error);
        showAdminMessage('announcement-message-inline', 'Durum değiştirilemedi', 'error');
    }
}

// Inline duyuru sil
async function deleteInlineAnnouncement(announcementId) {
    if (!confirm('Bu duyuruyu silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/announcements/${announcementId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Duyuru silinemedi');
        }
        
        showAdminMessage('announcement-message-inline', 'Duyuru başarıyla silindi', 'success');
        loadInlineAnnouncements();
        
    } catch (error) {
        console.error('❌ Inline duyuru silme hatası:', error);
        showAdminMessage('announcement-message-inline', 'Duyuru silinemedi', 'error');
    }
}

// ============================================
// KULLANICI YÖNETİMİ FONKSİYONLARI
// ============================================

// Kullanıcıları yükle
async function loadAdminUsers() {
    try {
        console.log('👥 Kullanıcılar yükleniyor...');
        
        const token = localStorage.getItem('token');
        console.log('🔑 Token var mı?', !!token);
        
        if (!token) {
            throw new Error('Token bulunamadı. Lütfen giriş yapınız.');
        }
        
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📡 API Response Status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ API Hatası:', errorData);
            throw new Error(errorData.message || 'Kullanıcılar yüklenemedi');
        }
        
        const users = await response.json();
        console.log('👥 Kullanıcılar yüklendi:', users);
        console.log('👥 Kullanıcı sayısı:', Array.isArray(users) ? users.length : 'Array değil');
        
        // Verileri kontrol et
        if (!Array.isArray(users)) {
            console.error('❌ API response bir array değil:', typeof users);
            throw new Error('API response formatı yanlış');
        }
        
        // İstatistikleri güncelle
        updateUserStats(users);
        
        // Tabloyu doldur
        populateUsersTable(users);
        
        showAdminMessage('user-message', `Toplam ${users.length} kullanıcı bulundu`, 'success');
        
    } catch (error) {
        console.error('❌ Kullanıcı yükleme hatası:', error);
        showAdminMessage('user-message', 'Hata: ' + error.message, 'error');
    }
}

// Kullanıcı istatistiklerini güncelle
function updateUserStats(users) {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const inactiveUsers = users.filter(u => u.status === 'inactive').length;
    const bannedUsers = users.filter(u => u.status === 'banned').length;
    const adminUsers = users.filter(u => u.role === 'admin').length;
    
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('activeUsers').textContent = activeUsers;
    document.getElementById('inactiveUsers').textContent = inactiveUsers;
    document.getElementById('bannedUsers').textContent = bannedUsers;
}

// Kullanıcı tablosunu doldur
function populateUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    
    if (!tbody) {
        console.error('❌ HATA: users-table-body elementi bulunamadı!');
        console.log('📋 Sayfadaki tüm tbody elementleri:', document.querySelectorAll('tbody'));
        return;
    }
    
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        const statusClass = {
            'active': 'status-active',
            'inactive': 'status-inactive',
            'banned': 'status-banned'
        }[user.status] || '';
        
        const roleText = {
            'admin': 'Yönetici',
            'organizer': 'Düzenleyici',
            'user': 'Kullanıcı'
        }[user.role] || user.role;
        
        row.innerHTML = `
            <td>${user.fullName || user.username || 'N/A'}</td>
            <td>${user.email}</td>
            <td>${user.organization || '-'}</td>
            <td>${user.phone || '-'}</td>
            <td><span class="status-badge ${statusClass}">${getUserStatusText(user.status)}</span></td>
            <td>${roleText}</td>
            <td class="action-buttons">
                <select onchange="changeUserRole('${user._id}', this.value)" class="role-select">
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>Kullanıcı</option>
                    <option value="organizer" ${user.role === 'organizer' ? 'selected' : ''}>Düzenleyici</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Yönetici</option>
                </select>
                <select onchange="changeUserStatus('${user._id}', this.value)" class="status-select">
                    <option value="active" ${user.status === 'active' ? 'selected' : ''}>Aktif</option>
                    <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Pasif</option>
                    <option value="banned" ${user.status === 'banned' ? 'selected' : ''}>Yasaklı</option>
                </select>
                <button onclick="deleteUser('${user._id}')" class="btn-danger btn-small">Sil</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    console.log('✅ Kullanıcı tablosu dolduruldu:', users.length, 'kullanıcı');
}

// Kullanıcı durum metni
function getUserStatusText(status) {
    const statusMap = {
        'active': 'Aktif',
        'inactive': 'Pasif',
        'banned': 'Yasaklı'
    };
    return statusMap[status] || status;
}

// Kullanıcı rolünü değiştir
async function changeUserRole(userId, newRole) {
    try {
        console.log('🔄 Kullanıcı rolü değiştiriliyor:', userId, newRole);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Rol değiştirilemedi');
        }
        
        const result = await response.json();
        showAdminMessage('user-message', 'Kullanıcı rolü başarıyla değiştirildi', 'success');
        
        // Kullanıcıları yeniden yükle
        loadAdminUsers();
        
    } catch (error) {
        console.error('❌ Rol değiştirme hatası:', error);
        showAdminMessage('user-message', 'Hata: ' + error.message, 'error');
    }
}

// Kullanıcı durumunu değiştir
async function changeUserStatus(userId, newStatus) {
    try {
        console.log('🔄 Kullanıcı durumu değiştiriliyor:', userId, newStatus);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Durum değiştirilemedi');
        }
        
        const result = await response.json();
        showAdminMessage('user-message', 'Kullanıcı durumu başarıyla değiştirildi', 'success');
        
        // Kullanıcıları yeniden yükle
        loadAdminUsers();
        
    } catch (error) {
        console.error('❌ Durum değiştirme hatası:', error);
        showAdminMessage('user-message', 'Hata: ' + error.message, 'error');
    }
}

// Kullanıcıyı sil
async function deleteUser(userId) {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
        return;
    }
    
    try {
        console.log('🗑️ Kullanıcı siliniyor:', userId);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Kullanıcı silinemedi');
        }
        
        showAdminMessage('user-message', 'Kullanıcı başarıyla silindi', 'success');
        
        // Kullanıcıları yeniden yükle
        loadAdminUsers();
        
    } catch (error) {
        console.error('❌ Kullanıcı silme hatası:', error);
        showAdminMessage('user-message', 'Hata: ' + error.message, 'error');
    }
}

// Kullanıcıları filtrele
function filterUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const roleFilter = document.getElementById('role-filter').value;
    
    const rows = document.querySelectorAll('#users-table-body tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const name = cells[0].textContent.toLowerCase();
        const email = cells[1].textContent.toLowerCase();
        const organization = cells[2].textContent.toLowerCase();
        const status = cells[4].querySelector('.status-badge').textContent.toLowerCase();
        const role = cells[5].textContent.toLowerCase();
        
        const matchesSearch = name.includes(searchTerm) || email.includes(searchTerm) || organization.includes(searchTerm);
        const matchesStatus = statusFilter === '' || status === getUserStatusText(statusFilter).toLowerCase();
        const matchesRole = roleFilter === '' || role === getUserStatusText(roleFilter).toLowerCase();
        
        if (matchesSearch && matchesStatus && matchesRole) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// ===========================================
// KATILIMCILAR MODAL FONKSİYONLARI
// ===========================================

// Etkinlik katılımcılarını göster
async function viewEventParticipants(eventId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/participants?eventId=${eventId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        const participants = result.participants || [];
        
        const modal = document.getElementById('participants-modal');
        const tbody = document.getElementById('participants-modal-table');
        
        tbody.innerHTML = '';
        if (participants.length > 0) {
            participants.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${p.fullName}</td>
                    <td>${p.email}</td>
                    <td>${p.phone}</td>
                    <td>${p.organization}</td>
                    <td>${p.status}</td>
                    <td class="admin-actions">
                        <button onclick="deleteParticipant('${p._id}', '${eventId}')" style="background: linear-gradient(135deg, #e74c3c, #c0392b); color: white;">Sil</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6">Bu etkinliğe katılımcı yok</td></tr>';
        }
        
        // Event title'ı al
        const eventTitle = document.querySelector(`#events-table tr:has(button[onclick="viewEventParticipants('${eventId}')"])`)?.cells[0].textContent || 'Etkinlik';
        document.getElementById('participants-event-title').textContent = eventTitle;
        
        modal.style.display = 'flex';
    } catch (error) {
        console.error('❌ Katılımcılar yüklenirken hata:', error);
        alert('Katılımcılar yüklenemedi: ' + error.message);
    }
}

// Katılımcı silme fonksiyonu
async function deleteParticipant(participantId, eventId) {
    if (!confirm('Bu katılımcıyı silmek istediğinizden emin misiniz?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/participants/${participantId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            alert('Katılımcı başarıyla silindi');
            viewEventParticipants(eventId); // Listeyi yenile
        } else {
            alert('Silme işlemi başarısız');
        }
    } catch (error) {
        console.error('❌ Silme hatası:', error);
        alert('Hata: ' + error.message);
    }
}

// Modal kapatma
function closeParticipantsModal() {
    document.getElementById('participants-modal').style.display = 'none';
}