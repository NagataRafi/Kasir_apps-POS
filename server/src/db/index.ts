import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

export const DEFAULT_DB_PATH = process.env.DATABASE_URL || path.join('data', 'data.db')

/**
 * Jalankan SEMUA berkas migrasi (*.sql) di `migrationsDir` secara berurutan.
 * Tiap migrasi berjalan dalam satu transaksi. Bila SQL error, transaksi
 * di-rollback dan fungsi melempar Error dengan pesan jelas.
 * Hanya migrasi yang belum tercatat di tabel `migrations` yang dijalankan.
 */
export function runMigrations(database: Database.Database, migrationsDir = 'migrations'): string[] {
  database.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `)

  const applied = new Set(
    (database.prepare('SELECT filename FROM migrations').all() as { filename: string }[]).map(
      (r) => r.filename
    )
  )

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  const ran: string[] = []

  for (const filename of files) {
    if (applied.has(filename)) continue
    const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf-8')

    const tx = database.transaction(() => {
      database.exec(sql)
      database.prepare('INSERT INTO migrations (filename) VALUES (?)').run(filename)
    })

    try {
      tx()
      ran.push(filename)
      console.log(`Applied migration: ${filename}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`MIGRATION FAILED: ${filename}`)
      console.error(`SQL error: ${message}`)
      throw new Error(`Migrasi ${filename} gagal dan di-rollback: ${message}`)
    }
  }

  return ran
}

/** Buka database file, aktifkan pragma, dan jalankan semua migrasi. */
export function openAndMigrate(dbPath = DEFAULT_DB_PATH, migrationsDir = 'migrations') {
  const dir = path.dirname(dbPath)
  if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const database = new Database(dbPath)
  database.pragma('journal_mode = WAL')
  database.pragma('synchronous = NORMAL')
  database.pragma('foreign_keys = ON')
  runMigrations(database, migrationsDir)
  return database
}

export const db = openAndMigrate()
export const migrateAll = (dir = 'migrations') => runMigrations(db, dir)