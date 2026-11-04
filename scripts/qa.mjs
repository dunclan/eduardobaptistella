// QA de ponta a ponta. Uso: QA_URL=http://localhost:3211 npm run qa
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'
import { chromium } from 'playwright-core'
import { archive, projects } from '../src/content/pt.ts'

const BASE = process.env.QA_URL ?? 'http://localhost:3211'
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const routes = ['/', ...projects.map((p) => `/trabalho/${p.slug}`), '/rota-que-nao-existe']
const shapes = {
  desktop: { viewport: { width: 1440, height: 900 } },
  mobile: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
}
const failures = []
const fail = (msg) => { failures.push(msg); console.log(`  FALHA ${msg}`) }

const browser = await chromium.launch({ executablePath: CHROME, args: ['--ignore-gpu-blocklist'] })

for (const [shape, opts] of Object.entries(shapes)) {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const ctx = await browser.newContext({ ...opts, reducedMotion })
    for (const route of routes) {
      const page = await ctx.newPage()
      const errors = []
      page.on('pageerror', (e) => errors.push(String(e).slice(0, 140)))
      page.on('console', (m) => { if (m.type() === 'error' && !(route.includes('nao-existe') && m.text().includes('404'))) errors.push(m.text().slice(0, 140)) })
      const res = await page.goto(BASE + route, { waitUntil: 'load' })
      await page.waitForTimeout(1200)
      const label = `${shape}/${reducedMotion} ${route}`
      if (res.status() !== (route.includes('nao-existe') ? 404 : 200)) fail(`${label}: HTTP ${res.status()}`)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      if (overflow > 0) fail(`${label}: overflow horizontal de ${overflow}px`)
      const clipped = await page.evaluate(() => [...document.querySelectorAll('h1, .next__name, .slate__title, .contact__big')].filter((el) => {
        const r = document.createRange(); r.selectNodeContents(el)
        return r.getBoundingClientRect().right > innerWidth + 1
      }).map((el) => el.textContent.slice(0, 30)))
      if (clipped.length) fail(`${label}: título cortado: ${clipped.join(', ')}`)
      if (errors.length) fail(`${label}: console: ${errors.join(' | ')}`)
      if (reducedMotion === 'no-preference') {
        // A cor nos estados de animação inicial não representa o estado final.
        await page.waitForTimeout(1200)
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
        for (const v of axe.violations) fail(`${label}: axe ${v.id} (${v.nodes.length}) ${v.nodes[0].target.join(' ')}`)
      }
      await page.close()
    }
    await ctx.close()
    console.log(`ok ${shape}/${reducedMotion}`)
  }
}

// Palco, teclado e transição de página.
{
  const ctx = await browser.newContext(shapes.desktop)
  const page = await ctx.newPage()
  await page.goto(BASE, { waitUntil: 'load' })
  await page.waitForTimeout(1500)
  const live = await page.evaluate(() => document.querySelector('.stage').classList.contains('is-live'))
  if (!live) fail('palco WebGL não ativou no desktop')
  const metrics = await page.evaluate(async () => {
    const el = document.querySelector('.stage__track')
    const top = el.getBoundingClientRect().top + scrollY
    const span = el.offsetHeight - innerHeight
    const seen = new Set()
    for (let i = 0; i <= 60; i++) {
      scrollTo({ top: top + (span * i) / 60, behavior: 'instant' })
      await new Promise((r) => requestAnimationFrame(r))
      seen.add(document.querySelector('.slate[data-active="true"] .slate__title')?.textContent)
    }
    return [...seen]
  })
  if (metrics.length !== projects.length) fail(`palco percorreu ${metrics.length} de ${projects.length}: ${metrics}`)
  console.log('palco:', metrics.join(' > '))

  await page.evaluate(() => { const el = document.querySelector('.stage__track'); scrollTo({ top: el.getBoundingClientRect().top + scrollY + 40, behavior: 'instant' }) })
  await page.waitForTimeout(700)
  await page.mouse.move(900, 400)
  await page.waitForTimeout(250)
  const cue = await page.evaluate(() => ({ text: document.querySelector('.cue__label').textContent, opacity: getComputedStyle(document.querySelector('.cue')).opacity }))
  if (cue.text !== 'Abrir estudo' || Number(cue.opacity) < 0.5) fail(`rótulo contextual incorreto: ${JSON.stringify(cue)}`)
  await page.mouse.click(900, 400)
  await page.waitForURL(/\/trabalho\/insunia/, { timeout: 8000 }).catch(() => fail('clique no palco não abriu o estudo'))
  await page.waitForTimeout(1800)
  const shutter = await page.evaluate(() => getComputedStyle(document.querySelector('.shutter')).visibility)
  if (shutter !== 'hidden') fail(`placa de transição presa: ${shutter}`)
  await page.goBack()
  await page.waitForTimeout(1500)
  if (!new URL(page.url()).pathname.endsWith('/')) fail('voltar não retornou à home')

  // Voltar ao topo: some no início, aparece depois da primeira tela e sobe de verdade.
  await page.goto(BASE, { waitUntil: 'load' })
  await page.waitForTimeout(1500)
  const visible = () => page.evaluate(() => getComputedStyle(document.querySelector('.totop')).visibility === 'visible')
  if (await visible()) fail('botão de topo visível no início da página')
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
  await page.waitForTimeout(700)
  if (!(await visible())) fail('botão de topo não apareceu no fim da página')
  await page.click('.totop')
  await page.waitForTimeout(1600)
  const y = await page.evaluate(() => scrollY)
  if (y > 2) fail(`botão de topo parou em y=${y}`)

  await page.goto(BASE, { waitUntil: 'load' })
  await page.keyboard.press('Tab')
  const skip = await page.evaluate(() => document.activeElement?.className)
  if (skip !== 'skip') fail(`primeiro Tab não foi para o link de pular: ${skip}`)

  await page.goto(BASE, { waitUntil: 'load' })
  await page.waitForTimeout(1600)
  await page.mouse.move(300, 250)
  await page.waitForTimeout(500)
  const wdth = await page.evaluate(() => [...document.querySelectorAll('.hero__ch')].map((c) => c.style.fontVariationSettings).filter(Boolean).length)
  if (!wdth) fail('manchete não respondeu ao cursor')

  const status = await page.request.get(`${BASE}/api/status`)
  const codes = await status.json()
  for (const [id, code] of Object.entries(codes)) if (code < 200 || code >= 400) fail(`link fora do ar: ${id} = ${code}`)
  console.log('status:', Object.entries(codes).map(([k, v]) => `${k}=${v}`).join(' '))
  await ctx.close()
}

await browser.close()

// Links externos respondem sem login (sem redirecionar para a Vercel).
for (const item of [...projects, ...archive]) {
  const res = await fetch(item.url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0' } })
  if (!res.ok || /vercel\.com\/login|\/sso-api/.test(res.url)) fail(`${item.url}: ${res.status} ${res.url}`)
}

fs.mkdirSync('qa-output', { recursive: true })
fs.writeFileSync('qa-output/last.json', JSON.stringify({ at: new Date().toISOString(), failures }, null, 1))
console.log(failures.length ? `\n${failures.length} FALHA(S)` : '\nQA OK: nenhuma falha')
process.exit(failures.length ? 1 : 0)
