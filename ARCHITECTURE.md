# ARCHITECTURE: KASIR

Versi: 0.1
Tanggal: 2026-11-23
Acuan kebutuhan: PRD.md

Semua pilihan di bawah adalah keputusan teknis awal. Ubah hanya lewat pembaruan dokumen ini dan catatan di CHANGELOG.md.

## 1. Prinsip

- Satu proses server, satu database, satu aplikasi web. Sederhana dan mudah dipulihkan.
- Server lokal adalah pusat. Internet hanya dipakai untuk QRIS iPaymu, Google Sheets, dan akses publik pelanggan.
- Uang dan stok memakai bilangan bulat.
- Semua perubahan uang dan stok terjadi dalam satu transaksi database.

## 2. Diagram

```
HP pelanggan (QR meja) --\
                          \        Cloudflare Tunnel
Internet ------------------+--> https://kasir.<domain> ---+
                                                          |
HP / PC kasir, layar dapur, admin (Wi-Fi kafe) -----------+--> PC server (WSL2)
                                                               |
                                                               |-- Fastify (API + SSE + file statis PWA)
                                                               |-- SQLite (data.db)
                                                               |-- Worker outbox Sheets
                                                               |-- Cadangan harian
                                                               |
                                       iPaymu <---- webhook ----+
                                       iPaymu <---- buat QRIS ---+
                                       Google Sheets <-- outbox -+
```

## 3. Stack

- Runtime: Node.js LTS terbaru, TypeScript.
- Server: Fastify.
- Database: SQLite dengan better-sqlite3 dan migrasi SQL sederhana (atau Drizzle ORM bila diperlukan). Mode WAL aktif.
- Validasi: zod.
- Realtime: Server-Sent Events (SSE). Lebih sederhana dari WebSocket dan cukup untuk satu arah (server ke layar).
- Frontend: React dengan Vite, Tailwind CSS, PWA lewat vite-plugin-pwa.
- Tes: Vitest untuk unit, Playwright untuk alur utama (P2).
- QR: pustaka pembuat QR di server atau klien.
- Sheets: googleapis dengan service account.
- Akses publik: cloudflared (Cloudflare Tunnel).

Alasan SQLite: satu kafe, satu server, beban kecil. Tidak butuh layanan database terpisah.

## 4. Struktur folder

```
Kasir_apps-POS/
  PRD.md
  ARCHITECTURE.md
  ROADMAP.md
  SESSION.md
  CHANGELOG.md
  knowledge.md
  .env.example
  .gitignore
  .agents/skills/        skills agent
  server/
    src/
      index.ts           titik masuk
      db/                koneksi, migrasi, query
      modules/
        auth/
        menu/
        tables/
        orders/
        payments/        iPaymu, qris manual, webhook
        kitchen/
        inventory/       bahan, resep, mutasi
        finance/
        reports/         outbox dan sheets
        stats/
        settings/
      lib/               uang, waktu, token, sse
    migrations/
    tests/
  web/
    src/
      pages/
        kasir/
        dapur/
        admin/
        meja/            halaman pelanggan
      components/
      lib/
    public/              ikon PWA
  scripts/               cadangan, setup
  data/                  data.db dan cadangan (tidak masuk git)
```

## 5. Rute aplikasi

Halaman:
- /kasir
- /dapur
- /admin
- /m/:tableToken (menu pelanggan)
- /pesanan/:orderCode (status pesanan pelanggan)

API publik (tanpa login):
- GET /api/public/menu
- POST /api/public/orders (dengan tableToken)
- GET /api/public/orders/:code
- GET /api/public/orders/:code/stream (SSE)
- POST /api/payments/ipaymu/webhook

API staf (butuh login dan peran): semua rute lain di bawah /api.

## 6. Model data

Semua nominal dalam rupiah bulat. Semua waktu disimpan UTC dan ditampilkan Asia/Jakarta.

- users: id, name, role (admin, kasir, dapur), pin_hash, active
- tables: id, label, token, active, sort
- categories: id, name, sort
- menu_items: id, category_id, name, description, price, photo_path, available, sort
- option_groups: id, menu_item_id, name, required, multi
- options: id, group_id, name, price_delta
- ingredients: id, name, unit (g, ml, pcs), stock_qty, min_qty, cost_per_unit
- recipes: menu_item_id, ingredient_id, qty
- option_recipes: option_id, ingredient_id, qty
- orders: id, code (harian, contoh A-001), source (kasir, meja), table_id, status, payment_status, payment_method, subtotal, discount, tax, total, note, created_by, created_at, paid_at, cancelled_at, cancel_reason
- order_items: id, order_id, menu_item_id, name_snapshot, price_snapshot, qty, note
- order_item_options: id, order_item_id, option_id, name_snapshot, price_delta_snapshot
- payments: id, order_id, provider (cash, ipaymu, qris_manual), provider_ref, amount, status, qr_payload, expires_at, paid_at, raw_callback
- stock_movements: id, ingredient_id, type (purchase, usage, adjustment, waste, opname, restore), qty_delta, note, order_id, user_id, created_at
- cash_entries: id, type (in, out), category, amount, note, occurred_at, order_id, user_id, deleted_at
- shifts: id, cashier_id, opened_at, opening_cash, closed_at, counted_cash, expected_cash
- sheets_outbox: id, kind, entity_id, payload, status (pending, sent, failed), attempts, last_error, created_at, sent_at
- audit_log: id, user_id, action, entity, entity_id, before, after, created_at
- settings: key, value

