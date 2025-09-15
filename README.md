# 📒 ArthaNote

ArthaNote adalah aplikasi pencatatan keuangan pribadi berbasis web.  
Dibangun menggunakan **React + TailwindCSS** dengan **Firebase** sebagai backend untuk autentikasi, database, dan hosting.

---

## ✨ Fitur
- 🔐 Autentikasi user dengan Firebase
- 💰 Manajemen akun (dompet, bank, e-wallet, dll.)
- 📥 Tambah pemasukan
- 📤 Tambah pengeluaran
- 🏦 Tabungan & transfer antar akun
- 📊 Laporan transaksi dengan filter (harian, mingguan, bulanan, tahunan, custom range)
- 🌗 Mode gelap & terang
- 🌍 Multi-bahasa (Indonesia & English)

---

## 🛠️ Teknologi
- [React](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Firebase](https://firebase.google.com/)
- [Lucide Icons](https://lucide.dev/)

---

## 🚀 Instalasi & Setup

### 1. Clone repository
```bash
git clone https://github.com/USERNAME/arthanote.git
cd arthanote
2. Install dependencies
bash
Copy code
npm install
3. Setup environment
Buat file .env di root project:

env
Copy code
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
🔑 Ganti nilai di atas dengan konfigurasi Firebase project kamu.
Jangan lupa .env masuk ke .gitignore.

4. Jalankan aplikasi
bash
Copy code
npm run dev
5. Build untuk production
bash
Copy code
npm run build
🌐 Deployment
ArthaNote bisa di-deploy ke:

Vercel (rekomendasi untuk React + Vite)

Netlify

Firebase Hosting