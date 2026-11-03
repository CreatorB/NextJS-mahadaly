import { getSession } from '@/lib/auth'
import { NavbarClient } from './NavbarClient'

/**
 * Navbar situs.
 *
 * Tomcat ini adalah server component supaya bisa membaca sesi: kalau user
 * sudah login, tombol "Masuk" / "Daftar" disembunyikan supaya header tidak
 * bertentangan dengan bar identitas di halaman absen (dan halaman lain).
 *
 * Semua halaman yang memakainya adalah server component, jadi aman.
 */
export async function Navbar() {
  const session = await getSession()
  return <NavbarClient sudahLogin={Boolean(session)} />
}
