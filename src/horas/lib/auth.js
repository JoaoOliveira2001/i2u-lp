export function normalizeDeveloperPassword(name) {
  return String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function getSharedPassword() {
  const fromEnv = import.meta.env.VITE_DASHBOARD_PASSWORD
  if (fromEnv != null && String(fromEnv).trim() !== '') {
    return String(fromEnv).trim()
  }
  return 'i2u2026'
}

const LUIZ_DEFAULT_PASSWORD = 'L7NH4DDYKQk4'

function getDeveloperPasswords() {
  return {
    kel: import.meta.env.VITE_HORAS_PASSWORD_KEL,
    leandro: import.meta.env.VITE_HORAS_PASSWORD_LEANDRO,
    joao: import.meta.env.VITE_HORAS_PASSWORD_JOAO,
    pedro: import.meta.env.VITE_HORAS_PASSWORD_PEDRO,
    luiz: import.meta.env.VITE_HORAS_PASSWORD_LUIZ || LUIZ_DEFAULT_PASSWORD,
  }
}

export function checkDeveloperPassword(name, password) {
  const trimmed = String(password).trim()
  const key = normalizeDeveloperPassword(name)
  const expected = getDeveloperPasswords()[key]
  const personal =
    expected != null && String(expected).trim() !== '' ? String(expected).trim() : ''

  // Luiz (and anyone with personal password) must use their own password.
  if (personal) return trimmed === personal

  return trimmed === getSharedPassword()
}

export const SESSION_DEV_KEY = 'i2u_horas_developer_id'

export function getSessionDeveloperId() {
  return sessionStorage.getItem(SESSION_DEV_KEY) || ''
}

export function setSessionDeveloperId(id) {
  sessionStorage.setItem(SESSION_DEV_KEY, id)
}

export function clearSessionDeveloperId() {
  sessionStorage.removeItem(SESSION_DEV_KEY)
}
