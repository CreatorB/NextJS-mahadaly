import { z } from 'zod'

const opt = z.string().trim().max(100).optional().transform((v) => v || null)
const optHp = z.string().trim().max(20).optional().transform((v) => v || null)

export const kiasDaftarSchema = z
  .object({
    nama: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter').max(200),
    jenisKelamin: z.enum(['Laki-Laki', 'Perempuan'], { message: 'Pilih jenis kelamin' }),
    nik: z.string().trim().regex(/^\d{16}$/, 'NIK harus 16 digit angka'),
    nisn: z.string().trim().optional().transform((v) => v || null).refine((v) => !v || /^\d{10}$/.test(v), 'NISN harus 10 digit'),
    tempatLahir: z.string().trim().min(2, 'Tempat lahir wajib diisi').max(100),
    tanggalLahir: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal lahir wajib diisi')
      .refine((v) => new Date(v) < new Date(new Date().toDateString()), 'Tanggal lahir harus sebelum hari ini'),
    alamat: z.string().trim().min(10, 'Alamat minimal 10 karakter').max(5000),
    email: z.string().trim().toLowerCase().email('Format email tidak valid').max(100),
    noHp: z.string().trim().regex(/^[0-9+\-\s.]{8,20}$/, 'Nomor HP tidak valid'),
    namaAyah: opt,
    noHpAyah: optHp,
    namaIbu: opt,
    noHpIbu: optHp,
    namaWali: opt,
    noHpWali: optHp,
    pendidikan: z.string().trim().max(50).optional().transform((v) => v || null),
    pekerjaan: opt,
    programId: z.coerce.number().int().positive('Pilih kelas program'),
    agreement: z.literal('on', { message: 'Anda harus menyetujui syarat dan ketentuan' }),
  })
  .superRefine((d, ctx) => {
    if (!d.namaAyah && !d.namaIbu && !d.namaWali) {
      ctx.addIssue({ code: 'custom', path: ['namaAyah'], message: 'Minimal salah satu data orang tua/wali harus diisi' })
    }
    if (d.namaAyah && !d.noHpAyah) ctx.addIssue({ code: 'custom', path: ['noHpAyah'], message: 'No. HP Ayah wajib diisi' })
    if (d.namaIbu && !d.noHpIbu) ctx.addIssue({ code: 'custom', path: ['noHpIbu'], message: 'No. HP Ibu wajib diisi' })
    if (d.namaWali && !d.noHpWali) ctx.addIssue({ code: 'custom', path: ['noHpWali'], message: 'No. HP Wali wajib diisi' })
  })

export type KiasDaftarInput = z.infer<typeof kiasDaftarSchema>

/** Biodata yang boleh diubah sendiri oleh santri (program, tahun, email, NIK diatur admin). */
export const kiasBiodataSchema = z
  .object({
    nama: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter').max(200),
    jenisKelamin: z.enum(['Laki-Laki', 'Perempuan'], { message: 'Pilih jenis kelamin' }),
    tempatLahir: z.string().trim().min(2, 'Tempat lahir wajib diisi').max(100),
    tanggalLahir: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal lahir wajib diisi')
      .refine((v) => new Date(v) < new Date(new Date().toDateString()), 'Tanggal lahir harus sebelum hari ini'),
    alamat: z.string().trim().min(10, 'Alamat minimal 10 karakter').max(5000),
    noHp: z.string().trim().regex(/^[0-9+\-\s.]{8,20}$/, 'Nomor HP tidak valid'),
    pendidikan: z.string().trim().max(50).optional().transform((v) => v || null),
    pekerjaan: opt,
    namaAyah: opt,
    noHpAyah: optHp,
    namaIbu: opt,
    noHpIbu: optHp,
    namaWali: opt,
    noHpWali: optHp,
  })
  .superRefine((d, ctx) => {
    if (!d.namaAyah && !d.namaIbu && !d.namaWali) {
      ctx.addIssue({ code: 'custom', path: ['namaAyah'], message: 'Minimal salah satu data orang tua/wali harus diisi' })
    }
    if (d.namaAyah && !d.noHpAyah) ctx.addIssue({ code: 'custom', path: ['noHpAyah'], message: 'No. HP Ayah wajib diisi' })
    if (d.namaIbu && !d.noHpIbu) ctx.addIssue({ code: 'custom', path: ['noHpIbu'], message: 'No. HP Ibu wajib diisi' })
    if (d.namaWali && !d.noHpWali) ctx.addIssue({ code: 'custom', path: ['noHpWali'], message: 'No. HP Wali wajib diisi' })
  })
