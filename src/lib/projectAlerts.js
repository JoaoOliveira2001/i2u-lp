export function getAttentionReasons(project) {
  const reasons = []
  const revenue = Number(project.revenue_brl) || 0
  const marginPct = project.margin_pct != null ? Number(project.margin_pct) : null
  const cost = Number(project.labor_cost_brl) || 0

  if (project.revenue_brl == null) {
    reasons.push('Sem valor definido')
  }

  if (revenue > 0 && !project.payment_date) {
    reasons.push('Sem data de pagamento')
  }

  if (marginPct != null && marginPct < 20) {
    reasons.push(`Margem baixa (${marginPct}%)`)
  }

  if (project.status === 'prejuizo') {
    reasons.push('Projeto no prejuízo')
  }

  if (revenue > 0 && cost / revenue > 0.8) {
    reasons.push(`Contrato ${Math.round((cost / revenue) * 100)}% consumido`)
  }

  if (project.status_note) {
    reasons.push(project.status_note)
  }

  return reasons
}

export function getAttentionProjects(projects) {
  return projects
    .filter((p) => p.project_status !== 'finalized')
    .map((project) => ({
      project,
      reasons: getAttentionReasons(project),
    }))
    .filter((item) => item.reasons.length > 0)
    .sort((a, b) => {
      const score = (item) => {
        let s = 0
        if (item.project.status === 'prejuizo') s += 4
        if (item.project.revenue_brl == null) s += 3
        if (item.project.status_note) s += 2
        if (item.project.margin_pct != null && Number(item.project.margin_pct) < 20) s += 1
        return s
      }
      return score(b) - score(a)
    })
}
