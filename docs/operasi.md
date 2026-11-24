# Operasi

## Reset PIN pengguna

Ganti PIN pengguna yang sudah ada tanpa membuat pengguna baru.

```bash
NEW_PIN=654321 npm run reset-pin -- Admin
```

- Nama pengguna diberikan sebagai argumen setelah `--`.
- PIN baru dibaca dari variabel lingkungan `NEW_PIN`, bukan dari argumen, agar tidak tersimpan di riwayat shell.
- PIN baru wajib hanya angka dan minimal 6 digit.
- PIN di-hash dengan `hashPin()` yang sama dengan login (scrypt `salt:key`), lalu `pin_hash` pengguna diperbarui.
- Semua sesi pengguna itu dihapus, jadi perangkat yang sudah login harus login ulang.
- Hitungan percobaan login pengguna dikosongkan. Hitungan ini disimpan di memori proses server, jadi setelah reset jalankan ulang server (`npm start`) agar hitungan di proses server ikut kosong.
- Skrip menolak pengguna yang tidak ada dan tidak pernah mencetak PIN.
- Database memakai `DATABASE_URL` bila diisi, selain itu `data/data.db`.

Contoh keluaran:

```
PIN pengguna "Admin" (ID 1) berhasil direset.
Sesi dihapus: 2. Hitungan percobaan login dikosongkan.
PIN baru tidak dicetak.
```
