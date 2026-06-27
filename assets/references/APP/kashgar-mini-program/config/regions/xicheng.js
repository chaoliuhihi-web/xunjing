import requestConfig from '../../request/config.js'

export const XICHENG_REGION_CONFIG = Object.freeze({
	regionCode: 'beijing-xicheng',
	regionName: '北京西城',
	cityName: '北京西城',
	packageCode: 'XICHENG-MAP-001',
	sceneCode: 'xicheng-multimodal-trigger',
	aiSceneCode: 'xicheng-ai-guide',
	sourceChannel: 'APP_UNIAPP',
	tenantId: requestConfig.XunjingTenantId || '1',
	companionName: '小京',
	storageKey: 'xicheng:lastRecognitionResult',
	routePassport: {
		title: '路线护照',
		badgePrefix: '西城印章',
		thresholdText: '完成 3 个文化点打卡可生成西城路线纪念章'
	},
	parentChildTasks: [
		'找一处带“塔”的建筑',
		'拍一张胡同门牌',
		'听完 1 段小京讲解'
	],
	sharePoster: {
		title: '我的西城寻径',
		subtitle: '把今天走过的文化点生成分享海报',
		auditStatus: 'pending'
	}
})

export const XICHENG_HOME_ACTIONS = Object.freeze([
	{ key: 'scan', title: '扫一扫', subtitle: '二维码 / 牌匾 / 门票', source: 'scan' },
	{ key: 'photo', title: '拍照识别', subtitle: '门头 / 文物 / 说明牌', source: 'photo' },
	{ key: 'ocr', title: 'OCR识别', subtitle: '图片文字生成讲解线索', source: 'ocr' },
	{ key: 'ask', title: '问问小京', subtitle: '带着当前位置继续问', source: 'chat' }
])

export const XICHENG_RECOMMENDED_QUESTIONS = Object.freeze([
	'讲讲白塔寺的历史故事',
	'从这里出发推荐一条亲子研学路线',
	'把这个点写进我的游记草稿'
])

export const XICHENG_DEFAULT_ROUTE = Object.freeze({
	routeId: 'xicheng-baitasi-culture-walk',
	title: '白塔寺文化 Citywalk',
	subtitle: '白塔寺 - 历代帝王庙 - 什刹海',
	durationText: '约 2.5 小时',
	distanceText: '约 3.2 公里',
	theme: '亲子研学',
	suitableFor: '亲子家庭 / Citywalk / 文博爱好者',
	startPoiCode: 'xicheng-baitasi',
	checkinPoints: [
		{ poiCode: 'xicheng-baitasi', poiName: '白塔寺', task: '观察白塔的塔身比例', completed: true },
		{ poiCode: 'xicheng-diwangmiao', poiName: '历代帝王庙', task: '找一处古建斗拱', completed: false },
		{ poiCode: 'xicheng-shichahai', poiName: '什刹海', task: '拍一张水系与胡同同框照片', completed: false }
	],
	passportTasks: [
		{ taskId: 'task-baitasi-photo', title: '拍下白塔细节', type: 'photo', completed: true },
		{ taskId: 'task-hutong-observe', title: '记录一个胡同门牌', type: 'observe', completed: false },
		{ taskId: 'task-history-quiz', title: '回答 1 道小京提问', type: 'quiz', completed: false }
	],
	badges: [
		{ badgeId: 'badge-white-pagoda', title: '白塔初识', status: 'earned' },
		{ badgeId: 'badge-family-study', title: '亲子研学家', status: 'locked' },
		{ badgeId: 'badge-citywalker', title: '西城漫步者', status: 'locked' }
	]
})

export const XICHENG_MATERIAL_TIMELINE = Object.freeze([
	{
		eventId: 'material-recognition-baitasi',
		eventType: 'recognition',
		title: '识别到白塔寺',
		poiCode: 'xicheng-baitasi',
		poiName: '白塔寺',
		recordedAt: '2026-06-27T10:00:00.000Z',
		summary: 'OCR 与定位信号匹配到白塔寺，可作为游记第一站。'
	},
	{
		eventId: 'material-task-photo',
		eventType: 'task',
		title: '完成亲子观察任务',
		poiCode: 'xicheng-baitasi',
		poiName: '白塔寺',
		recordedAt: '2026-06-27T10:08:00.000Z',
		summary: '观察白塔塔身和周边院落关系。'
	}
])

export const XICHENG_TRAVELOGUE_TEMPLATE = Object.freeze({
	draftId: 'xicheng-travelogue-draft-dev',
	title: '沿着白塔，走进西城的一天',
	summary: '从白塔寺出发，沿着胡同和水系完成一次轻量 Citywalk。',
	styles: ['城市漫步', '文化随笔', '亲子研学', '朋友圈短文', '小红书图文笔记'],
	sections: [
		{ heading: '第一站：白塔寺', body: '我们从白塔寺开始，先听小京讲白塔与街区的关系。' },
		{ heading: '路上的观察', body: '孩子记录了门牌、院落和古建细节，把观察任务变成旅行素材。' },
		{ heading: '小京点评', body: '这条路线适合慢走，重点不是赶景点，而是把历史线索和日常街巷连接起来。' }
	],
	sharePoster: {
		title: '我的西城寻径',
		status: 'ready'
	},
	memorialPdf: {
		title: '西城 Citywalk 纪念册',
		status: 'ready'
	},
	reviewStatus: 'pending'
})

export const XICHENG_CITY_OPS_REPORT = Object.freeze({
	reportId: 'xicheng-city-ops-dev',
	title: '西城 AI 旅伴试运营日报',
	cityOpsReport: true,
	metrics: [
		{ label: '访问量', value: '128' },
		{ label: '识别量', value: '46' },
		{ label: '路线完成', value: '18' },
		{ label: '作品数', value: '9' },
		{ label: '分享数', value: '6' },
		{ label: '误触发', value: '3' }
	],
	suggestion: '优先补齐白塔寺、历代帝王庙和什刹海的识别别名与亲子任务素材。'
})

export const XICHENG_P0_GROWTH_CONFIG = Object.freeze({
	materialTimeline: XICHENG_MATERIAL_TIMELINE,
	travelogueTemplate: XICHENG_TRAVELOGUE_TEMPLATE,
	cityOpsReport: XICHENG_CITY_OPS_REPORT
})

export const XICHENG_DEVELOPMENT_TRIGGER_FIXTURE = Object.freeze({
	developmentOnly: true,
	notForProduction: true,
	triggerType: 'development-fixture',
	intent: 'guide',
	action: 'open_ai_guide',
	regionCode: XICHENG_REGION_CONFIG.regionCode,
	packageCode: XICHENG_REGION_CONFIG.packageCode,
	sceneCode: XICHENG_REGION_CONFIG.sceneCode,
	poiCode: 'xicheng-baitasi',
	poiName: '白塔寺',
	confidence: 0.86,
	requiresUserConfirm: true,
	sourceLabel: '开发兜底样例',
	reason: '用于无后台或弱网环境下演示西城识别结果页，不可作为生产识别结果',
	recommendedQuestions: XICHENG_RECOMMENDED_QUESTIONS,
	routeRecommendation: {
		title: '白塔寺 - 历代帝王庙 - 什刹海',
		durationText: '约 2.5 小时',
		theme: '亲子研学'
	}
})
