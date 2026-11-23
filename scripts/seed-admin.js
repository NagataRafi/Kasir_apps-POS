#!/usr/bin/env node
/**
 * Seed script for admin user.
 * Reads PIN from environment variable ADMIN_PIN.
 * Do NOT write PIN in code, log, or commit.
 * Add ADMIN_PIN empty to .env.example
 */

'use strict'

const Database = require('better-sqlite3')
const crypto = require('crypto')

const adminsPin = process.env.ADMIN_PIN

if (!adminsPin) {
  console.error('ERROR: ADMIN_PIN environment variable not set')
  process.exit(1)
}

// Hash PIN with scrypt
const salt = crypto.randomBytes(16).toString('hex')
const key = crypto.scryptSync(adminsPin, salt, 64)

const pinHash = key.toString('hex')

const db = new Database('data.db', { verbose: false })

db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')

// Check if admin already exists
const existing = db.prepare('SELECT id FROM users WHERE role = ?').get('admin')
if (existing) {
  console.log('Admin user already exists, skipping.')
  db.close()
  process.exit(0)
}

// Create admin user
const result = db.prepare(
  'INSERT INTO users (name, role, pin_hash, active) VALUES (?, ?, ?, 1)'
).run('Admin', 'admin', pinHash)

console.log(`Admin user created with ID: ${result.lastInsertRowid}`)
console.log('PIN hash stored securely in database.')
console.log('Remember to add ADMIN_PIN to .env.example (empty value placeholder).')

db.close()