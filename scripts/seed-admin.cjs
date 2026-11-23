#!/usr/bin/env node
/**
 * Seed admin pertama.
 * Membaca PIN dari env ADMIN_PIN. PIN tidak pernah ditulis/di-log.
 * Hash PIN memakai scrypt dengan format `saltHex:keyHex` (sama dengan model TS).
 */
'use strict'

const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const Database = require('better-sqlite3')

const pin = process.env.ADMIN_PIN

if (!pin) {
  console.error('ERROR: ADMIN_PIN environment variable not set')
  process.exit(1)
}

if (pin.length < 6) {
  console.error('ERROR: ADMIN_PIN harus minimal 6 digit')
  process.exit(1)
}

// Format hash harus sama dengan hashPin() di model.ts
const salt = crypto.randomBytes(16).toString('hex')
const key = crypto.scryptSync(pin, salt, 64).toString('hex')
const pinHash = `${salt}:${key}`

const dbPath = process.env.DATABASE_URL || path.join('data', 'data.db')
const dir = path.dirname(dbPath)
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const existing = db.prepare('SELECT id FROM users WHERE role = ?').get('admin')
if (existing) {
  console.log('Admin user already exists, skipping.')
  db.close()
  process.exit(0)
}

const result = db
  .prepare('INSERT INTO users (name, role, pin_hash, active) VALUES (?, ?, ?, 1)')
  .run('Admin', 'admin', pinHash)

console.log(`Admin user created with ID: ${result.lastInsertRowid}`)
console.log('PIN hash stored securely (scrypt salt:key). PIN not printed.')
db.close()