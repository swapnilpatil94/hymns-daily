import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Props<T> {
  items: T[]
  rowHeight: number
  render(item: T, index: number): ReactNode
  scrollToIndex?: number | null
  className?: string
}

/** Fixed-row-height windowing: renders only the visible slice (+ overscan). */
export function VirtualList<T>({ items, rowHeight, render, scrollToIndex, className }: Props<T>) {
  const ref = useRef<HTMLDivElement>(null)
  const [top, setTop] = useState(0)
  const [height, setHeight] = useState(600)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setHeight(el.clientHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (scrollToIndex != null && ref.current) ref.current.scrollTop = scrollToIndex * rowHeight
  }, [scrollToIndex, rowHeight])

  const start = Math.max(0, Math.floor(top / rowHeight) - 6)
  const end = Math.min(items.length, Math.ceil((top + height) / rowHeight) + 6)
  return (
    <div ref={ref} className={className} onScroll={(e) => setTop(e.currentTarget.scrollTop)}>
      <div style={{ height: items.length * rowHeight, position: 'relative' }}>
        {items.slice(start, end).map((it, i) => (
          <div key={start + i} style={{ position: 'absolute', top: (start + i) * rowHeight, height: rowHeight, left: 0, right: 0 }}>
            {render(it, start + i)}
          </div>
        ))}
      </div>
    </div>
  )
}
