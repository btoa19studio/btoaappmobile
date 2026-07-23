// Elemen Toast (Pesan Kustom)
const toastEl = document.getElementById('toast');
let toastTimeout;

// Fungsi untuk menampilkan pesan toast
function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000); 
}

// Fungsi klik pada menu
function handleMenuClick(menuName) {
    showToast('Membuka: ' + menuName);
}

// Fungsi klik logout
function handleLogout() {
    showToast('Proses logout...');
}

// PENGAMBILAN DATA
async function fetchUserData() {
    try {
        const mockData = {
            name: "Nama Pengguna",
            email: "namapengguna@email.com",
            initials: "NP"
        };

        document.getElementById('user-name').textContent = mockData.name;
        document.getElementById('user-email').textContent = mockData.email;
        document.getElementById('user-avatar').textContent = mockData.initials;
        
    } catch (error) {
        showToast("Gagal memuat profil");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchUserData();
});
