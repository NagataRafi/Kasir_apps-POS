# PRD: KASIR (POS Kafe)

Versi: 0.1
Tanggal: 2026-11-23
Pemilik: Rafi Nagata
Repo: https://github.com/NagataRafi/Kasir_apps-POS.git

## 1. Ringkasan

KASIR adalah aplikasi POS untuk satu kafe milik sendiri. Aplikasi berjalan di PC server milik pemilik. Kasir, dapur, admin, dan pelanggan memakainya lewat browser. Aplikasi bisa dipasang sebagai PWA di Windows dan HP.

Fitur utama:
- Kasir: input pesanan, bayar tunai atau QRIS, cetak struk.
- QRIS dinamis dengan nominal otomatis pas (iPaymu).
- QR per meja. Pelanggan melihat menu dan memesan dari HP.
- Layar dapur untuk pesanan masuk.
- Stok per bahan baku dengan resep per menu.
- Laporan keuangan dan stok yang mudah diedit, lalu masuk ke Google Sheets sebagai laporan.
- Statistik performa kafe untuk admin.
- Semi offline: kasir dan dapur tetap jalan saat internet mati.

## 2. Tujuan dan non-tujuan

Tujuan:
- Mempercepat transaksi dan mengurangi salah hitung.
- Stok bahan baku terpotong otomatis dari resep.
- Pemilik melihat omzet, laba kotor, dan menu terlaris tanpa hitung manual.
- Pelanggan memesan dan membayar sendiri dari meja.

Non-tujuan (jangan dibuat kecuali PRD diubah):
- Multi cabang dan multi kafe.
- Aplikasi native Android, iOS, atau Electron.
- Sinkron dua arah dari Google Sheets ke aplikasi.
- Program loyalti, voucher, dan reservasi.
- Integrasi ojek online dan marketplace.
- Penggajian dan absensi pegawai.

## 3. Pengguna dan peran

- Admin (pemilik): semua fitur, termasuk menu, stok, keuangan, statistik, meja, pengguna, pengaturan.
- Kasir (1 orang): buka dan tutup shift, input pesanan, terima pembayaran, cetak struk, konfirmasi pesanan meja yang bayar di kasir.
- Dapur (1 orang): melihat pesanan yang sudah sah dan mengubah status menjadi diproses dan siap.
- Pelanggan: tanpa akun. Masuk lewat QR meja, memesan, membayar QRIS, melihat status.

Login staf memakai PIN. Pelanggan tidak login.

## 4. Dokumen pendukung

- PRD.md: dokumen ini, sumber kebenaran untuk kebutuhan.
- ARCHITECTURE.md: stack, struktur folder, model data, alur teknis.
- ROADMAP.md: fase kerja dan kriteria selesai.
- SESSION.md: status kerja terkini untuk menyambung sesi agent.
- CHANGELOG.md: riwayat perubahan.
- knowledge.md: aturan kerja untuk agent Freebuff.

Jika ada konflik, urutan prioritas: PRD.md, lalu ARCHITECTURE.md, lalu ROADMAP.md.

## 5. Keputusan yang sudah dikunci

1. Google Sheets hanya untuk laporan. Database aplikasi adalah sumber data utama. Edit data dilakukan di halaman admin.
2. Pembayaran QRIS dinamis memakai iPaymu. Cadangan: QRIS statis merchant ShopeeFood Partner dengan konfirmasi manual oleh kasir.
3. Pelanggan memesan dari meja dan membayar di muka lewat QRIS. Jika internet mati atau QRIS gagal, pesanan meja boleh dibayar di kasir.
4. Pengguna: 1 kasir, 1 dapur, jumlah meja dinamis (contoh awal 8 meja) yang diatur admin.
5. Stok per bahan baku dengan resep, detail.
6. Admin punya menu statistik performa kafe.
7. Struk dicetak ke printer thermal.
8. Pengembangan di WSL (Windows) memakai agent Freebuff dari terminal.
9. Server berjalan di PC pemilik, dibuka ke internet lewat Cloudflare Tunnel.

## 6. Alur utama

### 6.1 Pesan dari meja, bayar QRIS (alur normal)
1. Pelanggan scan QR meja. Halaman menu terbuka dengan nomor meja terisi.
2. Pelanggan memilih menu dan opsi, lalu menekan Pesan.
3. Server membuat pesanan berstatus menunggu bayar dan meminta QRIS ke iPaymu dengan nominal total.
4. Pelanggan melihat QR dan hitung mundur kedaluwarsa, lalu membayar dari aplikasi bank atau e-wallet.
5. iPaymu mengirim webhook. Server memverifikasi, menandai lunas, memotong stok, dan mengirim pesanan ke layar dapur.
6. Dapur mengubah status ke diproses lalu siap. Pelanggan melihat status berubah di HP.
7. Kasir mencetak struk bila diminta atau struk otomatis dicetak.

