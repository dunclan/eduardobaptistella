'use client'

import { useEffect, useRef } from 'react'
import type { Project, Ui } from '@/content/types'
import { loadGsap } from '@/lib/gsap'
import { scrollToY, TLink } from './Motion'
import { Status } from './Status'

const VERT = `attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}`
// Corte de canal: cada linha horizontal rasga e troca de imagem no seu próprio tempo.
const FRAG = `precision highp float;
varying vec2 v;uniform sampler2D ta,tb;uniform vec2 sa,sb,res,m;uniform float t;
float rnd(float x){return fract(sin(x*91.17)*43758.5453);}
vec2 cover(vec2 uv,vec2 s){float r=res.x/res.y,i=s.x/s.y;vec2 k=r>i?vec2(1.,i/r):vec2(r/i,1.);return vec2((uv.x-.5)*k.x+.5,1.-(1.-uv.y)*k.y);}
void main(){
  float row=floor(v.y*34.);float n=rnd(row+1.);
  float e=smoothstep(n*.5,n*.5+.5,t);
  float wave=sin(e*3.14159);
  float tear=wave*(n-.5)*.42;
  vec2 d=m*.006;
  vec3 a=texture2D(ta,cover(clamp(v+vec2(tear,0.)+d,0.,1.),sa)).rgb;
  vec3 b=texture2D(tb,cover(clamp(v+vec2(tear*.7,0.)+d,0.,1.),sb)).rgb;
  vec3 c=mix(a,b,smoothstep(.42,.58,e));
  c=mix(c,vec3(.914,.314,.165),wave*step(.9,n)*.8);
  gl_FragColor=vec4(c,1.);
}`

type Tex = { tex: WebGLTexture; w: number; h: number }
const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t) }

function createScene(canvas: HTMLCanvasElement, urls: string[], onReady: () => void) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
  if (!gl) return null
  const shader = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s }
  const prog = gl.createProgram()!
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  gl.useProgram(prog)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.bindAttribLocation(prog, 0, 'p')
  gl.linkProgram(prog)
  gl.useProgram(prog)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  const u = (n: string) => gl.getUniformLocation(prog, n)
  const loc = { ta: u('ta'), tb: u('tb'), sa: u('sa'), sb: u('sb'), res: u('res'), m: u('m'), t: u('t') }
  gl.uniform1i(loc.ta, 0)
  gl.uniform1i(loc.tb, 1)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

  const textures = new Map<number, Tex>()
  const loading = new Set<number>()
  let state = { index: 0, mix: 0, mx: 0, my: 0 }

  const draw = () => {
    const a = textures.get(state.index)
    const b = textures.get(state.index + 1) ?? a
    if (!a || !b) return
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, a.tex)
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, b.tex)
    gl.uniform2f(loc.sa, a.w, a.h)
    gl.uniform2f(loc.sb, b.w, b.h)
    gl.uniform1f(loc.t, textures.has(state.index + 1) ? state.mix : 0)
    gl.uniform2f(loc.m, state.mx, state.my)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
  const load = (i: number) => {
    if (i < 0 || i >= urls.length || textures.has(i) || loading.has(i)) return
    loading.add(i)
    const img = new Image()
    img.onload = () => {
      const tex = gl.createTexture()!
      gl.activeTexture(gl.TEXTURE2)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
      textures.set(i, { tex, w: img.naturalWidth, h: img.naturalHeight })
      if (i === 0) onReady()
      draw()
    }
    img.src = urls[i]
  }
  const resize = () => {
    const r = canvas.getBoundingClientRect()
    const dpr = Math.min(devicePixelRatio, 1.5)
    canvas.width = Math.max(1, Math.round(r.width * dpr))
    canvas.height = Math.max(1, Math.round(r.height * dpr))
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(loc.res, canvas.width, canvas.height)
    draw()
  }
  return {
    gl, load, resize, draw,
    set(next: Partial<typeof state>) { state = { ...state, ...next }; draw() },
    destroy() { gl.getExtension('WEBGL_lose_context')?.loseContext() },
  }
}

