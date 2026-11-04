import { getContent } from '@/content'

// Revalida a cada 5 minutos: o visitante nunca dispara uma varredura direta nos sites.
export const revalidate = 300

const check = async (url: string) => {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; portfolio-status/1.0)' },
      next: { revalidate },
    })
    return res.status
  } catch {
    return 0
  }
}

export async function GET() {
  const { projects, archive } = getContent()
  const items = [...projects.map((p) => [p.slug, p.url]), ...archive.map((a) => [a.id, a.url])]
  const results = await Promise.all(items.map(async ([id, url]) => [id, await check(url)] as const))
  return Response.json(Object.fromEntries(results))
}
