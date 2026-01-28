import { LocalRepository } from './local-repository'
import { Registro } from '../types'

export class RegistroRepository extends LocalRepository<Registro> {
	protected tableName = 'registro'

	async findByPublicador(idpublicador: string): Promise<Registro[]> {
		const db = await this.getDb()
		if (!db) return []
		const result = await db.query(
			`SELECT * FROM ${this.tableName} WHERE idpublicador = ? AND deleted = 0 ORDER BY anno_servicio DESC, mes DESC`,
			[idpublicador]
		)
		return this.mapRows((result.values || []) as any[])
	}
}

export const registroRepository = new RegistroRepository()
