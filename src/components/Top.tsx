import type { Ui } from '@/content/types'
import { TLink } from './Motion'

export function Top({ nav }: { nav: Ui['nav'] }) {
  return (
    <header className="top">
      <TLink className="top__mark" href="/" aria-label={nav.home}>EB</TLink>
      <nav className="top__nav mono" aria-label="Principal">
        <TLink href="/#trabalho">{nav.work}</TLink>
        <TLink href="/#sobre">{nav.about}</TLink>
        <TLink href="/#tecnica">{nav.expertise}</TLink>
        <TLink href="/#contato">{nav.contact}</TLink>
      </nav>
    </header>
  )
}
