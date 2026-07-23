// www/js/password.js
import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    collection, query, getDocs, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, orderBy 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// ====== STATE APLIKASI ======
let currentUser = null;
let passwordsCache = []; // Cache lokal untuk data password
let currentViewId = null; // ID dokumen yang sedang dilihat/diedit
let activeCategoryName = "";

// ====== ELEMEN DOM ======
const folderContainer = document.getElementById('folder-container');
const searchInput = document.getElementById('search-pass');
const folderModal = document.getElementById('folder-modal');
const folderTitle = document.getElementById('folder-title');
const folderItemsContainer = document.getElementById('folder-items-container');
const detailSheet = document.getElementById('detail-sheet');
const addModal = document.getElementById('add-modal');
const addPassForm = document.getElementById('add-pass-form');
const toastEl = document.getElementById('toast');

// ====== UTILITAS ======
let toastTimeout;
function showToast(message, isError = false) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.className = `toast-box show ${isError ? 'error' : ''}`;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toastEl.classList.remove('show'); }, 3000);
}

function getFormattedDate(timestamp) {
    if (!timestamp) return 'N/A';
    // Konversi Firestore Timestamp ke Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ====== LOGIKA UTAMA (RENDER & FETCH) ======

// Ambil data dari Firestore dan simpan di cache
async function fetchPasswords() {
    if (!currentUser) return;
    try {
        const passwordsCollection = collection(db, 'users', currentUser.uid, 'passwords');
        const q = query(passwordsCollection, orderBy("updatedAt", "desc"));
        const snapshot = await getDocs(q);
        passwordsCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderFolders();
    } catch (error) {
        console.error("Error fetching passwords:", error);
        showToast("Gagal memuat data password.", true);
    }
}

// Render tampilan folder berdasarkan data di cache
function renderFolders() {
    folderContainer.innerHTML = '';
    const keyword = searchInput.value.toLowerCase();

    const filteredData = passwordsCache.filter(item =>
        (item.category || "Tanpa Kategori").toLowerCase().includes(keyword) ||
        item.app.toLowerCase().includes(keyword) ||
        item.user.toLowerCase().includes(keyword)
    );

    const grouped = {};
    filteredData.forEach(item => {
        const cat = item.category || "Tanpa Kategori";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
    });

    if (Object.keys(grouped).length === 0) {
        folderContainer.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:var(--text-muted); margin-top:20px;">Data tidak ditemukan.</p>`;
        return;
    }

    Object.keys(grouped).sort().forEach(cat => {
        folderContainer.innerHTML += `
            <div class="folder-card" onclick="window.openFolder('${cat}')">
                <div class="folder-icon">📁</div>
                <div class="folder-title">${cat}</div>
                <div class="folder-count">${grouped[cat].length} Entri</div>
            </div>`;
    });
    updateCategoryDatalist();
}

// Buka folder spesifik
function openFolder(categoryName) {
    activeCategoryName = categoryName;
    folderTitle.innerHTML = `📁 ${categoryName}`;
    folderItemsContainer.innerHTML = '';

    const items = passwordsCache.filter(item => (item.category || "Tanpa Kategori") === categoryName);
    items.forEach(item => {
        folderItemsContainer.innerHTML += `
            <div class="entry-card">
                <div class="entry-app-name" onclick="window.openDetailSheet('${item.id}')">${item.app}</div>
                <div class="entry-field">
                    <div class="field-left"><i class="bi bi-person"></i> <span class="field-text">${item.user}</span></div>
                    <div class="field-actions"><button class="icon-action" onclick="window.copyText('${item.user}', 'Username')"><i class="bi bi-copy"></i></button></div>
                </div>
                <div class="entry-field">
                    <div class="field-left"><i class="bi bi-envelope"></i> <span class="field-text">${item.email}</span></div>
                    <div class="field-actions"><button class="icon-action" onclick="window.copyText('${item.email}', 'Email')"><i class="bi bi-copy"></i></button></div>
                </div>
                <div class="entry-field">
                    <div class="field-left"><i class="bi bi-key"></i> <span class="field-text" id="passmask-${item.id}">••••••••</span></div>
                    <div class="field-actions">
                        <button class="icon-action" onclick="window.toggleMask('${item.id}', '${item.pass}')"><i class="bi bi-eye"></i></button>
                        <button class="icon-action" onclick="window.copyText('${item.pass}', 'Password')"><i class="bi bi-copy"></i></button>
                    </div>
                </div>
            </div>`;
    });
    folderModal.classList.add('active');
}

// ====== OPERASI CRUD (Create, Read, Update, Delete) ======

// Simpan atau update password
async function savePassword(event) {
    event.preventDefault();
    if (!currentUser) return showToast("Anda harus login untuk menyimpan data.", true);

    const btnSave = document.getElementById('btn-save');
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="bi bi-hourglass-split"></i> Menyimpan...';

    const idValue = document.getElementById('input-id').value;
    const imageFile = document.getElementById('input-image').files[0];
    let imageUrl = document.getElementById('image-preview').src;

    try {
        // 1. Upload gambar jika ada file baru
        if (imageFile) {
            const storagePath = `users/${currentUser.uid}/images/${Date.now()}_${imageFile.name}`;
            const storageRef = ref(storage, storagePath);
            const snapshot = await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        // 2. Siapkan objek data
        const dataObj = {
            category: document.getElementById('input-category').value.trim(),
            app: document.getElementById('input-app').value,
            user: document.getElementById('input-user').value,
            email: document.getElementById('input-email').value,
            pass: document.getElementById('input-pass').value,
            notes: document.getElementById('input-notes').innerHTML,
            image: imageUrl.startsWith('https://') ? imageUrl : '',
            imagePath: imageUrl.startsWith('https://') ? new URL(imageUrl).pathname.split('/').pop() : '',
            updatedAt: serverTimestamp()
        };

        // 3. Simpan ke Firestore
        const passwordsCollection = collection(db, 'users', currentUser.uid, 'passwords');
        if (idValue) { // Update
            const docRef = doc(passwordsCollection, idValue);
            await updateDoc(docRef, dataObj);
            showToast("Entri berhasil diperbarui! 📝");
        } else { // Create
            dataObj.createdAt = serverTimestamp();
            await addDoc(passwordsCollection, dataObj);
            showToast("Entri baru tersimpan! 🎉");
        }

        await fetchPasswords();
        closeFormModal();
        if (activeCategoryName) openFolder(activeCategoryName);

    } catch (error) {
        console.error("Error saving password:", error);
        showToast("Gagal menyimpan data.", true);
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = '<i class="bi bi-save"></i> Simpan Data';
    }
}

// Hapus entri
async function deleteCurrentEntry() {
    if (!currentUser || !currentViewId) return;
    if (!confirm("Apakah Anda yakin ingin menghapus entri ini secara permanen?")) return;

    try {
        const docRef = doc(db, 'users', currentUser.uid, 'passwords', currentViewId);
        const entryToDelete = passwordsCache.find(p => p.id === currentViewId);
        
        // Hapus gambar dari storage jika ada
        if (entryToDelete && entryToDelete.imagePath) {
            const imageRef = ref(storage, `users/${currentUser.uid}/images/${entryToDelete.imagePath}`);
            await deleteObject(imageRef).catch(err => console.error("Gagal hapus gambar lama:", err));
        }

        await deleteDoc(docRef);
        showToast("Entri berhasil dihapus! 🗑️");
        
        await fetchPasswords();
        closeDetailSheet();
        folderModal.classList.remove('active');

    } catch (error) {
        console.error("Error deleting entry:", error);
        showToast("Gagal menghapus data.", true);
    }
}

// ====== MODAL & BOTTOM SHEET UI ======

function openDetailSheet(id) {
    const data = passwordsCache.find(item => item.id === id);
    if (!data) return;
    currentViewId = id;
    
    document.getElementById('detail-app').textContent = data.app;
    document.getElementById('detail-created').textContent = `Dibuat: ${getFormattedDate(data.createdAt)}`;
    document.getElementById('detail-updated').textContent = `Diubah: ${getFormattedDate(data.updatedAt)}`;
    document.getElementById('detail-cat').textContent = data.category || "-";
    document.getElementById('detail-user').textContent = data.user;
    document.getElementById('detail-email').textContent = data.email;
    document.getElementById('detail-pass').textContent = data.pass;
    document.getElementById('detail-notes').innerHTML = data.notes || "<i>Tidak ada catatan</i>";

    const imgBox = document.getElementById('detail-img-box');
    if (data.image) {
        document.getElementById('detail-img').src = data.image;
        imgBox.style.display = 'block';
    } else {
        imgBox.style.display = 'none';
    }
    detailSheet.classList.add('active');
}

function closeDetailSheet() { detailSheet.classList.remove('active'); }

function editCurrentEntry() {
    const data = passwordsCache.find(item => item.id === currentViewId);
    if (!data) return;
    
    closeDetailSheet();
    document.getElementById('form-modal-title').textContent = "Ubah Password";
    addPassForm.reset();
    
    document.getElementById('input-id').value = data.id;
    document.getElementById('input-category').value = data.category;
    document.getElementById('input-app').value = data.app;
    document.getElementById('input-user').value = data.user;
    document.getElementById('input-email').value = data.email;
    document.getElementById('input-pass').value = data.pass;
    document.getElementById('input-notes').innerHTML = data.notes;
    
    const preview = document.getElementById('image-preview');
    if (data.image) {
        preview.src = data.image;
        preview.style.display = 'block';
    } else {
        preview.src = '';
        preview.style.display = 'none';
    }
    addModal.classList.add('active');
}

function openAddModal() {
    closeFormModal();
    document.getElementById('form-modal-title').textContent = "Tambah Password Baru";
    addModal.classList.add('active');
}

function closeFormModal() {
    addModal.classList.remove('active');
    addPassForm.reset();
    document.getElementById('input-id').value = "";
    document.getElementById('input-notes').innerHTML = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('image-preview').src = '';
    document.getElementById('input-image').value = '';
    toggleVisibility(true); // Reset to hidden
}

function updateCategoryDatalist() {
    const datalist = document.getElementById('category-options');
    datalist.innerHTML = '';
    const uniqueCats = [...new Set(passwordsCache.map(item => item.category).filter(Boolean))];
    uniqueCats.forEach(cat => { datalist.innerHTML += `<option value="${cat}">`; });
}

// ====== HELPERS & EVENT LISTENERS ======
function copyText(text, label) {
    navigator.clipboard.writeText(text).then(() => showToast(`${label} disalin!`));
}

function toggleMask(id, realPass) {
    const el = document.getElementById(`passmask-${id}`);
    if (el.textContent === "••••••••") el.textContent = realPass;
    else el.textContent = "••••••••";
}

function toggleVisibility(forceHidden = false) {
    const input = document.getElementById('input-pass');
    const icon = document.getElementById('eye-icon');
    if (forceHidden || input.type === "text") {
        input.type = "password"; icon.innerHTML = '<i class="bi bi-eye"></i>';
    } else {
        input.type = "text"; icon.innerHTML = '<i class="bi bi-eye-slash"></i>';
    }
}

function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            const preview = document.getElementById('image-preview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
}

// Expose functions to global scope for inline event handlers
window.openFolder = openFolder;
window.openDetailSheet = openDetailSheet;
window.copyText = copyText;
window.toggleMask = toggleMask;

// ====== INISIALISASI HALAMAN ======
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, user => {
        if (user) {
            currentUser = user;
            fetchPasswords(); // Muat data setelah user login
        } else {
            currentUser = null;
            passwordsCache = [];
            renderFolders(); // Kosongkan tampilan
        }
    });

    // Event Listeners
    searchInput.addEventListener('keyup', renderFolders);
    addPassForm.addEventListener('submit', savePassword);

    // Attach listeners to buttons that are always present
    document.querySelector('.fab-single').addEventListener('click', openAddModal);
    document.querySelector('#add-modal .close-modal').addEventListener('click', closeFormModal);
    document.querySelector('#folder-modal .close-modal').addEventListener('click', () => folderModal.classList.remove('active'));
    document.getElementById('eye-icon').addEventListener('click', () => toggleVisibility());
    document.getElementById('input-image').addEventListener('change', previewImage);
    
    // Attach listeners for sheet actions
    document.querySelector('.btn-share').addEventListener('click', () => {
         const data = passwordsCache.find(item => item.id === currentViewId);
         if (!data) return;
         const shareText = `*Detail Akun ${data.app}*
Kategori: ${data.category}
Username: ${data.user}
Email: ${data.email}
Password: ${data.pass}`;
         if(navigator.share) {
            navigator.share({ title: `Akun ${data.app}`, text: shareText });
         } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
         }
    });
    document.querySelector('.btn-edit').addEventListener('click', editCurrentEntry);
    document.querySelector('.btn-delete').addEventListener('click', deleteCurrentEntry);

    // Close modals/sheets on overlay click
    folderModal.addEventListener('click', (e) => { if (e.target === folderModal) folderModal.classList.remove('active'); });
    detailSheet.addEventListener('click', (e) => { if (e.target === detailSheet) closeDetailSheet(); });
    addModal.addEventListener('click', (e) => { if (e.target === addModal) closeFormModal(); });
});
