import pool from '../config/database'
import { Role } from '../types'
import { generateUUID } from '../utils/uuid'

export class RoleRepository {
	async findAll(): Promise<Role[]> {
		const result = await pool.query(
			`SELECT id, role FROM role ORDER BY role`
		)
		return result.rows as Role[]
	}

	async findById(id: string): Promise<Role | null> {
		const result = await pool.query(
			`SELECT id, role FROM role WHERE id = $1`,
			[id]
		)
		return result.rows[0] || null
	}

	async create(data: Role): Promise<Role> {
		const id = generateUUID()
		const result = await pool.query(
			`INSERT INTO role (id, role) VALUES ($1, $2) RETURNING id`,
			[id, data.role]
		)
		return this.findById(result.rows[0].id) as Promise<Role>
	}

	async update(id: string, data: Partial<Role>): Promise<Role | null> {
		const result = await pool.query(
			`UPDATE role SET role=$1 WHERE id=$2 RETURNING id`,
			[data.role ?? null, id]
		)
		if (result.rowCount === 0) return null
		return this.findById(id)
	}

	async delete(id: string): Promise<boolean> {
		const result = await pool.query(
			`DELETE FROM role WHERE id = $1`,
			[id]
		)
		return (result.rowCount ?? 0) > 0
	}
}
