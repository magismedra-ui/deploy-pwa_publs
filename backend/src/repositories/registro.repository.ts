import { getPool } from '../config/database'
import { Registro } from '../types'
import { buildUpdateQuery, buildCreateQuery } from '../utils/repository-helpers'

export class RegistroRepository {
	async findAll(): Promise<Registro[]> {
		const pool = getPool()
		const [rows] = await pool.execute(
			'SELECT * FROM registro WHERE (deleted = FALSE OR deleted IS NULL) ORDER BY anno_servicio DESC, mes DESC'
		)
		return rows as Registro[]
	}

	async findById(id: string): Promise<Registro | null> {
		const pool = getPool()
		const [rows] = await pool.execute(
			'SELECT * FROM registro WHERE id = ? AND (deleted = FALSE OR deleted IS NULL)',
			[id]
		)
		return (rows as Registro[])[0] || null
	}

	async findByPublicador(idpublicador: string): Promise<Registro[]> {
		const pool = getPool()
		const [rows] = await pool.execute(
			'SELECT * FROM registro WHERE idpublicador = ? AND (deleted = FALSE OR deleted IS NULL) ORDER BY anno_servicio DESC, mes DESC',
			[idpublicador]
		)
		return rows as Registro[]
	}

	async create(data: Registro): Promise<Registro> {
		const pool = getPool()
		const { fields, placeholders, values, generatedId } = buildCreateQuery(data)
		await pool.execute(
			`INSERT INTO registro (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
			values
		)
		return this.findById(generatedId!) as Promise<Registro>
	}

	async update(id: string, data: Partial<Registro>): Promise<Registro | null> {
		const pool = getPool()
		const { updates, values } = buildUpdateQuery(data)

		if (updates.length === 0) {
			return this.findById(id)
		}

		values.push(id)
		await pool.execute(
			`UPDATE registro SET ${updates.join(', ')} WHERE id = ?`,
			values
		)
		return this.findById(id)
	}

	async delete(id: string): Promise<boolean> {
		const pool = getPool()
		const [result] = await pool.execute(
			"UPDATE registro SET deleted = TRUE, syncStatus = 'pending', updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
			[id]
		)
		return (result as any).affectedRows > 0
	}
}
