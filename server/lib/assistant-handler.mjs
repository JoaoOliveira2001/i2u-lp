import { openai } from '@ai-sdk/openai'
import { convertToModelMessages, stepCountIs, streamText } from 'ai'
import { createAssistantTools } from './assistant-tools.mjs'
import { getOpenAiApiKey } from './load-env.mjs'
import { ASSISTANT_SYSTEM_PROMPT } from './system-prompt.mjs'

export async function handleAssistantChat(request) {
  if (!getOpenAiApiKey()) {
    return new Response(
      JSON.stringify({
        error:
          'OPENAI_API_KEY não configurada. Adicione no .env.local para usar o assistente.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )
  }

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

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
    system: ASSISTANT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: createAssistantTools(),
    stopWhen: stepCountIs(8),
  })

  return result.toUIMessageStreamResponse()
}
