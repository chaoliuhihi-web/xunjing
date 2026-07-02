<template>
	<view class="travelogue-editor-topbar">
		<view class="travelogue-editor-back" @click="$emit('go-back')">
			<xicheng-icon name="back" variant="plain" :size="22" />
		</view>
		<text class="travelogue-editor-title">编辑游记</text>
		<view class="travelogue-editor-more" @click="$emit('open-actions')">
			<xicheng-icon name="more" variant="plain" :size="22" />
		</view>
	</view>
</template>

<script>
export default {
	name: 'XichengTravelogueEditTopbar',
	emits: ['go-back', 'open-actions']
}
</script>
