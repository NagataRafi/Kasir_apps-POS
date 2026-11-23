# knowledge.md: aturan kerja agent untuk KASIR

Proyek: aplikasi POS untuk satu kafe. Pemilik berbahasa Indonesia.

## Mulai setiap sesi

1. Baca SESSION.md, lalu ROADMAP.md, lalu bagian PRD.md dan ARCHITECTURE.md yang relevan.
2. Kerjakan satu tugas kecil dari fase aktif. Jangan lompat fase.
3. Jika kebutuhan tidak jelas atau bertentangan dengan PRD.md, tanya pemilik. Jangan menebak.

## Akhiri setiap tugas

0. Agent tidak boleh menulis "selesai" atau mencentang tugas tanpa menampilkan keluaran perintah yang membuktikannya. Setiap klaim harus disertai keluaran perintah (npm test, npm run lint, cat, grep, ls, git diff --stat).
1. Jalankan tes dan lint. Perbaiki sampai lulus.
2. Centang tugas di ROADMAP.md.
3. Perbarui SESSION.md dan CHANGELOG.md.
4. Commit kecil dengan pesan gaya conventional commits (feat, fix, docs, test, chore).
Sesi Freebuff dibatasi 5 jam. Perbarui SESSION.md sebelum sesi habis.

## Gaya kerja

- Balas dalam bahasa Indonesia, singkat, langsung (skill caveman).
- Terapkan skill ponytail level full: perubahan terkecil yang menyelesaikan tugas. Fitur di PRD.md adalah cakupan resmi. Jangan memangkasnya. Jangan menambah fitur di luar PRD.md.
- Untuk halaman antarmuka, pakai skill ui-ux-pro-max. Pelanggan mobile first. Kasir dan dapur nyaman di tablet dan PC. Target sentuh minimal 44 px.
- Pasang skills ke .agents/skills. Jika sumber caveman atau ui-ux-pro-max belum pasti, tampilkan URL kandidat ke pemilik dan minta konfirmasi sebelum memasang.

## Aturan teknis

- Stack mengikuti ARCHITECTURE.md. Tidak boleh mengganti stack tanpa persetujuan pemilik.
- Uang: bilangan bulat rupiah. Dilarang memakai float untuk uang.
- Stok: bilangan bulat dalam satuan dasar (g, ml, pcs).
- Waktu: simpan UTC, tampilkan Asia/Jakarta.
- Perubahan uang, stok, dan status pembayaran terjadi dalam satu transaksi database.
- Validasi semua input server dengan zod.
- Jangan menambah dependensi untuk beberapa baris kode. Cek pustaka standar dan dependensi yang sudah ada dulu.
- Migrasi database berupa berkas SQL bernomor. Jangan mengubah migrasi yang sudah dijalankan. Buat migrasi baru.

## Keamanan

- Rahasia hanya di .env. Jangan commit .env. Jaga .env.example tetap tanpa nilai asli.
- Jangan mencetak kunci API atau PIN ke log.
- Rute publik hanya yang tercantum di ARCHITECTURE.md bagian 5.
- Webhook wajib diverifikasi, idempoten, dan mencocokkan nominal.
- Jangan menjalankan perintah destruktif (rm -rf di luar folder build, drop database, git push --force). Minta izin dulu.
- Jangan menyentuh berkas di luar folder proyek.

## iPaymu

Jangan menebak endpoint, header, atau cara membuat tanda tangan. Baca dokumentasi resmi iPaymu. Jika tidak bisa mengakses dokumentasi, minta pemilik menempelkan bagian yang diperlukan. Pakai sandbox sampai pemilik menyetujui produksi.

## Pengujian

Tes wajib untuk: total dan kembalian, potong dan kembalikan stok, transisi status pesanan, webhook (idempoten, nominal salah, tanda tangan salah), outbox Sheets tanpa duplikat. Tulis tes bersama kodenya.

## Git

- Agent boleh git push ke cabang kerja per fase (contoh fase-1-kasir) setiap kali satu tugas selesai dan tes lulus.
- Agent tidak boleh push ke main, tidak boleh force push, tidak boleh menghapus cabang remote, tidak boleh membaca atau menampilkan isi folder ~/.config/gh atau token apa pun, dan tidak boleh mengubah konfigurasi git atau gh.
- Kombinasi ke main dilakukan pemilik lewat pull request.
- Pesan commit satu baris tanpa karakter \n.
- Contoh cabang: fase-1-kasir, fase-2-menu, dst.
