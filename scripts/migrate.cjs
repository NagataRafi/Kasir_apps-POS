#!/usr/bin/env node
/**
 * Jalankan semua migrasi berurutan dari folder migrations.
 * Tiap migrasi dalam satu transaksi. Berhenti jelas bila ada SQL error.
 * Usage: node scripts/migrate.js [dbPath]
 */
'use strict'

const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')

const dbPath = process.argv[2] || process.env.DATABASE_URL || path.join('data', 'data.db')
const migrationsDir = process.env.MIGRATIONS_DIR || 'migrations'

const dir = path.dirname(dbPath)
if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    applied_at TEXT DEFAULT (datetime('now'))
  );
`)

const applied = new Set(db.prepare('SELECT filename FROM migrations').all().map((r) => r.filename))
const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()

let ran = 0
for (const filename of files) {
  if (applied.has(filename)) {
    console.log(`Skip (already applied): ${filename}`)
    continue
  }
  const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf-8')
  const tx = db.transaction(() => {
    db.exec(sql)
    db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(filename)
  })
  try {
    tx()
    ran += 1
    console.log(`Applied migration: ${filename}`)
  } catch (err) {
    console.error(`MIGRATION FAILED: ${filename}`)
    console.error(`SQL error: ${err instanceof Error ? err.message : String(err)}`)
    db.close()
    process.exit(1)
  }
}

console.log(`Done. ${ran} migration(s) applied to ${dbPath}.`)
db.close()