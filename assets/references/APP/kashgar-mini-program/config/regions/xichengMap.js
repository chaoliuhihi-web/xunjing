export const XICHENG_CULTURAL_MAP_CATEGORIES = Object.freeze([
	{ key: 'culture-building', label: '文化建筑', color: '#16805F' },
	{ key: 'historic-site', label: '历史遗迹', color: '#A6783D' },
	{ key: 'hutong', label: '胡同院落', color: '#4E83A4' },
	{ key: 'food-shopping', label: '美食购物', color: '#D97A32' },
	{ key: 'nature', label: '自然景观', color: '#6F8E54' }
])

export const XICHENG_CULTURAL_MAP_POI_LAYOUTS = Object.freeze({
	'xicheng-baitasi': { left: 19, top: 63, categoryKey: 'culture-building', iconName: 'layer', image: '/static/xicheng/poi-baitasi-card.jpg' },
	'xicheng-imperial-temple': { left: 41, top: 70, categoryKey: 'historic-site', iconName: 'layer' },
	'xicheng-shichahai': { left: 50, top: 39, categoryKey: 'nature', iconName: 'location' },
	'xicheng-beihai': { left: 63, top: 28, categoryKey: 'nature', iconName: 'layer' },
	'xicheng-dashilar': { left: 72, top: 73, categoryKey: 'food-shopping', iconName: 'route' },
	'xicheng-beihai-north-gate': { left: 68, top: 27, categoryKey: 'culture-building', iconName: 'layer' },
	'xicheng-huguosi-street': { left: 72, top: 48, categoryKey: 'historic-site', iconName: 'layer' },
	'xicheng-hutong-yard': { left: 58, top: 55, categoryKey: 'hutong', iconName: 'location' },
	'xicheng-food-market': { left: 36, top: 58, categoryKey: 'food-shopping', iconName: 'route' }
})

export const XICHENG_CULTURAL_MAP_FALLBACK_POIS = Object.freeze([
	{ poiCode: 'xicheng-baitasi', poiName: '白塔寺', summary: '元大都古刹地标，白塔与胡同肌理相映成景。' },
	{ poiCode: 'xicheng-imperial-temple', poiName: '历代帝王庙', summary: '明清皇家礼制空间，适合串联古建与中轴叙事。' },
	{ poiCode: 'xicheng-shichahai', poiName: '什刹海', summary: '老北京水系与胡同生活交汇的慢行节点。' },
	{ poiCode: 'xicheng-beihai-north-gate', poiName: '北海北门', summary: '皇家园林北侧入口，适合作为水岸路线起点。' },
	{ poiCode: 'xicheng-huguosi-street', poiName: '护国寺街', summary: '从寺庙旧址延展出的京味街区和小吃线索。' },
	{ poiCode: 'xicheng-hutong-yard', poiName: '胡同院落', summary: '观察院落门楼、影壁和街巷尺度的生活场景。' },
	{ poiCode: 'xicheng-dashilar', poiName: '大栅栏', summary: '老字号与前门商业记忆交织的步行街区。' }
])

export const XICHENG_CULTURAL_MAP_BACKDROP = Object.freeze({
	sketches: Object.freeze([
		{ key: 'white-pagoda', className: 'xicheng-map-sketch-pagoda' },
		{ key: 'gate-north', className: 'xicheng-map-sketch-gate-north' },
		{ key: 'gate-south', className: 'xicheng-map-sketch-gate-south' },
		{ key: 'temple-east', className: 'xicheng-map-sketch-temple-east' }
	]),
	trees: Object.freeze([
		{ key: 'tree-1', left: 18, top: 22 },
		{ key: 'tree-2', left: 28, top: 72 },
		{ key: 'tree-3', left: 38, top: 18 },
		{ key: 'tree-4', left: 52, top: 64 },
		{ key: 'tree-5', left: 76, top: 34 },
		{ key: 'tree-6', left: 82, top: 70 },
		{ key: 'tree-7', left: 66, top: 82 },
		{ key: 'tree-8', left: 13, top: 52 }
	])
})
