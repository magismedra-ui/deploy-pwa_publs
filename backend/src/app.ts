import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler'

import authRoutes from './routes/auth.routes'
import addinfopublRoutes from './routes/addinfopubl.routes'
import asistenciaRoutes from './routes/asistencia.routes'
import grupoRoutes from './routes/grupo.routes'
import publicadorRoutes from './routes/publicador.routes'
import registroRoutes from './routes/registro.routes'
import roleRoutes from './routes/role.routes'
import usuarioRoutes from './routes/usuario.routes'

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
})

export const createApp = (): Express => {
	const app = express()

	app.use(helmet())
	app.use(cors({
		origin: [
			'http://localhost:5173',
			'http://localhost:3001',
			process.env.FRONTEND_URL ?? '',
		].filter(Boolean),
		credentials: true,
	}))
	app.use(express.json())
	app.use(express.urlencoded({ extended: true }))
	app.use(limiter)

	// APIs JSON: no cachear en navegador/CDN (evita 304 sin cuerpo útil en el cliente)
	app.use('/api', (_req, res, next) => {
		res.setHeader(
			'Cache-Control',
			'no-store, no-cache, must-revalidate, private',
		)
		res.setHeader('Pragma', 'no-cache')
		res.setHeader('Expires', '0')
		next()
	})

	app.use('/api/v1/auth', authRoutes)
	app.use('/api/v1/addinfopubl', addinfopublRoutes)
	app.use('/api/v1/asistencia', asistenciaRoutes)
	app.use('/api/v1/grupo', grupoRoutes)
	app.use('/api/v1/publicador', publicadorRoutes)
	app.use('/api/v1/registro', registroRoutes)
	app.use('/api/v1/role', roleRoutes)
	app.use('/api/v1/usuario', usuarioRoutes)

	app.get('/health', (_req, res) => {
		res.status(200).json({ success: true, message: 'API funcionando correctamente' })
	})

	app.use(notFoundHandler)
	app.use(errorHandler)

	return app
}
