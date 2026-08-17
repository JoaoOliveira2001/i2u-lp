#!/usr/bin/env node
/**
 * n8n G2L escuta-blip → Supabase direto (sem MacroBrain).
 *
 * Usage: node scripts/setup-n8n-g2l-monitor.mjs
 */

const API_KEY =
  process.env.N8N_API_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MDkwYzg4Yy1mYTE5LTQ3MzItODY3Yy1hODNjYzIwNGI1ZjEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzg0ODE5NTY5LCJleHAiOjE3ODczNzEyMDB9.HOlsezPRP_QyEN2g1rUI1_LOSP___r26yIlT1X5ECxc'

const BASE = process.env.N8N_BASE_URL || 'https://n8n.recargaclub.com.br/api/v1'
const WORKFLOW_ID = process.env.N8N_WORKFLOW_ID || 'OsnRIOdlCtoWshfg'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://tldpeecelswgmsoeqimv.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsZHBlZWNlbHN3Z21zb2VxaW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMjAyMTcsImV4cCI6MjA5NzU5NjIxN30.OhKrRXMOlV6Y1z1AGF3BqtT8-_kyGeWJzODKNTUBx9E'

const PROJECT_ID = 'cf7e9035-c5bb-4b3f-9b70-d78cd362de7f'
const MONITOR_ID = '81ee8fe6-3e94-4dd8-8afd-4090dc40e05b'

const BUILD_I2U_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const INGEST_SUPABASE_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'

const BUILD_I2U_CODE = `const j = $input.first().json;
const BLIP_APP_ID = 'g2l';

function buildBlipContactUrl(data) {
  const identity = data.contactIdentity || null;
  const ticketId = data.ticketId || null;
  if (ticketId) {
    return 'https://portal.blip.ai/application/detail/' + BLIP_APP_ID + '/desk/history/' + ticketId;
  }
  if (identity) {
    return 'https://portal.blip.ai/application/detail/' + BLIP_APP_ID + '/messages/' + encodeURIComponent(identity);
  }
  return null;
}

let event_type = 'other';

if (j.isFailure) {
  const reason = String(j.matchReason || '').toLowerCase();
  const blipType = String(j.blipType || '').toLowerCase();
  if (reason.includes('exception') || blipType.includes('exception')) {
    event_type = 'exception_redirect';
  } else {
    event_type = 'error';
  }
} else if (j.skipReason === 'empty_body') {
  event_type = 'other';
} else {
  event_type = 'success';
}

const executionId = j.executionId || String($execution.id);
const n8nExecutionUrl =
  j.n8nUrl ||
  ('https://n8n.recargaclub.com.br/workflow/' + $workflow.id + '/executions/' + executionId);

return [{
  json: {
    monitor_id: '${MONITOR_ID}',
    project_id: '${PROJECT_ID}',
    event_type,
    block_name: j.blockName || null,
    block_id: j.subbotId || j.routerId || null,
    conversation_id: j.contactIdentity || j.ticketId || null,
    contact_id: j.contactIdentity || null,
    error_code: j.errorCode || null,
    error_message: j.message || j.skipReason || null,
    occurred_at: new Date().toISOString(),
    raw_payload: j.raw || j,
    n8n_execution_url: n8nExecutionUrl,
    blip_contact_url: buildBlipContactUrl(j),
    isFailure: Boolean(j.isFailure),
    skipReason: j.skipReason || null,
  },
}];`

async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'X-N8N-API-KEY': API_KEY,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${path}: ${typeof body === 'string' ? body : JSON.stringify(body)}`)
  }
  return body
}

function patchClassifyFailure(nodes) {
  return nodes.map((node) => {
    if (node.name !== 'ClassifyFailure') return node
    let jsCode = node.parameters.jsCode
      .replace(/project: body\.project \|\| "ITV"/g, 'project: body.project || "gl2"')
      .replace(/project: "ITV"/g, 'project: "gl2"')
    jsCode = jsCode.replace(
      /const base = "https:\/\/wf\.agents\.macrolabs\.app";[\s\S]*?return `\$\{base\}\/workflow\/\$\{workflowId\}\/executions\/\$\{executionId\}`;/,
      'return `https://n8n.recargaclub.com.br/workflow/${$workflow.id}/executions/${executionId}`;',
    )
    return { ...node, parameters: { ...node.parameters, jsCode } }
  })
}

