// Converte as capturas brutas (_captures, fora do Git) para public/work.
// Para adicionar um projeto: acrescente uma entrada em SOURCES e rode `npm run images`.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const CLEAN = '_captures/clean'
const RAW = '_captures'
const c = (slug, frame) => `${CLEAN}/${slug}/${frame}.jpg`
const SOURCES = {
  insunia: { hero: c('insunia', 'd00'), a: c('insunia', 'd02'), b: c('insunia', 'd03'), c: c('insunia', 'd05'), d: c('insunia', 'd09'), m1: c('insunia', 'm00'), m2: c('insunia', 'm01'), m3: c('insunia', 'm03') },
  'sport-container': { hero: c('sport-container', 'd00'), a: c('sport-container', 'd02'), b: c('sport-container', 'd04'), c: c('sport-container', 'd01'), d: c('sport-container', 'd08'), m1: c('sport-container', 'm00'), m2: c('sport-container', 'm01'), m3: c('sport-container', 'm03') },
  'guia-capivari': { hero: c('guia', 'd00'), a: c('guia', 'd02'), b: c('guia', 'd03'), c: c('guia', 'd01'), d: c('guia', 'd04'), m1: c('guia', 'm00'), m2: c('guia', 'm02'), m3: c('guia', 'm03') },
  'smart-hub': { hero: c('smarthub', 'd00'), a: c('smarthub', 'd01'), b: c('smarthub', 'd03'), c: c('smarthub', 'd06'), d: c('smarthub', 'd07'), m1: c('smarthub', 'm00'), m2: c('smarthub', 'm01'), m3: c('smarthub', 'm02') },
  'armazem-capivari': { hero: c('armazem', 'd00'), a: c('armazem', 'd03'), b: c('armazem', 'd05'), c: c('armazem', 'd08'), d: c('armazem', 'd09'), m1: c('armazem', 'm00'), m2: c('armazem', 'm01'), m3: c('armazem', 'm03') },
  'camila-tobaldini': { hero: `${RAW}/camila/desktop/00.jpg`, a: c('camila', 'd03'), b: c('camila', 'd06'), c: c('camila', 'd04'), d: c('camila', 'd05'), m1: `${RAW}/camila/mobile/00.jpg`, m2: c('camila', 'm02'), m3: c('camila', 'm03') },
  'vacation-hub': { hero: c('vacation-hub', 'd00'), a: c('vacation-hub', 'd01'), b: c('vacation-hub', 'd02'), c: c('vacation-hub', 'd03'), d: c('vacation-hub', 'd09'), m1: c('vacation-hub', 'm00'), m2: c('vacation-hub', 'm01'), m3: c('vacation-hub', 'm02') },
}
const ARCHIVE = { tecside: 'tecside', rox: 'rox', joseantonio: 'joseantonio', 'primeira-classe': 'primeira-classe', marina: 'marina', inkk: 'inkk' }

const manifest = {}
for (const [slug, frames] of Object.entries(SOURCES)) {
  const dir = path.join('public/work', slug)
  fs.mkdirSync(dir, { recursive: true })
  manifest[slug] = {}
  for (const [name, src] of Object.entries(frames)) {
    if (!fs.existsSync(src)) throw new Error(`captura ausente: ${src}`)
    const out = path.join(dir, `${name}.webp`)
    const info = await sharp(src).resize({ width: name.startsWith('m') ? 780 : 2000, withoutEnlargement: true }).webp({ quality: 78, effort: 5 }).toFile(out)
    manifest[slug][name] = { width: info.width, height: info.height }
  }
  await sharp(frames.hero).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 72, effort: 5 }).toFile(path.join(dir, 'stage.webp'))
}
fs.mkdirSync('public/work/arquivo', { recursive: true })
for (const [id, folder] of Object.entries(ARCHIVE)) {
  await sharp(`${RAW}/${folder}/desktop/00.jpg`).resize({ width: 720 }).webp({ quality: 72 }).toFile(`public/work/arquivo/${id}.webp`)
}
fs.writeFileSync('src/content/image-sizes.json', JSON.stringify(manifest, null, 1) + '\n')
const total = fs.readdirSync('public/work', { recursive: true }).filter((f) => f.endsWith('.webp')).reduce((s, f) => s + fs.statSync(path.join('public/work', f)).size, 0)
console.log(`ok: ${(total / 1048576).toFixed(1)} MB em public/work`)
