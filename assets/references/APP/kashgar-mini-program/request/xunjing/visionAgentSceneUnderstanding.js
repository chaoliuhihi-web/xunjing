export const XICHENG_VISION_AGENT_SCENE_DOMAINS = Object.freeze([
	{ domainKey: 'architecture', domainLabel: '建筑', title: '建筑/空间', copy: '年代、结构、修复和拍照角度。', matchers: ['建筑', '门', '楼', '塔', '桥', '亭', '寺', '庙', '院', '胡同'] },
	{ domainKey: 'artifact', domainLabel: '文物', title: '文物/展陈', copy: '用途、工艺、年代和同时代事件。', matchers: ['文物', '博物馆', '展品', '青铜', '陶', '瓷', '碑', '展陈'] },
	{ domainKey: 'menu', domainLabel: '菜单', title: '菜单理解', copy: '辣度、清真、推荐菜和人数建议。', matchers: ['菜单', '菜品', '点菜', '点餐', '价格', '清真', '辣度', '推荐菜', '几个人', '人数'] },
	{ domainKey: 'food', domainLabel: '食物', title: '食物讲解', copy: '来源、吃法、搭配和附近推荐。', matchers: ['食物', '小吃', '美食', '餐', '包子', '烤', '茶', '饮料'] },
	{ domainKey: 'sign-ocr', domainLabel: '路牌/OCR', title: '文字与导航', copy: '翻译、发音、意义和怎么走。', matchers: ['路牌', '牌匾', '招牌', 'ocr', '文字', '维吾尔', '英文', '导航', '方向'] },
	{ domainKey: 'heritage', domainLabel: '非遗', title: '非遗体验', copy: '器物、技艺、演奏和附近体验。', matchers: ['非遗', '乐器', '手作', '工艺', '体验', '热瓦普', '传承'] },
	{ domainKey: 'plant', domainLabel: '植物', title: '植物观察', copy: '树龄、分布、季节和生态知识。', matchers: ['植物', '树', '花', '胡杨', '古树', '园林'] },
	{ domainKey: 'animal', domainLabel: '动物', title: '动物保护', copy: '习性、栖息地、保护和安全距离。', matchers: ['动物', '鸟', '猫', '豹', '雪豹', '保护', '栖息'] },
	{ domainKey: 'person', domainLabel: '人物', title: '人物故事', copy: '雕像、人物贡献和时代关系。', matchers: ['人物', '雕像', '塑像', '名人', '纪念', '故居'] },
	{ domainKey: 'event', domainLabel: '活动', title: '活动/演出', copy: '节目、时间、票务和下一步服务。', matchers: ['活动', '演出', '节目', '票', '开场', '演员', '市集'] }
])

const normalizeSceneText = (value = '') => String(value || '').trim().toLowerCase()

const createSceneCombinedText = ({ result = {}, visionAgentContext = {} } = {}) => [
	visionAgentContext.visionCaption,
	result.visionCaption,
	result.poiName,
	visionAgentContext.ocrText,
	result.ocrText,
	result.text,
	visionAgentContext.serviceText,
	visionAgentContext.activityText,
	visionAgentContext.knowledgeGraphText,
	result.theme,
	result.reason,
	result.sourceLabel
].map(normalizeSceneText).filter(Boolean).join(' ')

const scoreXichengVisionAgentDomain = (card = {}, context = {}) => {
	const combinedText = createSceneCombinedText(context)
	const matchers = Array.isArray(card.matchers) ? card.matchers : []
	const matchedScore = matchers.reduce((total, matcher) => {
		return combinedText.includes(normalizeSceneText(matcher)) ? total + 32 : total
	}, 0)
	const result = context.result || {}
	const visionAgentContext = context.visionAgentContext || {}
	const source = normalizeSceneText(result.source || visionAgentContext.source)
	const hasOcrText = Boolean(visionAgentContext.ocrText || result.ocrText || result.text)
	const ocrBoost = hasOcrText && ['scan', 'ocr', 'text'].includes(source) ? 18 : 0
	const menuBoost = card.domainKey === 'menu' && hasOcrText && /菜单|菜品|点餐|推荐菜|清真|辣度/.test(combinedText) ? 28 : 0
	const signBoost = card.domainKey === 'sign-ocr' && hasOcrText && /路牌|牌匾|招牌|维吾尔|英文|导航|方向/.test(combinedText) ? 30 : 0
	const serviceBoost = ['menu', 'food', 'heritage', 'event'].includes(card.domainKey) && (visionAgentContext.serviceText || visionAgentContext.activityText) ? 14 : 0
	return matchedScore + ocrBoost + menuBoost + signBoost + serviceBoost
}

export const createXichengVisionAgentSceneUnderstandingCards = () => XICHENG_VISION_AGENT_SCENE_DOMAINS.map(card => ({
	...card,
	matchers: [...card.matchers]
}))

