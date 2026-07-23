// ====== UTILITAS TOAST ======
const toastEl = document.getElementById('toast');
let toastTimeout;
function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => { toastEl.classList.remove('show'); }, 3000); 
}

function getFormattedDate() {
    return new Date().toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

// ====== DATA SIMULASI ======
let passwordsData = [
    { id: 101, category: "Sosial Media", app: "Instagram", user: "@bagastahta", email: "bagas@gmail.com", pass: "Bagas123", notes: "Akun utama", image: "", createdAt: "20 Jul 2026, 14:00", updatedAt: "20 Jul 2026, 14:00" },
    { id: 102, category: "Perbankan", app: "BCA Mobile", user: "bagasbca", email: "bagas@gmail.com", pass: "654321", notes: "<b>PIN:</b> 123456", image: "", createdAt: "21 Jul 2026, 09:30", updatedAt: "22 Jul 2026, 10:15" }
];

let currentViewId = null;
let activeCategoryName = ""; // Menyimpan kategori yang sedang dibuka

// ====== RENDER FOLDER GRID ======
function renderFolders() {
    const container = document.getElementById('folder-container');
    container.innerHTML = '';
    const keyword = document.getElementById('search-pass').value.toLowerCase();

    const filteredData = passwordsData.filter(item => 
        (item.category || "Tanpa Kategori").toLowerCase().includes(keyword) || 
        item.app.toLowerCase().includes(keyword) || 
        item.user.toLowerCase().includes(keyword)
    );

    const grouped = {};
    filteredData.forEach(item => {
        const cat = item.category || "Tanpa Kategori";
        if(!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
    });

    const sortedCategories = Object.keys(grouped).sort();

    if (sortedCategories.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#6b7280; margin-top:20px;">Tidak ada data.</p>`;
        return;
    }

    sortedCategories.forEach(cat => {
        const count = grouped[cat].length;
        container.innerHTML += `
            <div class="folder-card" onclick="openFolder('${cat}')">
                <div class="folder-icon">📁</div>
                <div class="folder-title">${cat}</div>
                <div class="folder-count">${count} Entri</div>
            </div>
        `;
    });
    updateCategoryDatalist();
}

// ====== BUKA FOLDER (LIST VERTIKAL) ======
function openFolder(categoryName) {
    activeCategoryName = categoryName; // Simpan state kategori aktif
    document.getElementById('folder-title').innerHTML = `📁 ${categoryName}`;
    const itemsContainer = document.getElementById('folder-items-container');
    itemsContainer.innerHTML = '';

    const items = passwordsData.filter(item => (item.category || "Tanpa Kategori") === categoryName);

    items.forEach(item => {
        itemsContainer.innerHTML += `
            <div class="entry-card">
                <!-- Klik Teks Tebal Membuka Sheet Detail -->
                <div class="entry-app-name" onclick="openDetailSheet(${item.id})">${item.app}</div>
                
                <!-- Field Username -->
                <div class="entry-field">
                    <div class="field-left"><i class="bi bi-person"></i> <span class="field-text">${item.user}</span></div>
                    <div class="field-actions">
                        <button class="icon-action" onclick="copyText('${item.user}', 'Username')" title="Copy Username"><i class="bi bi-copy"></i></button>
                    </div>
                </div>

                <!-- Field Email -->
                <div class="entry-field">
                    <div class="field-left"><i class="bi bi-envelope"></i> <span class="field-text">${item.email}</span></div>
                    <div class="field-actions">
                        <button class="icon-action" onclick="copyText('${item.email}', 'Email')" title="Copy Email"><i class="bi bi-copy"></i></button>
                    </div>
                </div>

                <!-- Field Password -->
                <div class="entry-field">
                    <div class="field-left"><i class="bi bi-key"></i> <span class="field-text" id="passmask-${item.id}">••••••••</span></div>
                    <div class="field-actions">
                        <button class="icon-action" onclick="toggleMask(${item.id}, '${item.pass}')" title="Lihat"><i class="bi bi-eye"></i></button>
                        <button class="icon-action" onclick="copyText('${item.pass}', 'Password')" title="Copy Password"><i class="bi bi-copy"></i></button>
                    </div>
                </div>
            </div>
        `;
    });
    document.getElementById('folder-modal').classList.add('active');
}

function closeFolderModal(event) {
    const modal = document.getElementById('folder-modal');
    if (event.target === modal) modal.classList.remove('active');
}
function filterFolders() { renderFolders(); }

function copyText(text, label) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => showToast(`${label} disalin! ✅`));
    } else {
        showToast("Gagal menyalin");
    }
}

