#!/usr/bin/env node
import { randomBytes } from 'node:crypto'
import { config } from 'dotenv'
import { createLinearWebhook } from '../server/lib/linear-client.mjs'

config({ path: '.env.local' })
config()

const url = process.argv[2] || process.env.LINEAR_WEBHOOK_URL || 'https://i2u-lp.vercel.app/api/linear/webhook'
const secret = process.env.LINEAR_WEBHOOK_SECRET || randomBytes(32).toString('hex')

async function main() {
  console.log('Registrando webhook Linear...')
  console.log('URL:', url)

  const result = await createLinearWebhook(url, secret)

  if (!result?.success) {
    console.error('Falha ao criar webhook:', result)
    process.exit(1)
  }

  console.log('\nWebhook criado:', result.webhook?.id)
  console.log('\nAdicione na Vercel / .env.local:')
  console.log(`LINEAR_WEBHOOK_SECRET=${secret}`)
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
