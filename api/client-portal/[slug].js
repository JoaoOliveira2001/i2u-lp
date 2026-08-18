import { handleClientPortalVercel } from '../../server/lib/client-portal.mjs'

export const config = { runtime: 'nodejs' }

export default function handler(req, res) {
  const slug = req.query?.slug
  return handleClientPortalVercel(req, res, slug)
}