Snapshot nama dan harga di order_items menjaga riwayat tetap benar walau menu berubah.

## 7. Status pesanan

order.status:
- pending_payment: dibuat, menunggu QRIS lunas
- pending_cashier: pesanan meja menunggu bayar di kasir
- paid: lunas, masuk antrean dapur
- preparing: sedang dibuat
- ready: siap diantar
- completed: selesai
- cancelled: batal
- expired: tidak dibayar sampai batas waktu

payment_status: unpaid, paid, refunded.

Dapur hanya melihat status paid, preparing, ready.

## 8. Alur pembayaran QRIS iPaymu

1. Server membuat pesanan pending_payment dalam satu transaksi.
2. Server memanggil iPaymu untuk membuat QRIS dengan nominal total. Format permintaan mengikuti dokumentasi resmi iPaymu.
3. Server menyimpan baris payments (provider_ref, qr_payload, expires_at).
4. Klien menampilkan QR dan hitung mundur.
5. Webhook diterima. Server memverifikasi sesuai dokumentasi iPaymu, mencari payments lewat provider_ref, mencocokkan nominal, lalu dalam satu transaksi: set paid, potong stok, buat cash_entry masuk, tulis outbox.
6. Webhook yang sama diterima dua kali tidak boleh menggandakan efek (idempoten).
7. Cadangan: pekerjaan berkala memeriksa status pembayaran yang masih pending ke iPaymu.
8. Jika kedaluwarsa, pesanan menjadi expired atau pelanggan membuat QR baru untuk pesanan yang sama.

Jika pemanggilan iPaymu gagal atau internet mati, klien menawarkan Bayar di kasir.

## 9. Potong stok

Terjadi saat pesanan menjadi paid, dalam transaksi yang sama.
Untuk setiap item: jumlah bahan = resep menu x qty, ditambah resep opsi x qty.
Tulis stock_movements bertipe usage dan kurangi ingredients.stock_qty.
Pembatalan pesanan lunas menulis stock_movements bertipe restore.
Stok boleh negatif. Sistem menampilkan peringatan.

## 10. Realtime (SSE)

- Kanal dapur: /api/kitchen/stream untuk pesanan baru dan perubahan status.
- Kanal kasir: pesanan pending_cashier dan perubahan pembayaran.
- Kanal pelanggan: status satu pesanan.
Klien menyambung ulang otomatis. Saat tersambung kembali, klien memuat ulang daftar penuh agar tidak ada pesanan terlewat.

## 11. Sinkron Google Sheets (outbox)

- Setiap kejadian laporan menulis baris sheets_outbox dalam transaksi yang sama dengan perubahan data.
- Worker membaca baris pending, mengirim batch ke Sheets, menandai sent.
- Gagal berarti percobaan ulang dengan jeda bertahap. Offline berarti baris menumpuk.
- Penulisan idempoten: baris Sheets diperbarui berdasarkan kunci (kode pesanan, id mutasi), bukan ditambah ulang.
- Aliran satu arah. Perubahan manual di Sheets tidak masuk ke aplikasi.

## 12. Cetak struk

Awal: halaman struk khusus dengan CSS untuk lebar 58 mm atau 80 mm dan window.print() di PC kasir. Cetak senyap lewat pintasan Chrome dengan opsi kiosk-printing.
Lanjutan: ESC/POS ke printer jaringan lewat server.

## 13. PWA dan semi offline

- Service worker menyimpan cangkang aplikasi dan menu agar halaman terbuka cepat dan tahan koneksi putus-sambung.
- Data transaksi tetap lewat server lokal. Tidak ada penyimpanan transaksi di browser pada MVP.
- Indikator status koneksi ke server dan ke internet terlihat di layar kasir.

## 14. Deployment di PC server (WSL2)

- Server berjalan di WSL2 (Ubuntu) di PC Windows.
- Agar perangkat lain di Wi-Fi dapat mengakses: aktifkan networkingMode=mirrored di .wslconfig (Windows 11 yang mendukung) atau pakai portproxy Windows ke IP WSL.
- Aktifkan systemd di WSL. Jalankan server dan cloudflared sebagai layanan.
- Buat tugas Task Scheduler Windows yang menjalankan WSL saat PC menyala agar layanan hidup tanpa jendela terminal.
- Atur Windows agar PC tidak tidur.
- Cadangan: skrip harian menyalin data.db memakai perintah backup SQLite. Simpan 14 hari. Salinan ke penyimpanan lain secara berkala.

## 15. Keamanan

- Hash PIN dengan argon2 atau bcrypt. Sesi lewat cookie httpOnly. Pembatasan percobaan login.
- Token meja 16 byte acak atau lebih. Bisa dibuat ulang.
- Rate limit di rute publik.
- Validasi zod di semua input.
- Webhook diverifikasi. Nominal dicocokkan.
- Rahasia di .env. Berkas .env tidak ada di git.
- Audit log untuk aksi sensitif.

## 16. Pengujian minimum

Tes unit wajib untuk: hitung total dan kembalian, potong dan kembalikan stok, transisi status pesanan, penanganan webhook (idempoten, nominal salah, tanda tangan salah), outbox Sheets (tanpa duplikat).
