import { getPool } from '../config/database'
import { AddInfoPubl } from '../types'
import { buildUpdateQuery, buildCreateQuery } from '../utils/repository-helpers'

export class AddInfoPublRepository {
	async findAll(): Promise<AddInfoPubl[]> {
		const pool = getPool()
		const [rows] = await pool.execute(
			'SELECT * FROM addinfopubl WHERE (deleted = FALSE OR deleted IS NULL) ORDER BY id DESC'
		)
		return rows as AddInfoPubl[]
	}

	async findById(id: string): Promise<AddInfoPubl | null> {
		const pool = getPool()
		const [rows] = await pool.execute(
			'SELECT * FROM addinfopubl WHERE id = ? AND (deleted = FALSE OR deleted IS NULL)',
			[id]
		)
		return (rows as AddInfoPubl[])[0] || null
	}

	async findByPublicador(idpublicador: string): Promise<AddInfoPubl[]> {
		const pool = getPool()
		const [rows] = await pool.execute(
			'SELECT * FROM addinfopubl WHERE idpublicador = ? AND (deleted = FALSE OR deleted IS NULL) ORDER BY fecha DESC',
			[idpublicador]
		)
		return rows as AddInfoPubl[]
	}

	async create(data: AddInfoPubl): Promise<AddInfoPubl> {
		const pool = getPool()
		const { fields, placeholders, values, generatedId } = buildCreateQuery(data)
		await pool.execute(
			`INSERT INTO addinfopubl (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
			values
		)
		return this.findById(generatedId!) as Promise<AddInfoPubl>
	}

	async update(id: string, data: Partial<AddInfoPubl>): Promise<AddInfoPubl | null> {
		const pool = getPool()
		const { updates, values } = buildUpdateQuery(data)

		if (updates.length === 0) {
			return this.findById(id)
		}

		values.push(id)
		await pool.execute(
			`UPDATE addinfopubl SET ${updates.join(', ')} WHERE id = ?`,
			values
		)
		return this.findById(id)
	}

	async delete(id: string): Promise<boolean> {
		const pool = getPool()
		const [result] = await pool.execute(
			"UPDATE addinfopubl SET deleted = TRUE, syncStatus = 'pending', updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
			[id]
		)
		return (result as any).affectedRows > 0
	}
}
