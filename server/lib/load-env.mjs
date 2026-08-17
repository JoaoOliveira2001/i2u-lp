import { config } from 'dotenv'

config({ path: '.env.local' })
config()

export function getOpenAiApiKey() {
  return process.env.OPENAI_API_KEY || process.env.CURSOR_OPENAI_API_KEY || ''
}

export function getLlmProvider() {
  const provider = (process.env.LLM_PROVIDER || 'cursor').toLowerCase()
  return provider === 'openai' ? 'openai' : 'cursor'
}
