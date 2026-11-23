# SESSION: KASIR

File ini adalah catatan status terkini. Agent membaca file ini di awal sesi dan memperbaruinya setelah tiap tugas selesai. Tulis singkat dan konkret.

## Status saat ini

- Fase aktif: 1 (Fitur) - tugas 1.1 selesai
- Tugas berjalan: completed (login PIN dan peral fully implemented)
- Terakhir diperbarui: 2026-11-23

## Catatan perbaikan 1.1 (2026-11-23)
- Migrasi 002 ditulis ulang valid (CREATE INDEX dengan nama tabel, tanpa user_role).
- Token sesi: crypto.randomBytes(32) hex di cookie, DB hanya SHA-256 di token_hash.
- Cookie: httpOnly, sameSite lax, path /, maxAge 12 jam, secure hanya NODE_ENV=production.
- Rate limit dua lapis: per nama (termasuk nama tidak ada) 5/5 menit; per IP 20/10 menit. Respons nama salah = PIN salah.
- Halaman login /login dengan papan angka besar, redirect sesuai peran.
- Migrasi dari database kosong dijalankan ulang (data/data.db). 19 tes lulus, lint 0 error.

## Sudah selesai

- Move files from /tmp/kasir_phase0 to current folder (server, web, migrations, tests, package.json, package-lock.json, tsconfig.json, vitest.config.ts, .gitignore, .env-example - NOT node_modules, data.db, helper scripts)
- npm install, fix .gitignore, git init, connect remote origin, commit pertama
- Pasang skills: caveman (.agents/skills/caveman/SKILL.md), ui-ux-pro-max (.agents/skills/ui-ux-pro-max beserta scripts dan data), ponytail (.agents/skills/ponytail/SKILL.md)
- Write real Vitest test untuk /api/health dan migrasi database
- Run npm test (6 tests pass: health, migration, auth)
- Run npm run lint (lulus, 7 warnings)
- Display /tmp/wsl2_access_steps.md dan save sebagai docs/wsl2-akses-hp.md
- Commit setiap tugas selesai
- Push ke cabang fase-1-kasir ke GitHub sudah selesai
- Login PIN dan peran: fully implemented dengan scrypt hashing, rate limiting, role middleware

## Langkah berikutnya

1. Lanjut ke Fase 1.2: CRUD kategori dan menu
2. Review dan commit perubahan remaining

## Keputusan terbuka (dari PRD bagian 14)

- Model dan ukuran kertas printer thermal
- Biaya iPaymu ditanggung kafe atau pelanggan
- Domain untuk Cloudflare Tunnel
- Pajak atau biaya layanan
- Struk otomatis untuk pesanan meja
- Data awal menu, bahan, resep

## Masalah yang diketahui

- Belum ada

## Catatan lingkungan

- Folder kerja: /DATA/Project/KASIR (WSL)
- Agent: Freebuff, model DeepSeek V4.1 Flash Slow
- Batas sesi Freebuff: 5 jam. Simpan status sebelum sesi habis.

## Aturan pembaruan

Di akhir setiap tugas:
1. Centang tugas di ROADMAP.md.
2. Perbarui bagian Status, Sudah selesai, dan Langkah berikutnya di file ini.
3. Tambah baris di CHANGELOG.md bagian Belum dirilis.
4. Commit.