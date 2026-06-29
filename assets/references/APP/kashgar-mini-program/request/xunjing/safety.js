export const normalizeXichengSafetyStatus = (safetyStatus = '') => String(safetyStatus || '').trim().toUpperCase()

export const isXichengUnsafeSafetyStatus = (safetyStatus = '') => ['BLOCKED', 'UNAVAILABLE'].includes(normalizeXichengSafetyStatus(safetyStatus))
