import type { MetadataRoute } from 'next'
import { site } from '@/content/site'

export default function robots(): MetadataRoute.Robots {
  // Fora dos buscadores, mas as redes precisam ler a página para montar a prévia do link.
  if (!site.indexable) {
    return {
      rules: [
        { userAgent: ['Twitterbot', 'facebookexternalhit', 'WhatsApp', 'LinkedInBot', 'TelegramBot', 'Slackbot', 'Discordbot'], allow: '/' },
        { userAgent: '*', disallow: '/' },
      ],
    }
  }
  return { rules: { userAgent: '*', allow: '/', disallow: '/api/' }, sitemap: `${site.url}/sitemap.xml` }
}
