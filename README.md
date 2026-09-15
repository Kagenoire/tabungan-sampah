# Tabungan Sampah

Website pencatatan Tabungan Sampah untuk Admin (Karang Taruna) dan Cek Tabungan untuk warga (tanpa login). Bisa dipakai oleh RW/lingkungan mana saja, data nasabah punya field RW/RT sendiri sehingga satu instance bisa menampung banyak RW sekaligus.

Dibangun berdasarkan brief `BRIEF WEBSITE TABUNGAN SAMPAH RW 06.docx` dan wireframe 10-layar. Seluruh 22 fitur inti di brief (bagian 10.1 - 10.22) sudah dibangun; sisanya adalah penyempurnaan yang bisa menyusul kalau dibutuhkan (lihat bagian "Ide penyempurnaan lanjutan").

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Firebase Firestore (data) + Firebase Auth (login admin)
- Firebase Admin SDK dipakai khusus di `/api/cek-tabungan` (server route) supaya data warga tidak bisa diakses langsung dari client tanpa ID + No. WhatsApp yang cocok.

## Fitur yang sudah jadi

Alur inti:
- Landing page (tampil harga sampah terbaru + pengumuman dari Firestore, bisa diedit lewat Pengaturan Sistem)
- Login Admin
- Dashboard Admin (statistik + grafik sampah per bulan)
- Data Nasabah (tambah, cari, filter RW & RT, nonaktifkan)
- Detail Nasabah + riwayat setoran per warga
- Input Setoran Sampah (multi jenis sekaligus, harga & persentase terkunci sesuai brief bagian 9)
- Riwayat Setoran (semua nasabah)
- Jenis & Harga Sampah (CRUD + validasi persentase wajib 100% + riwayat perubahan harga)
- Cek Tabungan warga tanpa login (ID Nasabah + No. WhatsApp)

Menu "Lainnya":
- **Akun Admin** - tambah/nonaktifkan akun pengurus Karang Taruna lain, ganti nama/username/password akun sendiri (wajib konfirmasi password saat ini), dan reset password admin lain yang lupa password (dari admin lain yang masih bisa login) - lewat server route + Firebase Admin SDK (bukan client SDK, supaya admin yang login tidak ke-logout saat bikin akun baru)
- **Pencairan Tabungan Lebaran** - cairkan saldo warga, transaksional (anti klik-dobel/race condition, sudah diuji), tercatat siapa/kapan/berapa
- **Dana Karang Taruna** - dashboard total bagian Karang Taruna (dari setoran), dana keluar, dan saldo
- **Supplier / Pengepul** - data pengepul + harga jual per jenis sampah (riwayat harga tersimpan, tidak pernah ditimpa)
- **Penjualan Sampah** - catat hasil jual ke pengepul, multi jenis sekaligus, total otomatis
- **Korlap** - data koordinator lapangan per RT
- **Pengambilan Sampah** - jadwal & status pengambilan (Menunggu/Dijadwalkan/Sedang Diambil/Selesai/Tidak Diambil)
- **Pengaturan Sistem** - nama program, tagline, dan pengumuman, tampil otomatis di landing page
- **Riwayat Aktivitas** - audit log siapa mengubah apa dan kapan, append-only (tidak bisa diedit/dihapus siapa pun termasuk admin, dijamin lewat Firestore rules)

## Ide penyempurnaan lanjutan (belum dibangun, opsional)

- Master data RW/RT terpisah (saat ini RW/RT cukup diisi bebas per nasabah/korlap, sudah tidak hardcode, tapi belum ada halaman kelola daftar RW/RT resmi)
- Lupa password admin lewat WhatsApp otomatis (saat ini kalau lupa password, admin lain yang masih bisa login mereset lewat halaman Akun Admin - butuh minimal 2 admin aktif. Alur WhatsApp otomatis butuh provider API WhatsApp pihak ketiga, misalnya Fonnte/Twilio/WABA resmi, dan kredensialnya harus disediakan sendiri)
- Edit/hapus transaksi Setoran & Penjualan yang sudah tersimpan (sengaja tidak dibuat, supaya riwayat keuangan tidak bisa diutak-atik setelah tercatat - konsisten dengan prinsip "harga lama tidak berubah" di brief)

## Project Firebase asli (sudah aktif)

Project asli **`tabungan-sampah-app`** (Google Cloud project di akun `fs07ytsanggamer@gmail.com`) sudah dibuat dan terhubung, dengan:

