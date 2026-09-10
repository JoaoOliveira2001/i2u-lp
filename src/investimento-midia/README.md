# Investimento de mídia (LON-22)

Página interna da Long Life (Bragança) para lançar valor investido por campanha no mês de **entrada do lead**.

URL: [https://i2u-lp.vercel.app/investimento-midia](https://i2u-lp.vercel.app/investimento-midia)

Dados: Supabase Bragança (`jlyqptmxcloouaxumdqu`), não o i2u-lucro.

| Recurso | Origem |
|---|---|
| Catálogo | VIEW `investimento_midia_catalogo?unidade=eq.braganca` |
| Valores | tabela `investimento_midia` unique `(unidade, periodo_mes, campanha)` |

Shell com sidebar. Seção ativa por hash (`#investimento`, `#como-funciona`, …).

## Como adicionar item na sidebar

1. Array `NAV_ITEMS` em `main.js`:

```js
{ id: "nova-secao", label: "Nova seção" }
{ id: "depois", label: "Ainda não", soon: true }
{ id: "fila", label: "Fila", badge: "em breve" }
```

2. Painel em `investimento-midia.html`:

```html
<section class="panel" data-panel="nova-secao" hidden>
  …
</section>
```

Links externos: `SIDEBAR_LINKS`. Rodapé: `Long Life · Bragança · LON-22`.

Vazio = DELETE do lançamento. Zero = grava R$ 0.
