import { useState } from 'react'
import { automations, infra } from './data'

function FlowRow({ flow }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="doc-flow">
      <button
        type="button"
        className={`doc-flow__toggle ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="doc-flow__toggle-label">{open ? 'Ocultar fluxo' : 'Ver fluxo'}</span>
        <span className="doc-flow__chevron">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <ol className="doc-flow__steps">
          {flow.map((step, i) => (
            <li className="doc-flow__node" key={i}>
              <span className="doc-flow__dot">{String(i + 1).padStart(2, '0')}</span>
              <div className="doc-flow__body">
                <p className="doc-flow__label">{step.label}</p>
                <p className="doc-flow__detail">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function AutomationCard({ automation }) {
  return (
    <article className="doc-card" id={automation.id}>
      <div className="doc-card__head">
        <span className="doc-card__num">{automation.num}</span>
        <div>
          <h2>{automation.name}</h2>
          <p className="doc-card__short">{automation.short}</p>
        </div>
      </div>

      <dl className="doc-meta">
        <div>
          <dt>ID n8n</dt>
          <dd>
            <a
              href={`https://auto.unificahub.com.br/workflow/${automation.workflowId}`}
              target="_blank"
              rel="noreferrer"
              className="doc-meta__link"
            >
              <code>{automation.workflowId}</code>
            </a>
          </dd>
        </div>
        <div>
          <dt>Gatilho</dt>
          <dd>{automation.trigger}</dd>
        </div>
      </dl>

      <h3 className="doc-subhead">Fluxo</h3>
      <FlowRow flow={automation.flow} />
    </article>
  )
}

function Sidebar() {
  const units = [
    {
      name: 'Bragança',
      href: '#automacoes',
      active: true,
      badge: 'Documentada',
    },
    {
      name: 'Jundiaí',
      href: '#',
      active: false,
      badge: 'Em breve',
    },
  ]

  return (
    <aside className="doc-sidebar">
      <p className="doc-sidebar__label">Unidades</p>
      <nav className="doc-sidebar__nav">
        {units.map((u) => (
          <a
            key={u.name}
            href={u.href}
            className={`doc-sidebar__item ${u.active ? 'is-active' : ''}`}
          >
            <span className="doc-sidebar__name">{u.name}</span>
            <span className="doc-sidebar__badge">{u.badge}</span>
          </a>
        ))}
      </nav>
    </aside>
  )
}

function SimpleTable({ headers, rows, render }) {
  return (
    <div className="doc-table-wrap">
      <table className="doc-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map((row, i) => render(row, i))}</tbody>
      </table>
    </div>
  )
}

export function App() {
  return (
    <div className="doc-page">
      <div className="doc-shell">
        <header className="doc-header">
          <div className="doc-brand">
            <span className="brand__dot" />
            <div>
              <p className="doc-kicker">Integration2U</p>
              <h1>Documentação Long Life</h1>
              <p className="doc-subtitle">Automações do funil Bragança — n8n</p>
            </div>
          </div>
          <a href="/cliente/longlife" className="doc-back">
            ← Voltar
          </a>
        </header>

        <div className="doc-layout">
          <Sidebar />
          <main className="doc-main">
        <section className="doc-section" id="automacoes">
          <h2 className="doc-section__title">Visão geral do funil</h2>
          <p className="doc-section__text">
            Os fluxos formam um funil integrado: a captação entrega o lead ao bot, o bot
            qualifica e transfere, e o consultor recebe na fila. Nenhuma automação é isolada.
          </p>

          <div className="doc-funnel">
            {['Captação', 'Abordagem IA', 'Qualificação', 'Transferência', 'Consultor'].map(
              (step, i) => (
                <div className="doc-funnel__step" key={i}>
                  <span>{step}</span>
                </div>
              ),
            )}
          </div>
        </section>

        <section className="doc-section">
          <h2 className="doc-section__title">Automações</h2>
          <div className="doc-grid">
            {automations.map((a) => (
              <AutomationCard automation={a} key={a.id} />
            ))}
          </div>
        </section>

        <section className="doc-section">
          <h2 className="doc-section__title">Alerta de bugs no Discord</h2>
          <p className="doc-section__text">
            Todos os fluxos têm nós <code>Checar CRM</code> após cada chamada ao CRM. Se a
            resposta sair de 2xx (ou o body vier <code>{'{ status: "error" }'}</code>), o alerta é
            enviado ao workflow <strong>Alerta_Discord_CRM</strong>, que deduplica (15 min) e
            publica um embed vermelho no canal do Discord. Nenhuma falha quebra o fluxo principal.
          </p>
        </section>

        <section className="doc-section">
          <h2 className="doc-section__title">Infra compartilhada</h2>
          <SimpleTable
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

        <footer className="doc-footer">
          Documentação gerada a partir de <code>BRAGANCA-FLUXOS.md</code>
        </footer>
          </main>
        </div>
      </div>
    </div>
  )
}
