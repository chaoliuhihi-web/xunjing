export const createXichengTravelogueGenerationStateMixin = () => ({
	data() {
		return {
			travelogueGenerationStatus: 'idle',
			travelogueGenerationFailureReason: ''
		}
	},
	computed: {
		travelogueGenerationState() {
			if (this.travelogueGenerationStatus === 'failed') return 'failed'
			if (!this.hasTraveloguePreviewEvidence) return 'insufficient'
			return 'ready'
		},
		travelogueMaterialHints() {
			return [
				{ key: 'scan', title: '识别一个西城地点', copy: this.materialCount > 0 ? `${this.materialCount} 条素材已进入草稿` : '从扫一扫、拍照、OCR 或文字线索确认官方 POI。' },
				{ key: 'route', title: '开始一段路线记录', copy: this.routePointCount > 0 ? `${this.routePointCount} 个轨迹点可用于路线故事线` : '从官方 Citywalk 开始记录，积累停留点和打卡。' },
				{ key: 'photo', title: '补充照片或现场备注', copy: this.photoMaterialCount > 0 || this.remarkMaterialCount > 0 ? `照片 ${this.photoMaterialCount} · 备注 ${this.remarkMaterialCount}` : '补一张照片或一句真实感受，让长文更像自己的游记。' }
			]
		}
	},
	methods: {
		generateTravelogueDraft() {
			if (!this.hasTraveloguePreviewEvidence) {
				this.travelogueGenerationStatus = 'insufficient'
				this.travelogueGenerationFailureReason = ''
				uni.showToast({ title: '素材不足，不能生成草稿', icon: 'none' })
				return
			}
			try {
				this.refreshDraftFromEvidence()
				this.travelogueGenerationStatus = 'ready'
				this.travelogueGenerationFailureReason = ''
				uni.showToast({ title: '游记草稿已生成', icon: 'none' })
			} catch (error) {
				this.travelogueGenerationStatus = 'failed'
				this.travelogueGenerationFailureReason = error && error.message ? error.message : '生成服务暂时不可用'
				uni.showToast({ title: '游记生成失败，可重试', icon: 'none' })
			}
		},
		openRoutesPage() {
			uni.navigateTo({ url: '/pages/xicheng/routes/routes' })
		}
	}
})
