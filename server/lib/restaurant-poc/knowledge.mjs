import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const KNOWLEDGE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../poc-ia-restaurante/knowledge',
)

let cachedKnowledge = null

export function loadRestaurantKnowledge() {
  if (cachedKnowledge) return cachedKnowledge

  const promptRules = readFileSync(join(KNOWLEDGE_DIR, 'prompt-regras.txt'), 'utf8')
  const testScenarios = readFileSync(join(KNOWLEDGE_DIR, 'cenarios-teste.txt'), 'utf8')

  cachedKnowledge = { promptRules, testScenarios }
  return cachedKnowledge
}
