// www/js/dashboard.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, getCountFromServer, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ====== UTILITAS TOAST ======
const toastEl = document.getElementById('toast');
let toastTimeout;
function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toastEl.classList.remove('show'); }, 3000); 
}

// ====== JAM, TANGGAL, & SALAM REAL-TIME ======
function updateClockAndGreeting() {
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

// ====== NAMA PENGGUNA & LOKASI ======
function renderGreeting(user) {
    const name = user.displayName || user.email.split('@')[0];
    document.getElementById('dash-name').textContent = name;
    document.getElementById('last-login-time').textContent = `Masuk: ${new Date(user.metadata.lastSignInTime).toLocaleString('id-ID')}`;
}

function getLocationName() {
    const locEl = document.getElementById('current-location');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                // Menggunakan API gratis untuk reverse geocoding
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`);
                const data = await response.json();
                locEl.textContent = data.city || data.locality || "Lokasi Ditemukan";
            } catch (error) {
                locEl.textContent = "Mode Offline";
            }
        }, () => { locEl.textContent = "Akses lokasi ditolak"; });
    } else {
        locEl.textContent = "GPS tidak didukung";
    }
}

// ====== MEMUAT DATA STATISTIK & AKTIVITAS DARI FIRESTORE ======
async function loadDashboardData(user) {
    if (!user) return;
    
    try {
        const collections = {
            pass: 'passwords',
            notes: 'notes',
            todo: 'todos',
            travel: 'travels'
        };

        // Mengambil jumlah data untuk setiap koleksi secara paralel
        const countPromises = Object.keys(collections).map(key => {
            const collRef = collection(db, 'users', user.uid, collections[key]);
            const q = query(collRef);
            return getCountFromServer(q);
        });
        
        const counts = await Promise.all(countPromises);
        
        document.getElementById('count-pass').textContent = counts[0].data().count;
        document.getElementById('count-notes').textContent = counts[1].data().count;
        document.getElementById('count-todo').textContent = counts[2].data().count;
        document.getElementById('count-travel').textContent = counts[3].data().count;
        
        // Mengambil 3 aktivitas terakhir dari koleksi 'passwords' (sebagai contoh)
        const activityCol = collection(db, 'users', user.uid, 'passwords');
        const activityQuery = query(activityCol, orderBy("updatedAt", "desc"), limit(3));
        const activitySnap = await getDocs(activityQuery);
        
        const actContainer = document.getElementById('activity-container');
        actContainer.innerHTML = ''; // Bersihkan status 'memuat'
        
        if (activitySnap.empty) {
            actContainer.innerHTML = `<li class="activity-item"><div class="act-details" style="text-align:center; width:100%;"><p>Belum ada aktivitas.</p></div></li>`;
        } else {
            const iconMap = { passwords: '🔑', notes: '📝', todos: '✅', travels: '🛵' };
            activitySnap.forEach(doc => {
                const activity = doc.data();
                // Konversi Firestore Timestamp ke JavaScript Date
                const updatedDate = activity.updatedAt?.toDate ? activity.updatedAt.toDate().toLocaleDateString('id-ID', {day:'numeric', month:'short'}) : 'Baru saja';
                
                actContainer.innerHTML += `
                    <li class="activity-item">
                        <div class="act-icon">${iconMap.passwords}</div>
                        <div class="act-details">
                            <h4>Diperbarui: ${activity.app || 'Entri'}</h4>
                            <p>${updatedDate}</p>
                        </div>
                    </li>
                `;
            });
        }
    } catch (error) {
        console.error("Gagal memuat data dashboard dari Firestore:", error);
        showToast("Gagal memuat statistik. Anda mungkin offline.");
        // Tampilkan nol jika gagal
        document.getElementById('count-pass').textContent = '0';
        document.getElementById('count-notes').textContent = '0';
        document.getElementById('count-todo').textContent = '0';
        document.getElementById('count-travel').textContent = '0';
    }
}

// ====== INISIALISASI HALAMAN ======
document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi jam dan lokasi
    updateClockAndGreeting();
    setInterval(updateClockAndGreeting, 1000); 
    getLocationName(); 

    // Cek status login dan muat data
    onAuthStateChanged(auth, (user) => {
        if (user) {
            renderGreeting(user);
            loadDashboardData(user);
        }
        // Jika tidak ada user, auth-guard akan menangani redirect
    });

    // Event listeners untuk FAB dan Kalender (jika ada)
    const fabMainBtn = document.querySelector('.fab-main');
    if (fabMainBtn) {
        fabMainBtn.addEventListener('click', () => document.getElementById('fab-menu').classList.toggle('active'));
    }
    // ... tambahkan listener lain jika perlu ...
});
