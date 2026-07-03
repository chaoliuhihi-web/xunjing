import requestConfig from '../../request/config.js'

const XICHENG_REGION_BASE_CONFIG = {
	regionCode: 'beijing-xicheng',
	regionName: '北京西城',
	cityName: '北京西城',
	packageCode: 'XICHENG-MAP-001',
	sceneCode: 'xicheng-multimodal-trigger',
	aiSceneCode: 'xicheng-ai-guide',
	sourceChannel: 'APP_UNIAPP',
	tenantId: requestConfig.XunjingTenantId || '1',
	companionName: '小京',
	companionAvatar: '/static/xicheng/xiaojing-companion.png',
	visualAssets: {
		homeHeroBackground: '/static/xicheng/home-hero-xicheng-approved-v3.jpg',
		homeCompanion: '/static/xicheng/xiaojing-companion-cutout-v2.png',
		heroLandmark: '/static/xicheng/scene-baitasi-waterfront.jpg',
		poiCards: {
			'xicheng-baitasi': '/static/xicheng/poi-baitasi-card.jpg'
		},
		routeThumbnails: {
			'baitasi-imperial-shichahai': '/static/xicheng/route-baitasi-culture.jpg',
			'beihai-shichahai-waterfront': '/static/xicheng/route-shichahai-waterfront.jpg',
			'dashilar-old-brand-walk': '/static/xicheng/route-hutong-life.jpg'
		},
		passportStamp: '/static/xicheng/route-passport-stamp.png',
		sharePosterBackground: '/static/xicheng/share-poster-background.jpg'
	},
	storageKey: 'xicheng:lastRecognitionResult',
	materialsStorageKey: 'xicheng:journeyMaterials',
	journeyStorageKey: 'xicheng:journeyDraft',
	inspirationStorageKey: 'xicheng:inspirationRoute',
	localOpsReportKey: 'xicheng:localOpsReport',
	reviewStorageKey: 'xicheng:reviewSubmissions',
	shareAssetStorageKey: 'xicheng:shareAssets',
	shareSettingStorageKey: 'xicheng:shareSettings',
	recordingStorageKey: 'xicheng:recordingSession',
	studyTaskStorageKey: 'xicheng:studyTaskEvidence',
	badgeAwardStorageKey: 'xicheng:badgeAwards',
	checkinStorageKey: 'xicheng:routeCheckins',
	inspirationImportStorageKey: 'xicheng:inspirationImports',
	recognitionFeedbackStorageKey: 'xicheng:recognitionFeedbacks',
	visionAgentMemoryStorageKey: 'xicheng_vision_agent_memory_trail',
	visionAgentMemorySessionStorageKey: 'xicheng_vision_agent_memory_session',
	visionAgentServiceTasksStorageKey: 'xicheng_vision_agent_service_tasks',
	aiGuideChatCachePrefix: 'ai_guide_messages_cache:xicheng:',
	aiGuideConversationCachePrefix: 'ai_guide_conversation_id:xicheng:',
	reviewStatus: {
		draft: '草稿',
		pending: '待审核',
		approved: '已审核',
		rejected: '需修改'
	},
	routePassport: {
		title: '路线记录',
		badgePrefix: '西城路线',
		targetCheckinCount: 3,
		thresholdText: '完成 3 个文化点记录可生成西城路线复盘'
	},
	parentChildTasks: [
		'找一处带“塔”的建筑',
		'拍一张胡同门牌',
		'听完 1 段小京讲解'
	],
	sharePoster: {
		title: '我的西城寻径',
		subtitle: '把今天走过的文化点生成分享海报',
		auditStatus: 'pending',
		backgroundImage: '/static/xicheng/share-poster-background.jpg',
		stampImage: '/static/xicheng/route-passport-stamp.png'
	}
}

