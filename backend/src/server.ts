import dotenv from 'dotenv'
import { createApp } from './app'
import { getPool } from './config/database'
import { getRedisClient } from './config/redis'

dotenv.config()

const PORT = process.env.PORT || 3000

const startServer = async () => {
	try {
		await getPool()
		console.log('✅ MySQL conectado')

		await getRedisClient()
		console.log('✅ Redis conectado')

		const app = createApp()

		app.listen(PORT, () => {
			console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
		})
	} catch (error) {
		console.error('❌ Error al iniciar servidor:', error)
		process.exit(1)
	}
}

startServer()
