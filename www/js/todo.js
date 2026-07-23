document.addEventListener('DOMContentLoaded', () => {
    console.log('Halaman ToDo siap.');
    // Logika untuk fitur ToDo akan ditambahkan di sini.
});

// Fungsi utilitas untuk menampilkan pesan singkat (toast)
function showToast(message) {
    const toastEl = document.getElementById('toast');
    if (!toastEl) return;
    
    toastEl.textContent = message;
    toastEl.classList.add('show');
    
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000); 
}