### 6.2 Pesan dari meja, bayar di kasir
1. Pelanggan memilih Bayar di kasir (otomatis tersedia saat QRIS tidak bisa dipakai).
2. Pesanan berstatus menunggu bayar di kasir dan muncul di layar kasir dengan nomor meja.
3. Kasir menerima tunai atau QRIS manual, lalu menandai lunas.
4. Setelah lunas, pesanan masuk layar dapur dan stok terpotong.

### 6.3 Pesanan dari kasir
Kasir memilih menu, memilih metode bayar (tunai, QRIS iPaymu, QRIS manual), konfirmasi, cetak struk. Pesanan lunas masuk dapur.

### 6.4 Shift kasir
Kasir membuka shift dengan modal awal. Saat tutup, kasir memasukkan uang fisik. Sistem menghitung selisih terhadap perkiraan.

### 6.5 Internet mati (semi offline)
- Server lokal tetap hidup. Kasir dan dapur yang tersambung Wi-Fi kafe tetap bekerja.
- Pembayaran tunai dan QRIS manual tetap bisa.
- QRIS iPaymu tidak tersedia. Aplikasi menampilkan peringatan dan menawarkan metode lain.
- Antrean sinkron Google Sheets menumpuk dan terkirim saat internet pulih.
- Pesan dari meja lewat QR hanya berjalan jika HP pelanggan dapat menjangkau server. Lihat risiko R3 di bagian 13.

## 7. Kebutuhan fungsional

Prioritas: P1 wajib untuk MVP, P2 setelah MVP stabil.

### Modul Menu (admin)
- F-01 P1: CRUD kategori dan menu (nama, harga, deskripsi, foto, status tersedia).
- F-02 P1: Opsi menu (misal ukuran, level gula, tambahan) dengan selisih harga.
- F-03 P2: Menu otomatis berstatus habis bila bahan tidak cukup untuk satu porsi.

### Modul Kasir
- F-10 P1: Layar kasir cepat untuk PC, tablet, dan HP.
- F-11 P1: Metode bayar tunai dengan hitung kembalian.
- F-12 P1: Cetak struk thermal (58 mm atau 80 mm, sesuai printer).
- F-13 P1: Shift buka dan tutup dengan selisih kas.
- F-14 P1: Batalkan pesanan dengan alasan. Pembatalan pesanan lunas butuh PIN admin dan mengembalikan stok.
- F-15 P2: Diskon nominal atau persen per pesanan.
- F-16 P2: Cetak ulang struk.

### Modul Meja dan Pesan dari Meja
- F-20 P1: Admin menambah, mengubah, menonaktifkan meja. Jumlah meja bebas.
- F-21 P1: Sistem membuat QR per meja berisi token acak yang tidak bisa ditebak. Admin dapat mencetak QR semua meja dan membuat ulang token.
- F-22 P1: Halaman menu pelanggan (mobile first), keranjang, catatan, kirim pesanan.
- F-23 P1: Halaman status pesanan untuk pelanggan, update otomatis.
- F-24 P1: Pelanggan memilih Bayar QRIS atau Bayar di kasir.
- F-25 P1: Pembatasan penyalahgunaan: batas jumlah pesanan belum bayar per meja dan kedaluwarsa pesanan yang tidak dibayar.

### Modul Pembayaran
- F-30 P1: QRIS dinamis iPaymu dengan nominal pas, waktu kedaluwarsa, dan buat ulang QR.
- F-31 P1: Webhook iPaymu dengan verifikasi, idempoten, dan cek nominal.
- F-32 P1: Cek status berkala sebagai cadangan jika webhook terlambat.
- F-33 P1: QRIS manual (gambar QRIS statis ShopeeFood Partner) dengan konfirmasi kasir.
- F-34 P1: Semua pembayaran tercatat di tabel payments dengan referensi penyedia.

### Modul Dapur
- F-40 P1: Layar dapur realtime berisi pesanan lunas, urut waktu, dengan nomor meja atau nama kasir.
- F-41 P1: Status baru, diproses, siap, selesai. Notifikasi suara untuk pesanan baru.
- F-42 P2: Waktu penyajian rata-rata dihitung dari timestamp status.

