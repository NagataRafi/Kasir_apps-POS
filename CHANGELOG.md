# CHANGELOG

Semua perubahan penting dicatat di sini. Format mengikuti Keep a Changelog. Versi mengikuti Semantic Versioning.

Kategori: Ditambah, Diubah, Diperbaiki, Dihapus, Keamanan.

## [Belum dirilis]

### Ditambah (2026-11-24)
- Skrip reset PIN: `NEW_PIN=xxxxxx npm run reset-pin -- Admin` (scripts/reset-pin.ts, logika di server/src/modules/auth/reset-pin.ts).
- Reset memvalidasi PIN hanya angka minimal 6 digit, memakai hashPin() yang sama dengan login, menghapus semua sesi pengguna, mengosongkan hitungan percobaan login, dan menolak pengguna yang tidak ada.
- docs/operasi.md berisi cara pakai reset PIN; tests/reset-pin.test.ts menguji PIN lama gagal, PIN baru berhasil, sesi lama tidak valid, dan PIN pendek ditolak.

### Diubah (2026-11-24)
- Halaman login: PIN dapat diisi dari keyboard fisik (type password, inputMode numeric, hanya digit, maks 12), papan angka layar tetap ada.
- Fokus otomatis ke kolom nama, Enter di kolom nama pindah ke PIN, Enter mengirim form bila nama terisi dan PIN minimal 6 digit.
- Tampilan jumlah digit "{n} dari maksimal 12 digit (minimal 6)" tanpa memperlihatkan digit.
- Logika PIN di web/src/lib/pin.ts dengan tes tests/pin.test.ts.
- Server mendengar di 0.0.0.0 dari HOST (default) sehingga localhost:4100 dapat diakses; log memuat baris localhost dan baris alamat LAN.
- web/vite.config.ts membaca PORT dari process.env (default 4100); impor lintas folder dihapus sehingga peringatan Vite hilang.
- Port server dipindah dari 3000 ke 4100 dan dapat diatur lewat PORT/HOST (server/src/config.ts); HOST default 0.0.0.0.
- .env.example memuat PORT=4100 dan HOST=0.0.0.0.
- web/vite.config.ts mem-proxy /api ke http://localhost:PORT untuk npm --prefix web run dev.
- docs/wsl2-akses-hp.md memakai port 4100 (portproxy dan rentang 4100-4110).

### Ditambah Fase 1.2b (2026-11-24)
- web/index.html sebagai entri Vite; web/public/index.html lama dihapus.
- react-router-dom (BrowserRouter di main.tsx), Tailwind CSS v4 lewat @tailwindcss/vite, CSS dasar web/src/index.css.
- Manifest PWA dan ikon sederhana: favicon.svg, logo192.png, logo512.png.
- Fastify menyajikan web/dist lewat @fastify/static dengan fallback index.html untuk rute halaman; /api/* tetap JSON dan 404 JSON.
- Skrip npm: build (web), start dan dev (server tsx).
- eslint mengabaikan coverage, dist, data, dan scripts/ sehingga lint 0 error 0 warning.
- Bukti curl: / dan /login 200 HTML dengan div root, /api/health dan /api/public/menu JSON, login admin 200 + /api/me 200.

### Ditambah Fase 1.2 (2026-11-24)
- Migrasi 003_categories_menu_items.sql: tabel categories (name, sort, active) dan menu_items (category_id, name, description, price, photo_path, available, sort). Harga bilangan bulat rupiah lewat CHECK, foto boleh kosong.
- Modul menu server/src/modules/menu/routes.ts: daftar, buat, ubah, ubah urutan, aktif/nonaktif kategori; daftar, buat, ubah, ubah urutan, tersedia/habis menu. Tulis hanya admin, baca admin dan kasir.
- GET /api/public/menu tanpa login: hanya kategori aktif dan menu tersedia, hanya id, nama, deskripsi, harga, photo_path.
- Validasi zod: harga negatif, bukan bilangan bulat, nama kosong, dan kategori tidak ada ditolak 400.
- Halaman admin web/src/pages/admin/menu.tsx untuk kelola kategori dan menu (target sentuh 44 px, mobile first), rute /admin.
- Tes tests/menu.test.ts (7 tes): validasi harga, izin per peran, menu publik tidak membocorkan menu nonaktif, migrasi 003 setelah 001 dan 002.

### Ditambah
- Dokumen awal: PRD.md, ARCHITECTURE.md, ROADMAP.md, SESSION.md, CHANGELOG.md, knowledge.md (2026-11-23)

### Diperbaiki Fase 0 (2026-11-23)
- Pindahkan hasil kerja dari /tmp/kasir_phase0 ke folder ini
- Salin folder server, web, migrations, tests, package.json, package-lock.json, tsconfig.json, vitest.config.ts, dan berkas dotfile seperti .gitignore dan .env.example. Jangan salin node_modules, data.db, dan skrip bantu di akar
- Jalankan npm install di folder ini
- Jalankan git init, hubungkan remote origin ke https://github.com/NagataRafi/Kasir_apps-POS.git, pastikan .gitignore mengecualikan node_modules, .env, data, dan *.db, lalu commit
- Pasang skills ke .agents/skills (caveman, ui-ux-pro-max, ponytail)
- Tulis minimal satu tes Vitest nyata untuk rute /api/health dan migrasi database
- Jalankan npm test dan npm run lint, tampilkan hasilnya
- Tampilkan /tmp/wsl2_access_steps.md lalu simpan sebagai docs/wsl2-akses-hp.md
- Commit setiap tugas selesai

### Diperbaiki Fase 1.1 (audit kedua, 2026-11-23)
- Migrasi 002 diperbaiki: CREATE INDEX valid dengan nama tabel, kolom user_role dihapus, id INTEGER PRIMARY KEY, token_hash UNIQUE, FK users ON DELETE CASCADE.
- Database lokal data/*.db dihapus lalu semua migrasi dijalankan ulang; pelaksana migrasi transaksional dan berhenti dengan pesan jelas saat SQL error.
- Token sesi 32 byte hex di cookie; database hanya menyimpan SHA-256 di token_hash; verifikasi dengan hashing token cookie.
- Cookie httpOnly, sameSite lax, path /, maxAge 12 jam, secure hanya production. Kedaluwarsa DB 12 jam.
- Pembatasan login dua lapis: per nama (termasuk nama tidak ada) 5 gagal/5 menit, per IP 20 gagal/10 menit. Respons nama salah identik dengan PIN salah.
- Halaman login /login dengan papan angka besar, validasi minimal 6 digit, redirect ke /kasir, /dapur, /admin sesuai peran.
- Tes baru auth-security: token hash di DB = SHA-256 cookie, nama tidak ada terkunci, batas per IP, respons identik, semua migrasi berurutan.

### Ditambah Fase 1.1 (2026-11-23)
- Implementasi login PIN dan peran (login, logout, me endpoint)
- Hash PIN dengan scrypt dari node:crypto, tanpa dependensi baru
- Sesi lewat cookie httpOnly dengan kedaluwarsa 30 hari
- Pembatasan percobaan login: 5 kali salah dalam 5 menit untuk satu pengguna
- Middleware peran untuk admin, kasir, dan dapur
- Migrasi 002_sessions_table.sql untuk tabel sesi
- Seed script scripts/seed-admin.js membaca PIN dari .env
- Tambah ADMIN_PIN ke .env.example
- Vitest auth.test.ts: hash & verifikasi PIN, login benar/salah, pembatasan percobaan, middleware menolak peran yang salah
- 6 tes unit total (health, migration, auth)
- Lint lulus dengan warnings
