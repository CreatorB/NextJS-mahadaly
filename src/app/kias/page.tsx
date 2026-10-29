import { permanentRedirect } from 'next/navigation'

/**
 * URL lama. Konten KIAS pindah ke /program/kias.
 * next.config.ts juga memasang redirect permanent (308) untuk /kias -> /program/kias;
 * file ini adalah pengaman bila config tidak ikut terbawa saat build.
 *
 * Sub-path /kias/daftar, /kias/formulir/*, /kias/<slug> TETAP di lokasi semula
 * karena sudah dipakai peserta & admin.
 */
export default function KiasRedirect() {
  permanentRedirect('/program/kias')
}
