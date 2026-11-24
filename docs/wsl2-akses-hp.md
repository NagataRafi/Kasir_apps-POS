# Langkah Uji Akses dari HP lewat WSL2

Untuk menguji akses dari HP (Handphone) ke server KASIR yang running di WSL2, ikuti langkah-langkah berikut di Windows:

## 1. Pastikan Jaringan WSL2 Diaktifkan

Di Windows PowerShell atau CMD, cek konfigurasi WSL:

```powershell
# Cek setting .wslconfig
Get-Content "$env:USERPROFILE\.wslconfig" 2>$null || echo "No .wslconfig file"
```

Atau aktifkan mode jaringan mirrored untuk mengizinkan perangkat lain di Wi-Fi mengakses WSL:

```powershell
# Tambahkan ke file .wslconfig di C:\Users\<username>\
cat > "$env:USERPROFILE\.wslconfig" @"
[network]
hostPorts = 4100-4110 #->guestPorts = 4100-4110
"@
```

Atau gunakan portproxy Windows:

```powershell
# Redirect port 4100 dari Windows ke IP WSL
netsh interface portproxy add v4toconnect listener=4100 connectaddress=<IP_WSL> connectport=4100
```

## 2. Cek IP Address WSL

Di dalam WSL (terminal Ubuntu):

```bash
# Cek IP address WSL
ip addr show dev eth0 | grep inet

# Atau lebih sederhana
hostname -I
```

Catatkan IP address WSL (misal: 172.20.32.1)

## 3. Jalankan Server di WSL

Di terminal WSL, mulai server KASIR:

```bash
cd /DATA/Project/KASIR
npm run dev  # atau node server/src/index.ts
```

## 4. Uji Akses dari HP di Wi-Fi yang Sama

1. Pastikan HP dan PC server (WSL) terhubung ke Wi-Fi yang sama di kafe
2. Buka browser di HP
3. Akses alamat: `http://<IP_WSL>:4100`

Harus muncul halaman KASIR POS Kafe dengan teks "KASIR POS Kafe Aplikasi"

Atau cek health endpoint:
`http://<IP_WSL>:4100/api/health`

Harus respons: `{"status":"ok","timestamp":"..."}`

## 5. Troubleshooting

Jika tidak bisa diakses dari HP:

- Cek firewall Windows: pastikan port 4100 diizinkan untuk jaringan privat
- Cek apakah networking mode di .wslconfig sudah benar
- Coba akses lewat `http://10.0.0.2:4100` (IP khusus WSL di Wi-Fi)
- Matikan antivirus sementara di Windows

## 6. Catatan Penting

- Jangan ubah pengaturan Windows selain yang disebutkan di atas
- Pastikan PC server tidak tidur saat uji coba
- Tutup port proxy setelah uji selesai untuk keamanan

### Contoh perintah di Windows (CMD):

```cmd
netsh interface portproxy add v4toconnect listener=4100 connectaddress=172.20.32.1 connectport=4100
```

Setelah uji selesai, hapus rule portproxy:

```cmd
netsh interface portproxy delete v4toconnect listener=4100 connectport=4100
```
