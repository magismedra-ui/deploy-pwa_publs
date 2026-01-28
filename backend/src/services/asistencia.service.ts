import { AsistenciaRepository } from '../repositories/asistencia.repository'
import { Asistencia } from '../types'
import { getCache, setCache, deleteCachePattern } from '../utils/cache'

export class AsistenciaService {
	private repository: AsistenciaRepository

	constructor() {
		this.repository = new AsistenciaRepository()
	}

	async findAll(): Promise<Asistencia[]> {
		const cacheKey = 'asistencia:all'
		const cached = await getCache<Asistencia[]>(cacheKey)

		if (cached) {
			return cached
		}

		const data = await this.repository.findAll()
		await setCache(cacheKey, data)
		return data
	}

	async findById(id: string): Promise<Asistencia | null> {
		const cacheKey = `asistencia:${id}`
		const cached = await getCache<Asistencia>(cacheKey)

		if (cached) {
			return cached
		}

		const data = await this.repository.findById(id)
		if (data) {
			await setCache(cacheKey, data)
		}
		return data
	}

	async create(data: Asistencia): Promise<Asistencia> {
		const result = await this.repository.create(data)
		await deleteCachePattern('asistencia:*')
		return result
	}

	async update(id: string, data: Partial<Asistencia>): Promise<Asistencia | null> {
		const result = await this.repository.update(id, data)
		await deleteCachePattern('asistencia:*')
		return result
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id)
		await deleteCachePattern('asistencia:*')
		return result
	}
}
