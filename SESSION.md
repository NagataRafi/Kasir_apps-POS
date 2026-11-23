# SESSION: KASIR

File ini adalah catatan status terkini. Agent membaca file ini di awal sesi dan memperbaruinya setelah tiap tugas selesai. Tulis singkat dan konkret.

## Status saat ini

- Fase aktif: 0 (Fondasi)
- Tugas berjalan: completed (6 dari 6)
- Terakhir diperbarui: 2026-11-23

## Sudah selesai

- Move files from /tmp/kasir_phase0 to current folder (server, web, migrations, tests, package.json, package-lock.json, tsconfig.json, vitest.config.ts, .gitignore, .env-example - NOT node_modules, data.db, helper scripts)
- npm install, fix .gitignore, git init, connect remote origin, commit pertama
- Pasang skills: caveman (.agents/skills/caveman/SKILL.md), ui-ux-pro-max (.agents/skills/ui-ux-pro-max beserta scripts dan data), ponytail (.agents/skills/ponytail/SKILL.md)
- Write real Vitest test untuk /api/health dan migrasi database
- Run npm test (2 tests pass: health endpoint, migration)
- Run npm run lint (lulus)
- Display /tmp/wsl2_access_steps.md dan save sebagai docs/wsl2-akses-hp.md
- Commit setiap tugas selesai

## Langkah berikutnya

1. Lanjut ke Fase 1: Menu, Kasir tunai, Struk
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