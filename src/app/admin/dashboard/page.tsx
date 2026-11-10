import type { Metadata } from 'next'
import Link from 'next/link'
import { clsx } from 'clsx'
import {
  Activity,
  ArrowRight,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  CircleAlert,
  ClipboardCheck,
  FileText,
  Gauge,
  GraduationCap,
  Landmark,
  Layers,
  ListChecks,
  MapPin,
  Newspaper,
  School,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'

import {
  ambilDataDashboard,
  PERIODE_LABEL,
  PERIODE_LIST,
  type Periode,
} from '@/lib/dashboard-data'
import {
  BarChart,
  ChartLegend,
  DonutChart,
  EmptyChart,
  HBarChart,
  LineChart,
  PALET,
  ProgressBar,
  StackedBarChart,
  StatCard,
} from '@/components/admin/charts'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: "Admin Dashboard — Ma'had Aly Syathiby" }

/* ------------------------------------------------------------------ */
/* Helper tampilan                                                     */
/* ------------------------------------------------------------------ */

function rupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={clsx(
        'rounded-xl border border-gray-100 bg-white p-5 shadow-sm',
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Tabel({
  kolom,
  baris,
  kosong,
}: {
  kolom: string[]
  baris: React.ReactNode[][]
  kosong: string
}) {
  if (!baris.length) return <EmptyChart pesan={kosong} />
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
            {kolom.map((k) => (
              <th key={k} className="whitespace-nowrap px-2 py-2 font-medium">
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {baris.map((b, i) => (
            <tr key={i} className="text-gray-700">
              {b.map((c, j) => (
                <td key={j} className="px-2 py-2 align-middle">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DonutPanel({
  title,
  subtitle,
  data,
  centerLabel,
  centerValue,
}: {
  title: string
  subtitle?: string
  data: { label: string; value: number; color?: string }[]
  centerLabel?: string
  centerValue?: number | string
}) {
  return (
    <Panel title={title} subtitle={subtitle}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="w-full shrink-0 sm:w-[180px]">
          <DonutChart data={data} centerLabel={centerLabel} centerValue={centerValue} />
        </div>
        <div className="min-w-0 flex-1">
          <ChartLegend data={data} />
        </div>
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Halaman                                                             */
/* ------------------------------------------------------------------ */

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>
}) {
  const sp = await searchParams
  const angkaPeriode = Number(sp.periode)
  const periode: Periode = (PERIODE_LIST as number[]).includes(angkaPeriode)
    ? (angkaPeriode as Periode)
    : 90

  const { ringkasan, hki, kias, karyawan, acara } = await ambilDataDashboard(periode)

  const perluVerifikasiTotal = ringkasan.pendingVerification + ringkasan.pendingVerificationKias
  const perluTransferTotal = ringkasan.pendingTransfer + ringkasan.pendingCheckKias
  const totalPeserta = ringkasan.totalSantri + ringkasan.totalKias

  const kpi: {
    label: string
    value: number
    hint?: string
    icon: React.ComponentType<{ className?: string }>
    spark?: number[]
    sparkColor?: string
    href?: string
    tone?: 'default' | 'good' | 'warn' | 'bad'
  }[] = [
    {
      label: 'Santri HKI',
      value: hki.total,
      hint: `${ringkasan.active} diterima`,
      icon: GraduationCap,
      spark: hki.tren.values,
      sparkColor: PALET[0],
      href: '/admin/pendaftaran',
    },
    {
      label: 'Peserta KIAS',
      value: kias.total,
      hint: `${kias.programAktif} program buka PSB`,
      icon: FileText,
      spark: kias.tren.values,
      sparkColor: PALET[1],
      href: '/admin/kias',
    },
    {
      label: 'Menunggu Verifikasi',
      value: perluVerifikasiTotal,
      hint: `HKI ${ringkasan.pendingVerification} · KIAS ${ringkasan.pendingVerificationKias}`,
      icon: ClipboardCheck,
      tone: perluVerifikasiTotal > 0 ? 'warn' : 'good',
      href: '/admin/pendaftaran?statusPendaftaran=pending',
    },
    {
      label: 'Menunggu Cek Transfer',
      value: perluTransferTotal,
      hint: `HKI ${ringkasan.pendingTransfer} · KIAS ${ringkasan.pendingCheckKias}`,
      icon: Wallet,
      tone: perluTransferTotal > 0 ? 'warn' : 'good',
      href: '/admin/pendaftaran?statusTransfer=pending',
    },
    {
      label: 'Pegawai Aktif',
      value: karyawan.aktif,
      hint: `dari ${karyawan.total} pegawai · ${karyawan.punyaAkun} punya akun`,
      icon: Briefcase,
      href: '/admin/pegawai',
    },
    {
      label: 'Hadir Hari Ini',
      value: karyawan.hariIni.hadir,
      hint: `dari ${karyawan.hariIni.total} absensi tercatat`,
      icon: CalendarCheck,
      tone: karyawan.hariIni.total === 0 ? 'default' : 'good',
      href: '/admin/absen',
    },
    {
      label: 'Pengajuan Menunggu',
      value: ringkasan.pendingPengajuan,
      hint: `${karyawan.perluTindak.length} perlu ditinjau`,
      icon: FileText,
      tone: ringkasan.pendingPengajuan > 0 ? 'warn' : 'good',
      href: '/admin/pengajuan',
    },
    {
      label: 'Event Mendatang',
      value: ringkasan.upcomingEvents,
      hint: `dari ${ringkasan.events} event terdaftar`,
      icon: CalendarDays,
      href: '/admin/events',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">Dashboard Admin</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ringkasan operasional Ma&apos;had Aly Syathiby: HKI, KIAS, karyawan, event, dan konten.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Periode absensi
          </span>
          <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white">
            {PERIODE_LIST.map((p) => (
              <Link
                key={p}
                href={`/admin/dashboard?periode=${p}`}
                className={clsx(
                  'px-3 py-1.5 text-xs font-medium transition',
                  p === periode
                    ? 'bg-brand-primary text-white'
                    : 'text-gray-600 hover:bg-gray-50',
                )}
              >
                {PERIODE_LABEL[p]}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* KPI utama */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpi.map((k) => (
          <StatCard
            key={k.label}
            label={k.label}
            value={k.value}
            hint={k.hint}
            icon={k.icon}
            spark={k.spark}
            sparkColor={k.sparkColor}
            href={k.href}
            tone={k.tone}
          />
        ))}
      </div>

      {/* Antrian kerja + tren */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Antrian Perlu Tindakan"
          subtitle="Semua antrian kosong berarti sistem bersih"
          className="xl:col-span-1"
        >
          {ringkasan.antrian.length ? (
            <ul className="space-y-2">
              {ringkasan.antrian.map((a) => (
                <li key={a.label}>
                  <Link
                    href={a.href}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5 transition hover:border-brand-primary/40 hover:bg-brand-primary/[0.03]"
                  >
                    <span className="min-w-0 text-sm text-gray-700">{a.label}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold tabular-nums text-amber-700">
                        {a.jumlah}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-300 transition group-hover:text-brand-primary" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-3 text-sm text-green-700">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Tidak ada antrian yang perlu ditindak.
            </div>
          )}
        </Panel>

        <Panel
          title="Tren Pendaftaran 12 Bulan Terakhir"
          subtitle="Jumlah pendaftaran baru per bulan (HKI & KIAS)"
          className="xl:col-span-2"
        >
          <LineChart
            labels={ringkasan.trends.labels}
            series={[
              { name: 'HKI', color: PALET[0], values: ringkasan.trends.hki },
              { name: 'KIAS', color: PALET[1], values: ringkasan.trends.kias },
            ]}
          />
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PALET[0] }} />
              HKI — total {ringkasan.totalSantri} pendaftar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PALET[1] }} />
              KIAS — total {ringkasan.totalKias} peserta
            </span>
            <span className="ml-auto">Total peserta aktif: {totalPeserta}</span>
          </div>
        </Panel>
      </div>

      {/* ============================================================ */}
      {/* HKI / PSB                                                      */}
      {/* ============================================================ */}
      <div className="flex items-center gap-3 pt-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
          <School className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-gray-900">HKI &amp; Pendaftaran Santri</h2>
          <p className="text-xs text-gray-500">
            Pipeline PSB HKI: verifikasi, transfer, kuota, dan sebaran pendaftar.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <DonutPanel
          title="Status Pendaftaran HKI"
          subtitle={`${hki.total} pendaftar tercatat`}
          data={hki.statusPendaftaran}
          centerLabel="pendaftar"
          centerValue={hki.total}
        />
        <DonutPanel
          title="Jenis Kelamin HKI"
          subtitle="Komposisi ikhwan & akhwat"
          data={hki.perJk}
          centerLabel="total"
          centerValue={hki.total}
        />
        <Panel title="Pendaftar per Program" subtitle="Program yang paling banyak peminatnya">
          <HBarChart
            data={hki.perProgram.map((p, i) => ({ ...p, color: PALET[i % PALET.length] }))}
          />
        </Panel>

        <Panel title="Pendaftar per Tahun PSB" subtitle="Jumlah pendaftar pada setiap tahun ajaran">
          <BarChart
            data={hki.perTahunPsb.map((t, i) => ({ ...t, color: PALET[i % PALET.length] }))}
          />
        </Panel>
        <Panel title="Sebaran Wilayah Pendaftar" subtitle="Provinsi asal pendaftar HKI">
          <HBarChart
            data={hki.perProvinsi.map((p, i) => ({ ...p, color: PALET[(i + 2) % PALET.length] }))}
          />
        </Panel>
        <Panel title="Riwayat Pendidikan Pendaftar" subtitle="Ijazah terakhir pendaftar">
          <HBarChart
            data={hki.perPendidikan.map((p, i) => ({ ...p, color: PALET[(i + 3) % PALET.length] }))}
          />
        </Panel>

        <Panel
          title="Kuota PSB per Tahun Ajaran"
          subtitle={hki.tahunAktif ? `Tahun aktif: ${hki.tahunAktif}` : 'Belum ada tahun PSB aktif'}
        >
          {hki.kuotaPsb.length ? (
            <div className="space-y-4">
              {hki.kuotaPsb.map((k) => (
                <div key={k.tahun} className="rounded-lg border border-gray-100 p-3">
                  <p className="mb-2 text-xs font-semibold text-gray-700">{k.tahun}</p>
                  <div className="space-y-2">
                    <ProgressBar
                      label="Ikhwan"
                      value={k.terpakaiIkhwan}
                      max={k.ikhwan}
                      color={PALET[0]}
                      suffix="terisi"
                    />
                    <ProgressBar
                      label="Akhwat"
                      value={k.terpakaiAkhwat}
                      max={k.akhwat}
                      color={PALET[1]}
                      suffix="terisi"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyChart pesan="Belum ada pengaturan kuota PSB" />
          )}
        </Panel>

        <Panel title="Kanal Pendaftaran" subtitle="Pemakaian link pendaftaran (dari kuota)">
          {hki.kanal.length ? (
            <div className="space-y-3">
              {hki.kanal.map((k) => (
                <ProgressBar
                  key={k.label}
                  label={k.label}
                  value={k.dipakai}
                  max={k.kuota ?? 0}
                  color={PALET[2]}
                  suffix="terpakai"
                />
              ))}
            </div>
          ) : (
            <EmptyChart pesan="Belum ada link pendaftaran" />
          )}
        </Panel>

        <Panel title="Transfer Masuk" subtitle="Total nominal transfer yang sudah disetujui">
          <div className="space-y-3">
            <div className="rounded-lg bg-brand-primary/[0.05] p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">Total dana diterima</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-brand-primary">
                {rupiah(hki.totalTransfer)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-xs text-gray-500">Lunas</p>
                <p className="text-lg font-bold tabular-nums text-green-700">{hki.lunas}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-xs text-gray-500">Belum lunas</p>
                <p className="text-lg font-bold tabular-nums text-amber-700">{hki.belumLunas}</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Menunggu Verifikasi Pendaftaran HKI"
          subtitle="8 pendaftar terakhir dengan status menunggu"
          action={
            <Link
              href="/admin/pendaftaran?statusPendaftaran=pending"
              className="text-xs font-medium text-brand-primary hover:underline"
            >
              Lihat semua
            </Link>
          }
        >
          <Tabel
            kolom={['Nama', 'Kode', 'Program', 'Tanggal']}
            kosong="Tidak ada pendaftar yang menunggu verifikasi"
            baris={hki.perluVerifikasi.map((p) => [
              <span key="n" className="font-medium text-gray-800">{p.nama}</span>,
              <span key="k" className="tabular-nums text-gray-500">{p.kode}</span>,
              <span key="p">{p.program}</span>,
              <span key="t" className="whitespace-nowrap text-gray-500">{p.tanggal}</span>,
            ])}
          />
        </Panel>

        <Panel
          title="Menunggu Cek Transfer HKI"
          subtitle="Nominal yang menunggu verifikasi pembayaran"
          action={
            <Link
              href="/admin/pendaftaran?statusTransfer=pending"
              className="text-xs font-medium text-brand-primary hover:underline"
            >
              Lihat semua
            </Link>
          }
        >
          <Tabel
            kolom={['Nama', 'Kode', 'Program', 'Nominal']}
            kosong="Tidak ada nominal yang menunggu pengecekan"
            baris={hki.perluTransfer.map((p) => [
              <span key="n" className="font-medium text-gray-800">{p.nama}</span>,
              <span key="k" className="tabular-nums text-gray-500">{p.kode}</span>,
              <span key="p">{p.program}</span>,
              <span key="n2" className="font-semibold tabular-nums text-brand-primary">
                {rupiah(p.nominal)}
              </span>,
            ])}
          />
        </Panel>
      </div>

      {/* ============================================================ */}
      {/* KIAS                                                            */}
      {/* ============================================================ */}
      <div className="flex items-center gap-3 pt-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-secondary/10 text-brand-secondary">
          <Landmark className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Program KIAS</h2>
          <p className="text-xs text-gray-500">
            Sebaran peserta KIAS per program, jenis program, gender, dan pendaftaran.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <DonutPanel
          title="Status Peserta KIAS"
          subtitle={`${kias.total} peserta · ${kias.programAktif}/${kias.programTotal} program buka PSB`}
          data={kias.status}
          centerLabel="peserta"
          centerValue={kias.total}
        />
        <DonutPanel
          title="Status Pendaftaran KIAS"
          subtitle="Menunggu, diterima, dan ditolak"
          data={kias.statusPendaftaran}
          centerLabel="peserta"
          centerValue={kias.total}
        />
        <DonutPanel
          title="Peserta per Jenis Program"
          subtitle="Program KIAS yang tersedia"
          data={kias.perJenis}
          centerLabel="jenis"
          centerValue={kias.perJenis.length}
        />

        <Panel title="Ikhwan & Akhwat per Jenis Program" subtitle="Komposisi gender tiap cabang">
          <StackedBarChart
            labels={kias.jkPerJenis.map((j) => j.jenis)}
            series={[
              { name: 'Ikhwan', color: PALET[0], values: kias.jkPerJenis.map((j) => j.ikhwan) },
              { name: 'Akhwat', color: PALET[3], values: kias.jkPerJenis.map((j) => j.akhwat) },
            ]}
          />
        </Panel>

        <Panel title="Peserta per Program KIAS" subtitle="Program dengan peserta terbanyak">
          <HBarChart
            data={kias.perProgram.map((p, i) => ({ ...p, color: PALET[i % PALET.length] }))}
          />
        </Panel>

        <Panel title="Peserta per Tahun PSB KIAS" subtitle="Jumlah peserta pada tiap tahun ajaran">
          <BarChart
            data={kias.perTahunPsb.map((t, i) => ({ ...t, color: PALET[(i + 1) % PALET.length] }))}
          />
        </Panel>

        <Panel
          title="Kuota PSB KIAS"
          subtitle={kias.tahunAktif ? `Tahun aktif: ${kias.tahunAktif}` : 'Belum ada tahun PSB KIAS'}
        >
          {kias.kuotaPsb.length ? (
            <div className="space-y-4">
              {kias.kuotaPsb.map((k) => (
                <div key={k.tahun} className="rounded-lg border border-gray-100 p-3">
                  <p className="mb-2 text-xs font-semibold text-gray-700">{k.tahun}</p>
                  <div className="space-y-2">
                    <ProgressBar
                      label="Ikhwan"
                      value={k.terpakaiIkhwan}
                      max={k.ikhwan}
                      color={PALET[0]}
                      suffix="terisi"
                    />
                    <ProgressBar
                      label="Akhwat"
                      value={k.terpakaiAkhwat}
                      max={k.akhwat}
                      color={PALET[3]}
                      suffix="terisi"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyChart pesan="Belum ada pengaturan kuota PSB KIAS" />
          )}
        </Panel>

        <Panel title="Pengajar per Jenis Program" subtitle="Jumlah pengajar yang terdaftar">
          <BarChart
            data={kias.pengajarPerJenis.map((p, i) => ({ ...p, color: PALET[(i + 2) % PALET.length] }))}
          />
        </Panel>

        <Panel title="Cek Transfer KIAS" subtitle="Status verifikasi pembayaran peserta">
          <DonutChart
            data={kias.statusTransfer}
            size={150}
            thickness={20}
            centerLabel="peserta"
            centerValue={kias.total}
          />
          <div className="mt-3">
            <ChartLegend data={kias.statusTransfer} />
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Menunggu Verifikasi Pendaftaran KIAS"
          subtitle="8 peserta terakhir berstatus menunggu"
          action={
            <Link
              href="/admin/kias/pendaftaran?status=Menunggu"
              className="text-xs font-medium text-brand-primary hover:underline"
            >
              Lihat semua
            </Link>
          }
        >
          <Tabel
            kolom={['Nama', 'Kode', 'Program', 'Tanggal']}
            kosong="Tidak ada peserta yang menunggu verifikasi"
            baris={kias.perluVerifikasi.map((p) => [
              <span key="n" className="font-medium text-gray-800">{p.nama}</span>,
              <span key="k" className="tabular-nums text-gray-500">{p.kode}</span>,
              <span key="p">{p.program}</span>,
              <span key="t" className="whitespace-nowrap text-gray-500">{p.tanggal}</span>,
            ])}
          />
        </Panel>

        <Panel
          title="Menunggu Cek Transfer KIAS"
          subtitle="Nominal yang menunggu verifikasi pembayaran"
          action={
            <Link
              href="/admin/kias/pendaftaran?transfer=Cek"
              className="text-xs font-medium text-brand-primary hover:underline"
            >
              Lihat semua
            </Link>
          }
        >
          <Tabel
            kolom={['Nama', 'Kode', 'Program', 'Nominal']}
            kosong="Tidak ada nominal yang menunggu pengecekan"
            baris={kias.perluCekTransfer.map((p) => [
              <span key="n" className="font-medium text-gray-800">{p.nama}</span>,
              <span key="k" className="tabular-nums text-gray-500">{p.kode}</span>,
              <span key="p">{p.program}</span>,
              <span key="n2" className="font-semibold tabular-nums text-brand-secondary">
                {rupiah(p.nominal)}
              </span>,
            ])}
          />
        </Panel>
      </div>

      {/* ============================================================ */}
      {/* Karyawan & absensi                                             */}
      {/* ============================================================ */}
      <div className="flex items-center gap-3 pt-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600/10 text-green-700">
          <Users className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Karyawan &amp; Absensi</h2>
          <p className="text-xs text-gray-500">
            Data kepegawaian dan rekap kehadiran pada periode {PERIODE_LABEL[periode].toLowerCase()}.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <DonutPanel
          title="Sebaran Jabatan"
          subtitle={`${karyawan.aktif} pegawai aktif dari ${karyawan.total}`}
          data={karyawan.perJabatan}
          centerLabel="pegawai"
          centerValue={karyawan.total}
        />
        <DonutPanel
          title="Rekap Kehadiran"
          subtitle={`Absensi ${PERIODE_LABEL[periode].toLowerCase()}`}
          data={karyawan.rekapStatus}
          centerLabel="absensi"
          centerValue={karyawan.rekapStatus.reduce((s, x) => s + x.value, 0)}
        />
        <DonutPanel
          title="Metode Absensi"
          subtitle="GPS, Wi-Fi, atau manual"
          data={karyawan.perMetode}
          centerLabel="catatan"
          centerValue={karyawan.perMetode.reduce((s, x) => s + x.value, 0)}
        />

        <Panel
          title="Kehadiran 30 Hari Terakhir"
          subtitle="Jumlah hadir, telat, alpa, dan izin per hari"
          className="lg:col-span-2 xl:col-span-2"
        >
          <StackedBarChart
            labels={karyawan.perHari.labels}
            series={[
              { name: 'Hadir', color: PALET[4], values: karyawan.perHari.hadir },
              { name: 'Telat', color: PALET[5], values: karyawan.perHari.telat },
              { name: 'Alpa', color: PALET[6], values: karyawan.perHari.alpa },
              { name: 'Izin/Sakit/Cuti', color: PALET[8], values: karyawan.perHari.izin },
            ]}
          />
        </Panel>

        <Panel title="Rata-rata Jam Masuk" subtitle="Rata-rata waktu masuk karyawan per hari">
          {karyawan.rataMasukPerHari.labels.length ? (
            <LineChart
              labels={karyawan.rataMasukPerHari.labels}
              series={[
                {
                  name: 'Jam masuk',
                  color: PALET[2],
                  values: karyawan.rataMasukPerHari.values,
                },
              ]}
              valueFormat={(n) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`}
            />
          ) : (
            <EmptyChart pesan="Belum ada data jam masuk" />
          )}
        </Panel>

        <Panel title="Status Pengajuan" subtitle="Pengajuan izin, sakit, dan cuti">
          <DonutChart
            data={karyawan.pengajuanStatus}
            size={150}
            thickness={20}
            centerLabel="pengajuan"
            centerValue={karyawan.pengajuanStatus.reduce((s, x) => s + x.value, 0)}
          />
          <div className="mt-3">
            <ChartLegend data={karyawan.pengajuanStatus} />
          </div>
        </Panel>

        <Panel title="Kehadiran Hari Ini" subtitle="Rekap absensi hari ini">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Hadir', value: karyawan.hariIni.hadir, color: 'text-green-700' },
              { label: 'Telat', value: karyawan.hariIni.telat, color: 'text-amber-700' },
              { label: 'Alpa', value: karyawan.hariIni.alpa, color: 'text-red-600' },
              { label: 'Izin/Sakit/Cuti', value: karyawan.hariIni.izin, color: 'text-blue-700' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-gray-100 p-3">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={clsx('text-xl font-bold tabular-nums', s.color)}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> {karyawan.hariLibur} hari libur
            </span>
            <span className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5" /> {karyawan.shiftAktif} shift aktif
            </span>
            <span className="flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5" /> {karyawan.punyaAkun} pegawai punya akun
            </span>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Belum Absen Hari Ini"
          subtitle="Pegawai aktif yang belum mencatat kehadiran"
          action={
            <Link
              href="/admin/absen"
              className="text-xs font-medium text-brand-primary hover:underline"
            >
              Lihat absensi
            </Link>
          }
        >
          <Tabel
            kolom={['Nama', 'Jabatan']}
            kosong="Semua pegawai aktif sudah absen hari ini"
            baris={karyawan.belumAbsen.map((p) => [
              <span key="n" className="font-medium text-gray-800">{p.nama}</span>,
              <span key="j" className="text-gray-500">{p.jabatan}</span>,
            ])}
          />
        </Panel>

        <Panel
          title="Pengajuan Menunggu Persetujuan"
          subtitle="Perlu ditinjau admin"
          action={
            <Link
              href="/admin/pengajuan"
              className="text-xs font-medium text-brand-primary hover:underline"
            >
              Lihat semua
            </Link>
          }
        >
          <Tabel
            kolom={['Nama', 'Jenis', 'Mulai', 'Selesai']}
            kosong="Tidak ada pengajuan yang menunggu"
            baris={karyawan.perluTindak.map((p) => [
              <span key="n" className="font-medium text-gray-800">{p.nama}</span>,
              <span key="j" className="capitalize">{p.jenis}</span>,
              <span key="d" className="whitespace-nowrap text-gray-500">{p.dari}</span>,
              <span key="s" className="whitespace-nowrap text-gray-500">{p.sampai}</span>,
            ])}
          />
        </Panel>
      </div>

      {/* ============================================================ */}
      {/* Event, berita, konten                                          */}
      {/* ============================================================ */}
      <div className="flex items-center gap-3 pt-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700">
          <Sparkles className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Event, Berita &amp; Konten</h2>
          <p className="text-xs text-gray-500">
            Aktivitas publik website: event, berita, media sosial, info KIAS, dan isi konten.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Event"
          value={acara.totalEvent}
          hint={`${acara.published} terbit · ${acara.mendatang} mendatang`}
          icon={CalendarDays}
          href="/admin/events"
        />
        <StatCard
          label="Berita"
          value={acara.berita.total}
          hint={`${acara.berita.published} terbit`}
          icon={Newspaper}
          href="/admin/berita"
        />
        <StatCard
          label="Media Sosial"
          value={acara.instagram.total}
          hint={`${acara.instagram.bulanTerakhir} posting 30 hari terakhir`}
          icon={Activity}
        />
        <StatCard
          label="Isi Konten Website"
          value={acara.konten.key}
          hint={`${acara.konten.terisi} terisi · ${acara.konten.item} item daftar`}
          icon={Layers}
          href="/admin/konten"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Panel
          title="Partisipasi per Event"
          subtitle="Hadir dibanding total pendaftaran"
          className="lg:col-span-2"
        >
          {acara.perEvent.length ? (
            <StackedBarChart
              labels={acara.perEvent.map((e) => e.judul)}
              series={[
                { name: 'Hadir', color: PALET[4], values: acara.perEvent.map((e) => e.hadir) },
                {
                  name: 'Belum hadir',
                  color: '#e5e7eb',
                  values: acara.perEvent.map((e) => Math.max(e.daftar - e.hadir, 0)),
                },
              ]}
            />
          ) : (
            <EmptyChart pesan="Belum ada event" />
          )}
        </Panel>

        <Panel title="Daftar Event" subtitle="Status dan pembayaran peserta">
          <Tabel
            kolom={['Event', 'Daftar', 'Hadir', 'Lunas']}
            kosong="Belum ada event"
            baris={acara.perEvent.slice(0, 8).map((e) => [
              <span key="j" className="block max-w-[180px] truncate font-medium text-gray-800" title={e.judul}>
                {e.judul}
              </span>,
              <span key="d" className="tabular-nums">{e.daftar}</span>,
              <span key="h" className="tabular-nums">{e.hadir}</span>,
              <span key="l" className="tabular-nums">{e.lunas}</span>,
            ])}
          />
        </Panel>

        <Panel title="Berita per Kategori" subtitle="Sebaran berita yang dipublikasikan">
          <HBarChart
            data={acara.berita.perKategori.map((k, i) => ({ ...k, color: PALET[i % PALET.length] }))}
          />
        </Panel>

        <Panel title="Halaman Info KIAS" subtitle="Halaman informasi yang tampil di website">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-xs text-gray-500">Total halaman</p>
                <p className="text-lg font-bold tabular-nums text-gray-900">{acara.halamanInfo.total}</p>
              </div>
              <div className="rounded-lg border border-gray-100 p-3">
                <p className="text-xs text-gray-500">Ditampilkan</p>
                <p className="text-lg font-bold tabular-nums text-green-700">
                  {acara.halamanInfo.tampil}
                </p>
              </div>
            </div>
            <HBarChart
              data={acara.halamanInfo.perKategori.map((k, i) => ({
                ...k,
                color: PALET[(i + 1) % PALET.length],
              }))}
            />
          </div>
        </Panel>

        <Panel title="Kelengkapan Konten Website" subtitle="Konten teks & label yang sudah terisi">
          <div className="space-y-3">
            <ProgressBar
              label="Teks & label terisi"
              value={acara.konten.terisi}
              max={acara.konten.key}
              color={PALET[2]}
              suffix="dari total"
            />
            <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600">
              <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span>
                Konten yang belum diisi memakai nilai bawaan sistem, jadi halaman publik tetap
                tampil utuh.
              </span>
            </div>
            <Link
              href="/admin/konten"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
            >
              Kelola konten website <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Panel>
      </div>

      {/* Ringkasan akhir */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Santri & Peserta" value={totalPeserta} hint="HKI + KIAS" icon={Users} />
        <StatCard
          label="Program KIAS Aktif"
          value={kias.programAktif}
          hint={`dari ${kias.programTotal} program terdaftar`}
          icon={Building2}
        />
        <StatCard
          label="Pendaftar per Tahun"
          value={hki.perTahunPsb.reduce((s, x) => s + x.value, 0)}
          hint="Total seluruh tahun PSB"
          icon={UserPlus}
        />
        <StatCard
          label="Lokasi Pendaftar"
          value={hki.perProvinsi.length}
          hint="Provinsi berbeda yang registering"
          icon={MapPin}
        />
      </div>

      <p className="flex items-center gap-2 pb-2 text-xs text-gray-400">
        <ListChecks className="h-3.5 w-3.5" />
        Data dashboard dihitung langsung dari basis data saat halaman dibuka.
      </p>
    </div>
  )
}