- Firestore Database (region `asia-southeast2`, mode production) - aktif
- Authentication, sign-in method Email/Password - aktif
- Security rules & index - sudah di-deploy (`firestore.rules`, `firestore.indexes.json`)
- Config web app & service account Admin SDK - sudah terpasang di `.env.local` (file ini **tidak ikut ke git**, jangan pernah commit/share)
- Data awal: 4 jenis sampah contoh (Botol Plastik/Kardus/Kertas/Besi) + profil program default
- 1 akun admin pertama sudah dibuat (lihat bagian "Login admin" di bawah)

Firebase Console: https://console.firebase.google.com/project/tabungan-sampah-app/overview

Kalau kamu fork repo ini, **jangan pakai project Firebase di atas** - bikin project Firebase sendiri, gratis dan datanya jadi punya kamu sendiri sepenuhnya. Caranya ada lengkap di bagian "Deploy sendiri" di bawah.

## Deploy sendiri (fork, dan publish ke domain sendiri)

Tutorial lengkap dari nol sampai website bisa diakses publik lewat domain sendiri. Gak perlu jago coding, ikutin urut dari atas.

### 1. Fork & clone repo

1. Buka repo ini di GitHub, klik tombol **Fork** di kanan atas (bikin salinan repo ini di akun GitHub kamu sendiri).
2. Di komputer, clone hasil fork-nya:
   ```
   git clone https://github.com/<username-github-kamu>/tabungan-sampah.git
   cd tabungan-sampah
   ```
