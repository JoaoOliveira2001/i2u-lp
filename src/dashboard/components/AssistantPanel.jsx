import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useMemo, useRef, useState } from 'react'

function MessageText({ parts }) {
  const text = (parts || [])
    .filter((part) => part.type === 'text' && part.text)
    .map((part) => part.text)
    .join('')

  if (!text) return null
  return <div className="assistant-msg assistant-msg--assistant">{text}</div>
}

export function AssistantPanel({ open, onClose, onDataChanged }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const changedRef = useRef(false)

  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/assistant/chat' }),
    [],
  )

  const { messages, sendMessage, status, error, clearError } = useChat({ transport })
  const isBusy = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, status])

  useEffect(() => {
    const last = messages[messages.length - 1]
    if (!last || last.role !== 'assistant') return

    const usedTool = (last.parts || []).some((part) => part.type === 'tool-invocation')
    if (usedTool) changedRef.current = true
  }, [messages])

  const handleClose = () => {
    if (changedRef.current) {
      onDataChanged?.()
      changedRef.current = false
    }
    onClose()
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const text = input.trim()
    if (!text || isBusy) return
    clearError()
    sendMessage({ text })
    setInput('')
  }

  if (!open) return null

  return (
    <>
      <button type="button" className="assistant-backdrop" onClick={handleClose} aria-label="Fechar" />
      <aside className="assistant-panel" role="dialog" aria-label="Assistente i2u">
        <header className="assistant-panel__header">
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)' }}>Assistente</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Edite valores, horas e taxas por prompt
            </p>
          </div>
          <button type="button" className="btn btn--ghost" onClick={handleClose}>
            Fechar
          </button>
        </header>

        <div className="assistant-panel__messages">
          {messages.length === 0 && (
            <div className="assistant-msg assistant-msg--assistant">
              Olá! Posso ajudar com:
              {'\n'}• Criar projeto ou colaborador
              {'\n'}• Alterar valor combinado e data de pagamento
              {'\n'}• Registrar horas de um dev
              {'\n'}• Consultar margem e lucratividade
            </div>
          )}

          {messages.map((message) =>
            message.role === 'user' ? (
              <div key={message.id} className="assistant-msg assistant-msg--user">
                {(message.parts || [])
                  .filter((p) => p.type === 'text')
                  .map((p) => p.text)
                  .join('')}
              </div>
            ) : (
              <MessageText key={message.id} parts={message.parts} />
            ),
          )}

          {isBusy && <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Pensando...</p>}

          {error && <div className="error-banner">{error.message}</div>}
          <div ref={bottomRef} />
        </div>

        <form className="assistant-panel__form" onSubmit={handleSubmit}>
          <textarea
            className="assistant-panel__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder="Ex: coloca otto em 2500 reais"
            rows={2}
            disabled={isBusy}
          />
          <button type="submit" className="btn btn--primary" disabled={isBusy || !input.trim()}>
            Enviar
          </button>
        </form>
      </aside>
    </>
  )
}
