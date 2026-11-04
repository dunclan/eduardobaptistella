'use client'

import { useEffect, useRef } from 'react'
import type { Ui } from '@/content/types'
import { site } from '@/content/site'
import { StatusSummary } from './Status'

const LINES = [['TUDO', 'AQUI'], ['ESTÁ', 'NO AR']]
const BASE = 74
const RANGE = 58
const MIN = 62
const MAX = 125

export function Hero({ copy }: { copy: Ui['hero'] }) {
  const title = useRef<HTMLHeadingElement>(null)

  // A largura das letras responde à distância do cursor, mantendo a largura total da linha.
  useEffect(() => {
    const el = title.current
    if (!el || !matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return
    const lines = [...el.querySelectorAll<HTMLElement>('.hero__ln')].map((ln) => [...ln.querySelectorAll<HTMLElement>('.hero__ch')])
    const chars = lines.flat()
    const centers = new Map<HTMLElement, { x: number; y: number }>()
    const current = new Map(chars.map((c) => [c, BASE]))
    let pointer: { x: number; y: number } | null = null
    let frame = 0

    const measure = () => {
      for (const c of chars) {
        const r = c.getBoundingClientRect()
        centers.set(c, { x: r.left + r.width / 2, y: r.top + r.height / 2 })
      }
    }
    const step = () => {
      frame = 0
      let moving = false
      for (const line of lines) {
        const influence = line.map((c) => {
          if (!pointer) return 0
          const p = centers.get(c)!
          const d = Math.hypot((pointer.x - p.x) / innerWidth, (pointer.y - p.y) / (innerWidth * 0.9))
          return Math.exp(-(d * d) / 0.016)
        })
        const mean = influence.reduce((a, b) => a + b, 0) / line.length
        line.forEach((c, i) => {
          const target = Math.min(MAX, Math.max(MIN, BASE + RANGE * (influence[i] - mean)))
          const now = current.get(c)!
          const next = now + (target - now) * 0.14
          if (Math.abs(next - now) > 0.04) moving = true
          current.set(c, next)
          c.style.fontVariationSettings = `'wdth' ${next.toFixed(1)}`
        })
      }
      if (moving) frame = requestAnimationFrame(step)
    }
    const request = () => { if (!frame) frame = requestAnimationFrame(step) }
    const onMove = (e: PointerEvent) => { pointer = { x: e.clientX, y: e.clientY }; request() }
    const onLeave = () => { pointer = null; request() }
    const hero = el.closest('.hero') as HTMLElement
    const start = window.setTimeout(measure, 1300)
    hero.addEventListener('pointermove', onMove, { passive: true })
    hero.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', measure, { passive: true })
    window.addEventListener('scroll', measure, { passive: true })
    return () => {
      window.clearTimeout(start)
      cancelAnimationFrame(frame)
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
    }
  }, [])

  let order = 0
  return (
    <section className="hero">
      <h1 className="hero__title" ref={title} aria-label={copy.aria}>
        {LINES.map((words, l) => (
          <span className="hero__ln" key={l} aria-hidden="true">
            {words.map((word, w) => (
              <span className="hero__wrap" key={word}>
                <span className="hero__w" data-w={word === 'NO AR' ? 'noar' : word === 'TUDO' ? 'tudo' : word === 'AQUI' ? 'aqui' : 'esta'}>
                  <span className="hero__rise" style={{ '--i': order++ } as React.CSSProperties}>
                    {[...word].map((ch, c) => (
                      <span className="hero__ch" key={c}>{ch === ' ' ? ' ' : ch}</span>
                    ))}
                    {word === 'NO AR' && <span className="hero__dot" />}
                  </span>
                </span>
                {w === 0 && ' '}
              </span>
            ))}
          </span>
        ))}
      </h1>
      <div className="hero__foot">
        <p className="hero__who mono">
          <strong>{site.name}</strong>
          <span>{copy.role}</span>
        </p>
        <p className="hero__line">{copy.line}</p>
        <div className="hero__cta">
          <a className="ul" href="#trabalho">{copy.ctaWork} ↓</a>
          <a className="ul" href="#contato">{copy.ctaContact} →</a>
          <div className="hero__status"><StatusSummary /></div>
        </div>
      </div>
    </section>
  )
}
