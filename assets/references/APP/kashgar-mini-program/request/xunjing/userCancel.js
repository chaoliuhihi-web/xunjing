export const isXunjingUserCancelled = (err = {}) => {
	const message = String((err && (err.errMsg || err.message || err)) || '').toLowerCase()
	return message.includes('cancel') || message.includes('取消')
}
