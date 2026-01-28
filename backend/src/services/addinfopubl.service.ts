import { AddInfoPublRepository } from '../repositories/addinfopubl.repository'
import { AddInfoPubl } from '../types'
import { getCache, setCache, deleteCachePattern } from '../utils/cache'

export class AddInfoPublService {
	private repository: AddInfoPublRepository

	constructor() {
		this.repository = new AddInfoPublRepository()
	}

	async findAll(): Promise<AddInfoPubl[]> {
		const cacheKey = 'addinfopubl:all'
		const cached = await getCache<AddInfoPubl[]>(cacheKey)

		if (cached) {
			return cached
		}

		const data = await this.repository.findAll()
		await setCache(cacheKey, data)
		return data
	}

	async findById(id: string): Promise<AddInfoPubl | null> {
		const cacheKey = `addinfopubl:${id}`
		const cached = await getCache<AddInfoPubl>(cacheKey)

		if (cached) {
			return cached
		}

		const data = await this.repository.findById(id)
		if (data) {
			await setCache(cacheKey, data)
		}
		return data
	}

	async findByPublicador(idpublicador: string): Promise<AddInfoPubl[]> {
		const cacheKey = `addinfopubl:publicador:${idpublicador}`
		const cached = await getCache<AddInfoPubl[]>(cacheKey)

		if (cached) {
			return cached
		}

		const data = await this.repository.findByPublicador(idpublicador)
		await setCache(cacheKey, data)
		return data
	}

	async create(data: AddInfoPubl): Promise<AddInfoPubl> {
		const result = await this.repository.create(data)
		await deleteCachePattern('addinfopubl:*')
		return result
	}

	async update(id: string, data: Partial<AddInfoPubl>): Promise<AddInfoPubl | null> {
		const result = await this.repository.update(id, data)
		await deleteCachePattern('addinfopubl:*')
		return result
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id)
		await deleteCachePattern('addinfopubl:*')
		return result
	}
}
