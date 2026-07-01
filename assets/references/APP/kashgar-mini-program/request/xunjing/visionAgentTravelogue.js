import { decodeXichengRouteValue } from './routeParams.js'

export const hasReviewableVisionAgentServiceTaskEvidence = (task = {}) => Boolean(
	task
	&& (
		task.poiCode
		|| task.poiName
		|| task.actionTitle
		|| task.actionCopy
	)
)

const XICHENG_VISION_AGENT_SCENE_DOMAIN_LABELS = Object.freeze({
	architecture: '建筑',
	artifact: '文物',
	menu: '菜单',
	food: '食物',
	'sign-ocr': '路牌/OCR',
	heritage: '非遗',
	plant: '植物',
	animal: '动物',
	person: '人物',
	event: '活动'
})

const createUniqueTextList = (items = [], limit = 6) => Array.from(new Set(
	items.map(item => String(item || '').trim()).filter(Boolean)
)).slice(0, limit)

export const parseTravelogueVisionAgentContext = (value = '') => {
	if (value && typeof value === 'object') return value
	const decodedValue = decodeXichengRouteValue(value)
	if (!decodedValue) return {}
	try {
		const parsedContext = JSON.parse(decodedValue)
		return parsedContext && typeof parsedContext === 'object' ? parsedContext : {}
	} catch (error) {
		return {}
	}
}

const parseTravelogueSourceRecognitionContext = (value = '') => {
	if (value && typeof value === 'object') return value
	if (!value || typeof value !== 'string') return {}
	try {
		const parsedContext = JSON.parse(value)
		return parsedContext && typeof parsedContext === 'object' ? parsedContext : {}
	} catch (error) {
		return {}
	}
}

export const createVisionAgentMemorySessionPackageFromRouteContext = (context = {}, fallbackSceneCount = '') => {
	if (!context || typeof context !== 'object') return null
	const embeddedPackage = context.visionAgentMemorySessionPackage
	if (embeddedPackage && typeof embeddedPackage === 'object') {
		const sceneCount = Number(embeddedPackage.sceneCount || context.memorySessionSceneCount || fallbackSceneCount || 0)
		if (sceneCount > 0) return { ...embeddedPackage, sceneCount, source: 'route-vision-agent-context' }
	}
	const sourceRecognitionContext = parseTravelogueSourceRecognitionContext(context.sourceRecognitionContext)
	const sceneCount = Number(context.memorySessionSceneCount || fallbackSceneCount || sourceRecognitionContext.sceneCount || 0)
	const poiTrailText = context.visionAgentMemorySessionText
		|| context.memorySessionText
		|| sourceRecognitionContext.poiTrailText
		|| context.poiName
		|| sourceRecognitionContext.poiName
		|| ''
	if (sceneCount <= 0 || !poiTrailText) return null
	return {
		packageName: 'AI识境连续会话包',
		source: 'route-vision-agent-context',
		sceneCount,
		poiTrailText,
		continuityCueText: context.continuityCueText || sourceRecognitionContext.continuityCueText || '小京会按上一段识境继续理解，不重新开始讲解。',
		domainContinuityText: context.domainContinuityText || sourceRecognitionContext.domainContinuityText || '',
		serviceContinuityText: context.serviceContinuityText || sourceRecognitionContext.serviceContinuityText || '',
		capturedAt: context.capturedAt || sourceRecognitionContext.capturedAt || ''
	}
}

export const createVisionAgentRealSystemBoundary = (reviewableTasks = []) => {
	const realSystemRequiredTasks = reviewableTasks.filter(task => {
		const serviceIntent = String(task && task.serviceIntent ? task.serviceIntent : '').trim()
		const taskType = String(task && task.taskType ? task.taskType : '').trim()
		return Boolean(
			task && (task.serviceHandoffRequiresRealSystem || task.requiresRealSystem)
			|| ['coupon', 'order', 'reservation', 'ticket', 'experience'].includes(serviceIntent)
			|| ['merchant', 'ticketing', 'experience'].includes(taskType)
		)
	})
	const realSystemRequiredActionTitles = createUniqueTextList(
		realSystemRequiredTasks.map(task => task.actionTitle || task.actionCopy || task.serviceIntentLabel || task.taskTypeLabel),
		5
	)
	const realSystemRequiredTaskCount = realSystemRequiredTasks.length
	const actionCue = realSystemRequiredActionTitles.length > 0 ? realSystemRequiredActionTitles.join('、') : '商家、票务或预约动作'
	const realSystemBoundaryText = realSystemRequiredTaskCount > 0
		? `真实系统待确认：${actionCue}需要商家、票务或预约系统确认，游记只记录现场意图，不生成可用券或订单结果。`
		: 'AI识境服务动作只记录现场意图和已审核素材，不生成未接入系统的优惠、票务或预约结果。'
	return {
		realSystemRequiredTaskCount,
		realSystemRequiredActionTitles,
		realSystemBoundaryText
	}
}

export const createVisionAgentAutoTraveloguePackage = (visionAgentServiceTasks = []) => {
	const reviewableTasks = Array.isArray(visionAgentServiceTasks)
		? visionAgentServiceTasks.filter(task => hasReviewableVisionAgentServiceTaskEvidence(task))
		: []
	if (reviewableTasks.length === 0) return null

	const poiNames = createUniqueTextList(reviewableTasks.map(task => task.poiName || task.poiCode), 5)
	const actionTitles = createUniqueTextList(reviewableTasks.map(task => task.actionTitle || task.actionCopy), 5)
	const sceneDomainLabels = createUniqueTextList(
		reviewableTasks.map(task => XICHENG_VISION_AGENT_SCENE_DOMAIN_LABELS[task.sceneDomain] || task.sceneDomain),
		8
	)
	const serviceIntentLabels = createUniqueTextList(reviewableTasks.map(task => task.serviceIntentLabel || ''), 8)
	const agentPromptCount = reviewableTasks.filter(task => task.taskType === 'agent' || task.actionPrompt).length
	const serviceActionCount = reviewableTasks.filter(task => task.serviceIntent || task.taskType !== 'agent').length
	const realSystemBoundary = createVisionAgentRealSystemBoundary(reviewableTasks)
	const sceneCue = sceneDomainLabels.length > 0 ? sceneDomainLabels.join('、') : '当前场景'
	const poiCue = poiNames.length > 0 ? poiNames.join('、') : '已识别地点'
	const actionCue = actionTitles.length > 0 ? actionTitles.join('、') : '后续动作'
	const serviceCue = serviceIntentLabels.length > 0 ? serviceIntentLabels.join('、') : actionCue

	return {
		packageName: 'AI识境自动素材包',
		taskCount: reviewableTasks.length,
		poiNames,
		actionTitles,
		sceneDomainLabels,
		serviceIntentLabels,
		agentPromptCount,
		serviceActionCount,
		...realSystemBoundary,
		storyCueText: `AI识境自动素材包基于 ${reviewableTasks.length} 个真实任务包，已把${poiCue}的${sceneCue}线索整理成游记故事骨架。`,
		mapCueText: `地图路线可围绕${poiCue}继续串联，并优先引用已记录轨迹、打卡和停留证据。`,
		shareCueText: `分享文案可突出${serviceCue}，生成朋友圈、小红书或纪念册时保留审核状态。`
	}
}
