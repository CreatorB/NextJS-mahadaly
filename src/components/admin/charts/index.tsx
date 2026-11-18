import { clsx } from 'clsx'

/**
 * Komponen chart dashboard — SVG/CSS murni, tanpa dependensi chart eksternal.
 *
 * Semua komponen aman dipakai di server component (tidak ada state/hook).
 * Grafik kosong menampilkan pesan "belum ada data" supaya dashboard tidak
 * pernah tampil rusak.
 */

export const PALET = [
  '#00367c', // brand primary
  '#00709f', // brand secondary
  '#35a2c9', // brand light
  '#f5ff7d', // brand accent
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#64748b',
  '#ec4899',
]

export type Slice = { label: string; value: number; color?: string }

export function EmptyChart({ pesan = 'Belum ada data' }: { pesan?: string }) {
  return (
    <div className="flex h-full min-h-[120px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/60 text-sm text-gray-400">
      {pesan}
    </div>
  )
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}jt`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}rb`
  return String(n)
}

/* ------------------------------------------------------------------ */
/* Donut                                                               */
/* ------------------------------------------------------------------ */

export function DonutChart({
  data,
  size = 168,
  thickness = 22,
  centerLabel,
  centerValue,
}: {
  data: Slice[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: number | string
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total <= 0) return <EmptyChart />

  const c = size / 2
  const r = (size - thickness) / 2
  const circ = 2 * Math.PI * r

  // Offset tiap irisan dihitung tanpa mutasi agar aman di server component.
  const segmen = data.reduce<{ d: Slice; offset: number }[]>((acc, d) => {
    const sebelum = acc.length > 0 ? acc[acc.length - 1] : null
    const offset = sebelum ? sebelum.offset + (sebelum.d.value / total) * circ : 0
    acc.push({ d, offset })
    return acc
  }, [])

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-auto w-full max-w-[220px]" role="img">
      <g transform={`rotate(-90 ${c} ${c})`}>
        {segmen.map((s, i) => {
          const len = (s.d.value / total) * circ
          return (
            <circle
              key={i}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={s.d.color ?? PALET[i % PALET.length]}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-s.offset}
            >
              <title>{`${s.d.label}: ${s.d.value}`}</title>
            </circle>
          )
        })}
      </g>
      {centerValue !== undefined && (
        <>
          <text x={c} y={c - 2} textAnchor="middle" className="fill-gray-900" style={{ fontSize: 26, fontWeight: 700 }}>
            {centerValue}
          </text>
          {centerLabel && (
            <text x={c} y={c + 18} textAnchor="middle" className="fill-gray-500" style={{ fontSize: 11 }}>
              {centerLabel}
            </text>
          )}
        </>
      )}
    </svg>
  )
}

