import { normalizeXichengSafetyStatus } from './safety.js'

export const decodeXichengRouteValue = (value = '') => {
	let decodedValue = String(value || '').replace(/\+/g, ' ')
	for (let decodeIndex = 0; decodeIndex < 3; decodeIndex += 1) {
		try {
			const nextValue = decodeURIComponent(decodedValue)
			if (nextValue === decodedValue) {
				return decodedValue
			}
			decodedValue = nextValue
		} catch (error) {
			return decodedValue
		}
	}
	return decodedValue
}

export const createXichengRouteOutputValue = (value = '', { platform = '' } = {}) => {
	const decodedValue = decodeXichengRouteValue(value)
	if (String(platform || '').toLowerCase() === 'h5') {
		return decodedValue
	}
	return encodeURIComponent(decodedValue)
}

export const createXichengRouteSignature = (routeOptions = {}) => JSON.stringify({
	mode: decodeXichengRouteValue(routeOptions.mode),
	question: decodeXichengRouteValue(routeOptions.question),
	regionCode: decodeXichengRouteValue(routeOptions.regionCode),
	packageCode: decodeXichengRouteValue(routeOptions.packageCode),
	sceneCode: decodeXichengRouteValue(routeOptions.sceneCode),
	sourceChannel: decodeXichengRouteValue(routeOptions.sourceChannel),
	poiCode: decodeXichengRouteValue(routeOptions.poiCode),
	poiName: decodeXichengRouteValue(routeOptions.poiName),
	companionName: decodeXichengRouteValue(routeOptions.companionName),
	safetyStatus: normalizeXichengSafetyStatus(routeOptions.safetyStatus),
	serviceHandoffContext: decodeXichengRouteValue(routeOptions.serviceHandoffContext)
})