function toggleMask(id, realPass) {
    const el = document.getElementById(`passmask-${id}`);
    if (el.textContent === "••••••••") el.textContent = realPass;
    else el.textContent = "••••••••";
}

// ====== PRATINJAU DETAIL (BOTTOM SHEET) ======
function openDetailSheet(id) {
    const data = passwordsData.find(item => item.id === id);
    if (!data) return;
    
    currentViewId = id;

    document.getElementById('detail-app').textContent = data.app;
    document.getElementById('detail-created').textContent = `Dibuat: ${data.createdAt}`;
    document.getElementById('detail-updated').textContent = `Diubah: ${data.updatedAt}`;
    
    document.getElementById('detail-cat').textContent = data.category || "-";
    document.getElementById('detail-user').textContent = data.user;
    document.getElementById('detail-email').textContent = data.email;
    document.getElementById('detail-pass').textContent = data.pass;
    document.getElementById('detail-notes').innerHTML = data.notes || "<i>Tidak ada catatan</i>";
    
    const imgBox = document.getElementById('detail-img-box');
    if(data.image) {
        document.getElementById('detail-img').src = data.image;
        imgBox.style.display = 'block';
    } else {
        imgBox.style.display = 'none';
    }

    document.getElementById('detail-sheet').classList.add('active');
}

function closeDetailSheet(event) {
    const sheet = document.getElementById('detail-sheet');
    if (event.target === sheet) sheet.classList.remove('active');
}

