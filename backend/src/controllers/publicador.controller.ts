import { Response, NextFunction } from 'express'
import { PublicadorService } from '../services/publicador.service'
import { AppError } from '../middlewares/errorHandler'
import { AuthRequest } from '../middlewares/auth'
import { RegistroService } from '../services/registro.service'
import { TarjetaPublicadorService } from '../services/tarjeta-publicador.service'

export class PublicadorController {
	private service: PublicadorService
	private registroService: RegistroService
	private tarjetaService: TarjetaPublicadorService

	constructor() {
		this.service = new PublicadorService()
		this.registroService = new RegistroService()
		this.tarjetaService = new TarjetaPublicadorService()
	}

	findAll = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
		try {
			const data = await this.service.findAll()
			res.status(200).json({ success: true, data })
		} catch (error) {
			next(error)
		}
	}

	findById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
		try {
			const id = req.params.id
			const data = await this.service.findById(id)

			if (!data) {
				const error: AppError = new Error('Recurso no encontrado')
				error.statusCode = 404
				throw error
			}

			res.status(200).json({ success: true, data })
		} catch (error) {
			next(error)
		}
	}

	findByGrupo = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
		try {
			const grupo = req.params.grupo
			const data = await this.service.findByGrupo(grupo)
			res.status(200).json({ success: true, data })
		} catch (error) {
			next(error)
		}
	}

	create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
		try {
			const data = await this.service.create(req.body)
			res.status(201).json({ success: true, data })
		} catch (error) {
			next(error)
		}
	}

	update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
		try {
			const id = req.params.id
			const data = await this.service.update(id, req.body)

			if (!data) {
				const error: AppError = new Error('Recurso no encontrado')
				error.statusCode = 404
				throw error
			}

			res.status(200).json({ success: true, data })
		} catch (error) {
			next(error)
		}
	}

	delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
		try {
			const id = req.params.id
			const deleted = await this.service.delete(id)

			if (!deleted) {
				const error: AppError = new Error('Recurso no encontrado')
				error.statusCode = 404
				throw error
			}

			res.status(200).json({ success: true, message: 'Recurso eliminado correctamente' })
		} catch (error) {
			next(error)
		}
	}

	downloadTarjetaS21 = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
		try {
			const id = req.params.id
			const [publicador, registros] = await Promise.all([
				this.service.findById(id),
				this.registroService.findByPublicador(id),
			])

			if (!publicador) {
				const error: AppError = new Error('Recurso no encontrado')
				error.statusCode = 404
				throw error
			}

			const pdfBytes = await this.tarjetaService.generarTarjetaS21(publicador, registros)

			res.setHeader('Content-Type', 'application/pdf')
			res.setHeader(
				'Content-Disposition',
				`attachment; filename="S-21_${publicador.nombre ?? 'publicador'}.pdf"`,
			)
			res.status(200).send(Buffer.from(pdfBytes))
		} catch (error) {
			next(error)
		}
	}
}
