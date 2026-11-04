'use client'

import { useEffect, useRef } from 'react'
import { loadGsap } from '@/lib/gsap'

/** Rótulo contextual que acompanha o ponteiro. O cursor do sistema continua visível. */
export function Cue() {
  const root = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  const img = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el || !matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return
    let gsap: Awaited<ReturnType<typeof loadGsap>>['gsap'] | null = null
    let x: (v: number) => void = () => {}
    let y: (v: number) => void = () => {}
    loadGsap().then((m) => {
      gsap = m.gsap
      x = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3' })
      y = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3' })
    })
    let active: Element | null = null

    const move = (e: PointerEvent) => {
      if (!gsap) return
      const target = (e.target as Element | null)?.closest?.('[data-cue]') ?? null
      const flip = e.clientX > innerWidth - 380
      x(flip ? e.clientX - 356 : e.clientX + 16)
      y(e.clientY + 16)
      if (target === active) return
      active = target
      if (!target) return void gsap.to(el, { opacity: 0, duration: 0.2 })
      label.current!.textContent = target.getAttribute('data-cue')
      const preview = target.getAttribute('data-preview')
      el.dataset.preview = String(Boolean(preview))
      if (preview) img.current!.src = preview
      gsap.to(el, { opacity: 1, duration: 0.2 })
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])

  return (
    <div className="cue" ref={root} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="cue__img" ref={img} alt="" />
      <span className="cue__label mono" ref={label} />
    </div>
  )
}
