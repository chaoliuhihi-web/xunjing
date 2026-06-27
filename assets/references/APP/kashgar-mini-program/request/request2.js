// 发送ajax请求
import config from "./config";
import global from './global.js';

const AUTH_PAGE = '/pagesLogin/auth/auth';
const DEFAULT_TIMEOUT = 15000;
const pendingRequests = new Map();
const responseCache = new Map();

const stableStringify = (value) => {
	if (!value || typeof value !== 'object') {
		return String(value === undefined || value === null ? '' : value);
	}
	if (Array.isArray(value)) {
		return `[${value.map(stableStringify).join(',')}]`;
	}
	return Object.keys(value).sort().map(key => `${key}:${stableStringify(value[key])}`).join('|');
};

const parsePayload = (payload) => {
	if (typeof payload !== 'string') {
		return payload;
	}
	try {
		return JSON.parse(payload);
	} catch (error) {
		return payload;
	}
};

const rejectAuthExpired = (reject) => {
	const error = {
		type: 'AUTH_EXPIRED',
		code: 403,
		message: '登录状态已失效'
	};
	uni.clearStorageSync();
	if (!global.globalLoginOK) {
		global.globalLoginOK = true;
		uni.reLaunch({
			url: AUTH_PAGE
		});
	}
	reject(error);
};

export default (url, data = {}, method = 'GET', needToken = true, options = {}) => {
	const requestMethod = String(method || 'GET').toUpperCase();
	const token = needToken ? (uni.getStorageSync('token') || '') : '';
	const requestKey = `${requestMethod}:${url}:${stableStringify(data)}:${token}`;
	const cacheTime = Number(options.cacheTime || 0);
	const useCache = requestMethod === 'GET' && cacheTime > 0;
	const useDedupe = requestMethod === 'GET' && options.dedupe !== false;

	if (useCache) {
		const cached = responseCache.get(requestKey);
		if (cached && cached.expires > Date.now()) {
			return Promise.resolve(cached.data);
		}
	}

	if (useDedupe && pendingRequests.has(requestKey)) {
		return pendingRequests.get(requestKey);
	}

	const requestPromise = new Promise((resolve, reject) => {
		let header = {
			'Content-Type': 'application/json;charset=utf-8',
		}
		if (needToken) {
			if (token != null && token != '') {
				header.Authorization = "Bearer " + token
			}
		}
		// 1. new Promise初始化promise实例的状态为pending
		uni.request({
			url: config.UrlRequest + url,
			data,
			method: requestMethod,
			header,
			timeout: options.timeout || DEFAULT_TIMEOUT,
			success: (res) => {
				try {
					const payload = parsePayload(res.data);
					if (res.statusCode === 403 || (payload && payload.code == 403)) {
						rejectAuthExpired(reject);
						return
					}
					if (res.statusCode < 200 || res.statusCode >= 300) {
						reject({
							type: 'HTTP_ERROR',
							code: res.statusCode,
							message: '网络请求失败',
							data: payload
						});
						return
					}
					if (!payload || typeof payload !== 'object') {
						reject({
							type: 'INVALID_RESPONSE',
							code: res.statusCode,
							message: '接口返回格式异常',
							data: payload
						});
						return
					}
					if (useCache) {
						responseCache.set(requestKey, {
							data: payload,
							expires: Date.now() + cacheTime
						});
					}
					resolve(payload);
				} catch (error) {
					reject(error);
				}
			},
			fail: (err) => {
				reject({
					type: 'REQUEST_FAILED',
					message: err && err.errMsg ? err.errMsg : '网络请求失败',
					error: err
				});
			},
		})
	});

	if (useDedupe) {
		pendingRequests.set(requestKey, requestPromise);
		requestPromise.then(
			() => pendingRequests.delete(requestKey),
			() => pendingRequests.delete(requestKey)
		);
	}

	return requestPromise;
}
