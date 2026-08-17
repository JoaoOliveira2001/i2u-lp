import { spawn } from 'node:child_process'
import { createUIMessageStream, createUIMessageStreamResponse, generateId } from 'ai'

const DEFAULT_CURSOR_BIN =
  '/Applications/Cursor.app/Contents/Resources/app/bin/cursor'

export function getCursorAgentBin() {
  return process.env.CURSOR_AGENT_BIN || DEFAULT_CURSOR_BIN
}

function extractUiMessageText(message) {
  return (message.parts || [])
    .filter((part) => part.type === 'text' && part.text)
    .map((part) => part.text)
    .join('')
}

export function buildCursorConversationPrompt(system, uiMessages) {
  const lines = [system, '', '--- Conversa (WhatsApp) ---', '']

  for (const message of uiMessages) {
    const text = extractUiMessageText(message)
    if (!text) continue

    if (message.role === 'user') lines.push(`Cliente: ${text}`)
    else if (message.role === 'assistant') lines.push(`Bot: ${text}`)
  }

  lines.push('', 'Responda agora como Bot (somente a mensagem do bot, estilo WhatsApp):')
  return lines.join('\n')
}

function parseAssistantText(event) {
  return (event.message?.content || [])
    .filter((part) => part.type === 'text' && part.text)
    .map((part) => part.text)
    .join('')
}

export function streamCursorAgentChat({ prompt, originalMessages }) {
  const stream = createUIMessageStream({
    originalMessages,
    execute: ({ writer }) =>
      new Promise((resolve, reject) => {
        const textId = generateId()
        writer.write({ type: 'start' })
        writer.write({ type: 'start-step' })
        writer.write({ type: 'text-start', id: textId })

        let lastText = ''
        let stderr = ''
        const args = [
          'agent',
          '-p',
          '--trust',
          '--print',
          '--output-format',
          'stream-json',
          '--stream-partial-output',
          '--mode',
          'ask',
          prompt,
        ]

        const proc = spawn(getCursorAgentBin(), args, {
          cwd: process.cwd(),
          env: process.env,
          stdio: ['ignore', 'pipe', 'pipe'],
        })

        let buffer = ''

        proc.stdout.on('data', (chunk) => {
          buffer += chunk.toString()
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.trim()) continue

            try {
              const event = JSON.parse(line)
              if (event.type !== 'assistant') continue

              const text = parseAssistantText(event)
              if (text.length <= lastText.length) continue

              writer.write({
                type: 'text-delta',
                id: textId,
                delta: text.slice(lastText.length),
              })
              lastText = text
            } catch {
              // ignore malformed stream lines
            }
          }
        })

        proc.stderr.on('data', (chunk) => {
          stderr += chunk.toString()
        })

        proc.on('error', (error) => {
          reject(error)
        })

        proc.on('close', (code) => {
          if (code !== 0 && !lastText) {
            reject(new Error(stderr.trim() || `Cursor agent exit ${code}`))
            return
          }

          writer.write({ type: 'text-end', id: textId })
          writer.write({ type: 'finish-step' })
          writer.write({ type: 'finish', finishReason: 'stop' })
          resolve()
        })
      }),
  })

  return createUIMessageStreamResponse({ stream })
}
