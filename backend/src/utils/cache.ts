import { getRedisClient } from '../config/redis'

const CACHE_TTL = 3600

export const getCache = async <T>(key: string): Promise<T | null> => {
	try {
		const client = await getRedisClient()
		if (!client) return null
		const cached = await client.get(key)
		if (cached) return JSON.parse(cached) as T
		return null
	} catch {
		return null
	}
}

export const setCache = async <T>(
	key: string,
	value: T,
	ttl: number = CACHE_TTL
): Promise<void> => {
	try {
		const client = await getRedisClient()
		if (!client) return
		await client.setEx(key, ttl, JSON.stringify(value))
	} catch {
		// Sin Redis se ignora la caché
	}
}

export const deleteCache = async (key: string): Promise<void> => {
	try {
		const client = await getRedisClient()
		if (!client) return
		await client.del(key)
	} catch {
		// Sin Redis no hay nada que borrar
	}
}

export const deleteCachePattern = async (pattern: string): Promise<void> => {
	try {
		const client = await getRedisClient()
		if (!client) return
		const keys = await client.keys(pattern)
		if (keys.length > 0) await client.del(keys)
	} catch {
		// Sin Redis no hay nada que borrar
	}
}
