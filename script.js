// Konfigurasi Kunci Local Storage
const LS_USERS_KEY = 'film07_users';
const LS_THEME_KEY = 'film07_theme';

// --- FUNGSI UTAMA ---

/**
 * Memuat daftar pengguna dari Local Storage.
 * @returns {Array<Object>} Daftar pengguna atau array kosong.
 */
function loadUsers() {
    try {
        const usersJSON = localStorage.getItem(LS_USERS_KEY);
        return usersJSON ? JSON.parse(usersJSON) : [];
    } catch (e) {
        console.error("Error loading users:", e);
        return [];
    }
}

/**
 * Menyimpan daftar pengguna ke Local Storage.
 * @param {Array<Object>} users Daftar pengguna yang akan disimpan.
 */
function saveUsers(users) {
    try {
        localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
    } catch (e) {
        console.error("Error saving users:", e);
    }
}

/**
 * Mengubah Mode Gelap/Terang
 */
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    
    const isDark = body.classList.contains('dark-mode');
    localStorage.setItem(LS_THEME_KEY, isDark ? 'dark' : 'light');
    
    // Update teks tombol
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.textContent = isDark ? '🌙 Mode Gelap' : '☀️ Mode Terang';
    }
}

// --- INISIALISASI (Run saat halaman dimuat) ---
document.addEventListener('DOMContentLoaded', function() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    
    // Inisialisasi Tema
    const currentTheme = localStorage.getItem(LS_THEME_KEY);
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
    }
    // Set teks tombol tema awal
    if (themeToggle) {
        themeToggle.textContent = body.classList.contains('dark-mode') ? '🌙 Mode Gelap' : '☀️ Mode Terang';
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Hanya jalankan logika autentikasi jika kita berada di auth.html
    if (document.getElementById('auth-form')) {
        handleAuthForm();
    }
});

// --- LOGIKA AUTHENTIKASI (Khusus untuk auth.html) ---

function handleAuthForm() {
    const authForm = document.getElementById('auth-form');
    const authStatus = document.getElementById('auth-status');
    
    authForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Cek apakah form sedang dalam mode pendaftaran (menggunakan toggleAuthMode dari auth.html)
        const isRegister = document.getElementById('auth-title').textContent === 'Daftar Akun FILM07' && 
                           document.getElementById('email-confirm').style.display === 'none'; // Tahap 1 Daftar
        const isConfirming = document.getElementById('email-confirm').style.display !== 'none'; // Tahap 2 Daftar
                           
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmCode = document.getElementById('confirm-code') ? document.getElementById('confirm-code').value.trim() : null;
        
        const users = loadUsers();
        const existingUser = users.find(user => user.email === email);
        
        authStatus.textContent = '';
        authStatus.className = 'status-message';
        
        if (isConfirming) {
             // --- Tahap 2: Konfirmasi Kode ---
            const storedCode = localStorage.getItem('temp_verification_code_' + email);
            
            if (confirmCode === storedCode) {
                const tempUserData = JSON.parse(localStorage.getItem('temp_register_data_' + email));
                
                if (tempUserData) {
                    // Selesaikan Pendaftaran
                    users.push({ 
                        email: tempUserData.email, 
                        password: tempUserData.password, 
                        isLoggedIn: true 
                    });
                    saveUsers(users);
                    localStorage.removeItem('temp_verification_code_' + email);
                    localStorage.removeItem('temp_register_data_' + email);
                    
                    authStatus.textContent = 'Pendaftaran Berhasil! Anda akan diarahkan ke Beranda.';
                    authStatus.classList.add('success');
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                }
            } else {
                authStatus.textContent = 'Kode verifikasi salah. Coba lagi.';
                authStatus.classList.add('error');
            }

        } else if (isRegister) {
            // --- Tahap 1: Pendaftaran (Kirim Kode) ---
            if (existingUser) {
                authStatus.textContent = 'Email sudah terdaftar. Silakan Masuk.';
                authStatus.classList.add('error');
                return;
            }
            
            // SIMULASI PENGIRIMAN EMAIL DENGAN KODE ACAK
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            localStorage.setItem('temp_verification_code_' + email, verificationCode);
            
            // Simpan data pendaftaran sementara
            localStorage.setItem('temp_register_data_' + email, JSON.stringify({ email, password }));
            
            authStatus.textContent = `Kode verifikasi 6 digit telah "dikirim" ke ${email}. (Simulasi: Kode Anda adalah ${verificationCode})`;
            authStatus.classList.add('success');
            
            // Ubah tampilan form ke mode konfirmasi kode
            document.getElementById('password-group').style.display = 'none';
            document.getElementById('email-confirm').style.display = 'block';
            document.querySelector('button[type="submit"]').textContent = 'Verifikasi & Daftar';
            document.getElementById('toggle-auth').style.display = 'none'; 
            
        } else {
            // --- LOGIKA LOGIN ---
            if (existingUser && existingUser.password === password) {
                // Login Berhasil 
                
                // Set status login
                users.forEach(user => user.isLoggedIn = (user.email === email));
                saveUsers(users);
                
                authStatus.textContent = 'Login Berhasil! Anda akan diarahkan ke Beranda.';
                authStatus.classList.add('success');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                authStatus.textContent = 'Email atau Password salah.';
                authStatus.classList.add('error');
            }
        }
    });
}