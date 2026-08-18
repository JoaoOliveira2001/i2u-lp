# POC IA para Restaurante

Prova de conceito de bot de delivery por WhatsApp, alimentado pelos documentos de regras e cenários de teste.

## Documentos (base de conhecimento)

| Arquivo | Descrição |
|---------|-----------|
| `knowledge/prompt_bot_delivery_whatsapp_regras_com_conversas_reais.docx` | Regras do bot |
| `knowledge/cenarios_teste_bot_delivery_whatsapp_com_conversas_reais.docx` | Cenários de teste |
| `knowledge/prompt-regras.txt` | Texto extraído para o system prompt |
| `knowledge/cenarios-teste.txt` | Texto extraído para o system prompt |

A API carrega os `.txt` em `server/lib/restaurant-poc/knowledge.mjs` e injeta no system prompt da OpenAI.

## Rodar local

```bash
npm run dev
```

Abra: http://localhost:5173/poc-restaurante.html

Requer login do Cursor CLI (`cursor agent status`) ou `LLM_PROVIDER=openai` + `OPENAI_API_KEY`.

## Estrutura

- `poc-restaurante.html` — entrada Vite
- `src/poc-restaurante/` — UI de chat (simula cliente)
- `server/lib/restaurant-poc/` — handler + knowledge base
- `api/restaurant-poc/chat.js` — rota Vercel
