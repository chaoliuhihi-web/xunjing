/**
 * 用户相关工具函数
 */

/**
 * 获取当前登录用户的ID
 * @returns {Number|null} 用户ID，如果未登录返回null
 */
export function getUserId() {
	try {
		const userId = uni.getStorageSync('userId')
		return userId || null
	} catch (e) {
		console.error('获取用户ID失败:', e)
		return null
	}
}

/**
 * 设置用户ID
 * @param {Number} userId 用户ID
 */
export function setUserId(userId) {
	try {
		uni.setStorageSync('userId', userId)
	} catch (e) {
		console.error('保存用户ID失败:', e)
	}
}

/**
 * 获取完整的用户信息
 * @returns {Object|null} 用户信息对象，如果未登录返回null
 */
export function getUserInfo() {
	try {
		const userModel = uni.getStorageSync('userModel')
		return userModel || null
	} catch (e) {
		console.error('获取用户信息失败:', e)
		return null
	}
}

/**
 * 获取用户token
 * @returns {String|null} token，如果未登录返回null
 */
export function getToken() {
	try {
		const token = uni.getStorageSync('token')
		return token || null
	} catch (e) {
		console.error('获取token失败:', e)
		return null
	}
}

/**
 * 清除所有用户相关数据
 */
export function clearUserData() {
	try {
		uni.clearStorageSync()
	} catch (e) {
		console.error('清除用户数据失败:', e)
	}
}

/**
 * 检查用户是否已登录
 * @returns {Boolean} 是否已登录
 */
export function isLoggedIn() {
	const token = getToken()
	const userId = getUserId()
	return !!(token && userId)
}

export default {
	getUserId,
	setUserId,
	getUserInfo,
	getToken,
	clearUserData,
	isLoggedIn
}
