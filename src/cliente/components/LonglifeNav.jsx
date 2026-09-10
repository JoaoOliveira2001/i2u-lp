import { useState } from 'react'

export const LONGLIFE_NAV = [
  { href: '/cliente/longlife', id: 'inicio', label: 'Início' },
  { href: '/investimento-midia', id: 'investimento', label: 'Investimento' },
  { href: '/docs/longlife', id: 'docs', label: 'Documentação' },
]

export function LonglifeNav({ active, children }) {
  const [open, setOpen] = useState(false)
  const title = LONGLIFE_NAV.find((item) => item.id === active)?.label || 'Long Life'

  return (
    <div className="ll-app">
      <aside className={`ll-sidebar ${open ? 'is-open' : ''}`} id="ll-sidebar" aria-label="Navegação">
        <div className="ll-brand">
          <span className="brand__dot" />
          <strong>Long Life</strong>
        </div>
        <nav className="ll-nav" aria-label="Seções">
          {LONGLIFE_NAV.map((item) => {
            const isActive = item.id === active
            return (
              <a
                key={item.id}
                href={item.href}
                className={`ll-nav__link ${isActive ? 'is-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </a>
            )
          })}
        </nav>
      </aside>
      <div className="ll-column">
        <div
          className={`ll-scrim ${open ? 'is-on' : ''}`}
          onClick={() => setOpen(false)}
          aria-hidden={!open}
        />
        <header className="ll-topbar">
          <button
            type="button"
            className="ll-icon-btn"
            aria-controls="ll-sidebar"
            aria-expanded={open}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fill="currentColor"
                d="M3 5h14v1.5H3V5zm0 4.25h14v1.5H3v-1.5zM3 13.5h14V15H3v-1.5z"
              />
            </svg>
          </button>
          <h1>{title}</h1>
        </header>
        <div className="ll-main">{children}</div>
      </div>
    </div>
  )
}
