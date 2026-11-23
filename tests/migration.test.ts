import { describe, it, expect } from 'vitest'
import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

describe('Database Migration', () => {
  it('should apply migration 001 successfully', () => {
    // Remove existing test database if present
    const testDbPath = path.join('data_test.db')
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
    }

    const db = new Database(testDbPath)

    // Read and execute the migration SQL
    const migrationPath = path.join('migrations', '001_users_tables_settings.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')

    console.log('Applying migration:', migrationPath)

    // Execute the SQL
    try {
      db.exec(sql)
      console.log('Migration applied successfully')
    } catch (e) {
      console.log('Error applying migration:', e.message)
      db.close()
      throw e
    }

    // Verify tables
    const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
    console.log('Tables after migration:', rows)

    // Check that expected tables exist
    const tableNames = rows.map((r: any) => r.name)
    expect(tableNames).toContain('users')
    expect(tableNames).toContain('settings')
    expect(tableNames).toContain('migrations')

    db.close()

    // Clean up test database
    fs.unlinkSync(testDbPath)
  })
})