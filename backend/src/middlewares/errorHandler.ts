import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
	statusCode?: number
	code?: string
}

export const errorHandler = (
	err: AppError,
	req: Request,
	res: Response,
	_next: NextFunction
): void => {
	const statusCode = err.statusCode || 500
	const message = err.message || 'Error interno del servidor'

	console.error('Error:', {
		message: err.message,
		stack: err.stack,
		statusCode,
		path: req.path,
		method: req.method
	})

	res.status(statusCode).json({
		success: false,
		error: {
			message,
			...(process.env.NODE_ENV === 'development' && { stack: err.stack })
		}
	})
}

export const notFoundHandler = (req: Request, res: Response): void => {
	res.status(404).json({
		success: false,
		error: {
			message: `Ruta ${req.path} no encontrada`
		}
	})
}
