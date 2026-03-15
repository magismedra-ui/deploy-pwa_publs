import { Request, Response, NextFunction } from 'express'
import { isValidUUID } from '../utils/uuid'
import { AppError } from './errorHandler'

export const validateUUID = (req: Request, _res: Response, next: NextFunction): void => {
	const id = req.params.id

	if (!id) {
		const error: AppError = new Error('ID es requerido')
		error.statusCode = 400
		throw error
	}

	if (!isValidUUID(id)) {
		const error: AppError = new Error('ID inválido. Debe ser un UUID válido')
		error.statusCode = 400
		throw error
	}

	next()
}
