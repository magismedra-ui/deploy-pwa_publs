import { Request, Response, NextFunction } from 'express'
import { isValidUUID } from '../utils/uuid'
import { AppError } from './errorHandler'

/**
 * Acepta id numérico (SERIAL en PostgreSQL) o UUID, según el esquema de usuario.
 */
export const validateUsuarioId = (
	req: Request,
	_res: Response,
	next: NextFunction,
): void => {
	const id = req.params.id

	if (!id) {
		const error: AppError = new Error('ID es requerido')
		error.statusCode = 400
		throw error
	}

	const isNumericId = /^\d+$/.test(id)
	if (isValidUUID(id) || isNumericId) {
		next()
		return
	}

	const error: AppError = new Error('ID inválido')
	error.statusCode = 400
	throw error
}
