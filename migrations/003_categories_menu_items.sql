-- Migration 003: Kategori dan menu
-- Harga bilangan bulat rupiah. photo_path boleh kosong (unggah foto tugas terpisah).
-- Nonaktifkan (active/available = 0), bukan hapus permanen.

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories (id),
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK(price >= 0 AND price = CAST(price AS INTEGER)),
  photo_path TEXT,
  available INTEGER NOT NULL DEFAULT 1 CHECK(available IN (0, 1)),
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items (category_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories (sort);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort ON menu_items (sort);
