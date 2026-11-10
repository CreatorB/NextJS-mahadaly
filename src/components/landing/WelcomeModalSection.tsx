import { getKontenMap } from '@/lib/konten'
import { WelcomeModal } from './WelcomeModal'

/**
 * Pembungkus server untuk modal sambutan (komponennya client component).
 *
 * Isi modal (salam, teks Indonesia, doa, catatan) disunting dari panel admin
 * lewat tabel `konten`.
 */
export async function WelcomeModalSection() {
  const konten = await getKontenMap()

  return (
    <WelcomeModal
      salam={konten['modal.salam']}
      teks={konten['modal.teks']}
      doa={konten['modal.doa']}
      catatan={konten['modal.catatan']}
    />
  )
}
