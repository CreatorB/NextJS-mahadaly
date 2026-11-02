/**
 * Normalisasi nomor WhatsApp/Hp Indonesia ke bentuk kanonik "08xxxxxxxxx".
 *
 * Format yang diterima:
 *   081234567890      -> 081234567890
 *   +62 812-3456-7890 -> 081234567890
 *   6281234567890     -> 081234567890
 *   62 812 3456 7890  -> 081234567890
 *   81234567890       -> 081234567890
 *
 * Semua karakter non-angka dibuang; prefiks 62 / 8 diubah menjadi 0.
 */

export function normalisasiHp(input: string | null | undefined): string {
  if (!input) return ''

  let digits = input.replace(/\D/g, '')
  if (!digits) return ''

  // Buang awalan 00 (pengganti + di luar negeri).
  if (digits.startsWith('00')) digits = digits.slice(2)

  // 62xxx -> 0xxx
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2)
  } else if (digits.startsWith('8') && digits.length >= 10) {
    // 8xxx -> 0xxx (penulisan tanpa 0 di depan)
    digits = '0' + digits
  }

  return digits
}

/**
 * Format tampilan nomor WhatsApp: 0812-3456-7890
 */
export function formatHp(input: string | null | undefined): string {
  const d = normalisasiHp(input)
  if (!d) return ''
  if (d.length <= 4) return d
  if (d.length <= 8) return `${d.slice(0, 4)}-${d.slice(4)}`
  if (d.length <= 11) return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`
  return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8, 12)}-${d.slice(12)}`
}

/**
 * Deteksi apakah sebuah string berisi nomor telepon Indonesia.
 * Dipakai untuk menentukan apakah input login adalah email atau nomor WA.
 */
export function seemsPhoneNumber(input: string): boolean {
  const d = input.replace(/\D/g, '')
  if (d.length < 9 || d.length > 15) return false
  return /^[+\d][\d\s().-]*$/.test(input.trim())
}
