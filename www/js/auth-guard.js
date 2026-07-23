// www/js/auth-guard.js
// Skrip ini melindungi halaman dari akses oleh pengguna yang tidak terautentikasi.

import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

onAuthStateChanged(auth, user => {
    if (!user) {
        // Pengguna tidak login, paksa kembali ke halaman login.
        console.log('Akses ditolak. Pengguna tidak login. Mengarahkan ke login.html');
        // Ganti URL, cegah pengguna menekan tombol "kembali" untuk kembali ke halaman yang dilindungi.
        window.location.replace('login.html');
    }
    // Jika 'user' ada, tidak lakukan apa-apa, biarkan halaman dimuat.
    // Console log di bawah ini bisa diaktifkan untuk debugging.
    // else {
    //     console.log('Akses diberikan. Pengguna:', user.email);
    // }
});
