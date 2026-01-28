import { RoleRepository } from '../repositories/role.repository'
import { Role } from '../types'
import { getCache, setCache, deleteCachePattern } from '../utils/cache'

export class RoleService {
	private repository: RoleRepository

	constructor() {
		this.repository = new RoleRepository()
	}

	async findAll(): Promise<Role[]> {
		const cacheKey = 'role:all'
		const cached = await getCache<Role[]>(cacheKey)

		if (cached) {
			return cached
		}

		const data = await this.repository.findAll()
		await setCache(cacheKey, data)
		return data
	}

	async findById(id: string): Promise<Role | null> {
		const cacheKey = `role:${id}`
		const cached = await getCache<Role>(cacheKey)

		if (cached) {
			return cached
		}

		const data = await this.repository.findById(id)
		if (data) {
			await setCache(cacheKey, data)
		}
		return data
	}

	async create(data: Role): Promise<Role> {
		const result = await this.repository.create(data)
		await deleteCachePattern('role:*')
		return result
	}

	async update(id: string, data: Partial<Role>): Promise<Role | null> {
		const result = await this.repository.update(id, data)
		await deleteCachePattern('role:*')
		return result
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repository.delete(id)
		await deleteCachePattern('role:*')
		return result
	}
}
