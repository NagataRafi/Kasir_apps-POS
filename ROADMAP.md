# ROADMAP: KASIR

Versi: 0.1
Tanggal: 2026-11-23
Aturan: kerjakan satu fase pada satu waktu. Pecah fase menjadi tugas kecil yang selesai dalam satu sesi agent. Centang tugas dan perbarui SESSION.md setelah tiap tugas.

## Fase 0: Fondasi
- [ ] Inisialisasi repo, struktur folder, TypeScript, lint, Vitest
- [ ] Pasang skills ke .agents/skills (ponytail, caveman, ui-ux-pro-max)
- [ ] Server Fastify dengan rute /api/health
- [ ] SQLite, mode WAL, sistem migrasi, tabel settings dan users
- [ ] Aplikasi web Vite dengan cangkang PWA kosong
- [ ] Server menyajikan berkas statis web
- [ ] .env.example dan .gitignore
- [ ] Uji akses dari HP di Wi-Fi yang sama (cek jaringan WSL2)
- [x] Commit pertama dan push ke GitHub

Selesai jika: HP di Wi-Fi kafe membuka halaman web dari server, tes dasar lulus, dokumen terisi.

## Fase 1: Menu, Kasir tunai, Struk
- [ ] Login PIN dan peran
- [ ] CRUD kategori dan menu, opsi menu
- [ ] Layar kasir: keranjang, bayar tunai, kembalian
- [ ] Penomoran pesanan harian
- [ ] Struk thermal lewat browser
- [ ] Shift buka dan tutup
- [ ] Batalkan pesanan dengan alasan

Selesai jika: kasir menyelesaikan penjualan tunai dari awal sampai struk tercetak, tes total dan kembalian lulus.

## Fase 2: Stok bahan baku
- [ ] CRUD bahan dan satuan dasar
- [ ] Resep menu dan opsi
- [ ] Potong stok otomatis saat lunas, kembalikan saat batal
- [ ] Mutasi stok: pembelian, penyesuaian, terbuang, opname
- [ ] Peringatan stok menipis
- [ ] Pembelian bahan membuat kas keluar

Selesai jika: satu penjualan memotong bahan sesuai resep, semua mutasi tercatat, tes stok lulus.

## Fase 3: Meja, Pesan dari Meja, Layar Dapur
- [ ] CRUD meja dinamis dan token
- [ ] Cetak QR semua meja
- [ ] Halaman menu pelanggan dan keranjang
- [ ] Pesanan meja dengan bayar di kasir
- [ ] Layar kasir menerima pesanan pending_cashier
- [ ] Layar dapur realtime (SSE) dengan suara
- [ ] Halaman status pesanan pelanggan
- [ ] Batas pesanan belum bayar per meja dan kedaluwarsa

Selesai jika: pelanggan scan QR, memesan, kasir konfirmasi bayar, dapur menerima, status berubah di HP pelanggan.

## Fase 4: QRIS iPaymu dan mode internet mati
- [ ] Baca dokumentasi resmi iPaymu, uji di sandbox
- [ ] Buat QRIS dengan nominal pas
- [ ] Webhook terverifikasi dan idempoten
- [ ] Pemeriksaan status berkala sebagai cadangan
- [ ] Tampilan QR dan hitung mundur di halaman pelanggan dan kasir
- [ ] QRIS manual ShopeeFood sebagai cadangan
- [ ] Deteksi internet mati dan tawaran Bayar di kasir
- [ ] Pasang Cloudflare Tunnel dan uji webhook dari luar
- [ ] Pindah ke mode produksi setelah lulus uji

Selesai jika: pembayaran sandbox dan produksi senilai kecil menandai pesanan lunas otomatis tanpa duplikat.

## Fase 5: Keuangan, Google Sheets, Statistik
- [ ] Halaman kas masuk dan keluar yang bisa diedit, dengan audit log
- [ ] Ringkasan harian, mingguan, bulanan
- [ ] Outbox dan worker Google Sheets
- [ ] Enam tab laporan di Sheets
- [ ] Tombol sinkron ulang dan ekspor CSV
- [ ] Statistik admin: omzet, menu terlaris, jam ramai, metode bayar
- [ ] HPP dan laba kotor (P2)

Selesai jika: data satu hari penjualan muncul benar di Sheets tanpa baris ganda dan statistik cocok dengan hitung manual.

## Fase 6: PWA, Ketahanan, Peluncuran
- [ ] Ikon, manifest, pemasangan di Windows dan HP
- [ ] Cache menu dan cangkang aplikasi
- [ ] Cadangan harian otomatis dan uji pemulihan
- [ ] Mulai otomatis saat PC hidup (systemd, Task Scheduler)
- [ ] Peninjauan keamanan: rute publik, rate limit, rahasia
- [ ] Uji satu hari operasional di kafe
- [ ] Panduan singkat untuk kasir dan dapur

Selesai jika: kafe beroperasi satu hari penuh tanpa pencatatan manual cadangan.

## Backlog (setelah MVP)
- Diskon dan promo
- Cetak ESC/POS ke printer jaringan
- DNS lokal agar QR meja berfungsi saat internet mati
- Tes end-to-end Playwright
- Perhitungan prediksi stok dan saran belanja
- Notifikasi stok menipis ke Telegram
