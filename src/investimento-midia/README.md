# Investimento por campanha

Página Long Life: [https://i2u-lp.vercel.app/investimento-midia](https://i2u-lp.vercel.app/investimento-midia)

Menu: Início (`/cliente/longlife`), Investimento, Documentação (`/docs/longlife`).

Campanhas e valores vêm do banco da unidade (Supabase Bragança). Lançamento é **por dia** (`periodo_dia`, fuso `America/Sao_Paulo`). Campo vazio apaga o lançamento. Zero grava R$ 0.

- Input `type=date`, default hoje
- Upsert com `on_conflict=unidade,periodo_dia,campanha` (não envia `periodo_mes`; o trigger no banco deriva)
- **Copiar dia anterior** preenche só campos vazios
