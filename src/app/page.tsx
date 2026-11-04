import { Hero } from '@/components/Hero'
import { Stage } from '@/components/Stage'
import { Status } from '@/components/Status'
import { TLink } from '@/components/Motion'
import { getContent } from '@/content'
import { site } from '@/content/site'

export default function Home() {
  const { ui, projects, archive, disciplines } = getContent()
  const addresses = [...projects.map((p) => p.urlLabel), ...archive.map((a) => a.label)]
  const person = {
    '@context': 'https://schema.org', '@type': 'Person', name: site.name, jobTitle: 'Software Developer',
    url: site.url, sameAs: site.contacts.filter((c) => c.href.startsWith('https://')).map((c) => c.href),
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      <Hero copy={ui.hero} />

      <div className="crawl mono" aria-hidden="true">
        <div className="crawl__track">
          {[...addresses, ...addresses].map((a, i) => <span key={i}>{a}</span>)}
        </div>
      </div>

      <Stage projects={projects} copy={ui.stage} />

      <section className="archive" aria-labelledby="arquivo-titulo">
        <header className="archive__head">
          <p className="mono">{ui.archive.kicker}</p>
          <h2 id="arquivo-titulo">{ui.archive.title}</h2>
        </header>
        <ul className="archive__list">
          {archive.map((a) => (
            <li className="archive__row" key={a.id}>
              <a href={a.url} target="_blank" rel="noopener noreferrer" data-cue={a.label} data-preview={a.preview ? `/work/arquivo/${a.id}.webp` : undefined}>
                <span className="archive__kind mono">{a.kind}</span>
                <span className="archive__name">{a.name}</span>
                <span className="archive__url mono"><Status id={a.id} /></span>
                <span className="archive__arrow" aria-hidden="true">↗</span>
                <span className="sr"> (abre em nova aba)</span>
              </a>
            </li>
          ))}
        </ul>
        <div className="archive__back">
          <p className="mono">{ui.archive.backstageTitle}</p>
          <p>{ui.archive.backstage}</p>
        </div>
      </section>

      <div className="paper">
        <section className="about" id="sobre" aria-labelledby="sobre-titulo">
          <p className="mono" id="sobre-titulo">{ui.about.kicker}</p>
          <p className="about__lead view-rise">{ui.about.lead}</p>
          <div className="about__text">
            {ui.about.paragraphs.map((t) => <p key={t}>{t}</p>)}
          </div>
        </section>

        <section className="tech" id="tecnica" aria-labelledby="tecnica-titulo">
          <header className="tech__head">
            <p className="mono">{ui.expertise.kicker}</p>
            <h2 id="tecnica-titulo">{ui.expertise.title}</h2>
          </header>
          <ol>
            {disciplines.map((d, i) => (
              <li className="tech__row" key={d.name}>
                <span className="tech__n mono" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="tech__name">{d.name}</h3>
                <p className="tech__text">
                  {d.text}
                  <span className="tech__tools mono">{d.tools.join(' · ')}</span>
                </p>
                <p className="tech__seen mono">
                  {ui.expertise.seenIn}{' '}
                  {d.seenIn.map((s, n) => (
                    <span key={s.slug}>
                      {n > 0 && ', '}
                      <TLink className="ul" href={`/trabalho/${s.slug}`}>{s.label}</TLink>
                    </span>
                  ))}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="contact" id="contato" aria-labelledby="contato-titulo">
        <p className="mono">{ui.contact.kicker}</p>
        <h2 className="contact__big" id="contato-titulo">
          {ui.contact.lines.map((l) => <span key={l}>{l} </span>)}
        </h2>
        <div>
          <div className="contact__grid">
            <p className="contact__text">{ui.contact.text}</p>
            <div className="contact__links">
              {site.contacts.length === 0 && <p>{ui.contact.empty}</p>}
              {site.contacts.map((c) => (
                <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                  <span>{c.label}</span>
                  <span className="mono">{c.value} ↗</span>
                </a>
              ))}
            </div>
          </div>
          <footer className="foot mono" style={{ marginTop: 28 }}>
            <span>© {new Date().getFullYear()} {ui.footer.rights}</span>
            <span>{ui.footer.built}</span>
          </footer>
        </div>
      </section>
    </main>
  )
}
