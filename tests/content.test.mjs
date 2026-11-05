import assert from 'node:assert/strict'
import fs from 'node:fs'
import { test } from 'node:test'
import sharp from 'sharp'
import { archive, disciplines, projects } from '../src/content/pt.ts'

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

test('slugs únicos e URLs https', () => {
  assert.equal(new Set(projects.map((p) => p.slug)).size, projects.length)
  for (const item of [...projects, ...archive]) assert.match(item.url, /^https:\/\//)
})

test('todo projeto tem imagens em disco e texto completo', () => {
  for (const p of projects) {
    for (const key of ['hero', 'stage', 'a', 'b', 'c', 'd', 'm1', 'm2', 'm3']) {
      assert.ok(fs.existsSync(`public/work/${p.slug}/${key}.webp`), `${p.slug}/${key}`)
    }
    for (const field of ['summary', 'context', 'problem', 'solution', 'evidence']) assert.ok(p[field].length > 10, `${p.slug}.${field}`)
    assert.ok(p.features.length >= 3 && p.stack.length >= 3, p.slug)
  }
})

test('imagens de compartilhamento têm 1200x630', async () => {
  for (const name of ['home', ...projects.map((p) => p.slug)]) {
    const { width, height } = await sharp(`public/og/${name}.jpg`).metadata()
    assert.deepEqual([width, height], [1200, 630], name)
  }
})

test('prévias do arquivo existem', () => {
  for (const a of archive) if (a.preview) assert.ok(fs.existsSync(`public/work/arquivo/${a.id}.webp`), a.id)
})

test('competências apontam para projetos existentes', () => {
  const slugs = new Set(projects.map((p) => p.slug))
  for (const d of disciplines) for (const s of d.seenIn) assert.ok(slugs.has(s.slug), `${d.name} -> ${s.slug}`)
})

test('cores de cena passam em AA', () => {
  for (const { slug, scene } of projects) {
    assert.ok(contrast(scene.bg, scene.fg) >= 4.5, `${slug} fg`)
    assert.ok(contrast(scene.bg, scene.muted) >= 4.5, `${slug} muted`)
    assert.ok(contrast(scene.bg, scene.accent) >= 3, `${slug} accent`)
  }
})
