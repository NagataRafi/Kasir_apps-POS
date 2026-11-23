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
