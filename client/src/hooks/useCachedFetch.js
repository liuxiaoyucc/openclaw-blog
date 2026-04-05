import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { getCache, setCache, generateCacheKey } from '../utils/cache'

/**
 * SWR 风格的数据获取 Hook
 * 
 * @param {string} url - 请求 URL（相对于 baseURL）
 * @param {object} [options] - 配置选项
 * @param {object} [options.params] - 请求参数
 * @param {number} [options.ttl=120] - 缓存过期时间（秒），默认 2 分钟
 * @param {boolean} [options.enabled=true] - 是否启用缓存
 * @param {function} [options.onSuccess] - 请求成功回调
 * @param {function} [options.onError] - 请求失败回调
 * @returns {{ data: any, error: Error|null, loading: boolean, mutate: function, clearCache: function }}
 */
export function useCachedFetch(url, options = {}) {
  const {
    params = null,
    ttl = 120,
    enabled = true,
    onSuccess,
    onError
  } = options

  const cacheKey = generateCacheKey(url, params)
  
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const isMountedRef = useRef(true)
  const fetchControllerRef = useRef(null)

  // 清理函数：组件卸载时取消请求
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort()
      }
    }
  }, [])

  // 核心获取逻辑
  const fetchData = useCallback(async (isInitial = false) => {
    // 如果未启用或没有 url，直接返回
    if (!enabled || !url) {
      setLoading(false)
      return
    }

    // 初始加载时，先尝试从缓存读取
    if (isInitial) {
      const cached = getCache(cacheKey)
      if (cached) {
        setData(cached.value)
        setError(null)
        setLoading(false)
        // 这里 loading 已设为 false，但会继续后台刷新
      }
    }

    // 创建新的 AbortController
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort()
    }
    fetchControllerRef.current = new AbortController()

    setLoading(isInitial && !getCache(cacheKey))
    setError(null)

    try {
      const res = await axios.get(url, {
        params,
        signal: fetchControllerRef.current.signal
      })

      if (!isMountedRef.current) return

      const result = res.data
      
      // 更新缓存
      setCache(cacheKey, result, ttl)
      
      setData(result)
      setError(null)
      
      if (onSuccess) onSuccess(result)
    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError') {
        // 请求被取消，忽略
        return
      }
      
      if (!isMountedRef.current) return
      
      setError(err)
      if (onError) onError(err)
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [url, params, ttl, enabled, cacheKey, onSuccess, onError])

  // 初始化和数据变化时获取数据
  useEffect(() => {
    fetchData(true)
  }, [url, params])

  /**
   * 手动触发重新获取（不清除缓存）
   */
  const mutate = useCallback(async () => {
    await fetchData(false)
  }, [fetchData])

  /**
   * 清除该请求的缓存并重新获取
   */
  const clearCache = useCallback(() => {
    const { clearCache: doClearCache } = require('../utils/cache')
    doClearCache(cacheKey)
    fetchData(false)
  }, [cacheKey, fetchData])

  return {
    data,
    error,
    loading,
    mutate,
    clearCache
  }
}

export default useCachedFetch