3. Install [Node.js](https://nodejs.org/) versi 20 ke atas kalau belum ada, lalu install dependency project:
   ```
   npm install
   ```

### 2. Bikin project Firebase sendiri (gratis)

Website ini butuh Firebase buat nyimpen data (nasabah, setoran, dll) dan login admin. Jangan pakai project Firebase punya orang lain - bikin punya sendiri, gratis dan cuma butuh akun Google.

1. Buka [Firebase Console](https://console.firebase.google.com/), klik **Add project**, kasih nama bebas (misal `tabungan-sampah-rw-kamu`), lanjut sampai selesai (Google Analytics boleh dimatikan, gak wajib).
2. Di menu kiri, klik **Build → Firestore Database → Create database**. Pilih **Production mode**, pilih lokasi server terdekat (misal `asia-southeast2` buat Indonesia), klik **Enable**.
3. Di menu kiri, klik **Build → Authentication → Get started**. Klik provider **Email/Password**, nyalakan toggle **Enable**, klik **Save**.
4. Klik ikon gerigi di pojok kiri atas → **Project settings**. Di tab **General**, scroll ke bawah ke bagian **Your apps**, klik ikon web (`</>`), kasih nama app bebas, klik **Register app**. Akan muncul kode config `firebaseConfig` - simpan dulu, dipakai di langkah berikutnya.
5. Masih di **Project settings**, buka tab **Service accounts**, klik **Generate new private key**, klik **Generate key** - akan kedownload 1 file `.json`. Simpan file ini baik-baik, **jangan pernah diupload/dishare ke mana pun** (ini kunci penuh ke database kamu).
6. Balik ke folder project di komputer, copy `.env.example` jadi `.env.local`:
   ```
   cp .env.example .env.local
   ```
   Buka `.env.local`, isi `NEXT_PUBLIC_FIREBASE_*` sesuai `firebaseConfig` dari langkah 4, set `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false` dan `USE_FIREBASE_EMULATOR=false`. Untuk `FIREBASE_SERVICE_ACCOUNT`, buka file `.json` yang kedownload di langkah 5, copy **seluruh isinya jadi satu baris** (hapus semua enter/baris baru), tempel sebagai nilai variabel itu.
7. Login Firebase CLI dan deploy security rules + index (aturan siapa boleh akses data apa):
   ```
   npx firebase-tools login
   npx firebase-tools use --add
   ```
   (pilih project Firebase yang baru dibuat tadi)
   ```
   npx firebase-tools deploy --only firestore:rules,firestore:indexes
   ```
8. Bikin akun admin pertama: di Firebase Console, buka **Authentication → Users → Add user**. Isi email (contoh: `admin@tabungansampah.local` - **harus pakai domain `@tabungansampah.local`**, bukan email asli, karena form login web ini pakai "Username" bukan email) dan password bebas minimal 6 karakter. Nanti login di web pakai Username `admin` (tanpa `@tabungansampah.local`, otomatis ditambahin sistem).
9. Coba jalanin lokal dulu buat mastiin semua beres:
   ```
   npm run dev
   ```
   Buka `http://localhost:3000`, coba login pakai akun admin yang baru dibuat. Kalau berhasil, lanjut ke deploy.
10. Tambahin minimal 1 jenis sampah lewat menu **Jenis & Harga Sampah** di admin, biar form Input Setoran ada isinya.

### 3. Deploy ke internet lewat Vercel (gratis)

1. Push perubahan `.env.local` **JANGAN** di-push ke GitHub (sudah otomatis di-skip lewat `.gitignore`, tapi cek lagi biar aman).
2. Daftar/login ke [Vercel](https://vercel.com) pakai akun GitHub kamu.
3. Klik **Add New → Project**, pilih repo `tabungan-sampah` hasil fork tadi, klik **Import**.
4. Sebelum klik Deploy, buka bagian **Environment Variables**, tambahkan satu-satu semua variabel yang ada di `.env.local` (copy nama dan isinya persis sama, termasuk `FIREBASE_SERVICE_ACCOUNT` yang panjang itu).
5. Klik **Deploy**, tunggu sampai selesai (biasanya 1-2 menit). Vercel akan kasih link otomatis seperti `tabungan-sampah-xxxx.vercel.app` - website sudah live dan bisa diakses siapa saja lewat link itu.

### 4. Pasang domain sendiri

Kalau sudah punya domain sendiri (beli dari Niagahoster, Domainesia, Namecheap, dll):

1. Di dashboard project Vercel, buka tab **Settings → Domains**.
2. Ketik nama domain kamu (misal `tabungansampah-rw06.com` atau subdomain seperti `sampah.karangtaruna.org`), klik **Add**.
3. Vercel akan kasih instruksi record DNS yang perlu ditambahkan (biasanya berupa `A` record atau `CNAME`) - catat nilainya.
4. Login ke panel domain kamu (tempat beli domainnya), cari menu **DNS/Nameserver Management**, tambahkan record sesuai instruksi Vercel di langkah 3.
5. Tunggu 10 menit - 24 jam (proses propagasi DNS), lalu domain kamu otomatis mengarah ke website ini dengan HTTPS aktif otomatis (gratis, dikelola Vercel).

Kalau ada kendala di salah satu langkah, screenshot error-nya dan tanyakan ke siapa pun yang paham coding di kelompok - kemungkinan besar cuma salah copy-paste config Firebase atau env var yang kurang satu.

## Menjalankan secara lokal

```
npm install
npm run dev
```

Buka `http://localhost:3000`.

Secara default `.env.local` di-set ke mode **Firebase Emulator** (`NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`) supaya bisa jalan tanpa project Firebase asli. Untuk memakai emulator:

```
npx firebase-tools emulators:start --only firestore,auth
```

Emulator Firestore butuh **Java 21+** terpasang di komputer kamu (cek versi: `java -version`). Kalau belum ada / versinya di bawah 21, download dari [Adoptium](https://adoptium.org/) (pilih versi 21, paket JRE cukup) lalu install seperti biasa.

Data di emulator **tidak permanen** - hilang tiap emulator dimatikan, kecuali diexport (`emulators:export`) lalu di-import lagi. Sudah ada 1 akun admin dan 4 jenis sampah contoh (Botol Plastik, Kardus, Kertas, Besi) yang diseed manual untuk sesi pertama - lihat bagian "Login" di bawah.

Kalau lebih gampang, langsung sambungkan ke project Firebase asli (set `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false` dan isi config asli) dan skip emulator sama sekali - datanya permanen dan ini yang dipakai kalau nanti deploy ke internet.

## Login admin

Akun admin pertama di project asli: username `admin` (password sudah dikirim terpisah, ganti sendiri lewat menu **Akun Admin → Profil Saya** setelah login pertama kali). Untuk tambah admin lain (pengurus Karang Taruna lainnya), login lalu buka menu **Lainnya → Akun Admin → Tambah Admin**.

Kalau lagi jalan pakai emulator lokal (`NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`), akun contoh yang dipakai untuk testing: username `admin`, password `admin123` - bukan akun produksi, data hilang tiap emulator dimatikan.
