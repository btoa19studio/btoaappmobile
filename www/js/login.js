// www/js/login.js
import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const errorMessage = document.getElementById('error-message');

    // Handler Tombol Login
    loginBtn.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            showError("Email dan password harus diisi.");
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = "Memproses...";

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Login berhasil
                console.log("Login berhasil:", userCredential.user);
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                showError(getFirebaseErrorMessage(error.code));
            })
            .finally(() => {
                loginBtn.disabled = false;
                loginBtn.textContent = "Masuk";
            });
    });

    // Handler Tombol Daftar
    signupBtn.addEventListener('click', () => {
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            showError("Email dan password harus diisi.");
            return;
        }
        
        if (password.length < 6) {
            showError("Password minimal harus 6 karakter.");
            return;
        }

        signupBtn.disabled = true;
        signupBtn.textContent = "Memproses...";

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Daftar dan login berhasil
                console.log("Daftar berhasil:", userCredential.user);
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                showError(getFirebaseErrorMessage(error.code));
            })
            .finally(() => {
                signupBtn.disabled = false;
                signupBtn.textContent = "Daftar";
            });
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function getFirebaseErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/invalid-email':
                return 'Format email tidak valid.';
            case 'auth/user-not-found':
            case 'auth/invalid-credential':
                return 'Email atau password salah.';
            case 'auth/wrong-password':
                return 'Password salah.';
            case 'auth/email-already-in-use':
                return 'Email ini sudah digunakan oleh akun lain.';
            case 'auth/weak-password':
                return 'Password terlalu lemah. Gunakan minimal 6 karakter.';
            default:
                console.error("Firebase Auth Error:", errorCode);
                return 'Terjadi kesalahan. Silakan coba lagi.';
        }
    }
});
