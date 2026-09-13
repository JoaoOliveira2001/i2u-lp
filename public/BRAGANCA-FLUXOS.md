# Fluxos n8n — Bragança

Documentação dos fluxos de automação da **Bragança** na instância Long Life (n8n).

Foco: o funil **6777 "Vendas Saúde"** (prefixo n8n **`[Bragança]`**). Clone isolado de Jundiaí: [`JUNDIAI-FLUXOS.md`](JUNDIAI-FLUXOS.md) (funil **7175**, prefixo **`[Jundiaí]`**). Config: [`braganca-config.json`](braganca-config.json). **ID da conexão WhatsApp:** [`WHATSAPP-ID-DINAMICO.md`](WHATSAPP-ID-DINAMICO.md) (LON-23 — não editar no n8n).

## Sumário

1. [Visão geral do funil Bragança](#1-visão-geral-do-funil-bragança)
2. [1 - Captação bragança](#2-1---captação-bragança)
3. [2 - Amil/GNDI Trilha E](#3-2---amilgndi-trilha-e)
4. [3.A - Webhook: Transferir](#4-3a---webhook-transferir)
5. [3.B - Weebhook: qualificado](#5-3b---weebhook-qualificado)
6. [4 - Qualifica_IA_Braganca](#6-4---qualifica_ia_braganca)
7. [Handoff_IA_130min_Braganca](#7-handoff_ia_130min_braganca)
8. [Alerta Discord (bugs)](#8-alerta-discord-bugs)
9. [Metabase comercial](#9-metabase-comercial-negociacoes_metabase)
10. [Infra compartilhada](#10-infra-compartilhada)

---

## 1. Visão geral do funil Bragança

Os fluxos da Bragança formam um **funil integrado**. Nenhum é uma peça isolada: cada um entrega o lead ao próximo.

```
Captação (fluxo 1)  →  lead entra em "Novo"
      ↓
Trilha E (fluxo 2)  →  bot aborda e move para "IA atendendo"
      ↓
Qualificação        →  Qualifica IA (fluxo 4) | Webhook Qualificado (3.B)
      ↓
Transferência       →  Webhook Transferir (3.A) | Handoff 130min (fluxo 7)
      ↓
"Qualificado pela IA"  →  fila `proximo_vendedor`  →  consultor
```

### Estágios do funil 6777 "Vendas Saúde"

| Estágio | ID | Papel |
|---|---|---|
| Novo | `43819` | Entrada (site, formulário Meta/RD, importação) |
| IA atendendo | `66328` | Bot conversando com o lead |
| Qualificado pela IA | `66329` | Fila de trabalho do time |
| Contato | `43820` | Vendedor puxou o lead para si |
| Qualificação | `43821` | — |
| Negociação | `43822` | — |
| Fechamento | `43823` | — |
| Fechado (ganho) | `49522` | — |
| Declinado (perdido) | `45972` | Descarte (opt-out / número errado) |

### Regras centrais

- **O bot nunca coloca card em "Contato".** "Contato" significa vendedor assumindo; é o gatilho da trilha F (aviso ao lead). Se o bot escrevesse nessa coluna, mandaria aviso antes de existir consultor.
- **A roleta da fila só gira na transferência.** Captação e abordagem **não** atribuem vendedor — evitam o erro de a fila andar sem ninguém receber lead.
- **Depois de entregue, o bot não mexe mais no card.** Quem move o card após a entrega é o vendedor. Exceções: `opt_out` e `numero_errado` (decisão final do lead).

---

## 2. 1 - Captação bragança

| | |
|---|---|
| **Nome n8n** | `[Bragança] 1 - Captação` (`cYkdLhOi8Y7lzUR1`) |
| **Trigger** | Webhook `POST /webhook/rd-station` |
| **Ativo** | Sim |

### O que faz

Recebe a conversão da **RD Station / LP** e coloca o lead na coluna **"Novo"** do funil, exatamente como o formulário do site faz. A partir daí a trilha C encontra o card e o bot inicia o atendimento — ninguém precisa saber que o lead veio da RD.

**Não atribui vendedor aqui.** Quem gira a roleta é a trilha B, depois da qualificação.

### Fluxo dos nós

```
Webhook RD → E0b Edit Fields: lead RD → E1 Normalizar → E1b Tem payload?
       ├─ sim → E2 CRM: criar negociação → E3 Interpretar
       │         ├─ E4 Supabase → E5 Responder ao RD
       │         └─ E3b Tem id_negociacao? → Metabase sync
       └─ não → E5b Responder ignorado (200 ao RD, sem chamar CRM)
```

JSON canônico: `workflows/captacao-braganca.json`

### Detalhes técnicos

- **Edit Fields (E0b)** — achata o webhook da RD nos campos que o resto do fluxo usa: `rd_id`, `nome`, `email`, `telefone`, `origem_telefone`, `cidade`, `vidas`, `tipo_empresa`, `campanha`, `produto`, `plano`, `identificador`. Em cada campo tenta **`last_conversion.content`**, se vazio **`first_conversion.content`**, depois `custom_fields` e a raiz do lead. `origem_telefone` grava qual camada tinha o número (`last` / `first` / `custom_fields` / `raiz`).
- **Normalização de telefone** — mesma validação do site: DDD válido, celular com 9, rejeita dígito repetido. Lead sem telefone válido **não segue para o CRM** (evita `JSON Body is not valid JSON`); o IF `E1b. Tem payload?` manda para `E5b` com `{ status:'ok', criados:0, ignorados:1, motivo:'sem_telefone_valido' }` para o RD não reenviar.
- **Mapeamento de fonte** (`id_fonte`) — campanha/produto/`conversion_identifier` → fonte no CRM. Chave normalizada (sem acento/minúscula). Se não achar, cai em `FONTE_PADRAO` (Não Informado) sem quebrar o fluxo.
- **Mapeamento de marca** — `gndi-saude-braganca` → GNDI Bragança; `amil-braganca` → Amil Bragança.
- **Vidas** — grava o **texto da faixa** (ex.: "entre 2 e 5 pessoas"), não só o número mínimo. É o campo que o bot lê para montar o contexto.
- **Tipo de plano** — trata a resposta do Meta ("você tem CNPJ ou MEI?"), com **negativa primeiro** para não classificar quem não tem CNPJ como empresarial.
- **Supabase** — insere `chat_sessions` com `trigger_type=rdstation`, `session_key=rd-<telefone>-<timestamp>`, `status=nova` (ou `erro_crm` se a criação falhar).
- **Metabase** — só dispara se `ok && id_negociacao` (`E3b`). Sem id, não chama o sync (evita 400 `missing_id_negociacao`).
- **Resposta ao RD** — sucesso: `{ status:'ok', recebidos, criados, ignorados }`; ignore: `{ status:'ok', recebidos:1, criados:0, ignorados:1, motivo }`.

---

## 3. 2 - Amil/GNDI Trilha E

| | |
|---|---|
| **ID n8n** | `7Y7HKH5tl3cDx7i5` |
| **Trigger** | Crones + Webhook `crm-transferir` |
| **Ativo** | Sim |

### O que faz

Orquestrador principal. É um workflow com **3 ramos** independentes:

| Ramo | Gatilho | Responsabilidade |
|---|---|---|
| **C** | Cron a cada **1 min** | Abordar leads em "Novo" e disparar o agente de IA |
| **D** | Cron a cada **10 min** | Transferir por silêncio (lead que não respondeu) |
| **B** | Webhook `crm-transferir` | Transferência manual/por motivo (pedido de humano, opt-out, etc.) |

O ramo B compartilha os mesmos nós do fluxo **3.A** (Webhook Transferir) — ver [seção 4](#4-3a---webhook-transferir).

### Ramo C — abertura com IA (Cron 1 min)

```
C0 Cron 1min → C1 listar negociações → C1b opt-outs → C1c inbox
  → C2 Filtrar leads em Novo → C3 campos do lead → C4 Montar contexto
  → C6 iniciar agente → C7 interpretar → C7b disparo ok?
       ├─ sim → C8 mover para IA atendendo
       └─ não → C9 POST crm-transferir (motivo=erro_agente)
```

- **C2** filtra cards em **Novo** (idade máx. 6h, lote máx. 5/rodada) aplicando várias travas anti-spam/anti-clone:
  - **LGPD**: nunca aborda quem está na lista de opt-out.
  - **Números próprios**: nunca dispara para as conexões do bot.
  - **Anti-clone**: por telefone; se o lead já tem card fora de "Novo" ou conversa mais nova que o card, não aborda de novo.
  - Marca em `staticData.disparados` **antes** de disparar. Em falha do start, o C7 **mantém** a marca e registra `transferidos` — o lead não volta para a próxima rodada do cron.
- **C4** monta o contexto (nome, cidade, plano, vidas, etc.) e chama o agente **17530** (`Amil_Braganca_Bot`) via `iniciar/whatsapp`, validando o contato CRM e cruzando `remoteJidAlt`. O `id_whatsapp` **não é fixo**: B1/C2/C4/D2 leem os WhatsApps do agente `17530` e usam o primeiro **conectado** (cache 5 min). Trocar o chip no CRM passa a valer sozinho — ver [`WHATSAPP-ID-DINAMICO.md`](WHATSAPP-ID-DINAMICO.md).
- **C6/C8** — após aceito, move o card para **IA atendendo (66328)** com `proxima_acao`.
- **C7b/C9** — se o POST `iniciar/whatsapp` falhar (depois do retry HTTP do C6), posta em `crm-transferir` com `motivo=erro_agente`. A roleta `proximo_vendedor` gira e o card vai para **Qualificado pela IA (66329)** já com consultor. Falha no C4 (ex.: WhatsApp desconectado) continua fora deste fallback.

### Ramo D — transferência por silêncio (Cron 10 min)

```
D0 Cron 10min → D1 listar → D1b inbox → D2 Filtrar sem resposta → D3 Transferir
```

- Lead em **IA atendendo (66328)** cuja **última mensagem é nossa** (`fromMe=true`) e com **≥ 210 min de silêncio** (3h30, depois da 3ª tentativa de follow-up de 2h40) → posta no webhook `crm-transferir` com `motivo=sem_resposta`.
- Trava em `staticData.transferidos` (24h) para não transferir o mesmo lead duas vezes.

---

## 4. 3.A - Webhook: Transferir

| | |
|---|---|
| **ID n8n** | `ow35uJafwXcn4dA5` |
| **Trigger** | Webhook `POST /webhook/crm-transferir` |
| **Ativo** | Sim |

### O que faz

Transferência para consultor humano. O agente do CRM chama esta ferramenta quando o lead **pede atendimento humano**, toca em **tema sensível**, ou quando não há qualificação a registrar (opt-out, número errado, sem resposta). Usa a **mesma roleta do site**, então chat, formulário e agente giram a mesma fila.

### Fluxo dos nós

```
Webhook → B0 Inbox → B1 Validar → B1b localizar negociação → B2 Fila próximo vendedor
  → B4 Montar transferência → B3 CRM atribuir/mover → B5 Supabase registrar
  → B6 Responder → B6b wait 90s → B7 Encerrar sessão do agente
```

### Motivos aceitos

| Motivo | Estágio | Comportamento |
|---|---|---|
| `qualificado` | Qualificado IA | Gira a roleta, atribui vendedor |
| `pediu_humano` | Qualificado IA | Gira a roleta, atribui vendedor |
| `tema_sensivel` | Qualificado IA | Não tratar por bot (contrato, cobrança, reclamação, saúde) |
| `sem_resposta` | Qualificado IA | Só dados do formulário; tentar ligação/e-mail |
| `erro_agente` | Qualificado IA | Falha no start do agente; gira a roleta, atribui vendedor sem abordagem |
| `opt_out` | **Declinado** | Não gasta posição da roleta; só marca e encerra |
| `numero_errado` | **Declinado** | Não gasta posição da roleta; só marca e encerra |

Obs.: `urgencia_medica` (versão antiga da ferramenta) é convertido para `tema_sensivel`. Motivo desconhecido cai em `pediu_humano`.

### Regras importantes (técnicas)

- **Placeholders**: se o CRM não trocar um `{{placeholder}}`, o valor é limpo para `null` (placeholder vale menos que campo vazio).
- **Fallback por inbox**: se chega sem `id_negociacao` e sem `telefone`, cruza a conversa mais recente do inbox com o mapa `staticData.ativos` para achar o card. B1 resolve o `id_whatsapp` do bot no CRM (não usa mais `26668`).
- **Anti-id-fantasma**: valida o `id_negociacao` contra os cards que existem agora no CRM (B1b). Se o id está velho, usa o card que a busca encontrou — corrige o caso em que o CRM devolvia 404 e o card ficava preso em "IA atendendo".
- **Não rebaixa card entregue a humano**: se o card já está em etapa de vendedor (Qualificado IA em diante) **e o dono é consultor humano**, a chamada é ignorada para etapa/dono. Se o dono ainda é bot (`12584`/`13182`/`12592`/`16074`), **gira a fila** e atribui. Só `opt_out`/`numero_errado` são exceções.
- **Urgência** (`urgente`) = urgência **comercial** (quer fechar rápido). Encurta o prazo da próxima ação (10 min) mas não muda etapa nem fila.
- **Canal de retorno**: se o vendedor tem número próprio (`id_whatsapp_vendedor`, ex. Larissa → `22639`), o agente avisa o lead que será chamado de outro número.
- **B3** usa os dados do **B4 por nome** (nunca `$json`, que seria a resposta do encerramento de sessão) — evita PUT vazio que deixava o card em "IA atendendo".

---

## 5. 3.B - Weebhook: qualificado

| | |
|---|---|
| **ID n8n** | `ZkI81pag9YTt4YN2` |
| **Trigger** | Webhook `POST /webhook/longlife-qualificacao` (qualificação) |
| **Ativo** | Sim |

### O que faz

Recebe a qualificação feita pelo agente de IA ao **encerrar a conversa** (qualificado ou parcial), grava os dados no Supabase e nos campos personalizados do CRM, calcula o **score**, e **encadeia automaticamente a transferência**.

O agente do CRM precisa de **uma ferramenta só** para o caminho feliz (`registrar_qualificacao`); a transferência é disparada por este fluxo. A ferramenta `transferir_para_consultor` continua existindo para os casos sem qualificação (opt-out, pediu humano, etc.).

### Fluxo dos nós

```
Webhook → A0a Campos → A0 Inbox → A1 Validar → A1b localizar → A1c Resolver id
  → A2 Supabase gravar → A3 CRM atualizar → A4 Explodir campos
  → A5 CRM upsert campo → A5b Preparar transferência → A5c Deve transferir?
  → A5d Encadear transferência → A6 Responder
```

### Detalhes técnicos

- **Normalização**: telefone com DDD, vidas pegando o **primeiro número** da faixa (valor conservador), perfil com tratamento de acento/CNPJ/negativa, temperatura (`quente/morno/frio`, default `morno`). A1 resolve `id_whatsapp` no CRM para filtrar o inbox do bot (LON-23).
- **Score** (0–100): parte de **45** e soma por perfil (+10), vidas (+10), idades (+8), cidade (+5), plano atual (+5), portabilidade (+8), rede (+5), decisor (+5), empresarial (+5), 3+ vidas (+4), urgência (+15), quente (+8); frio desconta (−10). Clamp final em 1–100.
- **Campos personalizados gravados**: `tipo_plano` (5280), `vidas` (3313), `cidade` (3319), `tem_plano_hoje` (5281), transcrição (5284) e **`qualifica_IA` (5587)**.
- **`qualifica_IA=sim` obrigatório** — é o campo que a trilha **Qualifica IA (fluxo 4)** lê. Se o agente não preencheu, o A4 preenche automaticamente.
- **Transcrição**: completa o campo resumo se a IA não preencheu.
- **A5c/A5d** — se a transferência for necessária, encadeia o webhook `crm-transferir` com `motivo=qualificado`.

---

## 6. 4 - Qualifica_IA_Braganca

| | |
|---|---|
| **ID n8n** | `oaHzdvwg6RNlgsGg` |
| **Trigger** | Cron a cada **1 min** |
| **Ativo** | Sim |

### O que faz

Varre o funil e move para **Qualificado pela IA (66329)** os leads em **IA atendendo (66328)** que já foram qualificados (campo `qualifica_IA` = sim). Complementa o fluxo 3.B: mesmo que a transferência não tenha sido encadeada, o lead qualificado não fica preso na conversa com o bot.

### Fluxo dos nós

```
Schedule 1min → Listar IA Atendendo → Preparar Lote → Filtrar qualifica_IA
  → Tem qualificados? → Loop Mover → Encadear transferencia (`crm-transferir`) → Concluído
```

### Detalhes técnicos

- Lista o funil 6777 (a API ignora filtro de estágio) e **filtra client-side** `66328` **ou `66329` com dono bot**.
- Verifica o campo personalizado `qualifica_IA (5587)`; se `sim/true/yes/1`, qualifica. Card em `66329` com dono bot entra mesmo sem o campo (recuperação).
- Ignora `66329` que já tem **consultor humano**.
- **Rate limit**: até **35 negócios/execução** — 20 mais recentes + 15 rotativos (`staticData.offset`).
- **Não faz PUT direto em 66329** — encadeia `crm-transferir` (`motivo=qualificado`) para girar `proximo_vendedor`.
- Tem nós `Checar CRM` que disparam alerta Discord em falha de API (ver [seção 8](#8-alerta-discord-bugs)).

---

## 7. Handoff_IA_130min_Braganca

| | |
|---|---|
| **ID n8n** | `lvcexDiMlxf3ojNO` |
| **Trigger** | Cron a cada **5 min** |
| **Ativo** | Sim |

### O que faz

Pega leads que estão em **IA atendendo (66328)** há **≥ 130 min** sem desfecho e os encaminha para **Qualificado pela IA (66329)**, atribuindo vendedor pela fila `proximo_vendedor`. É o desfecho dos leads que o bot abordou e que não responderam (follow-ups concluídos).

### Fluxo dos nós

```
Schedule 5min → Listar Funil → Filtrar 130min IA → Tem candidatos?
  → Loop Handoff → Precisa fila? → Fila próximo vendedor → Montar transferência
  → CRM atribuir/mover → Supabase registrar → Encerrar sessão agente → Loop
```

### Detalhes técnicos

- **Rastreio de tempo via `staticData`**, não `UpdatedAt` (que reseta a cada follow-up do CRM). Na 1ª detecção, faz bootstrap com `UpdatedAt`/`CreatedAt`.
- Lote máx. de **15** por execução, ordenados pelo tempo de IA (mais antigos primeiro).
- **Respeita vendedor humano já atribuído**: se o lead tem `id_usuario` humano (não bot `13182`/`12584`/`12592`/`16074`), não gira a fila de novo — só move para `66329` mantendo o dono. Conta de marketing/bot **não** conta como vendedor: a fila é obrigatória.
- Se a fila estiver vazia, o item é pulado (`fila_vazia`) **sem PUT**.
- Encadeia: fila `proximo_vendedor` → `PUT` CRM (estágio 66329 + `id_usuario`) → `PATCH chat_sessions` (etapa `transferida_sem_resposta`) → `DELETE` sessão do agente.

---

## 8. Alerta Ops (hub)

Todos os fluxos acima são instrumentados com nós **`Checar CRM: …`** após cada chamada HTTP ao CRM (`integracao.agendasistemacrm.com.br`).

### Como funciona

Quando uma resposta sai de 2xx, ou o body vem `{ status: "error" }`, o nó posta no webhook **`longlife-crm-api-alert`** (hub **`Alerta_Ops_LongLife`**, `lHxgrWn8KTUJXkkh`) sem quebrar o fluxo principal.

O monitor **`Monitor_Leads_Parado_Braganca`** (cron 10 min) detecta leads parados e posta em **`longlife-ops-alert`** no mesmo hub.

O hub então:

1. **Deduplica** por tipo + lead ou workflow+nó (cooldown 15–60 min).
2. Envia **Cursor** → **WhatsApp I2U AGENTS** → **Discord** (opcional).
3. Tipos: `crm_api_error`, `lead_stuck_novo`, `lead_stuck_ia`, `lead_qualificado_sem_vendedor`.

| Workflow Bragança | JSON / ID |
|---|---|
| Qualifica IA | `qualifica-ia-braganca.json` → `oaHzdvwg6RNlgsGg` |
| Webhook qualificado | `live-ZkI81pag9YTt4YN2-discord-patched.json` |
| Trilha E (RD) | `live-7Y7HKH5tl3cDx7i5-discord-patched.json` |
| Handoff 130min | `handoff-ia-130min-braganca.json` |
| Monitor leads parados | `monitor-leads-parado-braganca.json` |

Prompt Cursor: `CURSOR-AUTOMATION-OPS-PROMPT.md`. Config Discord opcional: `LON-discord-alert-checklist.md`.

---

## 9. Metabase comercial (`negociacoes_metabase`)

Fact table no Supabase Bragança para o dashboard **coorte por entrada** (LON-16). **Não** altera `chat_sessions`.

| Recurso | Valor |
|---|---|
| Tabela | `public.negociacoes_metabase` |
| Funil v1 | `6777` (`unidade='braganca'`) |
| Webhook sync 1 card | `POST /webhook/longlife-metabase-sync-negociacao` body `{ "id_negociacao": N }` |
| Workflow webhook | `Sync_Metabase_Negociacao_Webhook` → `cjesFALuQTY439x3` |
| Full sync (03:00 + manual) | `Sync_Metabase_Negociacoes_Full` → `9qfs3L9Qi59oAMGt` |
| Carga inicial (script) | `workflows/sync-metabase-negociacoes-initial.py` |
| JSON canônico | `sync-metabase-negociacao-webhook.json`, `sync-metabase-negociacoes-full.json` |
| Patch hooks Bragança | `patch-braganca-metabase-webhook.py` |
| Metabase | [dashboard 4](https://metabase.integration2u.com/dashboard/4) + DB `Supabase Bragança (LongLife)` |

**Quem chama o webhook** (fire-and-forget, `continueOnFail`): Captação RD (`E3`), Qualificado (`A3`), Transferir / Trilha E (`B3`), Handoff 130min (`CRM atribuir e mover`).

**Regras de mapeamento:** `created_at` = entrada; `unidade` = `braganca`|`jundiai`; `valor` = COALESCE(valor, valor_mensalidade, valor_implantacao, 0); `is_won=1` se estágio ganho da unidade ou `data_ganho`; `is_lost=1` se declinado da unidade (6777→45972, 7175→46943); cidade 3319/3473; motivo de perda **7798** (Bragança) / **8106** (Jundiaí). UPSERT `on_conflict=unidade,id`.

---

## 10. Infra compartilhada

### Serviços

| Recurso | Valor |
|---|---|
| CRM (API Lumion) | `integracao.agendasistemacrm.com.br/api/v1` |
| Supabase | `jlyqptmxcloouaxumdqu.supabase.co` |
| Fila de vendedores | RPC `proximo_vendedor(p_unidade='braganca')` (tabela `vendedores_fila` / `fila_estado`) |
| Alerta Discord | `POST /webhook/longlife-crm-api-alert` |
| Sync Metabase | `POST /webhook/longlife-metabase-sync-negociacao` |

### Constantes

| Constante | Valor | Uso |
|---|---|---|
| Funil | `6777` | Vendas Saúde |
| Agente de IA | `17530` | `Amil_Braganca_Bot` |
| Conexão WhatsApp | dinâmico | vínculo atual do agente `17530` (hoje `27059` BotDiegoQualificacao) |
| Vendedor (Larissa) | `12604` | WhatsApp `22639` (número próprio) |

### Campos personalizados do CRM

| Campo | ID |
|---|---|
| tipo_plano | `5280` |
| vidas | `3313` |
| cidade | `3319` |
| tem_plano_hoje | `5281` |
| transcrição / resumo | `5284` |
| qualifica_IA | `5587` |
| **motivo de perda** (LON-24) | `7798` Bragança / `8106` Jundiaí (`Motivo de Perda`; API tipo STRING) |

### Fila multi-unidade (padrão único)

`vendedores_fila`/`fila_estado` e a RPC `proximo_vendedor(p_unidade text)` agora servem Bragança **e** Jundiaí no Supabase compartilhado (`jlyqptmxcloouaxumdqu`). Os nós de fila (`B2. Fila: proximo vendedor` na Trilha/Transferir e `Fila proximo vendedor` no Handoff) chamam a RPC com `{"p_unidade":"braganca"}`. Migração: `reports/metabase/sql/003_fila_vendedores_unidade.sql`. Novas unidades entram só inserindo linhas com a nova `unidade`.
