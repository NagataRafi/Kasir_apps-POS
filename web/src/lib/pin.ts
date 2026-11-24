// Aturan PIN dipakai halaman login dan tes.
export const PIN_MIN_LENGTH = 6
export const PIN_MAX_LENGTH = 12

/** Buang semua karakter selain digit dan potong ke panjang maksimal. */
export function sanitizePin(value: string): string {
  return value.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH)
}

/** Tambah satu digit dari papan angka layar. */
export function appendPinDigit(pin: string, digit: string): string {
  if (!/^\d$/.test(digit)) return pin
  return sanitizePin(pin + digit)
}

/** Form boleh dikirim bila nama terisi dan PIN memenuhi panjang minimal. */
export function canSubmitLogin(name: string, pin: string): boolean {
  return name.trim().length > 0 && pin.length >= PIN_MIN_LENGTH
}
