import pool from '../config/database'
import { Grupo } from '../types'

export class GrupoRepository {
	async findAll(): Promise<Grupo[]> {
		const result = await pool.query(
			`SELECT id, nombre
			 FROM grupo
			 ORDER BY nombre ASC`
		)
		return result.rows as Grupo[]
	}

	async findById(id: string | number): Promise<Grupo | null> {
		const result = await pool.query(
			`SELECT id, nombre FROM grupo WHERE id = $1`,
			[id]
		)
		return result.rows[0] || null
	}

	async create(data: Grupo): Promise<Grupo> {
		const result = await pool.query(
			`INSERT INTO grupo (nombre) VALUES ($1) RETURNING id`,
			[data.nombre]
		)
		return this.findById(result.rows[0].id) as Promise<Grupo>
	}

	async update(id: string | number, data: Partial<Grupo>): Promise<Grupo | null> {
		const result = await pool.query(
			`UPDATE grupo SET nombre=$1 WHERE id=$2 RETURNING id`,
			[data.nombre ?? null, id]
		)
		if (result.rowCount === 0) return null
		return this.findById(id)
	}

	async delete(id: string | number): Promise<boolean> {
		const result = await pool.query(
			`DELETE FROM grupo WHERE id = $1`,
			[id]
		)
		return (result.rowCount ?? 0) > 0
	}
}
