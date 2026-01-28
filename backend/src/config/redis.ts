import { createClient } from 'redis'

let redisClient: ReturnType<typeof createClient> | null = null

export const getRedisClient = async () => {
	if (!redisClient) {
		redisClient = createClient({
			socket: {
				host: process.env.REDIS_HOST || 'localhost',
				port: parseInt(process.env.REDIS_PORT || '6379')
			},
			password: process.env.REDIS_PASSWORD || undefined
		})

		redisClient.on('error', (err) => {
			console.error('Redis Client Error:', err)
		})

		await redisClient.connect()
	}
	return redisClient
}

export const closeRedis = async (): Promise<void> => {
	if (redisClient) {
		await redisClient.quit()
		redisClient = null
	}
}