export function ChartLegend({ data }: { data: Slice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (!total) return null
  return (
    <ul className="space-y-1.5">
      {data.map((d, i) => (
        <li key={d.label} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: d.color ?? PALET[i % PALET.length] }}
          />
          <span className="min-w-0 flex-1 truncate text-gray-600">{d.label}</span>
          <span className="font-semibold tabular-nums text-gray-900">{d.value}</span>
          <span className="w-11 text-right text-xs tabular-nums text-gray-400">
            {total ? ((d.value / total) * 100).toFixed(0) : 0}%
          </span>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ */
/* Bar vertikal                                                       */
/* ------------------------------------------------------------------ */

export function BarChart({
  data,
  height = 210,
  color = PALET[0],
  valueFormat = fmt,
  labelFormat,
}: {
  data: { label: string; value: number; color?: string }[]
  height?: number
  color?: string
  valueFormat?: (n: number) => string
  labelFormat?: (s: string) => string
}) {
  if (!data.length || data.every((d) => d.value === 0)) return <EmptyChart />

  const W = 640
  const H = height
  const padL = 34
  const padR = 8
  const padT = 18
  const padB = 40
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const max = Math.max(...data.map((d) => d.value), 1)
  const slot = innerW / data.length
  const barW = Math.min(46, slot * 0.62)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
      {[0, 0.5, 1].map((f) => {
        const y = padT + innerH * (1 - f)
        return (
          <g key={f}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-gray-400" style={{ fontSize: 10 }}>
              {valueFormat(max * f)}
            </text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const h = (d.value / max) * innerH
        const x = padL + slot * i + (slot - barW) / 2
        const y = padT + innerH - h
        const label = labelFormat ? labelFormat(d.label) : d.label
        return (
          <g key={`${d.label}-${i}`}>
            <rect x={x} y={y} width={barW} height={Math.max(h, d.value > 0 ? 2 : 0)} rx={4} fill={d.color ?? color}>
              <title>{`${d.label}: ${d.value}`}</title>
            </rect>
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" className="fill-gray-600" style={{ fontSize: 10, fontWeight: 600 }}>
                {valueFormat(d.value)}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={H - padB + 15}
              textAnchor="middle"
              className="fill-gray-500"
              style={{ fontSize: 10 }}
            >
              {label.length > 14 ? `${label.slice(0, 13)}…` : label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Bar horizontal (HTML — mudah untuk label panjang)                  */
/* ------------------------------------------------------------------ */

export function HBarChart({
  data,
  valueFormat = fmt,
  max: maxPakai,
  color = PALET[0],
}: {
  data: { label: string; value: number; color?: string }[]
  valueFormat?: (n: number) => string
  max?: number
  color?: string
}) {
  if (!data.length || data.every((d) => d.value === 0)) return <EmptyChart />
  const max = maxPakai ?? Math.max(...data.map((d) => d.value), 1)

  return (
    <ul className="space-y-2">
      {data.map((d) => (
        <li key={d.label} className="grid grid-cols-[minmax(0,140px)_1fr_auto] items-center gap-3">
          <span className="truncate text-xs text-gray-600" title={d.label}>
            {d.label}
          </span>
          <span className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.max(2, (d.value / max) * 100)}%`,
                backgroundColor: d.color ?? color,
              }}
            />
          </span>
          <span className="w-14 text-right text-xs font-semibold tabular-nums text-gray-700">
            {valueFormat(d.value)}
          </span>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ */
/* Line / area (tren)                                                 */
/* ------------------------------------------------------------------ */

export function LineChart({
  labels,
  series,
  height = 220,
  valueFormat = fmt,
}: {
  labels: string[]
  series: { name: string; color?: string; values: number[] }[]
  height?: number
  valueFormat?: (n: number) => string
}) {
  const total = series.reduce((s, x) => s + x.values.reduce((a, b) => a + b, 0), 0)
  if (!labels.length || total === 0) return <EmptyChart />

  const W = 640
  const H = height
  const padL = 34
  const padR = 10
  const padT = 14
  const padB = 30
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const max = Math.max(...series.flatMap((s) => s.values), 1)
  const step = labels.length > 1 ? innerW / (labels.length - 1) : 0

  const xAt = (i: number) => padL + step * i
  const yAt = (v: number) => padT + innerH * (1 - v / max)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
      {[0, 0.5, 1].map((f) => {
        const y = padT + innerH * (1 - f)
        return (
          <g key={f}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-gray-400" style={{ fontSize: 10 }}>
              {valueFormat(max * f)}
            </text>
          </g>
        )
      })}

      {series.map((s, si) => {
        const color = s.color ?? PALET[si % PALET.length]
        const pts = s.values.map((v, i) => `${xAt(i)},${yAt(v)}`).join(' ')
        const area = `${padL},${padT + innerH} ${pts} ${xAt(s.values.length - 1)},${padT + innerH}`
        return (
          <g key={s.name}>
            {series.length === 1 && (
              <polygon points={area} fill={color} fillOpacity={0.08} />
            )}
            <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {s.values.map((v, i) => (
              <circle key={i} cx={xAt(i)} cy={yAt(v)} r={2.6} fill="#fff" stroke={color} strokeWidth={1.8}>
                <title>{`${s.name} · ${labels[i]}: ${v}`}</title>
              </circle>
            ))}
          </g>
        )
      })}

      {labels.map((l, i) => {
        const setiap = Math.ceil(labels.length / 8)
        if (i % setiap !== 0 && i !== labels.length - 1) return null
        const anchor = i === labels.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'
        return (
          <text key={i} x={xAt(i)} y={H - padB + 15} textAnchor={anchor} className="fill-gray-500" style={{ fontSize: 10 }}>
            {l}
          </text>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Stacked bar                                                        */
/* ------------------------------------------------------------------ */

export function StackedBarChart({
  labels,
  series,
  height = 210,
  valueFormat = fmt,
}: {
  labels: string[]
  series: { name: string; color?: string; values: number[] }[]
  height?: number
  valueFormat?: (n: number) => string
}) {
  const total = series.reduce((s, x) => s + x.values.reduce((a, b) => a + b, 0), 0)
  if (!labels.length || total === 0) return <EmptyChart />

  const W = 640
  const H = height
  const padL = 34
  const padR = 8
  const padT = 14
  const padB = 36
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const totals = labels.map((_, i) => series.reduce((s, x) => s + (x.values[i] ?? 0), 0))
  const max = Math.max(...totals, 1)
  const slot = innerW / labels.length
  const barW = Math.min(34, slot * 0.6)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
      {[0, 0.5, 1].map((f) => {
        const y = padT + innerH * (1 - f)
        return (
          <g key={f}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-gray-400" style={{ fontSize: 10 }}>
              {valueFormat(max * f)}
            </text>
          </g>
        )
      })}
      {labels.map((l, i) => {
        let acc = 0
        const x = padL + slot * i + (slot - barW) / 2
        return (
          <g key={l}>
            {series.map((s, si) => {
              const v = s.values[i] ?? 0
              if (v <= 0) return null
              const h = (v / max) * innerH
              const y = padT + innerH - ((acc + v) / max) * innerH
              acc += v
              return (
                <rect
                  key={s.name}
                  x={x}
                  y={y}
                  width={barW}
                  height={h}
                  fill={s.color ?? PALET[si % PALET.length]}
                  rx={2}
                >
                  <title>{`${l} · ${s.name}: ${v}`}</title>
                </rect>
              )
            })}
            {totals[i] > 0 && (
              <text x={x + barW / 2} y={padT + innerH - (totals[i] / max) * innerH - 5} textAnchor="middle" className="fill-gray-600" style={{ fontSize: 9, fontWeight: 600 }}>
                {valueFormat(totals[i])}
              </text>
            )}
            <text x={x + barW / 2} y={H - padB + 14} textAnchor="middle" className="fill-gray-500" style={{ fontSize: 9 }}>
              {l.length > 12 ? `${l.slice(0, 11)}…` : l}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Progress (kuota vs terisi)                                         */
/* ------------------------------------------------------------------ */

export function ProgressBar({
  label,
  value,
  max,
  color = PALET[0],
  suffix,
}: {
  label: string
  value: number
  max: number
  color?: string
  suffix?: string
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const lewat = max > 0 && value > max
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold tabular-nums text-gray-800">
          {value}
          {max > 0 ? ` / ${max}` : ''}
          {suffix ? ` ${suffix}` : ''}
          {lewat && <span className="ml-1 text-red-600">(penuh)</span>}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(pct, value > 0 ? 3 : 0)}%`, backgroundColor: lewat ? '#ef4444' : color }}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sparkline (di dalam kartu KPI)                                     */
/* ------------------------------------------------------------------ */

export function Sparkline({
  values,
  color = PALET[0],
  width = 96,
  height = 30,
}: {
  values: number[]
  color?: string
  width?: number
  height?: number
}) {
  if (!values.length || values.every((v) => v === 0)) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const step = values.length > 1 ? width / (values.length - 1) : 0
  const pts = values
    .map((v, i) => `${step * i},${height - 3 - ((v - min) / span) * (height - 6)}`)
    .join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Kartu KPI                                                          */
/* ------------------------------------------------------------------ */

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  spark,
  sparkColor,
  href,
  tone = 'default',
}: {
  label: string
  value: number | string
  hint?: string
  icon?: React.ComponentType<{ className?: string }>
  spark?: number[]
  sparkColor?: string
  href?: string
  tone?: 'default' | 'good' | 'warn' | 'bad'
}) {
  const toneCls = {
    default: 'text-brand-primary bg-brand-primary/10',
    good: 'text-green-700 bg-green-100',
    warn: 'text-amber-700 bg-amber-100',
    bad: 'text-red-700 bg-red-100',
  }[tone]

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{value}</p>
          {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
        </div>
        {Icon && (
          <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', toneCls)}>
            <Icon className="h-4.5 w-4.5" />
          </span>
        )}
      </div>
      {spark && spark.length > 1 && (
        <div className="mt-3">
          <Sparkline values={spark} color={sparkColor ?? PALET[0]} />
        </div>
      )}
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        className="block rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-brand-primary/40 hover:shadow"
      >
        {body}
      </a>
    )
  }
  return <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">{body}</div>
}
