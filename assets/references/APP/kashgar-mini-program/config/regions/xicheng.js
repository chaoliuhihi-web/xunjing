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
	materialsStorageKey: 'xicheng:journeyMaterials',
	journeyStorageKey: 'xicheng:journeyDraft',
	inspirationStorageKey: 'xicheng:inspirationRoute',
	localOpsReportKey: 'xicheng:localOpsReport',
	reviewStorageKey: 'xicheng:reviewSubmissions',
	shareAssetStorageKey: 'xicheng:shareAssets',
	recordingStorageKey: 'xicheng:recordingSession',
	reviewStatus: {
		draft: '草稿',
		pending: '待审核',
		approved: '已审核',
		rejected: '需修改'
	},
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

export const XICHENG_OFFICIAL_POIS = Object.freeze([
	{
		poiCode: 'xicheng-baitasi',
		poiName: '白塔寺',
		aliases: ['白塔寺', '妙应寺', '白塔', '阜成门内'],
		theme: '寺庙建筑',
		durationText: '40分钟'
	},
	{
		poiCode: 'xicheng-imperial-temple',
		poiName: '历代帝王庙',
		aliases: ['历代帝王庙', '帝王庙', '阜成门'],
		theme: '礼制文化',
		durationText: '35分钟'
	},
	{
		poiCode: 'xicheng-shichahai',
		poiName: '什刹海',
		aliases: ['什刹海', '后海', '前海', '西海'],
		theme: '水系胡同',
		durationText: '50分钟'
	},
	{
		poiCode: 'xicheng-beihai',
		poiName: '北海公园',
		aliases: ['北海', '北海公园', '琼华岛'],
		theme: '皇家园林',
		durationText: '60分钟'
	},
	{
		poiCode: 'xicheng-dashilar',
		poiName: '大栅栏',
		aliases: ['大栅栏', '前门', '廊房头条'],
		theme: '老字号街区',
		durationText: '45分钟'
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

export const XICHENG_SUGGESTED_QUESTIONS = Object.freeze([
	'讲讲白塔寺的历史故事',
	'从这里出发推荐一条亲子研学路线',
	'把这个点写进我的游记草稿'
])

export const XICHENG_RECOMMENDED_QUESTIONS = XICHENG_SUGGESTED_QUESTIONS

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
	suggestedQuestions: XICHENG_SUGGESTED_QUESTIONS,
	recommendedQuestions: XICHENG_SUGGESTED_QUESTIONS,
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
