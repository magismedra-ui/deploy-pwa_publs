import pool from '../config/database'
import { Asistencia } from '../types'

export class AsistenciaRepository {
	async findAll(): Promise<Asistencia[]> {
		const result = await pool.query(
			`SELECT id, fecha, presencial, zoom
			 FROM asistencia
			 ORDER BY fecha DESC`
		)
		return result.rows as Asistencia[]
	}

	async findById(id: string): Promise<Asistencia | null> {
		const result = await pool.query(
			`SELECT id, fecha, presencial, zoom
			 FROM asistencia
			 WHERE id = $1`,
			[id]
		)
		return result.rows[0] || null
	}

	async create(data: Asistencia): Promise<Asistencia> {
		const result = await pool.query(
			`INSERT INTO asistencia (fecha, presencial, zoom)
			 VALUES ($1, $2, $3)
			 RETURNING id`,
			[
				data.fecha,
				data.presencial ?? null,
				data.zoom ?? null,
			]
		)
		return this.findById(result.rows[0].id) as Promise<Asistencia>
	}

	async update(id: string, data: Partial<Asistencia>): Promise<Asistencia | null> {
		const result = await pool.query(
			`UPDATE asistencia
			 SET fecha=$1, presencial=$2, zoom=$3
			 WHERE id=$4
			 RETURNING id`,
			[
				data.fecha ?? null,
				data.presencial ?? null,
				data.zoom ?? null,
				id,
			]
		)
		if (result.rowCount === 0) return null
		return this.findById(id)
	}

	async delete(id: string): Promise<boolean> {
		const result = await pool.query(
			`DELETE FROM asistencia WHERE id = $1`,
			[id]
		)
		return (result.rowCount ?? 0) > 0
	}
}
