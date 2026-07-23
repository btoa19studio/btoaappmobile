// www/js/firebase-config.js
// Mengimpor fungsi yang diperlukan dari Firebase SDK modular melalui CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// --- KONFIGURASI FIREBASE ANDA ---
const firebaseConfig = {
  apiKey: "AIzaSyBuTWpXsf0WZmzeUY8rhAn7HpE43LeCDds",
  authDomain: "btoaappmobile.firebaseapp.com",
  projectId: "btoaappmobile",
  storageBucket: "btoaappmobile.appspot.com", // Domain storageBucket seringkali berbeda
  messagingSenderId: "159647504898",
  appId: "1:159647504898:web:ffd34675d25fa6e01be51b"
};
// ---------------------------------------------

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi dan ekspor service Firebase untuk digunakan di file lain
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // Inisialisasi Firebase Storage

console.log("Firebase modular berhasil diinisialisasi.");

// Ekspor instance untuk digunakan di skrip lain
export { app, auth, db, storage };
