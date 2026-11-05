import type { Metadata, Viewport } from 'next'
import { Archivo, Martian_Mono, Newsreader } from 'next/font/google'
import { Cue } from '@/components/Cue'
import { Motion } from '@/components/Motion'
import { StatusProvider } from '@/components/Status'
import { Top } from '@/components/Top'
import { getContent } from '@/content'
import { site } from '@/content/site'
import './globals.css'

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' })
// Só a fonte da manchete é pré-carregada: as outras não decidem a primeira pintura.
const newsreader = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-newsreader', display: 'swap', preload: false })
const martian = Martian_Mono({ subsets: ['latin'], axes: ['wdth'], variable: '--font-martian', display: 'swap', preload: false })

export const viewport: Viewport = { themeColor: '#0f0e0c' }

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: ${site.role}`, template: `%s · ${site.name}` },
  description: site.description,
  authors: [{ name: site.name }],
  robots: { index: site.indexable, follow: site.indexable },
  openGraph: {
    type: 'website', locale: 'pt_BR', siteName: site.name, url: '/',
    title: `${site.name}: tudo aqui está no ar.`, description: site.description,
    images: [{ url: '/og/home.jpg', width: 1200, height: 630, alt: 'Tudo aqui está no ar. Portfólio de Eduardo Baptistella.' }],
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { ui } = getContent()
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${newsreader.variable} ${martian.variable}`}>
      <body>
        <a className="skip" href="#conteudo">{ui.nav.skip}</a>
        <StatusProvider>
          <Top nav={ui.nav} />
          <div id="conteudo" tabIndex={-1} style={{ outline: 'none' }}>{children}</div>
        </StatusProvider>
        <Motion />
        <Cue />
      </body>
    </html>
  )
}
