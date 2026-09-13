import { useState } from 'react'
import { automations, automationsJundiai, infra } from '../docs-longlife/data'

const N8N_BASE = 'https://n8n.unificahub.com.br'

const UNITS = [
  { id: 'braganca', name: 'Bragança', funnel: 'Bragança · funil 6777', automations },
  { id: 'jundiai', name: 'Jundiaí', funnel: 'Jundiaí · funil 7175', automations: automationsJundiai },
]

function UnitNav({ unit, onChange }) {
  return (
    <aside className="nav">
      <div className="nav__block">
        <p className="nav__eyebrow">Unidades</p>
        {UNITS.map((u) => (
          <a
            key={u.id}
            href="#automacoes"
            onClick={() => onChange(u.id)}
            className={`nav__link ${unit === u.id ? 'is-active' : ''}`}
          >
            <span className="nav__name">{u.name}</span>
            <span className="nav__state">Documentada</span>
          </a>
        ))}
      </div>
    </aside>
  )
}

function Flow({ flow }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flow">
      <button
        type="button"
        className={`flow__toggle ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{open ? 'Ocultar fluxo' : 'Ver fluxo'}</span>
        <span className="flow__chev">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <ol className="flow__steps">
          {flow.map((step, i) => (
            <li className="flow__node" key={i}>
              <span className="flow__dot">{String(i + 1).padStart(2, '0')}</span>
              <div className="flow__body">
                <p className="flow__label">{step.label}</p>
                <p className="flow__desc">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function Automation({ a, index }) {
  return (
    <section className="automation" id={a.id}>
      <div className="automation__head">
        <span className="automation__index">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="automation__titles">
          <h2 className="automation__title">{a.name}</h2>
          <p className="automation__short">{a.short}</p>
        </div>
      </div>

      <div className="automation__meta">
        <div>
          <span className="meta__k">ID n8n</span>
          <a
            className="meta__v meta__link"
            href={`${N8N_BASE}/workflow/${a.workflowId}`}
            target="_blank"
            rel="noreferrer"
          >
            <code>{a.workflowId}</code>
          </a>
        </div>
        <div>
          <span className="meta__k">Gatilho</span>
          <span className="meta__v">{a.trigger}</span>
        </div>
      </div>

      <Flow flow={a.flow} />
    </section>
  )
}

function Table({ headers, rows, render }) {
  return (
    <table className="table">
      <thead>
        <tr>
          {headers.map((h, i) => (
            <th key={i}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{rows.map((r, i) => render(r, i))}</tbody>
    </table>
  )
}

export function App() {
  const [unit, setUnit] = useState('braganca')
  const active = UNITS.find((u) => u.id === unit) || UNITS[0]

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="mark" />
          <div>
            <p className="topbar__kicker">Integration2U</p>
            <p className="topbar__title">Documentação · Long Life</p>
          </div>
        </div>
        <a className="topbar__back" href="/cliente/longlife">
          Voltar ao portal
        </a>
      </header>

      <div className="layout">
        <UnitNav unit={unit} onChange={setUnit} />

        <main className="content">
          <header className="hero">
            <p className="hero__eyebrow">{active.funnel}</p>
            <h1 className="hero__title">Automações do atendimento</h1>
            <p className="hero__lede">
              Como um lead entra, é atendido, qualificado e chega ao consultor.
              Cada automação é uma etapa do mesmo funil.
            </p>
            <div className="hero__funnel">
              {['Captação', 'Abordagem IA', 'Qualificação', 'Transferência', 'Consultor'].map(
                (s, i) => (
                  <div className="hero__funnel-item" key={i}>
                    <div className="hero__step">{s}</div>
                    {i < 4 && <span className="hero__arrow">→</span>}
                  </div>
                ),
              )}
            </div>
          </header>

          <section className="block" id="automacoes">
            <h2 className="block__title">As automações</h2>
            {active.automations.map((a, i) => (
              <Automation a={a} index={i} key={a.id} />
            ))}
          </section>

          <section className="block">
            <h2 className="block__title">Alerta de operação</h2>
            <p className="block__text">
              Cada chamada ao CRM é checada. Fora de 2xx ou body com erro, o hub
              <code>Alerta_Ops_LongLife</code> deduplica e publica um alerta em
              cascata (Cursor → WhatsApp → Discord). A falha nunca interrompe o fluxo.
            </p>
          </section>

          <section className="block">
            <h2 className="block__title">Infra compartilhada</h2>
            <Table
              headers={['Recurso', 'Valor']}
              rows={infra}
              render={(r) => (
                <tr key={r.resource}>
                  <td>{r.resource}</td>
                  <td>
                    <code>{r.value}</code>
                  </td>
                </tr>
              )}
            />
          </section>
        </main>
      </div>
    </div>
  )
}
