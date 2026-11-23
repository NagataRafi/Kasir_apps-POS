import React, { useState, useRef } from 'react'

export default function LoginPage() {
  const [pin, setPin] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<'' | 'PIN minimal 6 digit' | 'Nama dan PIN wajib diisi'>('', '')
  const pinRef = useRef<HTMLInputElement>(null)

  const handleLogin = async () => {
    if (!name || !pin) {
      setError('Nama dan PIN wajib diisi')
      return
    }
    if (pin.length < 6) {
      setError('PIN minimal 6 digit')
      pinRef.current?.focus()
      return
    }

    setError('')
    // Clear any previous error
    // Kirim ke API login
    // dalam implementasi nyata, form ini akan submit ke /api/login
    // untuk sekarang, fokus pada validasi frontend

    // Simulasi login berhasil
    alert(`Login berhasil untuk ${name} dengan PIN ${pin.length} digit`)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login Kasir</h2>

        {/* Nama pelayanan */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Nama Pegawai
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            type="text"
            placeholder="Masukkan nama pegawai"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* PIN input dengan papan angka besar */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            PIN Masuk
          </label>
          <div className="relative">
            <input
              ref={pinRef}
              className="shadow appearance-none border w-full rounded py-2 px-3 text-2xl text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
              type="password"
              placeholder="*****"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              minlength={6}
              required
              aria-label="PIN masukan"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Tampilkan PIN"
              onClick={() => pinRef.current?.focus()}
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M13.586 5.586a1 1 0 0 1 1.414 0l1.414 1.414a1 1 0 0 1-1.414 1.414L15 6.414l-1.414 1.414a1 1 0 0 1-1.414-1.414l1.414-1.414zM4.146 4l1.414 1.414L10 8.586l1.414 1.414L14 6l-1.414-1.414L10 4.586l-1.414-1.414L4 10l1.414 1.414L8.586 14l1.414 1.414L10 18l1.414-1.414L14 12l1.414 1.414L18 8l-1.414-1.414L10 5.586l-1.414-1.414z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Tombol login */}
        <div className="flex items-center justify-center mb-4">
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
            disabled={pin.length < 6 || !name}
          >
            Masuk
          </button>
        </div>

        {/* Pesan error */}
        {error && (
          <div className="mt-3 p-2 rounded text-sm text-red-600 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}