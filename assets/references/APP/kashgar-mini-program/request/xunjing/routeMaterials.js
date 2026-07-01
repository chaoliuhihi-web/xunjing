const safeArray = value => Array.isArray(value) ? value : []
const normalizeKeyPart = value => String(value || '').trim()

export const createXichengRouteMaterialKey = (material = {}) => {
	const type = normalizeKeyPart(material.type)
	const routeCode = normalizeKeyPart(material.routeCode)
	const poiCode = normalizeKeyPart(material.poiCode)
	const poiName = normalizeKeyPart(material.poiName)
	if (!type || !routeCode || (!poiCode && !poiName)) return ''
	return [type, routeCode, poiCode || poiName].join(':')
}

export const mergeXichengOfficialRouteMaterials = (routeMaterials = [], existingMaterials = []) => {
	const routeMaterialsList = safeArray(routeMaterials).filter(Boolean)
	const routeMaterialKeys = new Set(
		routeMaterialsList
			.map(material => createXichengRouteMaterialKey(material))
			.filter(Boolean)
	)
	const preservedMaterials = safeArray(existingMaterials)
		.filter(Boolean)
		.filter(material => !routeMaterialKeys.has(createXichengRouteMaterialKey(material)))
	return [
		...routeMaterialsList,
		...preservedMaterials
	]
}
