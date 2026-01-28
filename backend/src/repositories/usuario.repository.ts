import { getPool } from '../config/database'
import { Usuario } from '../types'
import { buildUpdateQuery, buildCreateQuery } from '../utils/repository-helpers'

export class UsuarioRepository {
	async findAll(): Promise<Usuario[]> {
		const pool = getPool()
		const [rows] = await pool.execute(
			'SELECT id, idpublicador, idrole, email, updatedAt, syncStatus, deleted FROM usuario WHERE (deleted = FALSE OR deleted IS NULL) ORDER BY email'
		)
		return rows as Usuario[]
	}

	async findById(id: string): Promise<Usuario | null> {
		const pool = getPool()
		const [rows] = await pool.execute(
			'SELECT id, idpublicador, idrole, email, updatedAt, syncStatus, deleted FROM usuario WHERE id = ? AND (deleted = FALSE OR deleted IS NULL)',
			[id]
		)
		return (rows as Usuario[])[0] || null
	}

	async findByEmail(email: string): Promise<Usuario | null> {
		const pool = getPool()
		const [rows] = await pool.execute(
			'SELECT * FROM usuario WHERE email = ? AND (deleted = FALSE OR deleted IS NULL)',
			[email]
		)
		return (rows as Usuario[])[0] || null
	}

	async create(data: Usuario): Promise<Usuario> {
		const pool = getPool()
		const { fields, placeholders, values, generatedId } = buildCreateQuery(data, ['id', 'updatedAt'])
		await pool.execute(
			`INSERT INTO usuario (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
			values
		)
		return this.findById(generatedId!) as Promise<Usuario>
	}

	async update(id: string, data: Partial<Usuario>): Promise<Usuario | null> {
		const pool = getPool()
		const { updates, values } = buildUpdateQuery(data, ['id', 'created_at', 'password'])

		if (updates.length === 0) {
			return this.findById(id)
		}

		values.push(id)
		await pool.execute(
			`UPDATE usuario SET ${updates.join(', ')} WHERE id = ?`,
			values
		)
		return this.findById(id)
	}

	async delete(id: string): Promise<boolean> {
		const pool = getPool()
		const [result] = await pool.execute(
			"UPDATE usuario SET deleted = TRUE, syncStatus = 'pending', updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
			[id]
		)
		return (result as any).affectedRows > 0
	}
}
