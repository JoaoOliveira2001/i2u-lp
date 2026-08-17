import { openai } from '@ai-sdk/openai'
import { convertToModelMessages, streamText } from 'ai'
import {
  buildCursorConversationPrompt,
  streamCursorAgentChat,
} from '../cursor-agent-chat.mjs'
import { getLlmProvider, getOpenAiApiKey } from '../load-env.mjs'
import { buildRestaurantBotSystemPrompt } from './system-prompt.mjs'

export async function handleRestaurantPocChat(request) {
  let messages

  try {
    const body = await request.json()
    messages = body.messages ?? []
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (getLlmProvider() === 'cursor') {
    const prompt = buildCursorConversationPrompt(buildRestaurantBotSystemPrompt(), messages)
    return streamCursorAgentChat({ prompt, originalMessages: messages })
  }

  if (!getOpenAiApiKey()) {
    return new Response(
      JSON.stringify({
        error:
          'OPENAI_API_KEY não configurada. Use LLM_PROVIDER=cursor (padrão) ou adicione OPENAI_API_KEY no .env.local.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
    system: buildRestaurantBotSystemPrompt(),
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
