import { Request, Response, NextFunction } from 'express'
import { isValidUUID } from '../utils/uuid'
import { AppError } from './errorHandler'

export const validateUUIDParam =
	(paramName: string) =>
	(req: Request, _res: Response, next: NextFunction): void => {
		const id = req.params[paramName]?.trim()

		if (!id) {
			const error: AppError = new Error('ID es requerido')
			error.statusCode = 400
			next(error)
			return
		}

		if (!isValidUUID(id)) {
			const error: AppError = new Error(
				'ID inválido. Debe ser un UUID válido',
			)
			error.statusCode = 400
			next(error)
			return
		}

		next()
	}

/** Valida `req.params.id` (uso habitual en rutas `/:id`). */
export const validateUUID = validateUUIDParam('id')

/**
 * addinfopubl puede usar `id` UUID (Neon) o entero (SERIAL / MySQL).
 */
export const isValidAddInfoPublResourceId = (id: string): boolean => {
	const t = String(id).trim()
	if (!t) return false
	if (/^\d+$/.test(t)) return true
	return isValidUUID(t)
}

export const validateAddInfoPublIdParam =
	(paramName: string) =>
	(req: Request, _res: Response, next: NextFunction): void => {
		const id = req.params[paramName]?.trim()

		if (!id) {
			const error: AppError = new Error('ID es requerido')
			error.statusCode = 400
			next(error)
			return
		}

		if (!isValidAddInfoPublResourceId(id)) {
			const error: AppError = new Error(
				'ID inválido. Debe ser un UUID o un número entero',
			)
			error.statusCode = 400
			next(error)
			return
		}

		next()
	}

/** Valida `req.params.id` en rutas CRUD de addinfopubl. */
export const validateAddInfoPublRouteId = validateAddInfoPublIdParam('id')
