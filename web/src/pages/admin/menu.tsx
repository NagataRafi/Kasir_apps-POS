import React, { useCallback, useEffect, useState } from 'react'

interface Category {
  id: number
  name: string
  sort: number
  active: boolean
}

interface MenuItem {
  id: number
  category_id: number
  name: string
  description: string | null
  price: number
  photo_path: string | null
  available: boolean
  sort: number
}

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
})

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init
  })
  if (res.status === 401) {
    window.location.assign('/login')
    throw new Error('Belum masuk')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Permintaan gagal')
  return data as T
}

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [newCategory, setNewCategory] = useState('')
  const [form, setForm] = useState({ name: '', price: '', description: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const [cat, menu] = await Promise.all([
        api<{ categories: Category[] }>('/api/categories'),
        api<{ menu_items: MenuItem[] }>('/api/menu-items')
      ])
      setCategories(cat.categories)
      setItems(menu.menu_items)
      setSelected((current) => current ?? cat.categories[0]?.id ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const run = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
      setNotice(message)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setBusy(false)
    }
  }

  const addCategory = () => {
    const name = newCategory.trim()
    if (!name) {
      setError('Nama kategori wajib diisi')
      return
    }
    run(async () => {
      await api('/api/categories', { method: 'POST', body: JSON.stringify({ name }) })
      setNewCategory('')
    }, 'Kategori ditambahkan')
  }

  const renameCategory = (category: Category) => {
    const name = window.prompt('Nama kategori', category.name)?.trim()
    if (!name || name === category.name) return
    run(
      () =>
        api(`/api/categories/${category.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name })
        }),
      'Kategori diubah'
    )
  }

  const toggleCategory = (category: Category) =>
    run(
      () =>
        api(`/api/categories/${category.id}/active`, {
          method: 'PUT',
          body: JSON.stringify({ active: !category.active })
        }),
      category.active ? 'Kategori dinonaktifkan' : 'Kategori diaktifkan'
    )

  const moveCategory = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= categories.length) return
    const reordered = [...categories]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    run(
      () =>
        api('/api/categories/order', {
          method: 'PUT',
          body: JSON.stringify({ items: reordered.map((c, i) => ({ id: c.id, sort: i + 1 })) })
        }),
      'Urutan kategori disimpan'
    )
  }

  const addItem = () => {
    if (!selected) {
      setError('Pilih kategori terlebih dahulu')
      return
    }
    const name = form.name.trim()
    if (!name) {
      setError('Nama menu wajib diisi')
      return
    }
    const price = Number(form.price)
    if (!Number.isInteger(price) || price < 0) {
      setError('Harga harus bilangan bulat rupiah, tidak boleh negatif')
      return
    }
    run(async () => {
      await api('/api/menu-items', {
        method: 'POST',
        body: JSON.stringify({
          category_id: selected,
          name,
          price,
          description: form.description.trim() || null
        })
      })
      setForm({ name: '', price: '', description: '' })
    }, 'Menu ditambahkan')
  }

  const editPrice = (item: MenuItem) => {
    const input = window.prompt('Harga baru (rupiah, bilangan bulat)', String(item.price))
    if (input === null) return
    const price = Number(input)
    if (!Number.isInteger(price) || price < 0) {
      setError('Harga harus bilangan bulat rupiah, tidak boleh negatif')
      return
    }
    run(
      () => api(`/api/menu-items/${item.id}`, { method: 'PUT', body: JSON.stringify({ price }) }),
      'Harga disimpan'
    )
  }

  const toggleItem = (item: MenuItem) =>
    run(
      () =>
        api(`/api/menu-items/${item.id}/available`, {
          method: 'PUT',
          body: JSON.stringify({ available: !item.available })
        }),
      item.available ? 'Menu ditandai habis' : 'Menu tersedia lagi'
    )

  const moveItem = (list: MenuItem[], index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= list.length) return
    const reordered = [...list]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    run(
      () =>
        api('/api/menu-items/order', {
          method: 'PUT',
          body: JSON.stringify({ items: reordered.map((m, i) => ({ id: m.id, sort: i + 1 })) })
        }),
      'Urutan menu disimpan'
    )
  }

  const visibleItems = items.filter((item) => item.category_id === selected)
  const selectedCategory = categories.find((c) => c.id === selected) ?? null

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Kelola Kategori & Menu</h1>
            <p className="text-xs text-gray-500">Hanya admin. Harga bilangan bulat rupiah.</p>
          </div>
          <a href="/kasir" className="text-sm text-blue-600 underline min-h-[44px] flex items-center">
            Ke kasir
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {(error || notice) && (
          <div className="lg:col-span-2">
            {error && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}
            {notice && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
                {notice}
              </div>
            )}
          </div>
        )}

        {/* Kategori */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-gray-800 mb-3">Kategori</h2>
          <div className="flex gap-2 mb-4">
            <input
              className="flex-1 border rounded-xl px-3 min-h-[44px] text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nama kategori baru"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button
              type="button"
              onClick={addCategory}
              disabled={busy}
              className="min-h-[44px] px-4 rounded-xl bg-blue-600 text-white font-semibold disabled:bg-blue-300"
            >
              Tambah
            </button>
          </div>

          <ul className="space-y-2">
            {categories.map((category, index) => (
              <li
                key={category.id}
                className={`rounded-xl border p-2 ${selected === category.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(category.id)}
                    className="flex-1 text-left min-h-[44px] px-2 font-semibold text-gray-800 truncate"
                  >
                    {category.name}
                    {!category.active && <span className="ml-2 text-xs font-normal text-red-600">nonaktif</span>}
                  </button>
                  <button
                    type="button"
                    aria-label={`Naikkan ${category.name}`}
                    onClick={() => moveCategory(index, -1)}
                    disabled={index === 0 || busy}
                    className="min-w-[44px] min-h-[44px] rounded-lg bg-gray-100 text-gray-700 disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label={`Turunkan ${category.name}`}
                    onClick={() => moveCategory(index, 1)}
                    disabled={index === categories.length - 1 || busy}
                    className="min-w-[44px] min-h-[44px] rounded-lg bg-gray-100 text-gray-700 disabled:opacity-40"
                  >
                    ↓
                  </button>
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => renameCategory(category)}
                    className="flex-1 min-h-[44px] rounded-lg bg-gray-100 text-sm font-semibold text-gray-700"
                  >
                    Ubah nama
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    disabled={busy}
                    className={`flex-1 min-h-[44px] rounded-lg text-sm font-semibold ${
                      category.active ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {category.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </li>
            ))}
            {categories.length === 0 && <li className="text-sm text-gray-500">Belum ada kategori.</li>}
          </ul>
        </section>

        {/* Menu */}
        <section className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-bold text-gray-800 mb-1">Menu</h2>
          <p className="text-xs text-gray-500 mb-3">
            {selectedCategory ? `Kategori: ${selectedCategory.name}` : 'Pilih kategori di sebelah kiri.'}
          </p>

          <div className="grid gap-2 mb-4">
            <input
              className="border rounded-xl px-3 min-h-[44px] text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nama menu"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <input
              className="border rounded-xl px-3 min-h-[44px] text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Harga (rupiah, bilangan bulat)"
              inputMode="numeric"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
            <input
              className="border rounded-xl px-3 min-h-[44px] text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Deskripsi (opsional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <button
              type="button"
              onClick={addItem}
              disabled={busy || !selected}
              className="min-h-[44px] rounded-xl bg-blue-600 text-white font-semibold disabled:bg-blue-300"
            >
              Tambah menu
            </button>
          </div>

          <ul className="space-y-2">
            {visibleItems.map((item, index) => (
              <li key={item.id} className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                    <p className="text-sm text-gray-600">{rupiah.format(item.price)}</p>
                    {item.description && <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>}
                    {!item.available && <p className="text-xs font-semibold text-red-600 mt-1">habis</p>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      aria-label={`Naikkan ${item.name}`}
                      onClick={() => moveItem(visibleItems, index, -1)}
                      disabled={index === 0 || busy}
                      className="min-w-[44px] min-h-[44px] rounded-lg bg-gray-100 text-gray-700 disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Turunkan ${item.name}`}
                      onClick={() => moveItem(visibleItems, index, 1)}
                      disabled={index === visibleItems.length - 1 || busy}
                      className="min-w-[44px] min-h-[44px] rounded-lg bg-gray-100 text-gray-700 disabled:opacity-40"
                    >
                      ↓
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => editPrice(item)}
                    className="flex-1 min-h-[44px] rounded-lg bg-gray-100 text-sm font-semibold text-gray-700"
                  >
                    Ubah harga
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleItem(item)}
                    disabled={busy}
                    className={`flex-1 min-h-[44px] rounded-lg text-sm font-semibold ${
                      item.available ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {item.available ? 'Tandai habis' : 'Tersedia'}
                  </button>
                </div>
              </li>
            ))}
            {visibleItems.length === 0 && <li className="text-sm text-gray-500">Belum ada menu di kategori ini.</li>}
          </ul>
        </section>
      </main>
    </div>
  )
}
