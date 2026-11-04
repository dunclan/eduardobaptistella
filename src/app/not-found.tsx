import { TLink } from '@/components/Motion'
import { getContent } from '@/content'

export default function NotFound() {
  const { title, text, back } = getContent().ui.notFound
  return (
    <main className="lost">
      <p className="mono">404</p>
      <h1>{title}</h1>
      <p>{text}</p>
      <TLink className="ul" href="/">{back} →</TLink>
    </main>
  )
}
