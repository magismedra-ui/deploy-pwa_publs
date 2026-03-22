import { AddInfoPublRepository, AddInfoPublWithPublicador } from '../repositories/addinfopubl.repository'
import { PublicadorRepository } from '../repositories/publicador.repository'
import { AddInfoPubl } from '../types'
import { getCache, setCache, deleteCachePattern } from '../utils/cache'
import { AppError } from '../middlewares/errorHandler'

export class AddInfoPublService {
	private repository: AddInfoPublRepository
	private publicadorRepository: PublicadorRepository

	constructor() {
		this.repository = new AddInfoPublRepository()
		this.publicadorRepository = new PublicadorRepository()
	}

	async findAll(): Promise<AddInfoPublWithPublicador[]> {
		const cacheKey = 'addinfopubl:all'
		const cached = await getCache<AddInfoPublWithPublicador[]>(cacheKey)
		if (cached) return cached

		const data = await this.repository.findAll()
		await setCache(cacheKey, data)
		return data
	}

	async findById(id: string): Promise<AddInfoPubl | null> {
		const cacheKey = `addinfopubl:${id}`
		const cached = await getCache<AddInfoPubl>(cacheKey)
		if (cached) return cached

		const data = await this.repository.findById(id)
		if (data) await setCache(cacheKey, data)
		return data
	}

	async findByPublicador(idpublicador: string): Promise<AddInfoPubl[]> {
		const cacheKey = `addinfopubl:publicador:${idpublicador}`
		const cached = await getCache<AddInfoPubl[]>(cacheKey)
		if (cached) return cached

		const data = await this.repository.findByPublicador(idpublicador)
		await setCache(cacheKey, data)
		return data
	}

	async create(data: {
		idpublicador: string
		fecha?: string | null
		observaciones?: string | null
		pastoreo?: boolean
	}): Promise<AddInfoPubl> {
		// Validar que el publicador existe
		const publicador = await this.publicadorRepository.findById(data.idpublicador)
		if (!publicador) {
			const error: AppError = new Error(`Publicador con id '${data.idpublicador}' no encontrado`)
			error.statusCode = 404
			throw error
		}

		const result = await this.repository.create(data)
		await deleteCachePattern('addinfopubl:*')
		return result
	}

	async update(
		id: string,
		data: {
			fecha?: string | null
			observaciones?: string | null
			pastoreo?: boolean
		},
	): Promise<AddInfoPubl | null> {
		const result = await this.repository.update(id, data)
		if (result) await deleteCachePattern('addinfopubl:*')
		return result
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id)
		if (result) await deleteCachePattern('addinfopubl:*')
		return result
	}
}
