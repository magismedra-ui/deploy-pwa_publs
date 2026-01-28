import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'
import { AppError } from '../middlewares/errorHandler'

export class AuthController {
	private authService: AuthService

	constructor() {
		this.authService = new AuthService()
	}

	login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
		try {
			const { email, password } = req.body

			if (!email || !password) {
				const error: AppError = new Error('Email y contraseña son requeridos')
				error.statusCode = 400
				throw error
			}

			const result = await this.authService.login({ email, password })

			res.status(200).json({
				success: true,
				data: result
			})
		} catch (error) {
			next(error)
		}
	}
}
