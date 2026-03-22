import 'dotenv/config'
import { createApp } from './app'
import pool from './config/database'
import { getRedisClient } from './config/redis'

const PORT = Number(process.env.PORT) || 3000

const startServer = async () => {
	const app = createApp()

	// Abrir el puerto ANTES de PostgreSQL/Redis: Render hace un port scan;
	// si la BD tarda o falla, igual hay un proceso escuchando en PORT.
	app.listen(PORT, '0.0.0.0', () => {
		console.log(`🚀 Servidor escuchando en 0.0.0.0:${PORT}`)
	})

	try {
		await pool.query('SELECT 1')
		console.log('✅ PostgreSQL (Neon) conectado')
	} catch (error: unknown) {
		console.error('❌ PostgreSQL no disponible:', error)
		console.error(
			'💡 En Render: revisa DATABASE_URL (Neon) y ?sslmode=require. ' +
				'El servidor sigue arriba para no bloquear el health check.',
		)
	}

	const redis = await Promise.race([
		getRedisClient(),
		new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
	])
	if (redis) console.log('✅ Redis conectado')
	else console.log('⚠️ Redis no disponible, ejecutando sin caché')

	// Keep-alive (misma instancia)
	const localHealth = `http://127.0.0.1:${PORT}/health`
	setInterval(async () => {
		try {
			await fetch(localHealth)
			console.log('🔄 Keep-alive ping OK')
		} catch (err) {
			console.warn('⚠️ Keep-alive ping falló:', err)
		}
	}, 10 * 60 * 1000)
}

startServer().catch((error: unknown) => {
	console.error('❌ Error al iniciar servidor:', error)
	process.exit(1)
})
