// Başvurularım Sayfası JavaScript

let applicationsData = [];

// Sayfa yüklendikten sonra
document.addEventListener('DOMContentLoaded', async function() {
    // Kullanıcı oturum açmış mı kontrol et
    const token = localStorage.getItem('token');
    if (!token) {
        // Oturum açmamışsa login sayfasına yönlendir
        window.location.href = 'login.html';
        return;
    }

    // Başvuruları yükle
    await loadApplications();

    // Filtre dinleyicisi
    const statusFilter = document.getElementById('status-filter');
    statusFilter.addEventListener('change', filterApplications);

    // Sayfayı dili değişikliğine göre yeniden yükle
    if (typeof loadApplications === 'function') {
        window.addEventListener('languagechange', loadApplications);
    }
});

// Başvuruları yükle
async function loadApplications() {
    const token = localStorage.getItem('token');
    const applicationsList = document.getElementById('applications-list');
    const noApplications = document.getElementById('no-applications');

    try {
        // API'den başvuruları çek
        const response = await fetch(`${API_BASE_URL}/applications/my-applications`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Başvurular yüklenemedi');
        }

        const data = await response.json();
        applicationsData = data.applications || [];

        if (applicationsData.length === 0) {
            applicationsList.style.display = 'none';
            noApplications.style.display = 'block';
        } else {
            applicationsList.style.display = 'grid';
            noApplications.style.display = 'none';
            displayApplications(applicationsData);
        }
    } catch (error) {
        console.error('Hata:', error);
        applicationsList.innerHTML = `<div class="error-message">${getTranslation('Başvurular yüklenemedi')}</div>`;
    }
}

// Başvuruları görüntüle
function displayApplications(applications) {
    const applicationsList = document.getElementById('applications-list');
    
    if (applications.length === 0) {
        applicationsList.innerHTML = `
            <div class="no-applications">
                <p>${getTranslation('Henüz başvuru bulunmamaktadır')}</p>
            </div>
        `;
        return;
    }

    applicationsList.innerHTML = applications.map(app => `
        <div class="application-card" data-status="${app.status || 'pending'}">
            <div class="card-header">
                <div class="card-title">
                    <h3>${app.presentationTitle || 'Başlık'}</h3>
                    <p>${getTranslation('Etkinlik')}: ${app.eventId?.title || 'Bilinmiyor'}</p>
                </div>
                <div class="status-badge status-${app.status || 'pending'}">
                    ${getStatusBadgeText(app.status)}
                </div>
            </div>

            <div class="card-content">
                <div class="content-item">
                    <label>${getTranslation('Sunum Türü')}</label>
                    <value>${getApplicationType(app.applicationType)}</value>
                </div>
                <div class="content-item">
                    <label>${getTranslation('Başvuru Tarihi')}</label>
                    <value>${formatDate(app.createdAt)}</value>
                </div>
                <div class="content-item">
                    <label>${getTranslation('Durum')}</label>
                    <value>${getStatusText(app.status)}</value>
                </div>
            </div>

            <div class="card-footer">
                <button class="btn-small btn-detail" onclick="showApplicationDetail('${app._id}')">
                    ${getTranslation('Detayları Gör')}
                </button>
                ${app.status === 'pending' ? `
                    <button class="btn-small btn-cancel" onclick="cancelApplication('${app._id}')">
                        ${getTranslation('İptal Et')}
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Başvuruları filtrele
function filterApplications() {
    const statusFilter = document.getElementById('status-filter').value;
    let filtered = applicationsData;

    if (statusFilter) {
        filtered = applicationsData.filter(app => app.status === statusFilter);
    }

    displayApplications(filtered);
}

// Başvuru detaylarını göster
async function showApplicationDetail(applicationId) {
    const app = applicationsData.find(a => a._id === applicationId);
    if (!app) return;

    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <div class="modal-body-item">
            <label>${getTranslation('Sunum Başlığı')}</label>
            <value>${app.presentationTitle || '-'}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('Etkinlik')}</label>
            <value>${app.eventId?.title || '-'}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('Sunum Türü')}</label>
            <value>${getApplicationType(app.applicationType)}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('Konuşmacı Adı')}</label>
            <value>${app.speakerName || '-'}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('Konuşmacı Ünvanı')}</label>
            <value>${app.speakerTitle || '-'}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('Konuşmacı Kurumu')}</label>
            <value>${app.speakerInstitution || '-'}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('Sunum Özeti')}</label>
            <value>${app.presentationAbstract || '-'}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('İstenilen Tarih')}</label>
            <value>${app.preferredDate ? formatDate(app.preferredDate) : '-'}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('İstenilen Saat')}</label>
            <value>${app.preferredTime || '-'}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('Sunum Süresi (dakika)')}</label>
            <value>${app.presentationDuration || '-'} ${getTranslation('dakika')}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('Ek Notlar')}</label>
            <value>${app.additionalNotes || '-'}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('Durum')}</label>
            <value>${getStatusText(app.status)}</value>
        </div>

        <div class="modal-body-item">
            <label>${getTranslation('Başvuru Tarihi')}</label>
            <value>${formatDate(app.createdAt)}</value>
        </div>

        ${app.status === 'rejected' && app.rejectionReason ? `
            <div class="modal-body-item">
                <label>${getTranslation('Reddetme Sebebi')}</label>
                <value>${app.rejectionReason}</value>
            </div>
        ` : ''}
    `;

    document.getElementById('application-detail-modal').style.display = 'flex';
}

// Modal'ı kapat
function closeApplicationModal() {
    document.getElementById('application-detail-modal').style.display = 'none';
}

// Başvuruyu iptal et
async function cancelApplication(applicationId) {
    if (!confirm(getTranslation('Başvuruyu iptal etmek istediğinize emin misiniz?'))) {
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            showMessage(getTranslation('Başvuru başarıyla iptal edildi'), 'success');
            await loadApplications();
        } else {
            showMessage(getTranslation('Başvuru iptal edilemedi'), 'error');
        }
    } catch (error) {
        console.error('Hata:', error);
        showMessage(getTranslation('Başvuru iptal edilemedi'), 'error');
    }
}

// Durum metni
function getStatusText(status) {
    const statusTexts = {
        'pending': getTranslation('Bekleme'),
        'approved': getTranslation('Onaylandı'),
        'rejected': getTranslation('Reddedildi')
    };
    return statusTexts[status] || status;
}

// Durum badge metni
function getStatusBadgeText(status) {
    const badgeTexts = {
        'pending': '⏳ ' + getTranslation('Bekleme'),
        'approved': '✓ ' + getTranslation('Onaylandı'),
        'rejected': '✗ ' + getTranslation('Reddedildi')
    };
    return badgeTexts[status] || status;
}

// Başvuru türü
function getApplicationType(type) {
    const types = {
        'paper': getTranslation('Makale Sunumu'),
        'abstract': getTranslation('Bildiri Sunumu'),
        'poster': getTranslation('Poster Sunumu')
    };
    return types[type] || type;
}

// Modal dışı tıklama
window.addEventListener('click', function(event) {
    const modal = document.getElementById('application-detail-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});
