import { RegistroRepository } from '../repositories/registro.repository'
import { Registro } from '../types'
import { getCache, setCache, deleteCachePattern } from '../utils/cache'

export class RegistroService {
	private repository: RegistroRepository

	constructor() {
		this.repository = new RegistroRepository()
	}

	async findAll(): Promise<Registro[]> {
		const cacheKey = 'registro:all'
		const cached = await getCache<Registro[]>(cacheKey)

		if (cached) {
			return cached
		}

		const data = await this.repository.findAll()
		await setCache(cacheKey, data)
		return data
	}

	async findById(id: string): Promise<Registro | null> {
		const cacheKey = `registro:${id}`
		const cached = await getCache<Registro>(cacheKey)

		if (cached) {
			return cached
		}

		const data = await this.repository.findById(id)
		if (data) {
			await setCache(cacheKey, data)
		}
		return data
	}

	async findByPublicador(idpublicador: string): Promise<Registro[]> {
		const cacheKey = `registro:publicador:${idpublicador}`
		const cached = await getCache<Registro[]>(cacheKey)

		if (cached) {
			return cached
		}

		const data = await this.repository.findByPublicador(idpublicador)
		await setCache(cacheKey, data)
		return data
	}

	async create(data: Registro): Promise<Registro> {
		const result = await this.repository.create(data)
		await deleteCachePattern('registro:*')
		return result
	}

	async update(id: string, data: Partial<Registro>): Promise<Registro | null> {
		const result = await this.repository.update(id, data)
		await deleteCachePattern('registro:*')
		return result
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id)
		await deleteCachePattern('registro:*')
		return result
	}
}
