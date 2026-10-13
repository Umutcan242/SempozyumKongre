// Katılımlarım Sayfası JavaScript

let participationsData = [];
let currentParticipationId = null;

// Sayfa yüklendikten sonra
document.addEventListener('DOMContentLoaded', async function() {
    // Kullanıcı oturum açmış mı kontrol et
    const token = localStorage.getItem('token');
    if (!token) {
        // Oturum açmamışsa login sayfasına yönlendir
        window.location.href = 'login.html';
        return;
    }

    // Katılımları yükle
    await loadParticipations();

    // Filtre dinleyicisi
    const statusFilter = document.getElementById('status-filter');
    statusFilter.addEventListener('change', filterParticipations);
});

// Etkinlik durumunu belirle
function getEventStatus(eventDate) {
    const now = new Date();
    const event = new Date(eventDate);
    
    if (event > now) {
        return 'upcoming';
    } else if (event < now) {
        return 'completed';
    } else {
        return 'ongoing';
    }
}

// Katılımları yükle
async function loadParticipations() {
    const token = localStorage.getItem('token');
    const participationsList = document.getElementById('participations-list');
    const noParticipations = document.getElementById('no-participations');

    try {
        // API'den katılımları çek
        const response = await fetch(`${API_BASE_URL}/participants/my-participations`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Katılımlar yüklenemedi');
        }

        const data = await response.json();
        participationsData = data.participations || data.participants || [];

        if (participationsData.length === 0) {
            participationsList.style.display = 'none';
            noParticipations.style.display = 'block';
        } else {
            participationsList.style.display = 'grid';
            noParticipations.style.display = 'none';
            displayParticipations(participationsData);
        }
    } catch (error) {
        console.error('Hata:', error);
        participationsList.innerHTML = `<div class="error-message">${getTranslation('Katılımlar yüklenemedi')}</div>`;
    }
}

// Katılımları görüntüle
function displayParticipations(participations) {
    const participationsList = document.getElementById('participations-list');
    
    if (participations.length === 0) {
        participationsList.innerHTML = `
            <div class="no-participations">
                <p>${getTranslation('Henüz etkinlik katılımı bulunmamaktadır')}</p>
            </div>
        `;
        return;
    }

    participationsList.innerHTML = participations.map(participant => {
        const event = participant.eventId;
        const status = getEventStatus(event.date);
        
        return `
            <div class="participation-card" data-status="${status}">
                <div class="status-badge status-${status}">
                    ${getStatusBadgeText(status)}
                </div>
                
                <h3 class="card-event-title">${event.title || 'Etkinlik'}</h3>
                
                <div class="card-event-info">
                    <div class="info-row">
                        <div class="icon">📅</div>
                        <div class="label">${getTranslation('Tarih')}:</div>
                        <div class="value">${formatDate(event.date)}</div>
                    </div>
                    
                    <div class="info-row">
                        <div class="icon">📍</div>
                        <div class="label">${getTranslation('Konum')}:</div>
                        <div class="value">${event.location || '-'}</div>
                    </div>
                    
                    <div class="info-row">
                        <div class="icon">👥</div>
                        <div class="label">${getTranslation('Kapasite')}:</div>
                        <div class="value">${event.capacity || '-'} ${getTranslation('kişi')}</div>
                    </div>
                    
                    <div class="info-row">
                        <div class="icon">🏛️</div>
                        <div class="label">${getTranslation('Organizatör')}:</div>
                        <div class="value">${event.organizer || '-'}</div>
                    </div>
                </div>
                
                <div class="card-footer">
                    <button class="btn-small btn-detail" onclick="showParticipationDetail('${participant._id}')">
                        ${getTranslation('Detayları Gör')}
                    </button>
                    ${status === 'upcoming' ? `
                        <button class="btn-small btn-cancel" onclick="showCancelConfirm('${participant._id}')">
                            ${getTranslation('Katılımdan Vazgeç')}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Katılımları filtrele
function filterParticipations() {
    const statusFilter = document.getElementById('status-filter').value;
    let filtered = participationsData;

    if (statusFilter) {
        filtered = participationsData.filter(participant => {
            const status = getEventStatus(participant.eventId.date);
            return status === statusFilter;
        });
    }

    displayParticipations(filtered);
}

// Katılım detaylarını göster
async function showParticipationDetail(participationId) {
    const participant = participationsData.find(p => p._id === participationId);
    if (!participant) return;

    const event = participant.eventId;
    const status = getEventStatus(event.date);
    currentParticipationId = participationId;

    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <div class="modal-body-item">
            <label>${getTranslation('Etkinlik Adı')}</label>
            <value>${event.title || '-'}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('Tarihi')}</label>
            <value>${formatDate(event.date)}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('Konum')}</label>
            <value>${event.location || '-'}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('Açıklama')}</label>
            <value>${event.description || '-'}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('Kapasite')}</label>
            <value>${event.capacity || '-'} ${getTranslation('kişi')}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('Organizatör')}</label>
            <value>${event.organizer || '-'}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('Kayıt Tarihi')}</label>
            <value>${formatDate(participant.createdAt)}</value>
        </div>
    `;

    // Katılımdan Vazgeç butonunu kontrol et
    const cancelBtn = document.getElementById('cancel-participation-btn');
    if (status === 'upcoming') {
        cancelBtn.style.display = 'block';
    } else {
        cancelBtn.style.display = 'none';
    }

    document.getElementById('participation-detail-modal').style.display = 'flex';
}

// Modal'ı kapat
function closeParticipationModal() {
    document.getElementById('participation-detail-modal').style.display = 'none';
    currentParticipationId = null;
}

// Katılımdan Vazgeç Onayını Göster
function showCancelConfirm(participationId) {
    if (confirm(getTranslation('Bu etkinlikten katılımınızı iptal etmek istediğinize emin misiniz?'))) {
        cancelParticipation(participationId);
    }
}

// Katılımı İptal Et
async function cancelParticipation(participationId) {
    // Modal üzerinden çağrıldıysa currentParticipationId'yi kullan
    const id = participationId || currentParticipationId;
    if (!id) return;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/participants/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showMessage(getTranslation('Katılım başarıyla iptal edildi'), 'success');
            closeParticipationModal();
            await loadParticipations();
        } else {
            showMessage(getTranslation('Katılım iptal edilemedi'), 'error');
        }
    } catch (error) {
        console.error('Hata:', error);
        showMessage(getTranslation('Katılım iptal edilemedi'), 'error');
    }
}

// Durum metni
function getStatusText(status) {
    const statusTexts = {
        'upcoming': getTranslation('Yaklaşan'),
        'ongoing': getTranslation('Devam Eden'),
        'completed': getTranslation('Tamamlanan')
    };
    return statusTexts[status] || status;
}

// Durum badge metni
function getStatusBadgeText(status) {
    const badgeTexts = {
        'upcoming': '📅 ' + getTranslation('Yaklaşan'),
        'ongoing': '🔴 ' + getTranslation('Devam Eden'),
        'completed': '✓ ' + getTranslation('Tamamlanan')
    };
    return badgeTexts[status] || status;
}

// Modal dışı tıklama
window.addEventListener('click', function(event) {
    const modal = document.getElementById('participation-detail-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});