function rebuildNodes(existingNodes) {
  const patched = patchClassifyFailure(existingNodes)
  const keepNames = new Set([
    'Webhook',
    'ClassifyFailure',
    'IsFailure',
    'RespondOkIngested',
    'RespondOkSkipped',
  ])
  const kept = patched.filter((n) => keepNames.has(n.name))

  const isFailure = kept.find((n) => n.name === 'IsFailure')
  isFailure.parameters.conditions.conditions[0].leftValue =
    "={{ $('BuildI2UEvent').item.json.isFailure }}"

  const respondIngested = kept.find((n) => n.name === 'RespondOkIngested')
  respondIngested.parameters.responseBody =
    '={{ { ok: true, ingested: true, event_type: $(\'BuildI2UEvent\').item.json.event_type, supabase_id: $json.id || null } }}'

  return [
    kept.find((n) => n.name === 'Webhook'),
    kept.find((n) => n.name === 'ClassifyFailure'),
    {
      parameters: { jsCode: BUILD_I2U_CODE },
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [-256, 80],
      id: BUILD_I2U_ID,
      name: 'BuildI2UEvent',
    },
    {
      parameters: {
        method: 'POST',
        url: `${SUPABASE_URL}/rest/v1/bot_events`,
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'apikey', value: SUPABASE_ANON_KEY },
            { name: 'Authorization', value: `Bearer ${SUPABASE_ANON_KEY}` },
            { name: 'Content-Type', value: 'application/json' },
            { name: 'Prefer', value: 'return=representation' },
          ],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: `={{ JSON.stringify({
  monitor_id: $json.monitor_id,
  project_id: $json.project_id,
  event_type: $json.event_type,
  block_name: $json.block_name,
  block_id: $json.block_id,
  conversation_id: $json.conversation_id,
  contact_id: $json.contact_id,
  error_code: $json.error_code,
  error_message: $json.error_message,
  occurred_at: $json.occurred_at,
  raw_payload: $json.raw_payload,
  n8n_execution_url: $json.n8n_execution_url,
  blip_contact_url: $json.blip_contact_url
}) }}`,
        options: { timeout: 10000 },
      },
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [0, 80],
      id: INGEST_SUPABASE_ID,
      name: 'IngestSupabase',
    },
    isFailure,
    respondIngested,
    kept.find((n) => n.name === 'RespondOkSkipped'),
  ]
}

function rebuildConnections() {
  return {
    Webhook: { main: [[{ node: 'ClassifyFailure', type: 'main', index: 0 }]] },
    ClassifyFailure: { main: [[{ node: 'BuildI2UEvent', type: 'main', index: 0 }]] },
    BuildI2UEvent: { main: [[{ node: 'IngestSupabase', type: 'main', index: 0 }]] },
    IngestSupabase: { main: [[{ node: 'IsFailure', type: 'main', index: 0 }]] },
    IsFailure: {
      main: [
        [{ node: 'RespondOkIngested', type: 'main', index: 0 }],
        [{ node: 'RespondOkSkipped', type: 'main', index: 0 }],
      ],
    },
  }
}

async function main() {
  const workflow = await api(`/workflows/${WORKFLOW_ID}`)
  const updated = await api(`/workflows/${WORKFLOW_ID}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'G2L — Escuta Blip',
      nodes: rebuildNodes(workflow.nodes),
      connections: rebuildConnections(),
      settings: workflow.settings || { executionOrder: 'v1' },
      staticData: workflow.staticData ?? null,
    }),
  })

  if (!updated.active) {
    await api(`/workflows/${WORKFLOW_ID}/activate`, { method: 'POST', body: '{}' })
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        workflowId: WORKFLOW_ID,
        name: updated.name,
        active: updated.active,
        removed: ['IngestMacroBrain', 'IngestI2U'],
        destination: `${SUPABASE_URL}/rest/v1/bot_events`,
        project: 'gl2',
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