// ====== TOMBOL AKSI SHEET (SHARE, UBAH, HAPUS) ======
function shareCurrentEntry() {
    const data = passwordsData.find(item => item.id === currentViewId);
    if(!data) return;

    const shareText = `*Detail Akun ${data.app}*\nKategori: ${data.category}\nUsername: ${data.user}\nEmail: ${data.email}\nPassword: ${data.pass}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
}

function editCurrentEntry() {
    const data = passwordsData.find(item => item.id === currentViewId);
    if(!data) return;
    
    document.getElementById('detail-sheet').classList.remove('active');
    document.getElementById('form-modal-title').textContent = "Ubah Password";
    
    document.getElementById('input-id').value = data.id;
    document.getElementById('input-category').value = data.category;
    document.getElementById('input-app').value = data.app;
    document.getElementById('input-user').value = data.user;
    document.getElementById('input-email').value = data.email;
    document.getElementById('input-pass').value = data.pass;
    document.getElementById('input-notes').innerHTML = data.notes;
    
    if(data.image) {
        document.getElementById('image-preview').src = data.image;
        document.getElementById('image-preview').style.display = 'block';
    } else {
        document.getElementById('image-preview').src = '';
        document.getElementById('image-preview').style.display = 'none';
    }

    document.getElementById('add-modal').classList.add('active');
}

function deleteCurrentEntry() {
    if (confirm("Apakah Anda yakin ingin menghapus entri ini secara permanen?")) {
        passwordsData = passwordsData.filter(item => item.id !== currentViewId);
        
        document.getElementById('detail-sheet').classList.remove('active');
        document.getElementById('folder-modal').classList.remove('active');
        renderFolders();
        showToast("Entri berhasil dihapus! 🗑️");
    }
}

// ====== MODAL FORM ======
function openAddModal() {
    closeFormModal();
    document.getElementById('form-modal-title').textContent = "Tambah Password Baru";
    document.getElementById('add-modal').classList.add('active');
}

function closeFormModal() {
    document.getElementById('add-modal').classList.remove('active');
    document.getElementById('add-pass-form').reset();
    document.getElementById('input-id').value = "";
    document.getElementById('input-notes').innerHTML = ''; 
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('image-preview').src = '';
    
    document.getElementById('input-pass').type = "password";
    document.getElementById('eye-icon').innerHTML = '<i class="bi bi-eye"></i>';
}

function toggleVisibility() {
    const input = document.getElementById('input-pass');
    const icon = document.getElementById('eye-icon');
    if (input.type === "password") {
        input.type = "text"; icon.innerHTML = '<i class="bi bi-eye-slash"></i>';
    } else {
        input.type = "password"; icon.innerHTML = '<i class="bi bi-eye"></i>';
    }
}

function updateCategoryDatalist() {
    const datalist = document.getElementById('category-options');
    datalist.innerHTML = '';
    const uniqueCats = [...new Set(passwordsData.map(item => item.category).filter(c => c))];
    uniqueCats.forEach(cat => { datalist.innerHTML += `<option value="${cat}">`; });
}

function execCmd(command) { document.execCommand(command, false, null); document.getElementById('input-notes').focus(); }
function insertLink() { const url = prompt("Masukkan URL:", "http://"); if (url) document.execCommand('createLink', false, url); }
function insertTable() {
    const rows = prompt("Jumlah baris?", "2"); const cols = prompt("Jumlah kolom?", "2");
    if (rows && cols) {
        let tableHTML = '<table border="1" style="width:100%; border-collapse:collapse;">';
        for(let i=0; i<rows; i++) {
            tableHTML += '<tr>';
            for(let j=0; j<cols; j++) tableHTML += '<td style="padding:4px;">Isi</td>';
            tableHTML += '</tr>';
        }
        tableHTML += '</table><br>';
        document.execCommand('insertHTML', false, tableHTML);
    }
}

function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('image-preview');
            preview.src = e.target.result; preview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
}

// ====== SIMPAN / UPDATE DATA ======
function savePassword(event) {
    event.preventDefault(); 
    
    const idValue = document.getElementById('input-id').value;
    const catValue = document.getElementById('input-category').value.trim();
    const appValue = document.getElementById('input-app').value;
    const userValue = document.getElementById('input-user').value;
    const emailValue = document.getElementById('input-email').value;
    const passValue = document.getElementById('input-pass').value;
    const notesValue = document.getElementById('input-notes').innerHTML; 
    const imgValue = document.getElementById('image-preview').src; 
    const timeNow = getFormattedDate();

    const dataObj = {
        category: catValue,
        app: appValue,
        user: userValue,
        email: emailValue,
        pass: passValue,
        notes: notesValue,
        image: (imgValue.startsWith('data:image') ? imgValue : "")
    };

    if (idValue) {
        const index = passwordsData.findIndex(item => item.id == idValue);
        if(index !== -1) {
            dataObj.id = parseInt(idValue);
            dataObj.createdAt = passwordsData[index].createdAt;
            dataObj.updatedAt = timeNow;
            passwordsData[index] = dataObj;
            showToast("Entri berhasil diperbarui! 📝");
        }
    } else {
        dataObj.id = Date.now();
        dataObj.createdAt = timeNow;
        dataObj.updatedAt = timeNow;
        passwordsData.push(dataObj);
        showToast("Entri baru tersimpan! 🎉");
    }

    renderFolders(); 
    closeFormModal();
    document.getElementById('folder-modal').classList.remove('active');
    
    // Jika sedang dalam kategori tersebut, refresh tampilan list vertikalnya secara otomatis
    if (activeCategoryName) {
        openFolder(activeCategoryName);
    }
}

document.addEventListener('DOMContentLoaded', () => { renderFolders(); });