// ====== UTILITAS TOAST ======
const toastEl = document.getElementById('toast');
let toastTimeout;
function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toastEl.classList.remove('show'); }, 3000); 
}

// ====== JAM & TANGGAL REAL-TIME ======
function updateClock() {
    const now = new Date();
    const hours = now.getHours();
    
    document.getElementById('current-time').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('current-date').textContent = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });

    let greeting = "Selamat Malam,";
    if (hours >= 4 && hours < 11) greeting = "Selamat Pagi,";
    else if (hours >= 11 && hours < 15) greeting = "Selamat Siang,";
    else if (hours >= 15 && hours < 18) greeting = "Selamat Sore,";
    document.getElementById('greeting-text').textContent = greeting;
}

// ====== LOKASI NAMA KOTA ======
function getLocationName() {
    const locEl = document.getElementById('current-location');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            try {
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`);
                const data = await response.json();
                locEl.textContent = data.city || data.locality || "Lokasi Ditemukan";
            } catch (error) {
                locEl.textContent = "Mode Offline Aktif";
            }
        }, () => { locEl.textContent = "Akses lokasi ditolak"; });
    } else {
        locEl.textContent = "GPS tidak didukung";
    }
}

// ====== MODAL KALENDER ======
function toggleCalendar() {
    const modal = document.getElementById('calendar-modal');
    modal.classList.toggle('active');
    if (modal.classList.contains('active')) renderCalendar();
}

function renderCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayDate = now.getDate();
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    document.getElementById('cal-month-year').textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const gridBody = document.getElementById('cal-grid-body');
    gridBody.innerHTML = ''; 

    for (let i = 0; i < firstDay; i++) gridBody.innerHTML += `<div></div>`;
    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = (i === todayDate) ? 'today' : '';
        gridBody.innerHTML += `<div class="cal-day ${isToday}">${i}</div>`;
    }
}

// ====== DATA DASHBOARD ======
async function loadDashboardData() {
    try {
        const userData = {
            name: "Bagas Tahta",
            lastLogin: "08:30 WIB",
            stats: { passwords: 12, notes: 5, todos: 3, travels: 1 },
            activities: [
                { icon: '📝', title: 'Menambahkan Note Baru', time: '10 menit yang lalu' },
                { icon: '🔑', title: 'Memperbarui Password', time: '1 jam yang lalu' },
                { icon: '✅', title: 'Checklist Belanjaan', time: 'Kemarin' }
            ]
        };

        document.getElementById('dash-name').textContent = userData.name;
        document.getElementById('last-login-time').textContent = `Masuk: ${userData.lastLogin}`;
        document.getElementById('count-pass').textContent = userData.stats.passwords;
        document.getElementById('count-notes').textContent = userData.stats.notes;
        document.getElementById('count-todo').textContent = userData.stats.todos;
        document.getElementById('count-travel').textContent = userData.stats.travels;
        
        const actContainer = document.getElementById('activity-container');
        actContainer.innerHTML = '';
        userData.activities.forEach(act => {
            actContainer.innerHTML += `
                <li class="activity-item">
                    <div class="act-icon">${act.icon}</div>
                    <div class="act-details">
                        <h4>${act.title}</h4>
                        <p>${act.time}</p>
                    </div>
                </li>
            `;
        });
    } catch (error) {
        showToast("Gagal memuat data");
    }
}

// ====== SPEED DIAL FAB ======
function toggleFab() {
    document.getElementById('fab-menu').classList.toggle('active');
}

function openInputForm(menuType) {
    toggleFab();
    showToast("Membuka form input: " + menuType);
}

document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);
    getLocationName(); 
    loadDashboardData(); 
});