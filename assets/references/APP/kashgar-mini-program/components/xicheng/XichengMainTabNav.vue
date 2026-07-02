<template>
	<xicheng-bottom-nav
		:items="xichengMainTabItems"
		:active-key="activeKey"
		@navigate="handleXichengMainTabNav"
	/>
</template>

<script>
import { XICHENG_REGION_CONFIG } from '@/config/regions/xicheng.js'
import { createXichengRouteOutputValue } from '@/request/xunjing/routeParams.js'
import XichengBottomNav from '@/components/xicheng-bottom-nav/xicheng-bottom-nav.vue'

const encodeRouteValue = (value = '') => createXichengRouteOutputValue(value, { platform: process.env.UNI_PLATFORM })

export default {
	name: 'XichengMainTabNav',
	components: {
		XichengBottomNav
	},
	props: {
		activeKey: {
			type: String,
			default: 'explore'
		},
		routeContext: {
			type: Object,
			default: () => ({})
		}
	},
	data() {
		return {
			xichengMainTabItems: [
				{ key: 'explore', title: '探索', icon: 'explore' },
				{ key: 'routes', title: '地图', icon: 'routes' },
				{ key: 'record', title: '记录', icon: 'record' },
				{ key: 'mine', title: '我的', icon: 'mine' }
			]
		}
	},
	computed: {
		normalizedContext() {
			return {
				regionCode: this.routeContext.regionCode || XICHENG_REGION_CONFIG.regionCode,
				packageCode: this.routeContext.packageCode || XICHENG_REGION_CONFIG.packageCode,
				sceneCode: this.routeContext.sceneCode || XICHENG_REGION_CONFIG.sceneCode,
				sourceChannel: this.routeContext.sourceChannel || XICHENG_REGION_CONFIG.sourceChannel,
				companionName: this.routeContext.companionName || XICHENG_REGION_CONFIG.companionName
			}
		}
	},
	methods: {
		handleXichengMainTabNav(key = 'explore') {
			if (key === this.activeKey) {
				uni.pageScrollTo({
					scrollTop: 0,
					duration: 220
				})
				return
			}
			switch (key) {
				case 'explore':
					uni.reLaunch({ url: '/pages/xicheng/home/home' })
					break
				case 'routes':
					uni.redirectTo({ url: this.buildXichengRoutesUrl() })
					break
				case 'record':
					uni.redirectTo({ url: this.buildXichengRecordingUrl() })
					break
				case 'mine':
					uni.redirectTo({ url: '/pages/xicheng/works/works' })
					break
				default:
					uni.reLaunch({ url: '/pages/xicheng/home/home' })
			}
		},
		buildXichengRoutesUrl() {
			const context = this.normalizedContext
			return `/pages/xicheng/routes/routes?regionCode=${encodeRouteValue(context.regionCode)}&packageCode=${encodeRouteValue(context.packageCode)}&sceneCode=${encodeRouteValue(context.sceneCode)}&sourceChannel=${encodeRouteValue(context.sourceChannel)}&companionName=${encodeRouteValue(context.companionName)}`
		},
		buildXichengRecordingUrl() {
			const context = this.normalizedContext
			return `/pages/xicheng/recording/recording?autoStart=1&regionCode=${encodeRouteValue(context.regionCode)}&packageCode=${encodeRouteValue(context.packageCode)}&sceneCode=${encodeRouteValue(context.sceneCode)}&sourceChannel=${encodeRouteValue(context.sourceChannel)}&companionName=${encodeRouteValue(context.companionName)}`
		}
	}
}
</script>
