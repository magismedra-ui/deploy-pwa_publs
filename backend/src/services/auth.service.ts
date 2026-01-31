import { UsuarioRepository } from '../repositories/usuario.repository'
import { RoleRepository } from '../repositories/role.repository'
import { PublicadorRepository } from '../repositories/publicador.repository'
import { comparePassword, hashPassword } from '../utils/password'
import { generateToken } from '../utils/jwt'
import { LoginRequest, AuthResponse, Usuario } from '../types'
import { AppError } from '../middlewares/errorHandler'

export class AuthService {
	private usuarioRepository: UsuarioRepository
	private roleRepository: RoleRepository
	private publicadorRepository: PublicadorRepository

	constructor() {
		this.usuarioRepository = new UsuarioRepository()
		this.roleRepository = new RoleRepository()
		this.publicadorRepository = new PublicadorRepository()
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

		const [role, publicador] = await Promise.all([
			this.roleRepository.findById(usuario.idrole),
			usuario.idpublicador
				? this.publicadorRepository.findById(usuario.idpublicador)
				: Promise.resolve(null)
		])

		const nombre = publicador?.nombre ?? usuario.email
		const rol = role?.role ?? ''

		const token = generateToken({
			idusuario: usuario.id!,
			nombre,
			rol,
			email: usuario.email
		})

		return { token }
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
