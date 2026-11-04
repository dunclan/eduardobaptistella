/** Dados pessoais. Só entra aqui o que foi verificado ou confirmado pelo Eduardo. */
export const site = {
  name: 'Eduardo Baptistella',
  role: 'Software Developer & Digital Experiences',
  description:
    'Eduardo Baptistella, desenvolvedor de software. Sites, sistemas de gestão e aplicações para clientes reais, publicados e no ar.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eduardobaptistella.vercel.app',
  /** Fora dos buscadores até a revisão de docs/REVIEW.md. Para abrir: true e `vercel deploy --prod`. */
  indexable: false,
  /**
   * Para adicionar um canal, inclua { label, value, href }.
   * Exemplos: email com href 'mailto:...', WhatsApp com href 'https://wa.me/55...'.
   */
  contacts: [
    { label: 'GitHub', value: 'github.com/dunclan', href: 'https://github.com/dunclan' },
  ],
}
