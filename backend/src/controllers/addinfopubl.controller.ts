import { Response, NextFunction } from 'express'
import { AddInfoPublService } from '../services/addinfopubl.service'
import { AppError } from '../middlewares/errorHandler'
import { AuthRequest } from '../middlewares/auth'

export class AddInfoPublController {
	private service: AddInfoPublService

	constructor() {
		this.service = new AddInfoPublService()
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

	findByPublicador = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
		try {
			const idpublicador = req.params.idpublicador
			const data = await this.service.findByPublicador(idpublicador)
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
}
