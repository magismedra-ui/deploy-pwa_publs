import { LocalRepository } from './local-repository'
import { AddInfoPubl } from '../types'

export class AddInfoPublRepository extends LocalRepository<AddInfoPubl> {
	protected tableName = 'addinfopubl'

	async findByPublicador(idpublicador: string): Promise<AddInfoPubl[]> {
		const db = await this.getDb()
		if (!db) return []
		const result = await db.query(
			`SELECT * FROM ${this.tableName} WHERE idpublicador = ? AND deleted = 0 ORDER BY fecha DESC`,
			[idpublicador]
		)
		return this.mapRows((result.values || []) as any[])
	}
}

export const addinfopublRepository = new AddInfoPublRepository()
