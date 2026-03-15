import { Response, NextFunction } from 'express'
import { AddInfoPublService } from '../services/addinfopubl.service'
import { AppError } from '../middlewares/errorHandler'
import { AuthRequest } from '../middlewares/auth'

const service = new AddInfoPublService()

export const getAll = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		const data = await service.findAll()
		res.status(200).json({ success: true, data })
	} catch (error) {
		next(error)
	}
}

export const getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		const data = await service.findById(req.params.id)
		if (!data) {
			const error: AppError = new Error('Registro no encontrado')
			error.statusCode = 404
			throw error
		}
		res.status(200).json({ success: true, data })
	} catch (error) {
		next(error)
	}
}

export const getByPublicador = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		const data = await service.findByPublicador(req.params.idpublicador)
		res.status(200).json({ success: true, data })
	} catch (error) {
		next(error)
	}
}

export const create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { idpublicador, fecha, observaciones } = req.body

		if (!idpublicador) {
			const error: AppError = new Error('El campo idpublicador es requerido')
			error.statusCode = 400
			throw error
		}

		const data = await service.create({ idpublicador, fecha: fecha ?? null, observaciones: observaciones ?? null })
		res.status(201).json({ success: true, data })
	} catch (error) {
		next(error)
	}
}

export const update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		const { fecha, observaciones } = req.body
		const data = await service.update(req.params.id, { fecha: fecha ?? null, observaciones: observaciones ?? null })

		if (!data) {
			const error: AppError = new Error('Registro no encontrado')
			error.statusCode = 404
			throw error
		}

		res.status(200).json({ success: true, data })
	} catch (error) {
		next(error)
	}
}

export const remove = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
	try {
		const deleted = await service.delete(req.params.id)

		if (!deleted) {
			const error: AppError = new Error('Registro no encontrado')
			error.statusCode = 404
			throw error
		}

		res.status(200).json({ success: true, message: 'Registro eliminado correctamente' })
	} catch (error) {
		next(error)
	}
}
