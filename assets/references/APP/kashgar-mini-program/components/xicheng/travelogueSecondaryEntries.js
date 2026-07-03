export const XICHENG_TRAVELOGUE_SECONDARY_ENTRY_CONFIG = Object.freeze([
	{ key: 'material', title: '记录素材', copy: '照片、轨迹、现场备注', icon: 'route', url: '/pages/xicheng/footprint/footprint?mode=travelogueMaterial' },
	{ key: 'routes', title: '文旅地图路线', copy: 'POI 路线、攻略导入、开始记录', icon: 'routes', url: '/pages/xicheng/routes/routes' },
	{ key: 'works', title: '我的游记', copy: '电子书预览、PDF 打印、发布管理', icon: 'edit', url: '/pages/xicheng/works/works' },
	{ key: 'privacy', title: '隐私与反馈', copy: '公开范围、定位授权、问题反馈', icon: 'settings', url: '/pages/xicheng/ops-report/ops-report' }
])

export const createXichengTravelogueSecondaryEntries = ({
	materialCount = 0,
	routePointCount = 0,
	shareArtifactCount = 0,
	recognitionCount = 0,
	reviewBlockerCount = 0
} = {}) => XICHENG_TRAVELOGUE_SECONDARY_ENTRY_CONFIG.map(entry => ({
	...entry,
	meta: {
		material: `${materialCount} 素材 · ${routePointCount} 轨迹点`,
		routes: `${recognitionCount} 地点 · 可生成路线`,
		works: `${shareArtifactCount} 导出 · 可继续编辑`,
		privacy: reviewBlockerCount > 0 ? `${reviewBlockerCount} 项需确认` : '公开范围可管理'
	}[entry.key] || ''
}))
