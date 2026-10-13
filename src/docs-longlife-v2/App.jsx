import { useState } from 'react'
import {
  automations,
  automationsJundiai,
  automationsSorocaba,
  infra,
  unitStatus,
  changelog,
} from '../docs-longlife/data'

const N8N_BASE = 'https://n8n.unificahub.com.br'

const UNITS = [
  { id: 'braganca', name: 'Bragança', funnel: 'Bragança · funil 6777', automations },
  { id: 'jundiai', name: 'Jundiaí', funnel: 'Jundiaí · funil 7175', automations: automationsJundiai },
  {
    id: 'sorocaba',
    name: 'Sorocaba',
    funnel: 'Sorocaba · funil 12285',
    automations: automationsSorocaba,
    note:
      'O nó de sincronização com o Metabase está desativado nos workflows Captação, Trilha, Transferir, Qualificado e Handoff de Sorocaba. Por isso o dashboard ainda não mostra dados da unidade.',
  },
  { id: 'sumare', name: 'Sumaré', funnel: 'Sumaré · em migração', automations: [], state: 'Em migração' },
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
            <span className="nav__state">{u.state || 'Documentada'}</span>
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
            {active.note && <p className="block__text"><strong>Nota:</strong> {active.note}</p>}
            {active.automations.length === 0 && (
              <p className="block__text">
                Migração da unidade no backlog (LON-47). As automações serão documentadas quando a unidade for migrada.
              </p>
            )}
            {active.automations.map((a, i) => (
              <Automation a={a} index={i} key={a.id} />
            ))}
          </section>

          <section className="block">
            <h2 className="block__title">Alerta de operação</h2>
            <p className="block__text">
              Cada chamada ao CRM é checada. Fora de 2xx ou body com erro, o hub
              <code>Alerta_Ops_LongLife</code> deduplica e publica um alerta em
              alerta (Cursor → Discord). Os alertas de erro da API do n8n para o
              WhatsApp foram desligados. A falha nunca interrompe o fluxo.
            </p>
          </section>

          <section className="block" id="portal-filas">
            <h2 className="block__title">Portal de filas (longlife-portal)</h2>
            <p className="block__text">
              Cada unidade tem um login próprio no portal de filas: Bragança, Jundiaí e, desde a
              LON-51, Sorocaba (usuário <code>adminsorocaba</code>, senha guardada na variável de
              ambiente da Vercel). Pelo portal, a gestora da unidade pode:
            </p>
            <ul className="block__text">
              <li><strong>Ligar e desligar</strong> um atendente da roleta (ativo/inativo).</li>
              <li><strong>Inserir atendente</strong> (LON-52): nome, id de usuário no CRM e peso. O atendente já entra na roleta.</li>
              <li><strong>Retirar atendente</strong> (LON-52): o atendente sai da fila depois de uma confirmação. O histórico fica preservado, porque a linha é marcada como removida e não é apagada.</li>
            </ul>
            <p className="block__text">Cada login só vê e altera a fila da própria unidade.</p>
          </section>

          <section className="block" id="fila-vendedores">
            <h2 className="block__title">Fila de vendedores (Supabase)</h2>
            <p className="block__text">
              Tabela <code>vendedores_fila</code> (projeto <code>jlyqptmxcloouaxumdqu</code>). Hoje:
              Bragança 15, Jundiaí 15, Sorocaba 5 atendentes.
            </p>
            <ul className="block__text">
              <li><code>proximo_vendedor(p_unidade)</code>: gira a roleta da unidade. Só o n8n chama.</li>
              <li><code>adicionar_vendedor(p_unidade, p_id_usuario_crm, p_nome, p_peso, p_ativo)</code>: insere um atendente, ou reativa um que já tinha sido removido.</li>
              <li><code>remover_vendedor(p_unidade, p_id_usuario_crm)</code>: marca <code>removido = true</code>.</li>
              <li>Coluna <code>removido</code> (migration <code>20261009140000</code>). As views <code>v_fila_status</code> e <code>v_fila_proximo</code> não mostram os removidos.</li>
            </ul>
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

          <section className="block" id="status-unidades">
            <h2 className="block__title">Status das unidades</h2>
            <Table
              headers={['Unidade', 'Status']}
              rows={unitStatus}
              render={(r) => (
                <tr key={r.unit}>
                  <td>{r.unit}</td>
                  <td>{r.status}</td>
                </tr>
              )}
            />
          </section>

          <section className="block" id="historico">
            <h2 className="block__title">Histórico de mudanças</h2>
            <ul className="block__text">
              {changelog.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    </div>
  )
}
