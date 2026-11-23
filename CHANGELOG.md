# CHANGELOG

Semua perubahan penting dicatat di sini. Format mengikuti Keep a Changelog. Versi mengikuti Semantic Versioning.

Kategori: Ditambah, Diubah, Diperbaiki, Dihapus, Keamanan.

## [Belum dirilis]

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
