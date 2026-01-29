import { LocalRepository } from './local-repository'
import { Grupo } from '../types'

export class GrupoRepository extends LocalRepository<Grupo> {
	protected tableName = 'grupo'

	async findByNombre(nombre: string): Promise<Grupo | null> {
		const db = this.getDb()
		if (!db) return null
		const result = await db.query(
			`SELECT * FROM ${this.tableName} WHERE nombre = ? AND (deleted = 0 OR deleted IS NULL) LIMIT 1`,
			[nombre]
		)
		const rows = this.mapRows((result.values || []) as any[])
		return rows[0] || null
	}

	async findAll(): Promise<Grupo[]> {
		const db = this.getDb()
		if (!db) return []
		const result = await db.query(
			`SELECT * FROM ${this.tableName} WHERE (deleted = 0 OR deleted IS NULL)
			 ORDER BY nroGrupo ASC, nombre ASC`
		)
		return this.mapRows((result.values || []) as any[])
	}
}

export const grupoRepository = new GrupoRepository()