export const createXichengVisionAgentDomainServiceActions = (cards = []) => {
	const domainKeys = cards
		.filter(card => card && Number(card.score || 0) > 0)
		.map(card => card.domainKey)
		.filter(Boolean)
	const actions = []
	const appendAction = (action = {}) => {
		if (!action.actionKey || actions.some(item => item.actionKey === action.actionKey)) return
		actions.push(action)
	}
	if (domainKeys.includes('menu')) {
		appendAction({ actionKey: 'menu-order', title: '点推荐菜', copy: '按辣度、清真和人数生成点单建议', taskType: 'merchant', sceneDomain: 'menu', serviceIntent: 'order' })
		appendAction({ actionKey: 'menu-coupon', title: '领优惠', copy: '匹配附近餐厅优惠券和套餐', taskType: 'merchant', sceneDomain: 'menu', serviceIntent: 'coupon' })
	}
	if (domainKeys.includes('food')) {
		appendAction({ actionKey: 'food-reservation', title: '预约/排队', copy: '找附近同款美食并规划排队或预约', taskType: 'merchant', sceneDomain: 'food', serviceIntent: 'reservation' })
	}
	if (domainKeys.includes('event')) {
		appendAction({ actionKey: 'event-ticket', title: '查票务', copy: '查看演出时间、票务和入场提醒', taskType: 'ticketing', sceneDomain: 'event', serviceIntent: 'ticket' })
	}
	if (domainKeys.includes('heritage')) {
		appendAction({ actionKey: 'heritage-experience', title: '约体验', copy: '预约附近非遗体验、讲师或工坊', taskType: 'experience', sceneDomain: 'heritage', serviceIntent: 'experience' })
	}
	if (domainKeys.includes('sign-ocr')) {
		appendAction({ actionKey: 'sign-translate', title: '翻译导航', copy: '翻译文字、读音并接到步行导航', taskType: 'navigation', sceneDomain: 'sign-ocr', serviceIntent: 'translate' })
	}
	return actions.slice(0, 6)
}

export const createXichengVisionAgentSceneUnderstandingPrompt = (card = {}, subject = '当前场景') => {
	const safeSubject = subject || '当前场景'
	if (card.domainKey === 'menu') return `把${safeSubject}当作菜单来理解：告诉我菜品、辣度、是否清真、推荐菜、适合几个人和本地来源。`
	if (card.domainKey === 'food') return `把${safeSubject}当作食物来理解：讲它来自哪里、怎么吃、配什么饮料，以及附近哪里更值得试。`
	if (card.domainKey === 'sign-ocr') return `把${safeSubject}里的路牌/OCR文字翻译出来，给我发音、意义、历史背景和导航建议。`
	if (card.domainKey === 'heritage') return `把${safeSubject}当作非遗线索理解：讲器物或技艺、制作过程、表演方式，并推荐附近体验。`
	if (card.domainKey === 'artifact') return `把${safeSubject}当作文物来理解：讲用途、工艺、年代、同时代事件，以及和其它文物的区别。`
	if (card.domainKey === 'plant') return `把${safeSubject}当作植物来理解：讲树龄或季节、生态特点、分布和最佳观赏时间。`
	if (card.domainKey === 'animal') return `把${safeSubject}当作动物来理解：讲习性、栖息地、保护情况、是否危险和观察距离。`
	if (card.domainKey === 'person') return `把${safeSubject}当作人物线索来理解：讲人物故事、贡献、为什么在这里，以及同时期人物。`
	if (card.domainKey === 'event') return `把${safeSubject}当作活动现场来理解：讲节目、背景、开始时间、票务和附近下一步安排。`
	return `把${safeSubject}当作建筑来理解：讲年代、建筑特点、结构、修复历史、隐藏细节和拍照角度。`
}

export const inferXichengVisionAgentSceneUnderstandingPackage = ({ result = {}, visionAgentContext = null, recommendedRoute = null } = {}) => {
	const context = visionAgentContext && typeof visionAgentContext === 'object'
		? visionAgentContext
		: result.visionAgentContext && typeof result.visionAgentContext === 'object'
			? result.visionAgentContext
			: {}
	const rankedCards = createXichengVisionAgentSceneUnderstandingCards()
		.map(card => ({
			...card,
			score: scoreXichengVisionAgentDomain(card, { result, visionAgentContext: context })
		}))
		.sort((left, right) => {
			if (right.score !== left.score) return right.score - left.score
			return XICHENG_VISION_AGENT_SCENE_DOMAINS.findIndex(card => card.domainKey === left.domainKey)
				- XICHENG_VISION_AGENT_SCENE_DOMAINS.findIndex(card => card.domainKey === right.domainKey)
		})
	const domainCards = rankedCards.slice(0, 6)
	const matchedCards = domainCards.filter(card => Number(card.score || 0) > 0)
	const primaryCard = matchedCards[0] || domainCards[0] || {}
	const serviceActions = createXichengVisionAgentDomainServiceActions(domainCards)
	const routeCue = recommendedRoute && (recommendedRoute.title || recommendedRoute.theme)
		? `，可接入${recommendedRoute.title || recommendedRoute.theme}`
		: ''
	const sceneUnderstandingSummary = primaryCard.domainLabel
		? `${primaryCard.domainLabel}场景${routeCue}，优先触发${serviceActions.length > 0 ? '服务动作' : '讲解和追问'}`
		: ''
	return {
		packageName: 'AI识境场景理解包',
		primaryDomainKey: primaryCard.domainKey || '',
		primaryDomainLabel: primaryCard.domainLabel || '',
		sceneUnderstandingSummary,
		domainCards,
		serviceActions,
		createdFromSignals: ['camera', 'ocr', 'gps', 'knowledge', 'service'].filter(signal => {
			if (signal === 'ocr') return Boolean(context.ocrText || result.ocrText || result.text)
			if (signal === 'knowledge') return Boolean(context.knowledgeGraphText || result.theme || result.reason)
			if (signal === 'service') return Boolean(context.serviceText || context.activityText || serviceActions.length > 0)
			return true
		})
	}
}
