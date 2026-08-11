'use client'

import type { ReactNode } from 'react'

export function StatCard({
  label,
  value,
  icon,
  delta,
  accent,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  delta?: string
  accent?: 'primary' | 'accent' | 'muted'
}) {
  const tone =
    accent === 'accent'
      ? 'bg-accent/10 text-accent'
      : accent === 'muted'
        ? 'bg-secondary text-muted-foreground'
        : 'bg-primary/10 text-primary'
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {icon && <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>{icon}</span>}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      {delta && <p className="mt-1 text-xs text-muted-foreground">{delta}</p>}
    </div>
  )
}

export function LineChart({
  data,
  labels,
  height = 160,
  color = 'hsl(var(--primary))',
}: {
  data: number[]
  labels?: string[]
  height?: number
  color?: string
}) {
  const w = 600
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const span = max - min || 1
  const step = data.length > 1 ? w / (data.length - 1) : w
  const pts = data.map((d, i) => {
    const x = i * step
    const y = height - ((d - min) / span) * (height - 20) - 10
    return [x, y]
  })
  const line = pts.map((p) => p.join(',')).join(' ')
  const area = `0,${height} ${line} ${w},${height}`
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" role="img">
      <polygon points={area} fill={color} opacity={0.08} />
      <polyline points={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {labels &&
        labels.map((l, i) => (
          <text key={i} x={i * step} y={height - 2} fontSize={11} fill="hsl(var(--muted-foreground))">
            {l}
          </text>
        ))}
    </svg>
  )
}

export function BarChart({
  data,
  labels,
  height = 160,
  color = 'hsl(var(--primary))',
}: {
  data: number[]
  labels?: string[]
  height?: number
  color?: string
}) {
  const w = 600
  const max = Math.max(...data, 1)
  const gap = 12
  const bw = data.length ? (w - gap * (data.length - 1)) / data.length : w
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" preserveAspectRatio="none" role="img">
      {data.map((d, i) => {
        const h = (d / max) * (height - 22)
        const x = i * (bw + gap)
        return (
          <g key={i}>
            <rect x={x} y={height - h - 18} width={bw} height={h} rx={5} fill={color} opacity={0.85} />
            {labels && (
              <text x={x + bw / 2} y={height - 4} fontSize={11} textAnchor="middle" fill="hsl(var(--muted-foreground))">
                {labels[i]}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export function DonutChart({
  segments,
  size = 160,
}: {
  segments: { value: number; color: string; label: string }[]
  size?: number
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = size / 2 - 14
  const c = size / 2
  let offset = 0
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
        <circle cx={c} cy={c} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={14} />
        {segments.map((s, i) => {
          const frac = s.value / total
          const dash = frac * 2 * Math.PI * r
          const el = (
            <circle
              key={i}
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={14}
              strokeDasharray={`${dash} ${2 * Math.PI * r}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${c} ${c})`}
            />
          )
          offset += dash
          return el
        })}
      </svg>
      <ul className="space-y-1.5 text-sm">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto font-medium">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
