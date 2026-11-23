import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { runMigrations } from '../server/src/db/index'

describe('Database migrations', () => {
  it('menjalankan SEMUA berkas migrasi berurutan di database kosong', () => {
    const db = new Database(':memory:')
    db.pragma('foreign_keys = ON')

    const ran = runMigrations(db, 'migrations')

    const expected = fs
      .readdirSync('migrations')
      .filter((f) => f.endsWith('.sql'))
      .sort()

    expect(ran).toEqual(expected)

    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map(
      (t) => t.name
    )
    expect(tables).toContain('users')
    expect(tables).toContain('settings')
    expect(tables).toContain('sessions')
    expect(tables).toContain('migrations')

    // Migrasi 002 wajib valid: FK ke users ON DELETE CASCADE
    const fk = db.prepare('PRAGMA foreign_key_list(sessions)').all() as { table: string; on_delete: string }[]
    expect(fk.some((f) => f.table === 'users' && f.on_delete === 'CASCADE')).toBe(true)

    // Menjalankan ulang tidak menggandakan (idempoten)
    const ranAgain = runMigrations(db, 'migrations')
    expect(ranAgain).toEqual([])

    db.close()
  })
})