export function Stage({ projects, copy }: { projects: Project[]; copy: Ui['stage'] }) {
  const section = useRef<HTMLElement>(null)
  const n = projects.length

  useEffect(() => {
    const root = section.current
    if (!root) return
    const query = '(min-width: 900px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)'
    let revert = () => {}
    let started = false
    let dead = false
    const start = async () => {
      if (started) return
      started = true
      const { gsap, ScrollTrigger } = await loadGsap()
      if (dead) return
      const mm = gsap.matchMedia()
      revert = () => mm.revert()
      mm.add(query, () => {
      // Um canvas novo a cada montagem: um contexto perdido não volta.
      const canvas = document.createElement('canvas')
      root.querySelector('.stage__media')!.appendChild(canvas)
      const poster = root.querySelector<HTMLImageElement>('.stage__media img')
      const scene = createScene(canvas, projects.map((p) => `/work/${p.slug}/stage.webp`), () => { if (poster) poster.style.visibility = 'hidden' })
      if (!scene) { canvas.remove(); return }
      root.classList.add('is-live')
      scene.resize()
      scene.load(0); scene.load(1)

      const track = root.querySelector<HTMLElement>('.stage__track')!
      const slates = [...root.querySelectorAll<HTMLElement>('.slate')]
      const parts = slates.map((s) => ({
        s,
        masks: [...s.querySelectorAll<HTMLElement>('.slate__mask > span')],
        fades: [...s.querySelectorAll<HTMLElement>('.slate__fade')],
      }))
      const ticks = [...root.querySelectorAll<HTMLElement>('.stage__tick i')]
      const counter = root.querySelector<HTMLElement>('.stage__count')
      let last = -1

      const render = (f: number) => {
        const index = Math.min(n - 1, Math.floor(f))
        const t = f - index
        const e = smooth((t - 0.48) / 0.42) // segura o trabalho e troca no fim do trecho
        scene.load(index); scene.load(index + 1)
        scene.set({ index, mix: e })
        const active = e > 0.5 ? Math.min(n - 1, index + 1) : index
        parts.forEach(({ s, masks, fades }, i) => {
          const near = i === index || (i === index + 1 && e > 0)
          s.style.visibility = near ? 'visible' : 'hidden'
          if (!near) return
          const y = i === index ? -135 * smooth(e * 1.25) : 135 * (1 - smooth((e - 0.2) * 1.25))
          const line = i === index ? 1 - smooth(e * 2.4) : smooth((e - 0.55) * 2.4)
          masks.forEach((m) => { m.style.transform = `translateY(${y.toFixed(2)}%)` })
          fades.forEach((m) => { m.style.opacity = line.toFixed(3) })
        })
        if (active !== last) {
          last = active
          slates.forEach((s, i) => s.setAttribute('data-active', String(i === active)))
          scene.load(active + 1); scene.load(active + 2); scene.load(active - 1)
          if (counter) counter.textContent = `${String(active + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`
        }
        ticks.forEach((tick, i) => {
          tick.style.transform = `scaleX(${Math.min(1, Math.max(0, f - i + 1)).toFixed(3)})`
        })
      }
      render(0)

      const trigger = ScrollTrigger.create({
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => render(self.progress * (n - 1)),
        onRefresh: (self) => { scene.resize(); render(self.progress * (n - 1)) },
      })

      // Teclado: focar um trabalho leva até ele.
      const focus = (e: FocusEvent) => {
        const slate = (e.target as Element).closest<HTMLElement>('.slate')
        if (!slate) return
        const i = slates.indexOf(slate)
        scrollToY(trigger.start + ((trigger.end - trigger.start) * i) / (n - 1))
      }
      root.addEventListener('focusin', focus)

      const onMove = (e: PointerEvent) => scene.set({ mx: (e.clientX / innerWidth - 0.5) * 2, my: (e.clientY / innerHeight - 0.5) * 2 })
      const media = root.querySelector<HTMLElement>('.stage__sticky')!
      media.addEventListener('pointermove', onMove, { passive: true })
      const onLost = () => { root.classList.remove('is-live') }
      canvas.addEventListener('webglcontextlost', onLost)
      ScrollTrigger.refresh()

      return () => {
        trigger.kill()
        root.removeEventListener('focusin', focus)
        media.removeEventListener('pointermove', onMove)
        canvas.removeEventListener('webglcontextlost', onLost)
        root.classList.remove('is-live')
        parts.forEach(({ s, masks, fades }) => {
          s.style.removeProperty('visibility'); s.removeAttribute('data-active')
          masks.forEach((m) => m.style.removeProperty('transform'))
          fades.forEach((m) => m.style.removeProperty('opacity'))
        })
        if (poster) poster.style.removeProperty('visibility')
        scene.destroy()
        canvas.remove()
      }
      })
    }
    // O celular nunca baixa GSAP por causa do palco.
    const media = matchMedia(query)
    const onChange = () => { if (media.matches) start() }
    media.addEventListener('change', onChange)
    onChange()
    return () => { dead = true; media.removeEventListener('change', onChange); revert() }
  }, [projects, n])

  return (
    <section className="stage" id="trabalho" ref={section} style={{ '--n': n } as React.CSSProperties}>
      <header className="stage__intro">
        <p className="mono">{copy.kicker}</p>
        <h2>{copy.title}</h2>
        <p className="stage__note">{copy.note}</p>
      </header>
      <div className="stage__track">
        <div className="stage__sticky">
          <div className="stage__media" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/work/${projects[0].slug}/stage.webp`} alt="" loading="lazy" />
          </div>
          {projects.map((p, i) => (
            <article
              className="slate"
              key={p.slug}
              data-cue={copy.open}
              style={{ '--scene-bg': p.scene.bg, '--scene-fg': p.scene.fg, '--scene-muted': p.scene.muted, '--scene-accent': p.scene.accent } as React.CSSProperties}
            >
              <div className="slate__meta mono slate__fade">
                <span>{String(i + 1).padStart(2, '0')} · {p.category}</span>
                <Status id={p.slug} prelaunch={p.status === 'prelaunch'} />
              </div>
              <div className="slate__shot">
                <picture>
                  <source media="(min-width: 900px)" srcSet={`/work/${p.slug}/stage.webp`} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/work/${p.slug}/m1.webp`} alt={p.heroAlt} loading="lazy" decoding="async" />
                </picture>
              </div>
              <div className="slate__heading">
                <h3 className="slate__title">
                  {p.titleLines.map((line) => (
                    <span className="slate__mask" key={line}><span>{line}</span>{' '}</span>
                  ))}
                </h3>
              </div>
              <div className="slate__body slate__fade">
                <p className="slate__summary">{p.summary}</p>
                <TLink className="slate__link ul" href={`/trabalho/${p.slug}`} aria-label={`${copy.open}: ${p.name}`}>
                  {copy.open} →
                </TLink>
              </div>
            </article>
          ))}
          <div className="stage__rail mono" aria-hidden="true">
            <span className="stage__count" style={{ marginRight: 12 }}>01 / {String(n).padStart(2, '0')}</span>
            {projects.map((p) => <span className="stage__tick" key={p.slug}><i /></span>)}
          </div>
        </div>
      </div>
    </section>
  )
}
