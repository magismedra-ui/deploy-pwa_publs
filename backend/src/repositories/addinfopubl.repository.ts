import pool from '../config/database'
import { AddInfoPubl } from '../types'

export interface AddInfoPublWithPublicador extends AddInfoPubl {
	publicador_nombre?: string
}

export class AddInfoPublRepository {
	async findAll(): Promise<AddInfoPublWithPublicador[]> {
		const result = await pool.query(
			`SELECT a.*, p.nombre AS publicador_nombre
			 FROM addinfopubl a
			 JOIN publicador p ON a.idpublicador = p.id
			 ORDER BY a.fecha DESC`
		)
		return result.rows as AddInfoPublWithPublicador[]
	}

	async findById(id: string): Promise<AddInfoPubl | null> {
		const result = await pool.query(
			`SELECT * FROM addinfopubl WHERE id = $1`,
			[id]
		)
		return result.rows[0] || null
	}

	async findByPublicador(idpublicador: string): Promise<AddInfoPubl[]> {
		const result = await pool.query(
			`SELECT * FROM addinfopubl
			 WHERE idpublicador = $1
			 ORDER BY fecha DESC`,
			[idpublicador]
		)
		return result.rows as AddInfoPubl[]
	}

	async create(data: {
		idpublicador: string
		fecha?: string | Date | null
		observaciones?: string | null
		pastoreo?: boolean
	}): Promise<AddInfoPubl> {
		const pastoreo = data.pastoreo === true
		// No enviar `id`: en Neon suele ser SERIAL o UUID con DEFAULT.
		// Insertar UUID en columna INTEGER provocaba:
		// invalid input syntax for type integer: "uuid..."
		const result = await pool.query(
			`INSERT INTO addinfopubl (idpublicador, fecha, observaciones, pastoreo)
			 VALUES ($1, $2, $3, $4)
			 RETURNING *`,
			[
				data.idpublicador,
				data.fecha ?? null,
				data.observaciones ?? null,
				pastoreo,
			]
		)
		return result.rows[0] as AddInfoPubl
	}

	async update(
		id: string,
		data: {
			fecha?: string | Date | null
			observaciones?: string | null
			pastoreo?: boolean
		},
	): Promise<AddInfoPubl | null> {
		const result = await pool.query(
			`UPDATE addinfopubl
			 SET fecha = $1, observaciones = $2, pastoreo = $3
			 WHERE id = $4
			 RETURNING *`,
			[
				data.fecha ?? null,
				data.observaciones ?? null,
				data.pastoreo === true,
				id,
			]
		)
		if (result.rowCount === 0) return null
		return result.rows[0] as AddInfoPubl
	}

	async delete(id: string): Promise<boolean> {
		const result = await pool.query(
			`DELETE FROM addinfopubl WHERE id = $1 RETURNING id`,
			[id]
		)
		return (result.rowCount ?? 0) > 0
	}
}
