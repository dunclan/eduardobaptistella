import { archive, disciplines, projects, ui } from './pt.ts'
import sizes from './image-sizes.json' with { type: 'json' }

/**
 * Para oferecer inglês: crie src/content/en.ts com as mesmas exportações de pt.ts,
 * registre-o em `content` e adicione a rota /en. Os componentes já recebem tudo daqui.
 */
const content = { pt: { archive, disciplines, projects, ui } }

export type Locale = keyof typeof content
export const defaultLocale: Locale = 'pt'
export const getContent = (locale: Locale = defaultLocale) => content[locale]

type ImageKey = 'hero' | 'a' | 'b' | 'c' | 'd' | 'm1' | 'm2' | 'm3'

export const workImage = (slug: string, key: ImageKey) => {
  const size = (sizes as Record<string, Record<string, { width: number; height: number }>>)[slug]?.[key]
  if (!size) throw new Error(`imagem sem registro: ${slug}/${key}. Rode npm run images.`)
  return { src: `/work/${slug}/${key}.webp`, ...size }
}