export const XICHENG_REGION_CONFIG = Object.freeze({
	...XICHENG_REGION_BASE_CONFIG,
	privacyClearStorageKeys: Object.freeze([
		XICHENG_REGION_BASE_CONFIG.storageKey,
		XICHENG_REGION_BASE_CONFIG.materialsStorageKey,
		XICHENG_REGION_BASE_CONFIG.journeyStorageKey,
		XICHENG_REGION_BASE_CONFIG.inspirationStorageKey,
		XICHENG_REGION_BASE_CONFIG.localOpsReportKey,
		XICHENG_REGION_BASE_CONFIG.reviewStorageKey,
		XICHENG_REGION_BASE_CONFIG.shareAssetStorageKey,
		XICHENG_REGION_BASE_CONFIG.shareSettingStorageKey,
			XICHENG_REGION_BASE_CONFIG.recordingStorageKey,
			XICHENG_REGION_BASE_CONFIG.studyTaskStorageKey,
			XICHENG_REGION_BASE_CONFIG.badgeAwardStorageKey,
			XICHENG_REGION_BASE_CONFIG.checkinStorageKey,
			XICHENG_REGION_BASE_CONFIG.inspirationImportStorageKey,
			XICHENG_REGION_BASE_CONFIG.recognitionFeedbackStorageKey,
			XICHENG_REGION_BASE_CONFIG.visionAgentMemoryStorageKey,
			XICHENG_REGION_BASE_CONFIG.visionAgentMemorySessionStorageKey,
			XICHENG_REGION_BASE_CONFIG.visionAgentServiceTasksStorageKey
		]),
	privacyClearStorageKeyPrefixes: Object.freeze([
		XICHENG_REGION_BASE_CONFIG.aiGuideChatCachePrefix,
		XICHENG_REGION_BASE_CONFIG.aiGuideConversationCachePrefix
	])
})

export const XICHENG_OFFICIAL_POIS = Object.freeze([
	{
		poiCode: 'xicheng-baitasi',
		poiName: '白塔寺',
		aliases: ['白塔寺', '妙应寺', '白塔', '阜成门内'],
		theme: '寺庙建筑',
		durationText: '40分钟',
		summary: '元大都遗存与西城地标，适合观察白塔、藏式塔刹与寺院格局。'
	},
	{
		poiCode: 'xicheng-imperial-temple',
		poiName: '历代帝王庙',
		aliases: ['历代帝王庙', '帝王庙', '阜成门'],
		theme: '礼制文化',
		durationText: '35分钟',
		summary: '明清两代皇家祭祀历代帝王的场所，适合讲中国礼制文化。'
	},
	{
		poiCode: 'xicheng-shichahai',
		poiName: '什刹海',
		aliases: ['什刹海', '后海', '前海', '西海'],
		theme: '水系胡同',
		durationText: '50分钟',
		summary: '由前海、后海和西海组成的老北京水系，适合慢行感受市井生活。'
	},
	{
		poiCode: 'xicheng-beihai',
		poiName: '北海公园',
		aliases: ['北海', '北海公园', '琼华岛'],
		theme: '皇家园林',
		durationText: '60分钟',
		summary: '皇家园林与琼华岛白塔，是西城水岸慢行的开场点。'
	},
	{
		poiCode: 'xicheng-dashilar',
		poiName: '大栅栏',
		aliases: ['大栅栏', '前门', '廊房头条'],
		theme: '老字号街区',
		durationText: '45分钟',
		summary: '老字号、胡同街巷和前门商业记忆交织的城市更新样本。'
	}
])

const findXichengOfficialPoi = (poiCode) => XICHENG_OFFICIAL_POIS.find(poi => poi.poiCode === poiCode)

const createXichengRouteStops = (poiCodes = [], stopDetails = []) => poiCodes
	.map((poiCode, index) => {
		const poi = findXichengOfficialPoi(poiCode)
		return poi ? { ...poi, ...(stopDetails[index] || {}) } : null
	})
	.filter(Boolean)

