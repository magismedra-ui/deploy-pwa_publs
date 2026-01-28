import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { JwtPayload } from '../types'

export interface AuthRequest extends Request {
	user?: JwtPayload
}

export const authenticate = (
	req: AuthRequest,
	res: Response,
	next: NextFunction
): void => {
	try {
		const authHeader = req.headers.authorization

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			res.status(401).json({
				success: false,
				error: { message: 'Token de autenticación requerido' }
			})
			return
		}

		const token = authHeader.substring(7)
		const decoded = verifyToken(token)

		req.user = decoded
		next()
	} catch (error) {
		res.status(401).json({
			success: false,
			error: { message: 'Token inválido o expirado' }
		})
	}
}
