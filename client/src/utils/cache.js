/**
 * 缓存工具函数 - 基于 localStorage 实现
 * 支持设置 TTL（过期时间）
 */

const CACHE_PREFIX = 'blog_cache_'

/**
 * 生成缓存 key
 * @param {string} key - 原始 key
 * @returns {string} - 带前缀的缓存 key
 */
function wrapKey(key) {
  return `${CACHE_PREFIX}${key}`
}

/**
 * 将数据序列化（支持 Set/Map）
 * @param {any} value - 要序列化的值
 * @returns {string} - JSON 字符串
 */
function serialize(value) {
  return JSON.stringify(value, (k, v) => {
    if (v instanceof Set) return { __type: 'Set', data: [...v] }
    if (v instanceof Map) return { __type: 'Map', data: [...v] }
    return v
  })
}

/**
 * 反序列化数据
 * @param {string} str - JSON 字符串
 * @returns {any} - 反序列化后的值
 */
function deserialize(str) {
  if (!str) return null
  try {
    return JSON.parse(str, (k, v) => {
      if (v && v.__type === 'Set') return new Set(v.data)
      if (v && v.__type === 'Map') return new Map(v.data)
      return v
    })
  } catch {
    return null
  }
}

/**
 * 获取缓存
 * @param {string} key - 缓存 key
 * @returns {{ value: any, expired: boolean } | null} - 缓存数据和是否过期，null 表示不存在或已过期
 */
export function getCache(key) {
  const storageKey = wrapKey(key)
  const item = localStorage.getItem(storageKey)
  
  if (!item) return null
  
  try {
    const { value, expiresAt } = JSON.parse(item)
    const now = Date.now()
    
    // 检查是否过期
    if (expiresAt && now > expiresAt) {
      // 已过期，删除缓存
      localStorage.removeItem(storageKey)
      return null
    }
    
    return { value, expired: false }
  } catch {
    return null
  }
}

/**
 * 设置缓存
 * @param {string} key - 缓存 key
 * @param {any} value - 缓存值
 * @param {number} ttl - 过期时间（毫秒），0 表示永不过期
 * @param {number} [ttlSeconds] - 过期时间（秒），与 ttl 二选一，默认 120 秒
 */
export function setCache(key, value, ttlSeconds = 120) {
  const storageKey = wrapKey(key)
  const now = Date.now()
  
  const cacheData = {
    value,
    expiresAt: ttlSeconds > 0 ? now + ttlSeconds * 1000 : 0
  }
  
  try {
    localStorage.setItem(storageKey, JSON.stringify(cacheData))
  } catch (e) {
    // localStorage 满了，尝试清理旧缓存
    clearExpiredCache()
    try {
      localStorage.setItem(storageKey, JSON.stringify(cacheData))
    } catch {
      console.warn('Cache: Failed to save to localStorage')
    }
  }
}

/**
 * 清除指定缓存
 * @param {string} key - 缓存 key
 */
export function clearCache(key) {
  const storageKey = wrapKey(key)
  localStorage.removeItem(storageKey)
}

/**
 * 清除所有缓存
 */
export function clearAllCache() {
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))
}

/**
 * 清除所有过期缓存
 */
export function clearExpiredCache() {
  const keysToRemove = []
  const now = Date.now()
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(CACHE_PREFIX)) {
      try {
        const item = localStorage.getItem(key)
        const { expiresAt } = JSON.parse(item)
        if (expiresAt && now > expiresAt) {
          keysToRemove.push(key)
        }
      } catch {
        keysToRemove.push(key)
      }
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key))
}

/**
 * 生成请求缓存 key
 * @param {string} url - 请求 URL
 * @param {object} [params] - 请求参数
 * @returns {string} - 缓存 key
 */
export function generateCacheKey(url, params) {
  return params ? `${url}?${JSON.stringify(params)}` : url
}

export default {
  getCache,
  setCache,
  clearCache,
  clearAllCache,
  clearExpiredCache,
  generateCacheKey
}
