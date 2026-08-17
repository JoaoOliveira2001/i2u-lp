# Especificação do cliente — Bot Delivery + Dashboard

## Requisitos obrigatórios

1. CNPJ ou MEI (continuidade do projeto)
2. Bot demonstrável
3. Dashboard demonstrável
4. Valor teto gasto por conversa para resolver um pedido
5. API WhatsApp **não oficial**

## Diferenciais super relevantes

- IA privada (Ollama, LM Studio) ou IA com custo **< R$ 0,03 por pedido**

## Perguntas da proposta

1. Quais IAs já trabalhou?
2. Já trabalhou com IAs privadas (Ollama, LM Studio)?
3. Prazo estimado para conclusão?
4. Consegue hospedar ou ajudar na hospedagem?
5. Quais linguagens e tecnologias?

## Objetivo do bot

- Atendimento parecido com atendente humano (perguntas e respostas)
- Montar **1 pedido** com IDs do JSON de cardápio

## Fluxo macro

1. **Saudação** — boas-vindas, info estática, captura telefone/nome
2. **Endereço** — retirada (endereço loja) ou delivery (rua, número, complemento, bairro validado em JSON)
3. **Montagem do pedido** — localizar prato, adicionais (min/max), observação, mostrar valores; IDs: `p_id`, `e_id`, `i_id`
4. **Pagamento** — forma obrigatória, validar contra lista
5. **Resumo + confirmação**
6. **JSON final** — produtos, adicionais, endereço, bairro, pagamento
7. **Backend auxilia IA** — cálculo de preços por IDs
8. **Similaridade** pedido link x bot
9. **Handoff atendente** — após 2–3 tentativas sem resolver

## Campanhas

Segmentação: (a) não pediram, (b) pediram, (c) todos. Textos variáveis anti-bloqueio.

## Dashboard

- **Admin geral** — multi-restaurante, token, conversas, cadastro básico
- **Restaurante** — estilo WhatsApp Web, QR/instance, saudação editável, contatos, promoções, campanhas, pausar bot por conversa
- **Tags:** Iniciada, Cliente abandonou, Esperando atendente, Pedido final
- **Avisos sonoros** — handoff humano e pedido concluído

## API

Token do restaurante em todos os métodos.

## Materiais de referência

- Prompt + exemplos: https://drive.google.com/file/d/1ZWfl2gZj59kO7sgzq8BCNnb2NvPq42fZ/view
- Collections JSON: https://drive.google.com/file/d/19g8iyIgo1UVGACWkhNP4HCyl_Mf-t4Yq/view
- Vídeo JSON x link: https://drive.google.com/file/d/1ApB0_dpVmHazjosGFsgg7jykRZrO9MR4/view
- 15 pedidos reais (80% cobertura): https://docs.google.com/document/d/11PNdqDzfD6SMMe63lTBKXhJIL1AqHSwFp8Qq5OuN7lY/edit
- Bot similar: https://drive.google.com/file/d/1dj78WbJwDVnsgxnG8rtyD25ABClt9wo-/view

## Base de conhecimento local (POC)

- `knowledge/prompt-regras.txt` — regras do bot (derivado do zip Drive)
- `knowledge/cenarios-teste.txt` — cenários SUCESSO / ATENDENTE
