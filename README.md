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

Kalau suatu saat mau pindah ke project Firebase lain (misalnya project terpisah untuk lingkungan produksi vs testing), ulangi langkah-langkah ini:
1. Buat project baru di [Firebase Console](https://console.firebase.google.com/), atau lewat CLI: `npx firebase-tools projects:create <project-id>`.
2. Aktifkan **Firestore Database** (mode production, pilih region terdekat).
3. Aktifkan **Authentication → Sign-in method → Email/Password**. **Langkah ini cuma bisa lewat Firebase Console, tidak ada API publik untuk mengaktifkannya pertama kali** - begitu sudah aktif sekali, perubahan config lain baru bisa lewat API.
4. Di **Project Settings → General → Your apps**, tambah Web App, salin config-nya ke `.env.local` (lihat `.env.example`), set `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false` dan `USE_FIREBASE_EMULATOR=false`.
5. Di **Project Settings → Service Accounts**, klik **Generate new private key**, lalu tempel seluruh isi JSON-nya (jadi satu baris) ke `FIREBASE_SERVICE_ACCOUNT` di `.env.local` / Vercel env vars.
6. Deploy security rules & index:
   ```
   npx firebase-tools login
   npx firebase-tools use --add   # pilih project yang baru dibuat
   npx firebase-tools deploy --only firestore:rules,firestore:indexes
   ```
7. Tambahkan minimal 1 dokumen di koleksi `jenisSampah` lewat halaman **Jenis & Harga Sampah** di admin, dan buat akun admin pertama lewat Firebase Console → Authentication → Users (email `admin@tabungansampah.local`, atau username lain + otomatis `@tabungansampah.local`).

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

Emulator Firestore butuh **Java 21+**. Mesin ini cuma punya Java 8 sebagai default sistem, jadi dipasang Java 21 portable (tanpa install, tanpa butuh izin admin) di `C:\Users\FS07Y\AppData\Local\java-portable\jdk-21.0.12.1+1-jre`. Sebelum menjalankan perintah emulator di atas, set dulu:

```
export JAVA_HOME="/c/Users/FS07Y/AppData/Local/java-portable/jdk-21.0.12.1+1-jre"
export PATH="$JAVA_HOME/bin:$PATH"
```

(Kalau pakai PowerShell: `$env:JAVA_HOME = "C:\Users\FS07Y\AppData\Local\java-portable\jdk-21.0.12.1+1-jre"; $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"`)

Data di emulator **tidak permanen** - hilang tiap emulator dimatikan, kecuali diexport (`emulators:export`) lalu di-import lagi. Sudah ada 1 akun admin dan 4 jenis sampah contoh (Botol Plastik, Kardus, Kertas, Besi) yang diseed manual untuk sesi pertama - lihat bagian "Login" di bawah.

Kalau lebih gampang, langsung sambungkan ke project Firebase asli (set `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false` dan isi config asli) dan skip emulator sama sekali - datanya permanen dan ini yang dipakai kalau nanti deploy ke internet.

## Login admin

Akun admin pertama di project asli: username `admin` (password sudah dikirim terpisah, ganti sendiri lewat menu **Akun Admin → Profil Saya** setelah login pertama kali). Untuk tambah admin lain (pengurus Karang Taruna lainnya), login lalu buka menu **Lainnya → Akun Admin → Tambah Admin**.

Kalau lagi jalan pakai emulator lokal (`NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`), akun contoh yang dipakai untuk testing: username `admin`, password `admin123` - bukan akun produksi, data hilang tiap emulator dimatikan.

## Deploy

Cara termudah: [Vercel](https://vercel.com) (`vercel deploy`), lalu set semua env var dari `.env.local`/`.env.example` di Vercel Project Settings → Environment Variables (termasuk `FIREBASE_SERVICE_ACCOUNT`).
