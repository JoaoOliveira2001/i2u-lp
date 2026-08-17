#!/usr/bin/env bash
set -euo pipefail

# Atualiza um produto no XP Lanches via Supabase (login + PATCH).
#
# Uso:
#   XP_EMAIL="operacao@xplanches.com" XP_PASSWORD="sua-senha" \
#     ./scripts/xplanches-update-produto.sh 1 --descricao "Nova descrição"
#
#   XP_EMAIL="..." XP_PASSWORD="..." \
#     ./scripts/xplanches-update-produto.sh 1 --preco 18.90 --nome "XP Burguer"
#
#   XP_EMAIL="..." XP_PASSWORD="..." \
#     ./scripts/xplanches-update-produto.sh 1 --json '{"descricao":"...","preco":17.9}'

SUPABASE_URL="${SUPABASE_URL:-https://sqkdarstudcxrfgpwpvw.supabase.co}"
SUPABASE_KEY="${SUPABASE_KEY:-sb_publishable_Ont3rUOCVlRY0iBi60KZGw_rS58jycd}"

if [[ $# -lt 1 ]]; then
  echo "Uso: XP_EMAIL=... XP_PASSWORD=... $0 <produto_id> [--descricao TEXT] [--preco NUM] [--nome TEXT] [--json '{...}']" >&2
  exit 1
fi

PRODUCT_ID="$1"
shift

if [[ -z "${XP_EMAIL:-}" || -z "${XP_PASSWORD:-}" ]]; then
  echo "Defina XP_EMAIL e XP_PASSWORD no ambiente." >&2
  exit 1
fi

PATCH_JSON="$(
  python3 - "$@" <<'PY'
import json, sys

args = sys.argv[1:]
data = {}

i = 0
while i < len(args):
    arg = args[i]
    if arg == "--json":
        i += 1
        data.update(json.loads(args[i]))
    elif arg == "--descricao":
        i += 1
        data["descricao"] = args[i]
    elif arg == "--preco":
        i += 1
        data["preco"] = float(args[i])
    elif arg == "--nome":
        i += 1
        data["nome"] = args[i]
    elif arg == "--categoria":
        i += 1
        data["categoria"] = args[i]
    elif arg == "--level":
        i += 1
        data["level"] = args[i]
    elif arg in ("--ativo", "--inativo"):
        data["ativo"] = arg == "--ativo"
    else:
        raise SystemExit(f"Flag desconhecida: {arg}")
    i += 1

if not data:
    raise SystemExit("Informe ao menos um campo (--descricao, --preco, --nome ou --json).")

print(json.dumps(data, ensure_ascii=False))
PY
)"

echo "→ Login em $XP_EMAIL ..."
AUTH_RESPONSE="$(
  curl -sS -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$XP_EMAIL\",\"password\":\"$XP_PASSWORD\"}"
)"

ACCESS_TOKEN="$(
  python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("access_token",""))' <<<"$AUTH_RESPONSE"
)"

if [[ -z "$ACCESS_TOKEN" ]]; then
  echo "Falha no login:" >&2
  python3 -m json.tool <<<"$AUTH_RESPONSE" >&2 || echo "$AUTH_RESPONSE" >&2
  exit 1
fi

echo "→ Atualizando produto id=$PRODUCT_ID ..."
UPDATE_RESPONSE="$(
  curl -sS -w "\n__HTTP__:%{http_code}" -X PATCH \
    "$SUPABASE_URL/rest/v1/produtos?id=eq.$PRODUCT_ID" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "$PATCH_JSON"
)"

HTTP_CODE="${UPDATE_RESPONSE##*__HTTP__:}"
BODY="${UPDATE_RESPONSE%__HTTP__:*}"

echo "HTTP $HTTP_CODE"
if [[ -n "$BODY" ]]; then
  python3 -m json.tool <<<"$BODY" 2>/dev/null || echo "$BODY"
else
  echo "(sem corpo — verifique no painel se o RLS permitiu o update)"
fi

echo "→ Conferindo produto ..."
curl -sS "$SUPABASE_URL/rest/v1/produtos?id=eq.$PRODUCT_ID&select=id,nome,preco,descricao,ativo" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  | python3 -m json.tool
