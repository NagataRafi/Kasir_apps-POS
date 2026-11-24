import { describe, it, expect } from 'vitest'
import {
  PIN_MAX_LENGTH,
  appendPinDigit,
  canSubmitLogin,
  sanitizePin
} from '../web/src/lib/pin'

describe('validasi PIN login', () => {
  it('hanya digit, maksimal 12, dan syarat kirim terpenuhi', () => {
    expect(PIN_MAX_LENGTH).toBe(12)
    expect(sanitizePin('12ab34')).toBe('1234')
    expect(sanitizePin('1234567890123456')).toBe('123456789012')
    expect(appendPinDigit('12345', '6')).toBe('123456')
    expect(appendPinDigit('123456789012', '3')).toBe('123456789012')
    expect(appendPinDigit('12', 'x')).toBe('12')
    expect(canSubmitLogin('Admin', '123456')).toBe(true)
    expect(canSubmitLogin('Admin', '12345')).toBe(false)
    expect(canSubmitLogin('   ', '123456')).toBe(false)
  })
})
