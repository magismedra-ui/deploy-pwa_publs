import { LocalRepository } from './local-repository'
import { Publicador } from '../types'

export class PublicadorRepository extends LocalRepository<Publicador> {
	protected tableName = 'publicador'

	async findByGrupo(grupo: string): Promise<Publicador[]> {
		const db = this.getDb()
		if (!db) return []
		const result = await db.query(
			`SELECT * FROM ${this.tableName} WHERE grupo = ? AND (deleted = 0 OR deleted IS NULL) ORDER BY nombre ASC`,
			[grupo]
		)
		return this.mapRows((result.values || []) as any[])
	}

	async findByEmail(correo: string): Promise<Publicador | null> {
		const db = this.getDb()
		if (!db) return null
		const result = await db.query(
			`SELECT * FROM ${this.tableName} WHERE correo = ? AND (deleted = 0 OR deleted IS NULL) LIMIT 1`,
			[correo]
		)
		const rows = this.mapRows((result.values || []) as any[])
		return rows[0] || null
	}

	async findByEstado(estado: string): Promise<Publicador[]> {
		const db = this.getDb()
		if (!db) return []
		const result = await db.query(
			`SELECT * FROM ${this.tableName} WHERE estado = ? AND (deleted = 0 OR deleted IS NULL) ORDER BY nombre ASC`,
			[estado]
		)
		return this.mapRows((result.values || []) as any[])
	}

	async findAll(): Promise<Publicador[]> {
		const db = this.getDb()
		if (!db) return []
		const result = await db.query(
			`SELECT * FROM ${this.tableName} WHERE (deleted = 0 OR deleted IS NULL) ORDER BY nombre ASC`
		)
		return this.mapRows((result.values || []) as any[])
	}
}

export const publicadorRepository = new PublicadorRepository()
