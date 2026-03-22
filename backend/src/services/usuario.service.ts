import { UsuarioRepository } from '../repositories/usuario.repository'
import { Usuario } from '../types'
import { hashPassword, comparePassword } from '../utils/password'
import { getCache, setCache, deleteCachePattern } from '../utils/cache'
import { AppError } from '../middlewares/errorHandler'

export class UsuarioService {
	private repository: UsuarioRepository

	constructor() {
		this.repository = new UsuarioRepository()
	}

	async findAll(): Promise<Usuario[]> {
		const cacheKey = 'usuario:all'
		const cached = await getCache<Usuario[]>(cacheKey)

		if (cached) {
			return cached
		}

		const data = await this.repository.findAll()
		await setCache(cacheKey, data)
		return data
	}

	async findById(id: string): Promise<Usuario | null> {
		const cacheKey = `usuario:${id}`
		const cached = await getCache<Usuario>(cacheKey)

		if (cached) {
			return cached
		}

		const data = await this.repository.findById(id)
		if (data) {
			await setCache(cacheKey, data)
		}
		return data
	}

	async create(data: Omit<Usuario, 'id'>): Promise<Usuario> {
		const email = typeof data.email === 'string' ? data.email.trim() : ''
		if (!email) {
			const error: AppError = new Error('El correo es obligatorio')
			error.statusCode = 400
			throw error
		}
		if (!data.idrole) {
			const error: AppError = new Error('El rol es obligatorio')
			error.statusCode = 400
			throw error
		}
		if (!data.password || String(data.password).length < 6) {
			const error: AppError = new Error(
				'La contraseña debe tener al menos 6 caracteres',
			)
			error.statusCode = 400
			throw error
		}
		const hashedPassword = await hashPassword(String(data.password))
		const idpubRaw = data.idpublicador
		const idpublicador: string | null =
			idpubRaw != null && String(idpubRaw).trim() !== ''
				? String(idpubRaw).trim()
				: null
		const result = await this.repository.create({
			email,
			idrole: String(data.idrole),
			idpublicador,
			password: hashedPassword,
		} as Usuario)
		await deleteCachePattern('usuario:*')
		return result
	}

	async update(id: string, data: Partial<Usuario>): Promise<Usuario | null> {
		if (data.password) {
			data.password = await hashPassword(data.password)
		}
		const result = await this.repository.update(id, data)
		await deleteCachePattern('usuario:*')
		return result
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id)
		await deleteCachePattern('usuario:*')
		return result
	}

	async changePassword(
		userId: string,
		currentPassword: string,
		newPassword: string
	): Promise<void> {
		const usuario = await this.repository.findById(userId)

		if (!usuario) {
			const error: AppError = new Error('Usuario no encontrado')
			error.statusCode = 404
			throw error
		}

		const usuarioWithPassword = await this.repository.findByEmail(usuario.email)
		if (!usuarioWithPassword) {
			const error: AppError = new Error('Usuario no encontrado')
			error.statusCode = 404
			throw error
		}

		const isValidPassword = await comparePassword(
			currentPassword,
			usuarioWithPassword.password
		)

		if (!isValidPassword) {
			const error: AppError = new Error('Contraseña actual incorrecta')
			error.statusCode = 401
			throw error
		}

		if (currentPassword === newPassword) {
			const error: AppError = new Error(
				'La nueva contraseña debe ser diferente a la actual'
			)
			error.statusCode = 400
			throw error
		}

		if (newPassword.length < 6) {
			const error: AppError = new Error(
				'La nueva contraseña debe tener al menos 6 caracteres'
			)
			error.statusCode = 400
			throw error
		}

		const hashedPassword = await hashPassword(newPassword)
		await this.repository.update(userId, { password: hashedPassword })
		await deleteCachePattern('usuario:*')
	}
}
