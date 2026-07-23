// www/js/profil.js
import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

// ====== RENDER DATA PROFIL ======
function renderProfile(user) {
    if (!user) {
        console.error("Render profile dipanggil tanpa pengguna.");
        return;
    }

    // Gunakan displayName jika ada, jika tidak, buat dari bagian pertama email
    const name = user.displayName || user.email.split('@')[0];
    const email = user.email;
    
    // Buat inisial dari huruf pertama nama
    const initials = (name.charAt(0) || 'U').toUpperCase();

    document.getElementById('user-name').textContent = name;
    document.getElementById('user-email').textContent = email;
    const avatarEl = document.getElementById('user-avatar');
    if (avatarEl) {
        avatarEl.textContent = initials;
    }
}

// ====== FUNGSI LOGOUT ======
function handleLogout() {
    if (confirm("Apakah Anda yakin ingin keluar dari sesi ini?")) {
        signOut(auth).then(() => {
            console.log("Logout berhasil.");
            // Arahkan ke halaman login setelah logout berhasil
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error("Gagal saat proses logout:", error);
            showToast("Terjadi kesalahan saat logout.");
        });
    }
}

// ====== INISIALISASI HALAMAN ======
document.addEventListener('DOMContentLoaded', () => {
    // Listener untuk perubahan status otentikasi
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // Pengguna login, render profil mereka
            renderProfile(user);
        } else {
            // Pengguna tidak login. Seharusnya auth-guard.js sudah mengarahkan
            // ke halaman login, tapi sebagai fallback, kita bisa arahkan lagi.
            console.log("Tidak ada pengguna yang login, mengarahkan ke login.html");
            window.location.replace('login.html');
        }
    });

    // Tambahkan event listener ke tombol logout
    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // Tambahkan event listener untuk menu lainnya yang masih placeholder
    const menuItems = document.querySelectorAll('.profile-item');
    menuItems.forEach(item => {
        if (item.id !== 'logout-btn') {
            const text = item.querySelector('.profile-left').textContent.trim();
            item.addEventListener('click', () => showToast(`Fitur '${text}' belum tersedia.`));
        }
    });
});
