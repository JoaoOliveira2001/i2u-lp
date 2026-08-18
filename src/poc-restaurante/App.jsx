import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useMemo, useRef, useState } from 'react'

const QUICK_SCENARIOS = [
  { label: 'Cardápio', message: 'Boa noite, tem cardápio?' },
  { label: 'Delivery', message: 'Boa noite, faz delivery?' },
  { label: 'Pizza calabresa', message: 'Quero uma pizza grande de calabresa.' },
  { label: 'Lanche com bacon', message: 'Quero um Cheese Burguer com bacon.' },
  { label: 'Dois pratos', message: 'Quero uma pizza de calabresa e um x-bacon.' },
  { label: 'Taxa de entrega', message: 'Qual a taxa para o bairro Centro?' },
  { label: 'Pix', message: 'Vou pagar no Pix.' },
  { label: 'Cartão', message: 'Vou pagar no cartão de crédito.' },
  { label: 'Ticket', message: 'Aceita ticket alimentação?' },
  { label: 'Cancelar pedido', message: 'Quero cancelar meu pedido.' },
]

function MessageBubble({ role, text }) {
  if (!text) return null

  return (
    <div className={`bubble bubble--${role}`}>
      <span className="bubble__text">{text}</span>
    </div>
  )
}

function getMessageText(message) {
  return (message.parts || [])
    .filter((part) => part.type === 'text' && part.text)
    .map((part) => part.text)
    .join('')
}

export function App() {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/restaurant-poc/chat' }),
    [],
  )

  const { messages, sendMessage, status, error, setMessages, clearError } = useChat({ transport })
  const isBusy = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  const handleSubmit = (event) => {
    event.preventDefault()
    const text = input.trim()
    if (!text || isBusy) return
    clearError()
    sendMessage({ text })
    setInput('')
  }

  const handleQuickScenario = (message) => {
    if (isBusy) return
    clearError()
    sendMessage({ text: message })
  }

  const handleReset = () => {
    setMessages([])
    clearError()
    setInput('')
  }

  return (
    <div className="poc">
      <aside className="poc__sidebar">
        <header className="poc__sidebar-header">
          <h1>POC IA Restaurante</h1>
          <p>Simule o cliente e teste o bot de delivery.</p>
        </header>

        <section className="poc__section">
          <h2>Base de conhecimento</h2>
          <ul className="poc__docs">
            <li>prompt_bot_delivery_whatsapp_regras…</li>
            <li>cenarios_teste_bot_delivery_whatsapp…</li>
          </ul>
          <p className="poc__hint">
            Regras e cenários de teste alimentam o system prompt da IA.
          </p>
        </section>

        <section className="poc__section">
          <h2>Cenários rápidos</h2>
          <div className="poc__chips">
            {QUICK_SCENARIOS.map((scenario) => (
              <button
                key={scenario.label}
                type="button"
                className="poc__chip"
                disabled={isBusy}
                onClick={() => handleQuickScenario(scenario.message)}
              >
                {scenario.label}
              </button>
            ))}
          </div>
        </section>

        <button type="button" className="poc__reset" onClick={handleReset}>
          Nova conversa
        </button>
      </aside>

      <main className="poc__chat">
        <header className="poc__chat-header">
          <div className="poc__avatar">🍕</div>
          <div>
            <strong>Bot Delivery</strong>
            <span>WhatsApp · POC Integration2U</span>
          </div>
        </header>

        <div className="poc__messages">
          {messages.length === 0 && (
            <div className="poc__welcome">
              <p>Envie uma mensagem como se fosse o cliente no WhatsApp.</p>
              <p>O bot segue as regras dos documentos em <code>poc-ia-restaurante/knowledge/</code>.</p>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role === 'user' ? 'user' : 'bot'}
              text={getMessageText(message)}
            />
          ))}

          {isBusy && <p className="poc__typing">Bot digitando…</p>}
          {error && <div className="poc__error">{error.message}</div>}
          <div ref={bottomRef} />
        </div>

        <form className="poc__composer" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite como cliente…"
            disabled={isBusy}
            autoComplete="off"
          />
          <button type="submit" disabled={isBusy || !input.trim()}>
            Enviar
          </button>
        </form>
      </main>
    </div>
  )
}
