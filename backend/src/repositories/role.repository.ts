import { getPool } from '../config/database'
import { Role } from '../types'
import { buildUpdateQuery, buildCreateQuery } from '../utils/repository-helpers'

export class RoleRepository {
	async findAll(): Promise<Role[]> {
		const pool = getPool()
		const [rows] = await pool.execute(
			'SELECT * FROM role WHERE (deleted = FALSE OR deleted IS NULL) ORDER BY role'
		)
		return rows as Role[]
	}

	async findById(id: string): Promise<Role | null> {
		const pool = getPool()
		const [rows] = await pool.execute(
			'SELECT * FROM role WHERE id = ? AND (deleted = FALSE OR deleted IS NULL)',
			[id]
		)
		return (rows as Role[])[0] || null
	}

	async create(data: Role): Promise<Role> {
		const pool = getPool()
		const { fields, placeholders, values, generatedId } = buildCreateQuery(data)
		await pool.execute(
			`INSERT INTO role (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
			values
		)
		return this.findById(generatedId!) as Promise<Role>
	}

	async update(id: string, data: Partial<Role>): Promise<Role | null> {
		const pool = getPool()
		const { updates, values } = buildUpdateQuery(data)

		if (updates.length === 0) {
			return this.findById(id)
		}

		values.push(id)
		await pool.execute(
			`UPDATE role SET ${updates.join(', ')} WHERE id = ?`,
			values
		)
		return this.findById(id)
	}

	async delete(id: string): Promise<boolean> {
		const pool = getPool()
		const [result] = await pool.execute(
			"UPDATE role SET deleted = TRUE, syncStatus = 'pending', updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
			[id]
		)
		return (result as any).affectedRows > 0
	}
}
