// Gera o favicon EB e as imagens de compartilhamento. Uso: npm run brand
// Precisa do Chrome instalado e de internet (fontes do Google) e dos heros em public/work.
import fs from 'node:fs'
import { chromium } from 'playwright-core'
import sharp from 'sharp'
import { projects } from '../src/content/pt.ts'
import { site } from '../src/content/site.ts'

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const INK = '#0f0e0c'
const BONE = '#e9e3d6'
const SIGNAL = '#e9502a'
const HOST = new URL('https://eduardobaptistella.vercel.app').host

// Letras desenhadas na grade de 32 px, e não texto: o SVG não depende de fonte e fica nítido em 16 px.
const E = 'M5 7h10v4H9v3h5v4H9v3h6v4H5z'
const B = 'M17 7h6c2.600 0 4 1.600 4 4 0 1.900-.8 3.400-2.100 4.600 1.700.8 2.600 2.400 2.600 4.400 0 3-1.900 5-4.500 5h-6zM21 10.600v3.200h1.600c.8 0 1-.8 1-1.600 0-1-.4-1.600-1.200-1.600zM21 17.600v3.800h1.800c.8 0 1.200-.8 1.200-1.900s-.4-1.900-1.200-1.900z'
const mark = (radius) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="${radius}" fill="${INK}"/><path fill="${BONE}" d="${E}"/><path fill="${SIGNAL}" fill-rule="evenodd" d="${B}"/></svg>\n`

const png = (size, radius) => sharp(Buffer.from(mark(radius)), { density: 72 * size / 32 }).resize(size, size).png().toBuffer()

// ICO aceita PNG dentro: cabeçalho de 6 bytes e 16 por imagem.
function ico(images) {
  const head = Buffer.alloc(6 + 16 * images.length)
  head.writeUInt16LE(1, 2)
  head.writeUInt16LE(images.length, 4)
  let offset = head.length
  images.forEach(({ size, data }, i) => {
    const at = 6 + 16 * i
    head[at] = size
    head[at + 1] = size
    head.writeUInt16LE(1, at + 4)
    head.writeUInt16LE(32, at + 6)
    head.writeUInt32LE(data.length, at + 8)
    head.writeUInt32LE(offset, at + 12)
    offset += data.length
  })
  return Buffer.concat([head, ...images.map((i) => i.data)])
}

fs.writeFileSync('src/app/icon.svg', mark(6))
fs.writeFileSync('src/app/apple-icon.png', await png(180, 0))
const sizes = [16, 32, 48]
fs.writeFileSync('src/app/favicon.ico', ico(await Promise.all(sizes.map(async (size) => ({ size, data: await png(size, 6) })))))

const shell = (bg, fg, body) => `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Martian+Mono:wdth,wght@75..112.5,100..800&display=swap">
<style>
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;overflow:hidden;background:${bg};color:${fg};font-family:Archivo,sans-serif}
.mono{font:500 17px/1.3 'Martian Mono',monospace;font-stretch:87.5%;letter-spacing:.02em}
.logo{width:56px;height:56px;display:block}
.bar{position:absolute;left:48px;right:48px;display:flex;align-items:center;justify-content:space-between;gap:32px}
.fit{display:block;width:max-content;white-space:nowrap;font-weight:900;font-stretch:75%;line-height:1;transform-origin:0 0}
</style>${body}`

const fit = (page, width, max) => page.evaluate(([width, max]) => {
  for (const el of document.querySelectorAll('.fit')) {
    el.style.fontSize = '100px'
    el.style.fontSize = `${Math.min(max, 100 * width / el.getBoundingClientRect().width)}px`
  }
}, [width, max])

const home = shell(INK, BONE, `
<div class="bar" style="top:40px"><img class="logo" src="data:image/svg+xml;base64,${Buffer.from(mark(6)).toString('base64')}" alt=""><span class="mono">${HOST}</span></div>
<div style="position:absolute;left:48px;top:122px">
  <span class="fit" style="font-stretch:112%">TUDO AQUI</span>
  <span class="fit" style="font-stretch:112%;margin-top:22px">ESTÁ NO AR<i style="display:inline-block;width:.2em;height:.2em;margin-left:.07em;border-radius:50%;background:${SIGNAL}"></i></span>
</div>
<div class="bar" style="bottom:36px"><span style="font-size:26px;font-weight:600">${site.name}</span><span class="mono">${site.role}</span></div>`)

const work = (p) => {
  const hero = fs.readFileSync(`public/work/${p.slug}/hero.webp`).toString('base64')
  return shell(p.scene.bg, p.scene.fg, `
<div class="bar" style="top:40px"><img class="logo" src="data:image/svg+xml;base64,${Buffer.from(mark(6)).toString('base64')}" alt=""><span class="mono">${site.name}</span></div>
<div style="position:absolute;left:48px;top:118px"><span class="fit">${p.name}</span></div>
<img src="data:image/webp;base64,${hero}" alt="" style="position:absolute;left:48px;top:250px;width:1104px;height:auto;display:block">`)
}

const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
const shoot = async (html, name, max) => {
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await fit(page, 1104, max)
  const shot = await page.screenshot({ type: 'png' })
  await sharp(shot).jpeg({ quality: 84, mozjpeg: true }).toFile(`public/og/${name}.jpg`)
}
fs.mkdirSync('public/og', { recursive: true })
await shoot(home, 'home', 400)
for (const p of projects) await shoot(work(p), p.slug, 118)
await browser.close()
console.log(`ok: favicon e ${projects.length + 1} imagens em public/og`)
