import type { ReactElement } from 'react'

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** Slender cross with a soft halo; the app's single sacred mark. Decorative. */
export function Cross({ size = 44 }: { size?: number }): ReactElement {
  return (
    <svg className="cross" width={size} height={size * 1.25} viewBox="0 0 40 50" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="halo" cx="50%" cy="42%" r="50%">
          <stop offset="0" stopColor="var(--gold-hi)" stopOpacity=".55" />
          <stop offset="1" stopColor="var(--gold-hi)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="21" r="20" fill="url(#halo)" />
      <path d="M20 4v42M10 16h20" stroke="var(--gold)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M17.5 4h5M17.5 46h5M10 13.5v5M30 13.5v5" stroke="var(--gold)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

/** Gold hairline with a small diamond at its centre. */
export function Divider(): ReactElement {
  return (
    <div className="orn" aria-hidden="true">
      <span />
      <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1l5 6-5 6-5-6z" fill="var(--gold)" /></svg>
      <span />
    </div>
  )
}

export const icons: Record<'today' | 'hymns' | 'favs' | 'settings', ReactElement> = {
  today: (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" {...S}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" />
    </svg>
  ),
  hymns: (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" {...S}>
      <path d="M12 6.5C9.5 5 6.5 4.7 3.5 5.2v13c3-.5 6-.2 8.5 1.3 2.5-1.5 5.5-1.8 8.5-1.3v-13c-3-.5-6-.2-8.5 1.3zM12 6.5v13" />
    </svg>
  ),
  favs: (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" {...S}>
      <path d="M12 2.8c1.6 2 2.6 3.4 2.6 4.8a2.6 2.6 0 0 1-5.2 0c0-1.4 1-2.8 2.6-4.8zM8.5 12.5h7v8.7h-7zM12 12.5v-1.7" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" {...S}>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9M4 12h16" />
      <circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" />
    </svg>
  ),
}

export const PlayIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false"><path d="M8 5.2v13.6L19 12z" fill="currentColor" /></svg>
)
export const PauseIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z" fill="currentColor" /></svg>
)

const ROMAN: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]
export function roman(n: number): string {
  let out = ''
  for (const [v, s] of ROMAN) while (n >= v) { out += s; n -= v }
  return out
}
