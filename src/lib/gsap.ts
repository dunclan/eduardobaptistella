/** GSAP sai do pacote inicial: nada na primeira pintura depende dele. */
const load = async () => {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
  gsap.registerPlugin(ScrollTrigger)
  return { gsap, ScrollTrigger }
}

let pending: ReturnType<typeof load> | null = null
export const loadGsap = () => (pending ??= load())
