// Konfigurasi alamat dengar server. Ubah lewat PORT dan HOST di lingkungan.
export const DEFAULT_PORT = 4100
export const DEFAULT_HOST = '0.0.0.0'

function readPort(value: string | undefined): number {
  const port = Number(value)
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : DEFAULT_PORT
}

export const PORT = readPort(process.env.PORT)
export const HOST = process.env.HOST || DEFAULT_HOST