export const XICHENG_ROUTE_CODE_ALIASES = Object.freeze({
	'baitasi-ditan-shichahai': 'baitasi-imperial-shichahai',
	'baitasi-diwangmiao-shichahai': 'baitasi-imperial-shichahai',
	'baitasi-emperor-shichahai': 'baitasi-imperial-shichahai'
})

export const normalizeXichengRouteCode = (routeCode = '') => {
	const normalizedRouteCode = String(routeCode || '').trim()
	return XICHENG_ROUTE_CODE_ALIASES[normalizedRouteCode] || normalizedRouteCode
}

export const XICHENG_RECOMMENDED_ROUTES = Object.freeze([
	{
		routeCode: 'baitasi-imperial-shichahai',
		title: '白塔寺 - 历代帝王庙 - 什刹海',
		theme: '亲子研学',
		durationText: '约 2.5 小时',
		distanceText: '3.2 公里',
		bestTimeText: '适合上午',
		summary: '从寺庙建筑、礼制文化走到水系胡同，适合家庭和研学团一路记录并生成游记。',
		routeTips: '全程约 3.2 公里，建议穿舒适步行鞋，带好水和防晒用品。',
		keywords: ['古刹文脉', '建筑美学', '宗教文化'],
		recommendedFilterKeys: ['half-day', 'family', 'culture'],
		passportTaskCount: 3,
		studyTaskCount: 3,
		nearbyHighlights: [
			{ title: '烟袋斜街', subtitle: '胡同商业与老北京烟火气' },
			{ title: '银锭桥', subtitle: '什刹海水岸看点' },
			{ title: '妙应寺白塔', subtitle: '西城地标建筑' },
			{ title: '荷花市场', subtitle: '水岸休闲节点' }
		],
		stops: createXichengRouteStops([
			'xicheng-baitasi',
			'xicheng-imperial-temple',
			'xicheng-shichahai'
		], [
			{ walkText: '起点讲解约 20 分钟', guidePrompt: '讲讲白塔寺的建筑看点' },
			{ walkText: '步行约 1.1 公里，约 20 分钟', guidePrompt: '讲讲历代帝王庙的礼制文化' },
			{ walkText: '步行约 1.3 公里，约 25 分钟', guidePrompt: '讲讲什刹海和老北京水系' }
		])
	},
	{
		routeCode: 'beihai-shichahai-waterfront',
		title: '北海公园 - 什刹海 - 白塔寺',
		theme: '水岸慢行',
		durationText: '约 3 小时',
		distanceText: '3.6 公里',
		bestTimeText: '适合下午',
		summary: '串联皇家园林、水系胡同和白塔地标，适合周末半日 Citywalk。',
		routeTips: '水岸路段较多，适合慢行拍照；节假日建议错峰进入热门景区。',
		keywords: ['湖光烟柳', '老城风情', '慢游惬意'],
		recommendedFilterKeys: ['half-day', 'family', 'culture'],
		passportTaskCount: 3,
		studyTaskCount: 2,
		nearbyHighlights: [
			{ title: '琼华岛', subtitle: '皇家园林核心看点' },
			{ title: '银锭桥', subtitle: '水岸视角与胡同入口' },
			{ title: '后海沿岸', subtitle: '老城休闲场景' }
		],
		stops: createXichengRouteStops([
			'xicheng-beihai',
			'xicheng-shichahai',
			'xicheng-baitasi'
		], [
			{ walkText: '起点游览约 40 分钟', guidePrompt: '讲讲北海公园和琼华岛' },
			{ walkText: '步行约 1.2 公里，约 22 分钟', guidePrompt: '讲讲什刹海的水系胡同' },
			{ walkText: '步行约 1.4 公里，约 28 分钟', guidePrompt: '讲讲白塔寺为什么是西城地标' }
		])
	},
	{
		routeCode: 'dashilar-old-brand-walk',
		title: '大栅栏 - 历代帝王庙 - 白塔寺',
		theme: '老字号与中轴文化',
		durationText: '约 2 小时',
		distanceText: '2.8 公里',
		bestTimeText: '适合午后',
		summary: '用老字号街区作为入口，带出西城中轴、礼制和胡同文化的运营主题。',
		routeTips: '商业街区人流较密，适合从老字号打卡切入，再转入文化讲解点。',
		keywords: ['市井烟火', '京味生活', '胡同故事'],
		recommendedFilterKeys: ['half-day', 'night', 'culture'],
		passportTaskCount: 3,
		studyTaskCount: 2,
		nearbyHighlights: [
			{ title: '廊房头条', subtitle: '老字号街巷肌理' },
			{ title: '前门商业街', subtitle: '城市商业记忆' },
			{ title: '白塔寺片区', subtitle: '胡同更新与文化地标' }
		],
		stops: createXichengRouteStops([
			'xicheng-dashilar',
			'xicheng-imperial-temple',
			'xicheng-baitasi'
		], [
			{ walkText: '起点游览约 25 分钟', guidePrompt: '讲讲大栅栏的老字号故事' },
			{ walkText: '转场约 25 分钟，建议地铁或骑行', guidePrompt: '讲讲历代帝王庙和中轴礼制' },
			{ walkText: '步行约 1.0 公里，约 18 分钟', guidePrompt: '讲讲白塔寺片区的胡同更新' }
		])
	}
])

