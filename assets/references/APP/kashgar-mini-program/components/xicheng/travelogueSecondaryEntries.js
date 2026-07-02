export const XICHENG_TRAVELOGUE_SECONDARY_ENTRY_CONFIG = Object.freeze([
	{ key: 'footprint', title: '记录与足迹', copy: '路线记录、素材盒、现场备注', icon: 'route', url: '/pages/xicheng/footprint/footprint' },
	{ key: 'passport', title: '路线护照与研学', copy: '打卡徽章、亲子研学任务', icon: 'passport', url: '/pages/xicheng/passport/passport' },
	{ key: 'share', title: '分享与审核', copy: '分享海报、PDF纪念册、作品审核', icon: 'share', url: '/pages/xicheng/share/share' },
	{ key: 'ops', title: '运营与隐私', copy: '城市运营报告、隐私与反馈', icon: 'settings', url: '/pages/xicheng/ops-report/ops-report' }
])

export const createXichengTravelogueSecondaryEntries = ({
	materialCount = 0,
	routePointCount = 0,
	passportProgress = 0,
	completedTaskCount = 0,
	parentChildTaskCount = 0,
	shareArtifactCount = 0,
	reviewText = '',
	recognitionCount = 0,
	reviewBlockerCount = 0
} = {}) => XICHENG_TRAVELOGUE_SECONDARY_ENTRY_CONFIG.map(entry => ({
	...entry,
	meta: {
		footprint: `${materialCount} 素材 · ${routePointCount} 轨迹点`,
		passport: `${passportProgress}% 护照 · ${completedTaskCount}/${parentChildTaskCount} 任务`,
		share: `${shareArtifactCount} 产物 · ${reviewText}`,
		ops: `${recognitionCount} 识别 · ${reviewBlockerCount} 待复核`
	}[entry.key] || ''
}))
