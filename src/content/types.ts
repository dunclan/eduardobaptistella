export type Scene = { bg: string; fg: string; muted: string; accent: string; light?: boolean }

export type Shot = { key: 'a' | 'b' | 'c' | 'd'; alt: string; caption: string }

export type Project = {
  slug: string
  name: string
  /** Quebra do título no palco da home. */
  titleLines: string[]
  category: string
  /** Mês do deploy de produção verificado. */
  deployed: string
  url: string
  urlLabel: string
  status: 'live' | 'prelaunch'
  statusNote?: string
  credit?: string
  summary: string
  context: string
  problem: string
  solution: string
  features: string[]
  stack: string[]
  evidence: string
  scene: Scene
  heroAlt: string
  shots: Shot[]
  phoneAlt: [string, string, string]
}

export type ArchiveItem = {
  id: string
  name: string
  kind: string
  url: string
  label: string
  preview: boolean
}

export type Discipline = { name: string; text: string; tools: string[]; seenIn: { label: string; slug: string }[] }

export type Ui = {
  nav: { work: string; about: string; expertise: string; contact: string; skip: string; home: string }
  hero: { aria: string; role: string; line: string; ctaWork: string; ctaContact: string }
  status: { checking: string; live: string; prelaunch: string; down: string; summary: (up: number, total: number) => string; summaryPending: string }
  stage: { kicker: string; title: string; note: string; open: string; progress: string }
  archive: { kicker: string; title: string; backstageTitle: string; backstage: string }
  about: { kicker: string; lead: string; paragraphs: string[] }
  expertise: { kicker: string; title: string; seenIn: string }
  contact: { kicker: string; lines: string[]; text: string; empty: string }
  footer: { rights: string; built: string }
  caseStudy: {
    back: string; visit: string; category: string; deployed: string; address: string; status: string
    context: string; problem: string; solution: string; features: string; stack: string; evidence: string; next: string
    phone: string; gallery: string
  }
  notFound: { title: string; text: string; back: string }
}
