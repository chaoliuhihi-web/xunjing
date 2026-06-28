export const KASHGAR_DIARY_ELEMENTS = [
	{ icon: '▣', name: '喀什古城' },
	{ icon: '◉', name: '老茶馆' },
	{ icon: '⌾', name: '鸽子广场' },
	{ icon: '◌', name: '烤包子' }
]

export const KASHGAR_DIARY_MODES = [
	{ key: 'family', icon: '♟', title: '亲子游记' },
	{ key: 'moments', icon: '◐', title: '朋友圈' },
	{ key: 'redbook', icon: '▣', title: '小红书' },
	{ key: 'album', icon: '▤', title: '旅行纪念页' }
]

export const KASHGAR_DIARY_STATS = [
	{ icon: '⌾', value: '5个', label: '景点' },
	{ icon: '▧', value: '20张', label: '照片' },
	{ icon: '▣', value: '3天2晚', label: '' }
]

export const KASHGAR_DIARY_CHECKLIST = [
	'行程亮点提炼',
	'亲子视角故事',
	'朋友圈文案',
	'小红书图文笔记',
	'旅行纪念页排版',
	'PDF纪念册'
]

export const KASHGAR_AI_COMPANION_ACTIONS = [
	{
		key: 'listen',
		title: '听讲解',
		iconClass: 'kashgar-ai-action-listen',
		question: '给我讲讲喀什古城的历史故事'
	},
	{
		key: 'guide',
		title: '看攻略',
		iconClass: 'kashgar-ai-action-guide',
		question: '推荐一条喀什古城半日游攻略'
	},
	{
		key: 'places',
		title: '找打卡地',
		iconClass: 'kashgar-ai-action-place',
		target: 'map'
	},
	{
		key: 'question',
		title: '问问题',
		iconClass: 'kashgar-ai-action-question',
		question: ''
	}
]

export const KASHGAR_AI_COMPANION_QUESTIONS = [
	'喀什古城有什么历史故事？',
	'适合带孩子游玩的路线推荐',
	'喀什有哪些特色美食不能错过？',
	'喀什拍照打卡地有哪些？',
	'喀什古城晚上有哪些好玩的地方？'
]

export const KASHGAR_AI_COMPANION_PLACES = [
	{
		badge: 'TOP1',
		title: '高台民居',
		desc: '俯瞰古城全景',
		cover: '/static/kashgar/ai-place-gaotai.png',
		question: '高台民居怎么玩最值得？'
	},
	{
		badge: 'TOP2',
		title: '百年老茶馆',
		desc: '品茗古茶时光',
		cover: '/static/kashgar/ai-place-tea.png',
		question: '喀什老茶馆有什么体验？'
	},
	{
		badge: 'TOP3',
		title: '喀什老街巷',
		desc: '漫步古城老街',
		cover: '/static/kashgar/ai-place-oldstreet.png',
		question: '喀什老街巷适合怎么逛？'
	}
]
