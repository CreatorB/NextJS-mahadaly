import {
  Award,
  AtSign,
  BookOpen,
  Briefcase,
  Calendar,
  Clock,
  Download,
  FileText,
  FlaskConical,
  Gavel,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Scale,
  Users,
  type LucideIcon,
} from 'lucide-react'

/**
 * Peta ikon konten -> komponen lucide.
 *
 * Nilai disimpan di database sebagai string (mis. `scale`) supaya admin bisa
 * memilih dari daftar tetap lewat panel admin — bukan bebas mengetik nama
 * komponen.
 */
export const IKON_MAP: Record<string, LucideIcon> = {
  scale: Scale,
  'file-text': FileText,
  briefcase: Briefcase,
  flask: FlaskConical,
  gavel: Gavel,
  'book-open': BookOpen,
  users: Users,
  award: Award,
  phone: Phone,
  globe: Globe,
  'at-sign': AtSign,
  'map-pin': MapPin,
  mail: Mail,
  'message-circle': MessageCircle,
  calendar: Calendar,
  clock: Clock,
  download: Download,
}

/** Daftar ikon yang boleh dipilih (label + nilai). */
export const IKON_PILIHAN: { nilai: string; label: string }[] = [
  { nilai: 'scale', label: 'Timbangan Hukum' },
  { nilai: 'file-text', label: 'Dokumen' },
  { nilai: 'briefcase', label: 'Kantor' },
  { nilai: 'flask', label: 'Ilmuwan' },
  { nilai: 'gavel', label: 'Palu Hakim' },
  { nilai: 'book-open', label: 'Buku' },
  { nilai: 'users', label: 'Orang / Santri' },
  { nilai: 'award', label: 'Penghargaan' },
  { nilai: 'phone', label: 'Telepon' },
  { nilai: 'globe', label: 'Situs' },
  { nilai: 'at-sign', label: 'Media Sosial' },
  { nilai: 'map-pin', label: 'Lokasi' },
  { nilai: 'mail', label: 'Surel' },
  { nilai: 'message-circle', label: 'Pesan' },
  { nilai: 'calendar', label: 'Kalender' },
  { nilai: 'clock', label: 'Jam' },
  { nilai: 'download', label: 'Unduh' },
]

/** Ambil komponen ikon; fallback ke ikon dokumen bila tidak dikenal. */
export function getIkon(nilai: string | null | undefined): LucideIcon {
  if (!nilai) return FileText
  return IKON_MAP[nilai] ?? FileText
}
