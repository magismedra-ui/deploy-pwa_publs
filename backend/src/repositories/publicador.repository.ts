import { getPool } from '../config/database'
import { Publicador } from '../types'
import { buildUpdateQuery, buildCreateQuery } from '../utils/repository-helpers'

export class PublicadorRepository {
	async findAll(): Promise<Publicador[]> {
		const pool = getPool()
		const [rows] = await pool.execute(
			'SELECT * FROM publicador WHERE (deleted = FALSE OR deleted IS NULL) ORDER BY nombre'
		)
		return rows as Publicador[]
	}

	async findById(id: string): Promise<Publicador | null> {
		const pool = getPool()
		const [rows] = await pool.execute(
			'SELECT * FROM publicador WHERE id = ? AND (deleted = FALSE OR deleted IS NULL)',
			[id]
		)
		return (rows as Publicador[])[0] || null
	}

	async findByGrupo(grupo: string): Promise<Publicador[]> {
		const pool = getPool()
		const [rows] = await pool.execute(
			'SELECT * FROM publicador WHERE grupo = ? AND (deleted = FALSE OR deleted IS NULL) ORDER BY nombre',
			[grupo]
		)
		return rows as Publicador[]
	}

	async create(data: Publicador): Promise<Publicador> {
		const pool = getPool()
		const { fields, placeholders, values, generatedId } = buildCreateQuery(data, ['id', 'updatedAt', 'created_at'])
		await pool.execute(
			`INSERT INTO publicador (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
			values
		)
		return this.findById(generatedId!) as Promise<Publicador>
	}

	async update(id: string, data: Partial<Publicador>): Promise<Publicador | null> {
		const pool = getPool()
		const { updates, values } = buildUpdateQuery(data, ['id', 'created_at'])

		if (updates.length === 0) {
			return this.findById(id)
		}

		values.push(id)
		await pool.execute(
			`UPDATE publicador SET ${updates.join(', ')} WHERE id = ?`,
			values
		)
		return this.findById(id)
	}

	async delete(id: string): Promise<boolean> {
		const pool = getPool()
		const [result] = await pool.execute(
			"UPDATE publicador SET deleted = TRUE, syncStatus = 'pending', updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
			[id]
		)
		return (result as any).affectedRows > 0
	}
}
