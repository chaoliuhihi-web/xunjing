import { isXichengUnsafeSafetyStatus, normalizeXichengSafetyStatus } from './safety.js'
import { normalizeXichengReviewedSources } from './sources.js'

export const normalizeXichengDisplayFollowUps = (followUps = []) => {
	if (!Array.isArray(followUps)) return []
	return followUps
		.map(followUp => {
			const cleanedFollowUp = String(followUp || '')
				.replace(/\s*POI\s*级已审核来源\s*$/g, '')
				.replace(/\s*已审核来源\s*$/g, '')
				.trim()
			if (!cleanedFollowUp) return ''
			if (cleanedFollowUp === followUp) return cleanedFollowUp
			return `继续了解${cleanedFollowUp}`
		})
		.filter(Boolean)
		.slice(0, 3)
}

export const normalizeXichengCachedMessages = (list, { createMessageId = () => '' } = {}) => {
	if (!Array.isArray(list)) return []
	const usedMessageIds = new Set()
	let repairSeed = 0
	const allocateMessageId = (rawId = '') => {
		const cachedId = String(rawId || '').trim()
		if (cachedId && !usedMessageIds.has(cachedId)) {
			usedMessageIds.add(cachedId)
			return cachedId
		}
		let nextId = String(createMessageId() || '').trim()
		while (!nextId || usedMessageIds.has(nextId)) {
			nextId = `cached_msg_${repairSeed++}`
		}
		usedMessageIds.add(nextId)
		return nextId
	}
	return list
		.filter(item => item && (item.role === 'user' || item.role === 'assistant'))
		.filter(item => !(item.role === 'assistant' && item.isPending && !item.content))
		.map(item => {
			const safetyStatus = normalizeXichengSafetyStatus(item.safetyStatus)
			const unsafeSafetyStatus = isXichengUnsafeSafetyStatus(safetyStatus)
			return {
				id: allocateMessageId(item.id),
				role: item.role,
				content: item.content || '',
				images: Array.isArray(item.images) ? item.images : [],
				followUps: unsafeSafetyStatus ? [] : normalizeXichengDisplayFollowUps(item.followUps),
				sources: unsafeSafetyStatus ? [] : normalizeXichengReviewedSources(item.sources),
				safetyStatus,
				isPending: false,
				interrupted: Boolean(item.interrupted)
			}
		})
}