### Modul Stok Bahan Baku
- F-50 P1: CRUD bahan (nama, satuan dasar, stok awal, batas minimum, harga beli per satuan).
- F-51 P1: Resep per menu dan per opsi (jumlah bahan per porsi).
- F-52 P1: Stok terpotong otomatis saat pesanan lunas. Pembatalan mengembalikan stok.
- F-53 P1: Mutasi stok: pembelian, pemakaian, penyesuaian, bahan rusak atau terbuang, opname. Semua tercatat dengan pengguna dan waktu.
- F-54 P1: Peringatan stok menipis di dashboard admin dan kasir.
- F-55 P1: Pembelian bahan menambah stok dan otomatis membuat catatan kas keluar.
- F-56 P2: Perhitungan HPP per menu dari resep dan harga beli.
- Penjualan saat stok tidak cukup tetap diizinkan, stok boleh negatif, dan sistem memberi peringatan.

### Modul Keuangan
- F-60 P1: Kas masuk otomatis dari penjualan lunas.
- F-61 P1: Kas keluar dan kas masuk lain dicatat manual (kategori, nominal, catatan, tanggal).
- F-62 P1: Admin dapat mengedit dan menghapus catatan manual. Setiap perubahan masuk audit log.
- F-63 P1: Ringkasan harian, mingguan, bulanan: pemasukan, pengeluaran, selisih.
- F-64 P2: Rekap per metode bayar dan per shift.

### Modul Laporan Google Sheets
- F-70 P1: Data dikirim satu arah dari database ke Google Sheets lewat service account.
- F-71 P1: Tab: Penjualan, Detail Item, Stok Bahan, Mutasi Stok, Keuangan, Ringkasan Harian.
- F-72 P1: Antrean pengiriman (outbox) dengan percobaan ulang. Aman saat offline dan tidak membuat baris ganda.
- F-73 P1: Tombol sinkron ulang manual di halaman admin.
- F-74 P1: Ekspor CSV dari halaman admin sebagai cadangan.

### Modul Statistik Admin
- F-80 P1: Omzet, jumlah transaksi, rata-rata nilai pesanan per hari, minggu, bulan.
- F-81 P1: Menu terlaris dan terendah.
- F-82 P1: Jam dan hari ramai.
- F-83 P1: Rincian per metode bayar dan per sumber pesanan (kasir atau meja).
- F-84 P2: Laba kotor (penjualan dikurangi HPP).
- F-85 P2: Pemakaian bahan dan estimasi hari stok tersisa.
- F-86 P2: Waktu penyajian rata-rata.

### Modul Pengguna dan Pengaturan
- F-90 P1: Kelola pengguna dan PIN. Peran admin, kasir, dapur.
- F-91 P1: Pengaturan kafe: nama, alamat, footer struk, pajak atau biaya layanan (opsional), jam operasional.
- F-92 P1: Audit log untuk aksi sensitif.

## 8. Kebutuhan non-fungsional

- Platform: PWA. Windows (Chrome atau Edge), Android (Chrome), iOS (Safari) lewat Tambahkan ke Layar Utama.
- Kinerja: layar kasir menyimpan pesanan dalam waktu kurang dari 1 detik di jaringan lokal.
- Realtime: pesanan lunas muncul di dapur dalam kurang dari 2 detik.
- Uang: semua nominal disimpan sebagai bilangan bulat rupiah.
- Stok: semua jumlah disimpan sebagai bilangan bulat dalam satuan dasar (gram, ml, pcs).
- Zona waktu: Asia/Jakarta. Bahasa antarmuka: Indonesia.
- Keamanan: lihat bagian 12.
- Cadangan: salinan harian database dengan penyimpanan 14 hari terakhir.
- Aksesibilitas: target sentuh minimal 44 px, kontras teks cukup, bisa dipakai satu tangan di HP.
- Kemudahan: kasir baru bisa memakai layar kasir tanpa pelatihan lebih dari 15 menit.

## 9. Model data (ringkas)

Rincian ada di ARCHITECTURE.md. Entitas utama: users, tables, categories, menu_items, options, ingredients, recipes, orders, order_items, payments, stock_movements, cash_entries, shifts, sheets_outbox, audit_log, settings.

## 10. Integrasi

