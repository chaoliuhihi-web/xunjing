export const decodeXichengRouteValue = (value = '') => {
	let decodedValue = String(value || '')
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
