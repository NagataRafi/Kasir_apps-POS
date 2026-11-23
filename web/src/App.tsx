import React from 'react'
import LoginPage from './pages/login'

function Placeholder({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-gray-500 mt-2">Halaman ini akan diisi pada tugas berikutnya.</p>
        <a href="/login" className="inline-block mt-6 text-blue-600 underline">Kembali ke login</a>
      </div>
    </div>
  )
}

function App() {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/'

  if (path === '/login' || path === '/') {
    return <LoginPage />
  }
  if (path.startsWith('/kasir')) return <Placeholder title="Layar Kasir" />
  if (path.startsWith('/dapur')) return <Placeholder title="Layar Dapur" />
  if (path.startsWith('/admin')) return <Placeholder title="Halaman Admin" />

  return <LoginPage />
}

export default App