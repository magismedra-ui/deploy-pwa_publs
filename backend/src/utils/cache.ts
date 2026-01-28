import { getRedisClient } from '../config/redis'

const CACHE_TTL = 3600

export const getCache = async <T>(key: string): Promise<T | null> => {
	try {
		const client = await getRedisClient()
		const cached = await client.get(key)
		if (cached) {
			return JSON.parse(cached) as T
		}
		return null
	} catch (error) {
		console.error('Cache get error:', error)
		return null
	}
}

export const setCache = async <T>(key: string, value: T, ttl: number = CACHE_TTL): Promise<void> => {
	try {
		const client = await getRedisClient()
		await client.setEx(key, ttl, JSON.stringify(value))
	} catch (error) {
		console.error('Cache set error:', error)
	}
}

export const deleteCache = async (key: string): Promise<void> => {
	try {
		const client = await getRedisClient()
		await client.del(key)
	} catch (error) {
		console.error('Cache delete error:', error)
	}
}

export const deleteCachePattern = async (pattern: string): Promise<void> => {
	try {
		const client = await getRedisClient()
		const keys = await client.keys(pattern)
		if (keys.length > 0) {
			await client.del(keys)
		}
	} catch (error) {
		console.error('Cache delete pattern error:', error)
	}
}
