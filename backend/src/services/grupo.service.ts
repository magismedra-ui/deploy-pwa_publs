import { GrupoRepository } from '../repositories/grupo.repository'
import { Grupo } from '../types'
import { getCache, setCache, deleteCachePattern } from '../utils/cache'

export class GrupoService {
	private repository: GrupoRepository

	constructor() {
		this.repository = new GrupoRepository()
	}

	async findAll(): Promise<Grupo[]> {
		const cacheKey = 'grupo:all'
		const cached = await getCache<Grupo[]>(cacheKey)

		if (cached) {
			return cached
		}

		const data = await this.repository.findAll()
		await setCache(cacheKey, data)
		return data
	}

	async findById(id: string): Promise<Grupo | null> {
		const cacheKey = `grupo:${id}`
		const cached = await getCache<Grupo>(cacheKey)

		if (cached) {
			return cached
		}

		const data = await this.repository.findById(id)
		if (data) {
			await setCache(cacheKey, data)
		}
		return data
	}

	async create(data: Grupo): Promise<Grupo> {
		const result = await this.repository.create(data)
		await deleteCachePattern('grupo:*')
		return result
	}

	async update(id: string, data: Partial<Grupo>): Promise<Grupo | null> {
		const result = await this.repository.update(id, data)
		await deleteCachePattern('grupo:*')
		return result
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id)
		await deleteCachePattern('grupo:*')
		return result
	}
}