export const XICHENG_HOME_ACTIONS = Object.freeze([
	{ key: 'scan', title: '扫一扫', subtitle: '二维码 / 牌匾 / 门票', source: 'scan' },
	{ key: 'photo', title: '拍照识别', subtitle: '门头 / 文物 / 说明牌', source: 'photo' },
	{ key: 'gps', title: 'GPS定位', subtitle: '附近文化点 / 可走路线', source: 'gps' },
	{ key: 'ocr', title: 'OCR识别', subtitle: '图片文字生成讲解线索', source: 'ocr' },
	{ key: 'text', title: '文本识别', subtitle: '地点 / 展牌 / 攻略文字', source: 'text' },
	{ key: 'ask', title: '问问小京', subtitle: '带着当前位置继续问', source: 'chat' }
])

const normalizeXichengQuestionSubject = (poiName = '') => {
	const subject = String(poiName || '').trim()
	return subject && !['待确认西城文化点', '西城文化点', '这个点'].includes(subject)
		? subject
		: '这个点'
}

export const createXichengPoiSuggestedQuestions = (poiName = '') => {
	const subject = normalizeXichengQuestionSubject(poiName)
	return [
		`讲讲${subject}的历史故事`,
		subject === '这个点' ? '从这里出发推荐一条亲子研学路线' : `从${subject}出发推荐一条亲子研学路线`,
		subject === '这个点' ? '把这个点写进我的游记草稿' : `把${subject}写进我的游记草稿`
	]
}

export const XICHENG_SUGGESTED_QUESTIONS = Object.freeze(createXichengPoiSuggestedQuestions())

export const XICHENG_RECOMMENDED_QUESTIONS = XICHENG_SUGGESTED_QUESTIONS

export const XICHENG_ROUTE_RECOMMENDATION_FILTERS = Object.freeze([
	{ key: 'half-day', title: '半日', iconText: '时' },
	{ key: 'family', title: '亲子', iconText: '学' },
	{ key: 'night', title: '夜游', iconText: '月' },
	{ key: 'culture', title: '文化', iconText: '景' }
])

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
	suggestedQuestions: Object.freeze(createXichengPoiSuggestedQuestions('白塔寺')),
	recommendedQuestions: Object.freeze(createXichengPoiSuggestedQuestions('白塔寺')),
	sources: [
		{
			title: '西城试运营开发样例',
			excerpt: '仅用于开发环境验证识别结果页来源展示，不可作为生产审核来源。'
		}
	],
	routeRecommendation: {
		title: '白塔寺 - 历代帝王庙 - 什刹海',
		durationText: '约 2.5 小时',
		theme: '亲子研学'
	}
})
