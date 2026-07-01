import { decodeXichengRouteValue } from './routeParams.js'

export const normalizeXichengServiceHandoffSteps = (steps = []) => (
	Array.isArray(steps)
		? steps
			.map(step => ({
				label: String((step && step.label) || '').trim(),
				copy: String((step && step.copy) || '').trim()
			}))
			.filter(step => step.label || step.copy)
			.slice(0, 3)
		: []
)

export const parseXichengServiceHandoffContext = (value = '') => {
	if (value && typeof value === 'object') {
		return {
			...value,
			handoffSteps: normalizeXichengServiceHandoffSteps(value.handoffSteps)
		}
	}
	const decodedValue = decodeXichengRouteValue(value)
	if (!decodedValue) return {}
	try {
		const parsed = JSON.parse(decodedValue)
		return parsed && typeof parsed === 'object'
			? {
				...parsed,
				handoffSteps: normalizeXichengServiceHandoffSteps(parsed.handoffSteps)
			}
			: {}
	} catch (error) {
		return {}
	}
}

export const getXichengServiceHandoffIntentText = (context = {}) => (
	context.serviceIntentText || context.serviceIntentLabel || context.taskTypeLabel || ''
)

export const getXichengServiceHandoffStepText = (context = {}) => (
	normalizeXichengServiceHandoffSteps(context.handoffSteps)
		.map(step => step.label || step.copy)
		.filter(Boolean)
		.join('、')
)

export const createXichengServiceHandoffRouteContext = (value = '') => {
	const serviceHandoffContext = parseXichengServiceHandoffContext(value)
	return {
		serviceHandoffContext,
		serviceHandoffTitle: serviceHandoffContext.actionTitle || serviceHandoffContext.handoffTitle || '',
		serviceHandoffIntentText: getXichengServiceHandoffIntentText(serviceHandoffContext),
		serviceHandoffStepText: getXichengServiceHandoffStepText(serviceHandoffContext),
		serviceHandoffSummary: serviceHandoffContext.handoffSummary || ''
	}
}

export const createXichengServiceHandoffViewContext = (context = {}) => {
	if (!context.serviceHandoffContext || !context.serviceHandoffTitle) return null
	return {
		title: context.serviceHandoffTitle,
		intentText: context.serviceHandoffIntentText || '现场服务',
		stepText: context.serviceHandoffStepText || context.serviceHandoffSummary || '继续生成服务方案'
	}
}

export const buildXichengServiceHandoffPromptPrefix = (context = {}) => {
	if (!context.serviceHandoffTitle) return ''
	const serviceHandoffTitle = `服务承接：${context.serviceHandoffTitle}。`
	const serviceHandoffIntentText = context.serviceHandoffIntentText ? `服务意图：${context.serviceHandoffIntentText}。` : ''
	const serviceHandoffStepText = context.serviceHandoffStepText ? `下一步：${context.serviceHandoffStepText}。` : ''
	return `${serviceHandoffTitle}${serviceHandoffIntentText}${serviceHandoffStepText}服务边界：涉及商家、优惠、票务或预约时，不要编造可用券、库存或排队结果，必须说明哪些需要真实系统确认。`
}
