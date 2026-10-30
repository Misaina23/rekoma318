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
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground sm:text-sm">{label}</span>
        {icon && (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2.5 text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl">
        {value}
      </div>
      {delta && <p className="mt-1 text-xs text-muted-foreground tabular-nums">{delta}</p>}
    </div>
  )
}

export function LineChart({
  data,
  labels,
  height = 170,
  color = 'hsl(var(--primary))',
}: {
  data: number[]
  labels?: string[]
  height?: number
  color?: string
}) {
  const w = 640
  const max = Math.max(...data, 1)
  const min = 0
  const span = max - min || 1
  const padX = 16
  const innerW = w - padX * 2
  const step = data.length > 1 ? innerW / (data.length - 1) : innerW
  const pts = data.map((d, i) => {
    const x = padX + i * step
    const y = height - ((d - min) / span) * (height - 34) - 22
    return [x, y]
  })
  const line = pts.map((p) => p.join(',')).join(' ')
  const area = `${padX},${height - 20} ${line} ${padX + innerW},${height - 20}`
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img">
      <polygon points={area} fill={color} opacity={0.1} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill={color} />
      ))}
      {labels &&
        labels.map((l, i) =>
          i % 2 === 0 || i === labels.length - 1 ? (
            <text
              key={i}
              x={padX + i * step}
              y={height - 4}
              fontSize={10}
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
            >
              {l}
            </text>
          ) : null
        )}
    </svg>
  )
}

export function BarChart({
  data,
  labels,
  height = 175,
  color = 'hsl(var(--primary))',
}: {
  data: number[]
  labels?: string[]
  height?: number
  color?: string
}) {
  const w = 640
  const max = Math.max(...data, 1)
  const gap = 10
  const bw = data.length ? (w - gap * (data.length - 1)) / data.length : w
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img">
      {data.map((d, i) => {
        const rawH = (d / max) * (height - 36)
        const h = d > 0 ? Math.max(6, rawH) : 3
        const x = i * (bw + gap)
        return (
          <g key={i}>
            <rect
              x={x}
              y={height - h - 20}
              width={bw}
              height={h}
              rx={5}
              fill={color}
              opacity={d > 0 ? 0.88 : 0.2}
            />
            {d > 0 && (
              <text
                x={x + bw / 2}
                y={Math.max(11, height - h - 25)}
                fontSize={10}
                textAnchor="middle"
                fill="hsl(var(--foreground))"
              >
                {d}
              </text>
            )}
            {labels && (i % 2 === 0 || i === labels.length - 1) && (
              <text
                x={x + bw / 2}
                y={height - 4}
                fontSize={10}
                textAnchor="middle"
                fill="hsl(var(--muted-foreground))"
              >
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
  size = 148,
}: {
  segments: { value: number; color: string; label: string }[]
  size?: number
}) {
  const sum = segments.reduce((s, x) => s + x.value, 0)
  const total = sum || 1
  const r = size / 2 - 14
  const c = size / 2
  let offset = 0
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
      <div className="relative shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
          <circle cx={c} cy={c} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={14} />
          {sum > 0 &&
            segments.map((s, i) => {
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
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-lg font-bold text-foreground tabular-nums">{sum}</span>
          <span className="text-[10px] text-muted-foreground">Total</span>
        </div>
      </div>
      <ul className="w-full flex-1 space-y-2 text-xs sm:text-sm">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
              <span className="truncate text-muted-foreground">{s.label}</span>
            </span>
            <span className="font-semibold text-foreground tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
