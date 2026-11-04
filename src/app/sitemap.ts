import type { MetadataRoute } from 'next'
import { getContent } from '@/content'
import { site } from '@/content/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, priority: 1 },
    ...getContent().projects.map((p) => ({ url: `${site.url}/trabalho/${p.slug}`, priority: 0.8 })),
  ]
}
