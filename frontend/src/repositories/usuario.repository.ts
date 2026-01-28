import { LocalRepository } from './local-repository'
import { Usuario } from '../types'

export class UsuarioRepository extends LocalRepository<Usuario> {
	protected tableName = 'usuario'

	async findByEmail(email: string): Promise<Usuario | null> {
		const db = await this.getDb()
		if (!db) return null
		const result = await db.query(
			`SELECT * FROM ${this.tableName} WHERE email = ? AND deleted = 0`,
			[email]
		)
		const rows = this.mapRows((result.values || []) as any[])
		return rows[0] || null
	}
}

export const usuarioRepository = new UsuarioRepository()
