import { createClient } from 'redis'

let redisClient: ReturnType<typeof createClient> | null = null
let redisUnavailable = false

export const getRedisClient = async (): Promise<ReturnType<typeof createClient> | null> => {
	const disabled =
		process.env.REDIS_DISABLED === 'true' || process.env.REDIS_DISABLED === '1'
	if (disabled || redisUnavailable) return null
	if (redisClient) return redisClient

	try {
		const client = createClient({
			socket: {
				host: process.env.REDIS_HOST || 'localhost',
				port: parseInt(process.env.REDIS_PORT || '6379', 10),
				connectTimeout: 3000
			},
			password: process.env.REDIS_PASSWORD || undefined
		})
		client.on('error', () => {}) // Evitar mensajes repetidos en consola
		await client.connect()
		redisClient = client
		return redisClient
	} catch {
		redisUnavailable = true
		console.warn('⚠️ Redis no disponible, ejecutando sin caché')
		return null
	}
}

export const closeRedis = async (): Promise<void> => {
	if (redisClient) {
		await redisClient.quit()
		redisClient = null
	}
	redisUnavailable = false
}
