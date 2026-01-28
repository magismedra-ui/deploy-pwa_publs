import { PublicadorRepository } from '../repositories/publicador.repository'
import { Publicador } from '../types'
import { getCache, setCache, deleteCachePattern } from '../utils/cache'

export class PublicadorService {
	private repository: PublicadorRepository

	constructor() {
		this.repository = new PublicadorRepository()
	}

	async findAll(): Promise<Publicador[]> {
		const cacheKey = 'publicador:all'
		const cached = await getCache<Publicador[]>(cacheKey)

		if (cached) {
			return cached
		}

		const data = await this.repository.findAll()
		await setCache(cacheKey, data)
		return data
	}

	async findById(id: string): Promise<Publicador | null> {
		const cacheKey = `publicador:${id}`
		const cached = await getCache<Publicador>(cacheKey)

		if (cached) {
			return cached
		}

		const data = await this.repository.findById(id)
		if (data) {
			await setCache(cacheKey, data)
		}
		return data
	}

	async findByGrupo(grupo: string): Promise<Publicador[]> {
		const cacheKey = `publicador:grupo:${grupo}`
		const cached = await getCache<Publicador[]>(cacheKey)

		if (cached) {
			return cached
		}

		const data = await this.repository.findByGrupo(grupo)
		await setCache(cacheKey, data)
		return data
	}

	async create(data: Publicador): Promise<Publicador> {
		const result = await this.repository.create(data)
		await deleteCachePattern('publicador:*')
		return result
	}

	async update(id: string, data: Partial<Publicador>): Promise<Publicador | null> {
		const result = await this.repository.update(id, data)
		await deleteCachePattern('publicador:*')
		return result
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id)
		await deleteCachePattern('publicador:*')
		return result
	}
}