### iPaymu (QRIS dinamis)
- Agent wajib membaca dokumentasi resmi iPaymu sebelum menulis kode. Dilarang menebak endpoint, header, atau format tanda tangan.
- Mode sandbox dulu, produksi setelah lulus uji.
- Kunci API hanya di file .env. Tidak boleh masuk git.
- Webhook harus memakai alamat publik (Cloudflare Tunnel).
- Pemilik perlu menyiapkan: akun iPaymu aktif dan terverifikasi, API Key, nomor VA.

### Google Sheets
- Service account dengan akses edit ke satu spreadsheet.
- ID spreadsheet dan kredensial di .env.

### Printer thermal
- Keputusan awal: cetak lewat browser memakai CSS struk 58 mm atau 80 mm pada PC kasir. Cetak senyap memakai opsi kiosk-printing di pintasan Chrome.
- Opsi lanjutan (P2): cetak ESC/POS langsung bila printer jaringan.

## 11. Skills agent

Agent memasang skills ke folder .agents/skills.

- ponytail: sudah ada sumbernya (https://github.com/DietrichGebert/ponytail). Level default full. Skill ini memotong fitur yang tidak diminta. Cakupan fitur tetap mengikuti PRD ini, jadi fitur di PRD bukan fitur tambahan.
- caveman: agent membalas singkat. Agent mencari sumber resminya dan menampilkan URL ke pemilik sebelum memasang.
- ui-ux-pro-max: dipakai untuk semua halaman. Agent mencari sumber resminya dan menampilkan URL ke pemilik sebelum memasang.
- Aturan testing, keamanan, database, dan git sudah ditulis di knowledge.md. Skill pihak ketiga untuk bidang ini opsional, dicari nanti bila perlu.

## 12. Keamanan

- PIN staf di-hash. Pembatasan percobaan login.
- Token meja acak, panjang, dan bisa dibuat ulang.
- Rute publik dibatasi: hanya menu meja, buat pesanan, status pesanan, dan webhook. Rute kasir, dapur, admin wajib login.
- Webhook diverifikasi dan idempoten. Nominal dicocokkan dengan pesanan.
- Validasi semua input di server.
- Rahasia hanya di .env. File .env masuk .gitignore.
- Cloudflare Tunnel dipakai agar port router tidak dibuka.
- Audit log untuk perubahan harga, stok, keuangan, pembatalan, dan pengguna.

## 13. Risiko

- R1: PC server mati berarti kafe berhenti memakai aplikasi. Mitigasi: cadangan harian, mulai otomatis saat PC hidup, mode tulis tangan sementara.
- R2: WSL2 tidak terjangkau dari perangkat lain di Wi-Fi secara bawaan. Mitigasi: mode jaringan mirrored di .wslconfig atau portproxy Windows. Diuji di Fase 0.
- R3: QR meja memakai alamat publik, jadi saat internet mati HP pelanggan tidak bisa membukanya. Mitigasi awal: saat offline kasir yang menginput pesanan. Opsi lanjutan: DNS lokal di router agar domain mengarah ke server saat di Wi-Fi kafe.
- R4: Model agent gratis lebih lemah. Mitigasi: tugas kecil per sesi, tes otomatis, SESSION.md selalu diperbarui.
- R5: Pesanan palsu atau iseng dari QR. Mitigasi: pesanan baru masuk dapur hanya setelah lunas atau dikonfirmasi kasir. Ada batas pesanan belum bayar per meja.
- R6: Kesalahan hitung uang. Mitigasi: bilangan bulat, tes unit untuk total, kembalian, stok.

## 14. Keputusan terbuka

1. Model dan ukuran kertas printer thermal.
2. Biaya iPaymu ditanggung kafe atau dibebankan ke pelanggan.
3. Domain untuk Cloudflare Tunnel. Domain yang sudah dikelola di Cloudflare diperlukan.
4. Pajak atau biaya layanan dipakai atau tidak.
5. Struk otomatis tercetak untuk pesanan meja atau hanya saat diminta.
6. Daftar menu, bahan, dan resep awal. Pemilik menyiapkan data awal.

## 15. Kriteria MVP selesai

- Kasir dapat menjual tunai dan QRIS iPaymu, struk tercetak.
- Pesanan dari meja lunas lewat QRIS masuk dapur otomatis.
- Stok bahan terpotong sesuai resep dan bisa diedit dari halaman admin.
- Data penjualan, stok, dan keuangan muncul di Google Sheets.
- Admin melihat statistik dasar.
- Aplikasi terpasang di PC kasir dan HP, dan lolos uji satu hari operasional di kafe.
