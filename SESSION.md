# SESSION: KASIR

File ini adalah catatan status terkini. Agent membaca file ini di awal sesi dan memperbaruinya setelah tiap tugas selesai. Tulis singkat dan konkret.

## Status saat ini

- Fase aktif: 1 (Fitur) - tugas 1.1 dan 1.2 selesai
- Tugas berjalan: completed (perbaikan halaman login: PIN via keyboard, fokus otomatis, Enter)
- Terakhir diperbarui: 2026-11-24

## Catatan perbaikan halaman login (2026-11-24)
- Kolom PIN: input type=password, inputMode numeric, autoComplete off, hanya digit, maksimal 12; papan angka layar tetap ada dan mengisi state yang sama.
- Fokus otomatis ke kolom nama saat halaman dibuka; Enter di kolom nama pindah ke kolom PIN; form dikirim via Enter bila nama terisi dan PIN minimal 6 digit.
- Hitungan digit ditampilkan sebagai "{n} dari maksimal 12 digit (minimal 6)" tanpa memperlihatkan digitnya.
- Error untuk nama salah dan PIN salah tetap "Nama atau PIN salah".
- Logika PIN dipindah ke web/src/lib/pin.ts (sanitizePin, appendPinDigit, canSubmitLogin) dan diuji di tests/pin.test.ts (1 tes, coverage pin.ts 100%).
- 27 tes lulus, build lulus, lint 0 error 0 warning.

## Catatan perbaikan bind dan log (2026-11-24)
- fastify.listen({ port: PORT, host: HOST }) dengan PORT default 4100 dan HOST default 0.0.0.0 dari server/src/config.ts. Tidak ada alamat tetap atau os.networkInterfaces untuk bind.
- Log: "Server berjalan di http://localhost:4100" lalu "Akses perangkat lain: http://<ip-lan>:4100" (IPv4 non-loopback dari os.networkInterfaces, hanya untuk pesan).
- web/vite.config.ts tidak lagi mengimpor server/src/config; port proxy dibaca dari process.env.PORT dengan default 4100. Peringatan Vite hilang.
- Bukti: ss -ltn -> LISTEN 0.0.0.0:4100; curl localhost:4100 dan 127.0.0.1:4100 sama-sama 200 JSON; server dihentikan setelah uji; 26 tes lulus; lint 0 error 0 warning.

## Catatan revisi port (2026-11-24)
- Port 3000 tidak dipakai lagi. server/src/index.ts membaca PORT (default 4100) dan HOST (default 0.0.0.0) dari server/src/config.ts.
- .env.example memuat PORT=4100 dan HOST=0.0.0.0. .env lokal tidak diubah (belum punya PORT, jadi default 4100 berlaku).
- web/vite.config.ts mem-proxy /api ke http://localhost:PORT (default dari server/src/config.ts) agar npm --prefix web run dev bisa dipakai bersama server. Tidak ada angka port ditulis ulang di file lain.
- docs/wsl2-akses-hp.md memakai 4100 (portproxy dan rentang 4100-4110).
- Tes memakai fastify.inject (tanpa port tetap); tidak ada perubahan tes.
- Bukti: server log "Server running at http://10.255.255.254:4100", curl /api/health 200 JSON, curl -I /login 200 text/html, port 3000 menolak koneksi (curl exit 7).

## Catatan tugas 1.2b (2026-11-24)
- web/index.html (Vite entry) ditambahkan; web/public/index.html dihapus agar tidak menimpa hasil build.
- React 19, react-dom, react-router-dom, Tailwind v4 (@tailwindcss/vite) terpasang di web.
- web/src/index.css dasar Tailwind; main.tsx memakai BrowserRouter; vite.config.ts memuat plugin react dan tailwind.
- PWA sederhana: manifest.json dengan ikon favicon.svg, logo192.png, logo512.png (dibuat lokal, tanpa dependensi).
- Fastify memakai @fastify/static dari web/dist dan setNotFoundHandler: rute halaman jatuh ke index.html, /api/* tetap JSON 404.
- Skrip root: npm run dev (tsx watch), npm run build (vite build di web), npm start (tsx server).
- Lint 0 error 0 warning setelah coverage, dist, data, dan scripts/ di-ignore.
- Bukti curl: / dan /login HTML identik dengan div root, /api/health JSON, /api/public/menu JSON, login admin 200 dengan cookie kasir_session, /api/me 200.

## Catatan tugas 1.2 (2026-11-24)
- Audit ulang 1.1: 8 syarat OK. Tidak ada perubahan source; DB lokal dihapus dan migrasi 001+002 dijalankan ulang.
- Migrasi 003: categories (id, name, sort, active) dan menu_items (id, category_id, name, description, price, photo_path, available, sort). Harga INTEGER dengan CHECK >= 0 dan bilangan bulat.
- API: /api/categories dan /api/menu-items (GET admin+kasir, tulis admin), /api/*/order untuk ubah urutan, /api/categories/:id/active, /api/menu-items/:id/available. Tanpa hapus permanen.
- Publik: GET /api/public/menu hanya kategori aktif dan menu tersedia, tanpa sort/active/category_id.
- Halaman admin: web/src/pages/admin/menu.tsx di rute /admin.
- 26 tes lulus, lint 0 error (12 warning lama).

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
- Tugas 1.2: migrasi 003, API kategori/menu, GET /api/public/menu, halaman admin kategori dan menu, tes menu
- Tugas 1.2b: web Vite + Tailwind + PWA shell dapat dibangun, disajikan Fastify dengan fallback SPA, skrip build/start/dev
- Revisi 1.2b: port server 4100 lewat PORT/HOST, proxy /api di Vite dev, dokumen akses HP diperbarui
- Perbaikan 1.2b: bind 0.0.0.0, log localhost dan alamat LAN, Vite membaca PORT dari env tanpa impor lintas folder
- Perbaikan login: PIN bisa diketik keyboard (digit saja, maks 12), fokus otomatis, Enter pindah kolom/kirim form, hitungan digit, tes validasi PIN

## Langkah berikutnya

1. Tugas 1.3: layar kasir (keranjang, bayar tunai, kembalian)
2. Opsi menu (F-02) belum dikerjakan

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