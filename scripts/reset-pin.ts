/**
 * Reset PIN pengguna yang sudah ada.
 * Pemakaian: NEW_PIN=xxxxxx npm run reset-pin -- "Nama Pengguna"
 * PIN dibaca dari env (bukan argumen) agar tidak masuk riwayat shell, dan
 * tidak pernah dicetak. Hash memakai hashPin() yang sama dengan login.
 */
import path from 'path'
import Database from 'better-sqlite3'
import { resetUserPin, ResetPinError } from '../server/src/modules/auth/reset-pin'

const name = process.argv[2]
const newPin = process.env.NEW_PIN

if (!name) {
  console.error('ERROR: nama pengguna wajib sebagai argumen')
  console.error('Contoh: NEW_PIN=xxxxxx npm run reset-pin -- Admin')
  process.exit(1)
}

const dbPath = process.env.DATABASE_URL || path.join('data', 'data.db')
let db: Database.Database
try {
  db = new Database(dbPath)
} catch {
  console.error(`ERROR: tidak dapat membuka database ${dbPath}`)
  process.exit(1)
}
db.pragma('foreign_keys = ON')

try {
  const { userId, sessionsDeleted } = resetUserPin(db, name, newPin)
  console.log(`PIN pengguna "${name}" (ID ${userId}) berhasil direset.`)
  console.log(`Sesi dihapus: ${sessionsDeleted}. Hitungan percobaan login dikosongkan.`)
  console.log('PIN baru tidak dicetak.')
} catch (err) {
  if (err instanceof ResetPinError) {
    console.error(`ERROR: ${err.message}`)
  } else {
    console.error('ERROR: reset PIN gagal')
  }
  process.exitCode = 1
} finally {
  db.close()
}
