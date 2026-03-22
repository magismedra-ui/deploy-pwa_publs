import pool from '../config/database'
import { AddInfoPubl } from '../types'

/** ISO / datetime → YYYY-MM-DD para columna DATE en PostgreSQL */
function fechaParaPg(
	fecha: string | Date | null | undefined,
): string | null {
	if (fecha == null || fecha === '') return null
	if (typeof fecha === 'string') {
		const t = fecha.trim()
		if (t.length >= 10) return t.slice(0, 10)
		return t
	}
	try {
		const d = fecha instanceof Date ? fecha : new Date(fecha)
		if (Number.isNaN(d.getTime())) return null
		return d.toISOString().slice(0, 10)
	} catch {
		return null
	}
}

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
		const idpub = String(data.idpublicador).trim()
		const fecha = fechaParaPg(data.fecha)
		const obs = data.observaciones ?? null
		const params = [idpub, fecha, obs, pastoreo]

		const intentos: { sql: string; label: string }[] = [
			{
				label: 'id=gen_random_uuid + idpublicador::uuid',
				sql: `INSERT INTO addinfopubl (id, idpublicador, fecha, observaciones, pastoreo)
					VALUES (gen_random_uuid(), $1::uuid, $2::date, $3, $4)
					RETURNING *`,
			},
			{
				label: 'sin id + idpublicador::uuid (SERIAL o DEFAULT en id)',
				sql: `INSERT INTO addinfopubl (idpublicador, fecha, observaciones, pastoreo)
					VALUES ($1::uuid, $2::date, $3, $4)
					RETURNING *`,
			},
			{
				label: 'sin id ni casts (esquema ya alineado)',
				sql: `INSERT INTO addinfopubl (idpublicador, fecha, observaciones, pastoreo)
					VALUES ($1, $2, $3, $4)
					RETURNING *`,
			},
		]

		const errores: string[] = []
		for (const { sql, label } of intentos) {
			try {
				const result = await pool.query(sql, params)
				if (result.rows[0]) return result.rows[0] as AddInfoPubl
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : String(err)
				errores.push(`${label}: ${msg}`)
			}
		}

		throw new Error(
			`No se pudo insertar en addinfopubl. Ejecuta scripts/migrate-neon-addinfopubl-uuid.sql en Neon si idpublicador es INTEGER. Detalle: ${errores.join(' || ')}`,
		)
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
