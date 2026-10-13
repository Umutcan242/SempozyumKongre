const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
    // Etkinlikler
    loadEvents();
    document.getElementById('event-form').addEventListener('submit', handleEventForm);
    // Konuşmacılar
    loadSpeakers();
    document.getElementById('speaker-form').addEventListener('submit', handleSpeakerForm);
    
    // Modal kapatma
    window.onclick = function(event) {
        const participantsModal = document.getElementById('participants-modal');
        if (event.target == participantsModal) {
            participantsModal.style.display = 'none';
        }
    };
});

// --- ETKİNLİKLER ---
async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        const result = await response.json();
        const events = result.events || result;
        const tbody = document.querySelector('#events-table tbody');
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
                        <button onclick="viewEventParticipants('${event._id}')">Katılımcılar</button>
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

async function handleEventForm(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    try {
        const response = await fetch(`${API_BASE_URL}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            showAdminMessage('event-message', 'Etkinlik eklendi', 'success');
            form.reset();
            loadEvents();
        } else {
            const result = await response.json();
            showAdminMessage('event-message', result.message || 'Hata oluştu', 'error');
        }
    } catch (error) {
        showAdminMessage('event-message', 'Etkinlik eklenemedi', 'error');
    }
}

async function deleteEvent(id) {
    if (!confirm('Etkinliği silmek istediğinize emin misiniz?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/events/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showAdminMessage('event-message', 'Etkinlik silindi', 'success');
            loadEvents();
        } else {
            showAdminMessage('event-message', 'Silme işlemi başarısız', 'error');
        }
    } catch (error) {
        showAdminMessage('event-message', 'Etkinlik silinemedi', 'error');
    }
}

// --- KONUŞMACILAR ---
async function loadSpeakers() {
    try {
        const response = await fetch(`${API_BASE_URL}/speakers`);
        const result = await response.json();
        const speakers = result.speakers || result;
        const tbody = document.querySelector('#speakers-table tbody');
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
            loadSpeakers();
        } else {
            const result = await response.json();
            showAdminMessage('speaker-message', result.message || 'Hata oluştu', 'error');
        }
    } catch (error) {
        showAdminMessage('speaker-message', 'Konuşmacı eklenemedi', 'error');
    }
}

async function deleteSpeaker(id) {
    if (!confirm('Konuşmacıyı silmek istediğinize emin misiniz?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/speakers/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showAdminMessage('speaker-message', 'Konuşmacı silindi', 'success');
            loadSpeakers();
        } else {
            showAdminMessage('speaker-message', 'Silme işlemi başarısız', 'error');
        }
    } catch (error) {
        showAdminMessage('speaker-message', 'Konuşmacı silinemedi', 'error');
    }
}

// --- KATILIMCILAR ---
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
        
        document.getElementById('participants-event-title').textContent = 
            document.querySelector(`#events-table tr:has(button[onclick="viewEventParticipants('${eventId}')"])`)?.cells[0].textContent || 'Etkinlik';
        
        modal.style.display = 'flex';
    } catch (error) {
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
        alert('Hata: ' + error.message);
    }
}

function closeParticipantsModal() {
    document.getElementById('participants-modal').style.display = 'none';
}

// Tab Switching
function showAdminTab(tabName) {
    const contents = document.querySelectorAll('.admin-content');
    const buttons = document.querySelectorAll('.tab-button');
    
    contents.forEach(c => c.style.display = 'none');
    buttons.forEach(b => b.classList.remove('active'));
    
    document.getElementById(`admin-${tabName}`).style.display = 'block';
    event.target.classList.add('active');
}

// --- YARDIMCI ---
function showAdminMessage(id, text, type) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = `admin-message ${type}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
