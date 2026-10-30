/**
 * State modal sambutan landing page (dipakai client component saja).
 *
 * 'pending' = belum diketahui (modal mungkin akan tampil)
 * 'open'    = modal sedang tampil -> video hero TIDAK boleh autoplay
 * 'closed'  = modal sudah ditutup / tidak ditampilkan -> video boleh jalan
 *
 * Store sederhana (bukan context) supaya bisa dipakai lintas subtree tanpa
 * perlu provider di server component.
 */

export type WelcomeState = 'pending' | 'open' | 'closed'

let state: WelcomeState = 'pending'
const listeners = new Set<() => void>()

export function getWelcomeState(): WelcomeState {
  return state
}

export function setWelcomeState(next: WelcomeState): void {
  if (state === next) return
  state = next
  listeners.forEach((fn) => fn())
}

export function subscribeWelcome(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
