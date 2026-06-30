const findInitialQuestionIndex = (messages = [], question = '') => {
	const normalizedQuestion = String(question || '').trim()
	if (!normalizedQuestion || !Array.isArray(messages)) return -1
	return messages.findIndex(item =>
		item
		&& item.role === 'user'
		&& String(item.content || '').trim() === normalizedQuestion
	)
}

export const hasCompletedInitialQuestionInMessages = (messages = [], question = '') => {
	const normalizedQuestion = String(question || '').trim()
	if (!normalizedQuestion) return false
	const questionIndex = findInitialQuestionIndex(messages, normalizedQuestion)
	if (questionIndex < 0) return false
	return messages.slice(questionIndex + 1).some(item =>
		item
		&& item.role === 'assistant'
		&& !item.isPending
		&& String(item.content || '').trim()
	)
}

export const hasPendingInitialQuestionInMessages = (messages = [], question = '') => {
	const normalizedQuestion = String(question || '').trim()
	if (!normalizedQuestion) return false
	const questionIndex = findInitialQuestionIndex(messages, normalizedQuestion)
	if (questionIndex < 0) return false
	return messages.slice(questionIndex + 1).some(item =>
		item
		&& item.role === 'assistant'
		&& item.isPending
	)
}
