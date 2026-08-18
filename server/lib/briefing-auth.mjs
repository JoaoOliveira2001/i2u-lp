export function getBriefingSecret() {
  return (
    process.env.BRIEFING_API_SECRET ||
    process.env.LINEAR_SYNC_SECRET ||
    process.env.VITE_DASHBOARD_PASSWORD ||
    ''
  )
}

export function isBriefingAuthorized(req) {
  const secret = getBriefingSecret()
  if (!secret) return false
  const auth = req.headers.authorization || req.headers.Authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  return token === secret
}

export function briefingUnauthorizedResponse() {
  return { status: 401, body: { error: 'Unauthorized' } }
}
