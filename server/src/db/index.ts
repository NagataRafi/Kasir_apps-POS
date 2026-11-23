import Database from 'better-sqlite3'

export const db = new Database('data.db', { 
  verbose: false 
})

db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')

// Create tables for foundation
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'kasir', 'dapur')),
    pin_hash TEXT,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    applied_at TEXT DEFAULT (datetime('now'))
  );
`)

export function migrate(filename: string) {
  const [row] = db.prepare(
    'SELECT COUNT(*) FROM migrations WHERE filename = ?'
  ).get(filename)

  if (row === undefined) {
    db.prepare('BEGIN TRANSACTION').run()
    const sql = require('fs').readFileSync(`migrations/${filename}`, 'utf-8')
    db.exec(sql)
    db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(filename)
    db.prepare('COMMIT').run()
    console.log(`Applied migration: ${filename}`)
  }
}
