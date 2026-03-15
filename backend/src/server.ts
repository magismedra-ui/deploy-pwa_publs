import 'dotenv/config'
import { createApp } from './app'
import pool from './config/database'
import { getRedisClient } from './config/redis'

const PORT = process.env.PORT || 3000

const startServer = async () => {
	try {
		// Verificar conexión a PostgreSQL (Neon)
		await pool.query('SELECT 1')
		console.log('✅ PostgreSQL (Neon) conectado')

		const redis = await getRedisClient()
		if (redis) console.log('✅ Redis conectado')
		else console.log('⚠️ Redis no disponible, ejecutando sin caché')

		const app = createApp()

		app.listen(Number(PORT), '0.0.0.0', () => {
			console.log(`🚀 Servidor corriendo en 0.0.0.0:${PORT}`)
		})
	} catch (error: unknown) {
		console.error('❌ Error al iniciar servidor:', error)
		const err = error as NodeJS.ErrnoException & { errors?: NodeJS.ErrnoException[] }
		const firstErr = err.errors?.[0] ?? err
		const isRefused =
			firstErr.code === 'ECONNREFUSED' ||
			String((error as Error).message).includes('ECONNREFUSED')
		if (isRefused) {
			console.error(
				'\n💡 Posibles soluciones:\n' +
					'  1. Crea backend/.env con DATABASE_URL (copia desde .env.example).\n' +
					'  2. Si usas PostgreSQL local: inicia el servicio en el puerto 5432.\n' +
					'  3. Si usas Neon: usa la URL que te da el panel (incluye ?sslmode=require).\n'
			)
		}
		process.exit(1)
	}
}

startServer()
