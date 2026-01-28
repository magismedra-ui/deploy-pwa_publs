import { UsuarioRepository } from '../repositories/usuario.repository'
import { comparePassword, hashPassword } from '../utils/password'
import { generateToken } from '../utils/jwt'
import { LoginRequest, AuthResponse, Usuario } from '../types'
import { AppError } from '../middlewares/errorHandler'

export class AuthService {
	private usuarioRepository: UsuarioRepository

	constructor() {
		this.usuarioRepository = new UsuarioRepository()
	}

	async login(credentials: LoginRequest): Promise<AuthResponse> {
		const usuario = await this.usuarioRepository.findByEmail(credentials.email)

		if (!usuario) {
			const error: AppError = new Error('Credenciales inválidas')
			error.statusCode = 401
			throw error
		}

		const isValidPassword = await comparePassword(credentials.password, usuario.password)

		if (!isValidPassword) {
			const error: AppError = new Error('Credenciales inválidas')
			error.statusCode = 401
			throw error
		}

		const token = generateToken({
			userId: usuario.id!,
			email: usuario.email,
			idrole: usuario.idrole
		})

		return {
			token,
			usuario: {
				id: usuario.id!,
				email: usuario.email,
				idpublicador: usuario.idpublicador,
				idrole: usuario.idrole
			}
		}
	}

	async createUsuario(data: Omit<Usuario, 'id'>): Promise<Usuario> {
		const existingUsuario = await this.usuarioRepository.findByEmail(data.email)

		if (existingUsuario) {
			const error: AppError = new Error('El email ya está registrado')
			error.statusCode = 409
			throw error
		}

		const hashedPassword = await hashPassword(data.password)

		return this.usuarioRepository.create({
			...data,
			password: hashedPassword
		})
	}
}
