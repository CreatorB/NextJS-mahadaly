import { z } from 'zod'

export const registrationSchema = z.object({
  noInduk: z.string().max(50).optional(),
  nik: z.string().max(16).optional(),
  nisn: z.string().max(10).optional(),
  nama: z.string().min(3, 'Minimal 3 karakter').max(100),
  jk: z.enum(['Laki-Laki', 'Perempuan'], { error: 'Pilih jenis kelamin' }),
  tmpLahir: z.string().min(1, 'Tempat lahir wajib diisi').max(50),
  tglLahir: z.string().refine((v) => {
    const d = new Date(v)
    return d < new Date() && d > new Date('1950-01-01')
  }, 'Tanggal lahir tidak valid'),
  alamat: z.string().min(10, 'Minimal 10 karakter').max(500),
  namaAyah: z.string().max(100).optional(),
  noHpAyah: z.string().max(15).optional(),
  namaIbu: z.string().max(100).optional(),
  noHpIbu: z.string().max(15).optional(),
  namaWali: z.string().max(100).optional(),
  noHpWali: z.string().max(15).optional(),
  programId: z.string().min(1, 'Pilih program'),
  pendidikan: z.string().min(1, 'Pilih pendidikan terakhir'),
  pekerjaanId: z.string().min(1, 'Pilih pekerjaan'),
  email: z.string().email('Email tidak valid').max(100),
  kodeNegara: z.string(),
  noHp: z.string().min(8, 'Minimal 8 digit').max(15).regex(/^\d+$/, 'Hanya angka'),
  nominalTransfer: z.string().min(1, 'Isi nominal transfer'),
  tahunPsb: z.string().optional(),
})

export type RegistrationFormData = {
  noInduk?: string
  nik?: string
  nisn?: string
  nama: string
  jk: 'Laki-Laki' | 'Perempuan'
  tmpLahir: string
  tglLahir: string
  alamat: string
  namaAyah?: string
  noHpAyah?: string
  namaIbu?: string
  noHpIbu?: string
  namaWali?: string
  noHpWali?: string
  programId: string
  pendidikan: string
  pekerjaanId: string
  email: string
  kodeNegara: string
  noHp: string
  nominalTransfer: string
  tahunPsb?: string
}
