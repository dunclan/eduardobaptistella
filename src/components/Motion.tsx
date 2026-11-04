'use client'

import type Lenis from 'lenis'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type ComponentProps, type MouseEvent } from 'react'
import { loadGsap } from '@/lib/gsap'

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const afterPaint = (fn: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 400))

let lenis: Lenis | null = null
let playCut: ((go: () => void) => void) | null = null

/** Rola até um ponto respeitando a rolagem suave, quando ativa. */
export const scrollToY = (y: number) => {
  if (lenis) lenis.scrollTo(y, { duration: 0.9 })
  else window.scrollTo({ top: y, behavior: reduced() ? 'instant' : 'smooth' })
}

const toTop = () => {
  scrollToY(0)
  document.getElementById('conteudo')?.focus({ preventScroll: true })
}

/** Aparece depois da primeira tela, em todas as páginas. A sentinela evita ouvir o scroll. */
function BackToTop() {
  const sentinel = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting))
    io.observe(sentinel.current!)
    return () => io.disconnect()
  }, [])
  return (
    <>
      <div className="totop__sentinel" ref={sentinel} aria-hidden="true" />
      <button type="button" className="totop" data-show={show} onClick={toTop} aria-label="Voltar ao topo">↑</button>
    </>
  )
}

/** Link interno com o corte de página. Mantém o comportamento nativo de abrir em nova aba. */
export function TLink({ href, onClick, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const [path, hash] = href.split('#')
    if ((path || pathname) === pathname) {
      if (hash) {
        const el = document.getElementById(hash)
        if (el) { e.preventDefault(); scrollToY(el.getBoundingClientRect().top + window.scrollY); el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }) }
      } else {
        // O "EB" na própria página também volta ao topo.
        e.preventDefault()
        toTop()
      }
      return
    }
    if (!playCut) return // GSAP ainda não carregou: navegação comum.
    e.preventDefault()
    playCut(() => router.push(href))
  }
  return <Link href={href} onClick={handle} {...rest} />
}

/** Rolagem suave, cabeçalho e placa de transição. Montado uma vez no layout. */
export function Motion() {
  const pathname = usePathname()
  const shutter = useRef<HTMLDivElement>(null)
  const pending = useRef<object | null>(null)
  const first = useRef(true)
  const uncover = useRef<() => void>(() => {})
  const refresh = useRef<() => void>(() => {})

  useEffect(() => {
    let dead = false
    const cleanups: (() => void)[] = []
    afterPaint(async () => {
      if (dead) return
      const { gsap, ScrollTrigger } = await loadGsap()
      if (dead) return
      refresh.current = () => ScrollTrigger.refresh()

      const header = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => document.documentElement.toggleAttribute('data-top-hidden', self.direction > 0 && self.scroll() > 120),
      })
      cleanups.push(() => { header.kill(); document.documentElement.removeAttribute('data-top-hidden') })

      const el = shutter.current!
      const plates = el.querySelectorAll('i')
      const line = el.querySelector('b')
      uncover.current = () => {
        pending.current = null
        gsap.timeline({ onComplete: () => { gsap.set(el, { visibility: 'hidden', pointerEvents: 'none' }); lenis?.start() } })
          .set(plates, { transformOrigin: 'right' })
          .set(line, { transformOrigin: 'right' })
          .to(plates, { scaleX: 0, duration: 0.55, ease: 'expo.inOut', stagger: 0.025 })
          .to(line, { scaleX: 0, duration: 0.3, ease: 'power3.inOut' }, 0.1)
      }
      playCut = (go) => {
        if (reduced()) return go()
        lenis?.stop()
        const tl = gsap.timeline()
        tl.set(el, { visibility: 'visible', pointerEvents: 'auto' })
          .set(plates, { scaleX: 0, transformOrigin: 'left' })
          .set(line, { scaleX: 0, transformOrigin: 'left' })
          .to(line, { scaleX: 1, duration: 0.28, ease: 'power3.inOut' })
          .to(plates, { scaleX: 1, duration: 0.42, ease: 'expo.inOut', stagger: 0.025 }, 0.04)
          .call(go)
        pending.current = tl
        // Rede lenta: a placa nunca prende a página.
        window.setTimeout(() => { if (pending.current === tl) uncover.current() }, 4000)
      }
      cleanups.push(() => { playCut = null })

      if (!reduced() && matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const { default: LenisClass } = await import('lenis')
        if (dead) return
        const instance = new LenisClass({ lerp: 0.11 })
        lenis = instance
        instance.on('scroll', ScrollTrigger.update)
        const tick = (time: number) => instance.raf(time * 1000)
        gsap.ticker.add(tick)
        gsap.ticker.lagSmoothing(0)
        cleanups.push(() => { gsap.ticker.remove(tick); instance.destroy(); lenis = null })
      }
    })
    return () => { dead = true; cleanups.forEach((fn) => fn()) }
  }, [])

  // Sobre a seção de contato, o cabeçalho deixa o modo de diferença e fica legível.
  useEffect(() => {
    const contact = document.querySelector('.contact')
    if (!contact) return
    const io = new IntersectionObserver(([e]) => document.documentElement.toggleAttribute('data-on-signal', e.isIntersecting), { rootMargin: '0px 0px -95% 0px' })
    io.observe(contact)
    return () => { io.disconnect(); document.documentElement.removeAttribute('data-on-signal') }
  }, [pathname])

  useEffect(() => {
    if (first.current) { first.current = false; return }
    document.documentElement.removeAttribute('data-top-hidden')
    if (!location.hash) { lenis?.scrollTo(0, { immediate: true, force: true }); window.scrollTo(0, 0) }
    refresh.current()
    if (pending.current) uncover.current()
  }, [pathname])

  return (
    <>
      <BackToTop />
      <div className="shutter" ref={shutter} aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((n) => <i key={n} />)}
        <b />
      </div>
    </>
  )
}
