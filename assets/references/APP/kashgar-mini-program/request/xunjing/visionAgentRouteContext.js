import { decodeXichengRouteValue as decodeRouteValue } from './routeParams.js'

export const parseXichengVisionAgentRouteContext = (value = '') => {
	if (value && typeof value === 'object') return value
	const decodedValue = decodeRouteValue(value)
	if (!decodedValue) return {}
	try {
		const parsed = JSON.parse(decodedValue)
		return parsed && typeof parsed === 'object' ? parsed : {}
	} catch (error) {
		return { sourceRecognitionContext: decodedValue }
	}
}

export const mergeXichengVisionAgentRouteContext = (routeOptions = {}, selectedCached = null) => {
	const routeVisionAgentContext = routeOptions.visionAgentContext && typeof routeOptions.visionAgentContext === 'object'
		? routeOptions.visionAgentContext
		: {}
	const cachedVisionAgentContext = selectedCached && selectedCached.visionAgentContext && typeof selectedCached.visionAgentContext === 'object'
		? selectedCached.visionAgentContext
		: {}
	const baseVisionAgentContext = Object.keys(routeVisionAgentContext).length > 0 ? routeVisionAgentContext : cachedVisionAgentContext
	if (Object.keys(baseVisionAgentContext).length === 0 && !routeOptions.sourceRecognitionContext && !routeOptions.memorySessionSceneCount) return {}
	return {
		...baseVisionAgentContext,
		sourceRecognitionContext: routeOptions.sourceRecognitionContext || baseVisionAgentContext.sourceRecognitionContext || '',
		memorySessionSceneCount: routeOptions.memorySessionSceneCount || baseVisionAgentContext.memorySessionSceneCount || ''
	}
}
