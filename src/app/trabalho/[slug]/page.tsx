import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { TLink } from '@/components/Motion'
import { Status } from '@/components/Status'
import { getContent, workImage } from '@/content'
import { site } from '@/content/site'

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false
export const generateStaticParams = () => getContent().projects.map((p) => ({ slug: p.slug }))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const project = getContent().projects.find((p) => p.slug === slug)
  if (!project) return {}
  const image = `/work/${slug}/hero.webp`
  return {
    title: project.name,
    description: project.summary,
    alternates: { canonical: `/trabalho/${slug}` },
    openGraph: { title: `${project.name} · ${site.name}`, description: project.summary, images: [image] },
  }
}

export default async function CaseStudy({ params }: Props) {
  const { slug } = await params
  const { projects, ui } = getContent()
  const copy = ui.caseStudy
  const index = projects.findIndex((p) => p.slug === slug)
  if (index < 0) notFound()
  const p = projects[index]
  const next = projects[(index + 1) % projects.length]
  const shot = (key: 'a' | 'b' | 'c' | 'd') => ({ ...p.shots.find((s) => s.key === key)!, img: workImage(slug, key) })
  const figure = (key: 'a' | 'b' | 'c' | 'd', sizes: string) => {
    const s = shot(key)
    return (
      <figure key={key} className="view-rise">
        <Image src={s.img.src} width={s.img.width} height={s.img.height} alt={s.alt} sizes={sizes} quality={75} />
        <figcaption className="mono">{s.caption}</figcaption>
      </figure>
    )
  }
  const hero = workImage(slug, 'hero')
  const fit = (name: string) => ({ '--len': name.length, '--long': Math.max(...name.split(' ').map((w) => w.length)) }) as React.CSSProperties
  const ld = { '@context': 'https://schema.org', '@type': 'CreativeWork', name: p.name, url: p.url, description: p.summary, creator: { '@type': 'Person', name: site.name } }

  return (
    <main
      className="case"
      data-light={p.scene.light || undefined}
      style={{ '--scene-bg': p.scene.bg, '--scene-fg': p.scene.fg, '--scene-muted': p.scene.muted, '--scene-accent': p.scene.accent } as React.CSSProperties}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <header className="case__hero">
        <TLink className="case__back mono ul" href="/#trabalho" style={{ background: 'none' }}>← {copy.back}</TLink>
        <h1 className="case__title" style={fit(p.name)}>
          <span><span>{p.name}</span></span>
        </h1>
        <dl className="case__facts mono">
          <div className="case__fact"><dt>{copy.category}</dt><dd>{p.category}</dd></div>
          <div className="case__fact"><dt>{copy.deployed}</dt><dd>{p.deployed}</dd></div>
          <div className="case__fact"><dt>{copy.address}</dt><dd><a className="ul" href={p.url} target="_blank" rel="noopener noreferrer">{p.urlLabel} ↗</a></dd></div>
          <div className="case__fact"><dt>{copy.status}</dt><dd><Status id={p.slug} prelaunch={p.status === 'prelaunch'} /></dd></div>
        </dl>
      </header>

      <div className="case__figure">
        <Image src={hero.src} width={hero.width} height={hero.height} alt={p.heroAlt} sizes="100vw" priority quality={85} />
      </div>

      <div className="case__summary"><p>{p.summary}</p></div>

      <div className="case__story">
        <section className="case__block" aria-labelledby="c1"><h2 className="mono" id="c1">{copy.context}</h2><p>{p.context}</p></section>
        <section className="case__block" aria-labelledby="c2"><h2 className="mono" id="c2">{copy.problem}</h2><p>{p.problem}</p></section>
        <section className="case__block" aria-labelledby="c3"><h2 className="mono" id="c3">{copy.solution}</h2><p>{p.solution}</p></section>
        {p.credit && <p className="case__credit mono">{p.credit}</p>}
        {p.statusNote && <p className="case__note">{p.statusNote}</p>}
      </div>

      <p className="case__gallery-label mono">{copy.gallery}</p>
      <div className="case__wide">{figure('a', '100vw')}</div>
      <div className="case__pair">
        {figure('b', '(max-width: 899px) 100vw, 58vw')}
        {figure('c', '(max-width: 899px) 100vw, 38vw')}
      </div>

      <section className="case__phones" aria-label={copy.phone} tabIndex={0}>
        <h2 className="mono">{copy.phone}</h2>
        {(['m1', 'm2', 'm3'] as const).map((key, i) => {
          const m = workImage(slug, key)
          return (
            <figure key={key}>
              <Image src={m.src} width={m.width} height={m.height} alt={p.phoneAlt[i]} sizes="(max-width: 899px) 72vw, 24vw" quality={75} />
            </figure>
          )
        })}
      </section>

      <div className="case__wide" style={{ paddingBottom: 'clamp(56px, 9vw, 140px)' }}>{figure('d', '100vw')}</div>

      <div className="case__detail">
        <section className="case__feat" aria-labelledby="c4">
          <h2 className="mono" id="c4">{copy.features}</h2>
          <ol>
            {p.features.map((f, i) => (
              <li key={f}><span className="mono" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span><span>{f}</span></li>
            ))}
          </ol>
        </section>
        <section className="case__stack" aria-labelledby="c5">
          <h2 className="mono" id="c5">{copy.stack}</h2>
          <ul>{p.stack.map((s) => <li key={s}>{s}</li>)}</ul>
          <p className="case__evidence mono">{copy.evidence}: {p.evidence}</p>
        </section>
      </div>

      <div className="case__visit">
        <a href={p.url} target="_blank" rel="noopener noreferrer">
          <span>{copy.visit} ↗</span>
          <span className="mono">{p.urlLabel}</span>
        </a>
      </div>

      <TLink className="next" href={`/trabalho/${next.slug}`} data-cue={copy.next}>
        <span className="mono">{copy.next}</span>
        <span className="next__name" style={fit(next.name)}>{next.name}</span>
      </TLink>
    </main>
  )
}
