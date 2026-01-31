import { getPool } from '../config/database'
import { Grupo } from '../types'
import { buildUpdateQuery, buildCreateQuery } from '../utils/repository-helpers'
import { ResultSetHeader } from 'mysql2'

export class GrupoRepository {
	async findAll(): Promise<Grupo[]> {
		const pool = getPool()
		const [rows] = await pool.execute(
			`SELECT * FROM grupo WHERE (deleted = FALSE OR deleted IS NULL)
			 ORDER BY COALESCE(nroGrupo, 999999) ASC, nombre ASC`
		)
		return rows as Grupo[]
	}

	async findById(id: string | number): Promise<Grupo | null> {
		const pool = getPool()
		const [rows] = await pool.execute(
			'SELECT * FROM grupo WHERE id = ? AND (deleted = FALSE OR deleted IS NULL)',
			[id]
		)
		return (rows as Grupo[])[0] || null
	}

	async create(data: Grupo): Promise<Grupo> {
		const pool = getPool()
		const { fields, placeholders, values } = buildCreateQuery(
			data,
			['id', 'updatedAt'],
			{ skipId: true }
		)
		const [result] = await pool.execute(
			`INSERT INTO grupo (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
			values
		)
		const insertId = (result as ResultSetHeader).insertId
		return this.findById(insertId) as Promise<Grupo>
	}

	async update(id: string | number, data: Partial<Grupo>): Promise<Grupo | null> {
		const pool = getPool()
		const { updates, values } = buildUpdateQuery(data)

		if (updates.length === 0) {
			return this.findById(id)
		}

		values.push(id)
		await pool.execute(
			`UPDATE grupo SET ${updates.join(', ')} WHERE id = ?`,
			values
		)
		return this.findById(id)
	}

	async delete(id: string | number): Promise<boolean> {
		const pool = getPool()
		const [result] = await pool.execute(
			"UPDATE grupo SET deleted = TRUE, syncStatus = 'pending', updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
			[id]
		)
		return (result as ResultSetHeader).affectedRows > 0
	}
}
