import { getPool } from '../config/database'
import { Asistencia } from '../types'
import { buildUpdateQuery, buildCreateQuery } from '../utils/repository-helpers'

export class AsistenciaRepository {
	async findAll(): Promise<Asistencia[]> {
		const pool = getPool()
		const [rows] = await pool.execute(
			'SELECT * FROM asistencia WHERE (deleted = FALSE OR deleted IS NULL) ORDER BY fecha DESC'
		)
		return rows as Asistencia[]
	}

	async findById(id: string): Promise<Asistencia | null> {
		const pool = getPool()
		const [rows] = await pool.execute(
			'SELECT * FROM asistencia WHERE id = ? AND (deleted = FALSE OR deleted IS NULL)',
			[id]
		)
		return (rows as Asistencia[])[0] || null
	}

	async create(data: Asistencia): Promise<Asistencia> {
		const pool = getPool()
		const { fields, placeholders, values, generatedId } = buildCreateQuery(data)
		await pool.execute(
			`INSERT INTO asistencia (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
			values
		)
		return this.findById(generatedId!) as Promise<Asistencia>
	}

	async update(id: string, data: Partial<Asistencia>): Promise<Asistencia | null> {
		const pool = getPool()
		const { updates, values } = buildUpdateQuery(data)

		if (updates.length === 0) {
			return this.findById(id)
		}

		values.push(id)
		await pool.execute(
			`UPDATE asistencia SET ${updates.join(', ')} WHERE id = ?`,
			values
		)
		return this.findById(id)
	}

	async delete(id: string): Promise<boolean> {
		const pool = getPool()
		const [result] = await pool.execute(
			"UPDATE asistencia SET deleted = TRUE, syncStatus = 'pending', updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
			[id]
		)
		return (result as any).affectedRows > 0
	}
}
