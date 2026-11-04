'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getContent } from '@/content'

type Codes = Record<string, number> | null
const Ctx = createContext<Codes>(null)

export function StatusProvider({ children }: { children: React.ReactNode }) {
  const [codes, setCodes] = useState<Codes>(null)
  useEffect(() => {
    let alive = true
    fetch('/api/status')
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => { if (alive) setCodes(d) })
      .catch(() => { if (alive) setCodes({}) })
    return () => { alive = false }
  }, [])
  return <Ctx.Provider value={codes}>{children}</Ctx.Provider>
}

/** Resposta HTTP real do endereço, verificada no servidor. */
export function Status({ id, prelaunch = false }: { id: string; prelaunch?: boolean }) {
  const { status } = getContent().ui
  const codes = useContext(Ctx)
  const code = codes?.[id]
  const ok = code !== undefined && code >= 200 && code < 400
  const state = !codes ? 'checking' : !ok ? 'down' : prelaunch ? 'prelaunch' : 'live'
  const text = state === 'checking' ? status.checking : state === 'down' ? status.down : `${code} · ${prelaunch ? status.prelaunch : status.live}`
  return (
    <span className="status mono" data-state={state}>
      <span className="status__led" aria-hidden="true" />
      {text}
    </span>
  )
}

export function StatusSummary() {
  const { status } = getContent().ui
  const codes = useContext(Ctx)
  const values = codes ? Object.values(codes) : []
  const up = values.filter((c) => c >= 200 && c < 400).length
  return (
    <span className="status mono" data-state={!codes ? 'checking' : up ? 'live' : 'down'}>
      <span className="status__led" aria-hidden="true" />
      {codes && values.length ? status.summary(up, values.length) : status.summaryPending}
    </span>
  )
}
