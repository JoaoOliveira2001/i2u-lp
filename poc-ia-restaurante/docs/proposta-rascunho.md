# Proposta — Bot Delivery WhatsApp + Dashboard (rascunho Integration2U)

## Respostas às perguntas obrigatórias

### 1) Quais IAs já trabalhou?

OpenAI (GPT-4o / 4o-mini), Anthropic (Claude), modelos via **Cursor Agent** e **Vercel AI SDK** em produção (dashboards com assistente por prompt, tool-calling e streaming). Experiência com prompts longos, base de conhecimento em documentos e validação por cenários de teste — padrão já aplicado na POC deste projeto (`poc-ia-restaurante`).

### 2) Já trabalhou com IAs privadas como Ollama e LM Studio?

Sim. Ollama e LM Studio (API compatível com OpenAI) para reduzir custo e manter dados on-premise. Para este projeto, recomendamos **modelo híbrido**: LLM local ou mini (Ollama `llama3.1` / `qwen2.5`) para NLU + roteamento, e funções determinísticas no backend (preço, bairro, IDs) — alinhado ao item 8 da spec (“backend ajuda a IA”).

### 3) Qual prazo imagina para a conclusão?

| Fase | Escopo | Prazo estimado |
|------|--------|----------------|
| **MVP demonstrável** | Bot + dashboard básico + 1 restaurante + handoff atendente + JSON pedido | **6–8 semanas** |
| **Produto completo** | Multi-loja, campanhas, tags, avisos sonoros, métricas de custo/conversa | **+8–10 semanas** |

*Depende de acesso aos JSONs finais, homologação dos 15 pedidos reais e instância WhatsApp estável.*

### 4) Consegue hospedar a solução ou ajudar no processo de hospedagem?

Sim. Hospedagem em **VPS ou cloud** (ex.: Hetzner, AWS sa-east-1, Railway) com:

- API Node.js + PostgreSQL/Supabase
- Worker WhatsApp (Evolution API / Baileys) em container dedicado
- Ollama opcional na mesma VPS ou servidor separado
- SSL, backup, monitoramento

Acompanhamos DNS, deploy e variáveis de ambiente; o cliente mantém CNPJ/MEI e contratos de infra.

### 5) Quais linguagens e tecnologias serão empregadas?

| Camada | Stack sugerida |
|--------|----------------|
| **Bot / IA** | Node.js, Vercel AI SDK, prompt + tool-calling; Ollama/LM Studio ou GPT-4o-mini conforme custo |
| **Backend** | Node.js (Fastify/Express), PostgreSQL (Supabase), Redis (sessão/fila) |
| **WhatsApp não oficial** | Evolution API ou Baileys (instância por QR no dashboard) |
| **Dashboard** | React + Vite (layout WhatsApp Web), Supabase Auth, realtime |
| **Integração cardápio** | REST com token por restaurante; cálculo de preço 100% no backend por IDs |

---

## Valor teto por conversa (requisito 4)

Proposta de controle:

| Cenário | Custo estimado/conversa | Como garantir teto |
|---------|-------------------------|-------------------|
| **IA privada (Ollama 8B)** | ~R$ 0,00–0,01 (só infra) | Limite de tokens + max turns |
| **GPT-4o-mini (cloud)** | ~R$ 0,02–0,08 | Cache de system prompt, JSON compacto, backend calcula totais |
| **Meta combinada** | **< R$ 0,03/pedido** | Hybrid: NLU local + confirmações via API; handoff cedo se ambíguo |

*POC atual já injeta regras + cenários (~40k chars) — em produção usamos JSON compacto + RAG por intent para reduzir tokens.*

---

## O que já temos (POC Integration2U)

- Pasta `poc-ia-restaurante/` com prompt e cenários de teste do cliente
- Chat demonstrável: http://localhost:5173/poc-restaurante.html
- IA via assinatura Cursor (dev) ou OpenAI/Ollama (prod)
- Regras alinhadas ao zip: delivery, adicionais, bandeira cartão/ticket, handoff, link cardápio

## Gap até produto completo

1. Conectar Evolution API / Baileys (WhatsApp real)
2. State machine de pedido + JSON `p_id` / `e_id` / `i_id`
3. API de preço/bairro/pagamento (backend determinístico)
4. Dashboard WhatsApp Web + tags + som + campanhas
5. Contador de tentativas → fila “Esperando atendente”
6. Multi-tenant (admin + restaurante)

---

## Próximo passo sugerido

1. Validar POC com os 15 pedidos reais (meta 80% automático)
2. Receber JSON collections do Drive e mapear endpoints
3. Fechar teto R$/conversa e escolha Ollama vs cloud
4. Demo integrada: 1 instância WhatsApp + dashboard + 1 pedido fechado em JSON
