import React, { useState } from 'react'

const ROLE_HOME: Record<string, string> = {
  admin: '/admin',
  kasir: '/kasir',
  dapur: '/dapur'
}

export default function LoginPage() {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const pressDigit = (d: string) => {
    setError('')
    if (pin.length < 12) setPin((p) => p + d)
  }

  const backspace = () => {
    setError('')
    setPin((p) => p.slice(0, -1))
  }

  const submit = async () => {
    if (!name.trim()) {
      setError('Nama pengguna wajib diisi')
      return
    }
    if (pin.length < 6) {
      setError('PIN minimal 6 digit')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), pin })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error === 'Invalid credentials' ? 'Nama atau PIN salah' : data?.error || 'Login gagal')
        setPin('')
        return
      }
      const role = data?.user?.role as string
      window.location.assign(ROLE_HOME[role] ?? '/kasir')
    } catch {
      setError('Tidak dapat menghubungi server')
      setPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">KASIR POS Kafe</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">Masuk dengan nama dan PIN</p>

        <label className="block text-gray-700 text-sm font-semibold mb-1">Nama pengguna</label>
        <input
          type="text"
          className="w-full border rounded-lg px-3 py-3 mb-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nama pegawai"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="username"
        />

        <label className="block text-gray-700 text-sm font-semibold mb-1">PIN</label>
        <div className="w-full border rounded-lg px-3 py-3 mb-2 text-3xl tracking-[0.4em] text-center min-h-[56px] bg-gray-50">
          {pin ? '•'.repeat(pin.length) : <span className="text-gray-300 text-base tracking-normal">Masukkan PIN</span>}
        </div>
        <p className="text-xs text-gray-400 mb-4 text-center">{pin.length} digit (minimal 6)</p>

        {/* Papan angka besar */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => pressDigit(d)}
              className="h-16 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-2xl font-bold text-gray-800"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={backspace}
            className="h-16 rounded-xl bg-amber-100 hover:bg-amber-200 text-lg font-semibold text-amber-800"
          >
            Hapus
          </button>
          <button
            type="button"
            onClick={() => pressDigit('0')}
            className="h-16 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-2xl font-bold text-gray-800"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => setPin('')}
            className="h-16 rounded-xl bg-red-100 hover:bg-red-200 text-lg font-semibold text-red-700"
          >
            Reset
          </button>
        </div>

        {error && <div className="mb-3 text-center text-sm text-red-600">{error}</div>}

        <button
          type="button"
          onClick={submit}
          disabled={loading || pin.length < 6 || !name.trim()}
          className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-lg font-bold"
        >
          {loading ? 'Memproses…' : 'Masuk'}
        </button>
      </div>
    </div>
  )
}