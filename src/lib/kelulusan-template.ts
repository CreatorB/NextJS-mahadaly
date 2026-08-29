export const KELULUSAN_CATATAN_TEMPLATE = `Demi kelancaran proses perkuliahan kedepannya, maka kami memberikan catatan khusus bagi Antum sebagai berikut:

- Wajib bagi Antum memperkuat Mahāratul Kalām, yaitu keterampilan berbicara bahasa Arab.
- Wajib bagi Antum memperkuat ⁠Mahāratul Istimā’ yaitu keterampilan menyimak bahasa Arab.
- Wajib bagi Antum memperkuat⁠ kemampuan membaca dan memahami teks berbahasa Arab`

export const PREDIKAT_LULUS_DENGAN_CATATAN = 'Lulus Dengan Catatan'

export const PREDIKAT_OPTIONS = [
  'Mumtaz',
  'Jayyid Jiddan',
  'Jayyid',
  'Maqbul',
  PREDIKAT_LULUS_DENGAN_CATATAN,
]

export const KELULUSAN_OPTIONS = ['lulus', 'tidak_lulus'] as const
export type KelulusanValue = (typeof KELULUSAN_OPTIONS)[number]

/**
 * Parse catatan into a structured shape for dashboard rendering.
 * Lines that start with `- ` or `* ` become bullets.
 * Other lines are paragraphs.
 */
export type CatatanBlock = { type: 'paragraph'; text: string } | { type: 'bullet'; text: string }

export function parseCatatan(raw: string | null | undefined): CatatanBlock[] {
  if (!raw || !raw.trim()) return []
  const lines = raw.split(/\r?\n/)
  const blocks: CatatanBlock[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      blocks.push({ type: 'bullet', text: trimmed.slice(2).trim() })
    } else {
      blocks.push({ type: 'paragraph', text: trimmed })
    }
  }
  return blocks
}

/**
 * Normalize nama for fuzzy matching (CSV vs DB).
 *  - trim
 *  - collapse multiple spaces
 *  - uppercase
 *  - remove trailing punctuation
 */
export function normalizeNama(nama: string): string {
  return nama
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
    .replace(/[.,;:!?]+$/g, '')
}
