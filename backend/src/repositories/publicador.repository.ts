import pool from '../config/database'
import { Publicador } from '../types'
import { generateUUID } from '../utils/uuid'

export class PublicadorRepository {
	async findAll(): Promise<Publicador[]> {
		const result = await pool.query(
			`SELECT id, nombre, correo, sexo, esperanza, privilegio, precursor,
			        fecha_nacimiento, fecha_bautismo, direccion, telefono_familiar,
			        telefono, grupo, capitan, auxiliar, estado, observaciones, created_at
			 FROM publicador
			 ORDER BY nombre`
		)
		return result.rows as Publicador[]
	}

	async findById(id: string): Promise<Publicador | null> {
		const result = await pool.query(
			`SELECT id, nombre, correo, sexo, esperanza, privilegio, precursor,
			        fecha_nacimiento, fecha_bautismo, direccion, telefono_familiar,
			        telefono, grupo, capitan, auxiliar, estado, observaciones, created_at
			 FROM publicador
			 WHERE id = $1`,
			[id]
		)
		return result.rows[0] || null
	}

	async findByGrupo(grupo: string): Promise<Publicador[]> {
		const result = await pool.query(
			`SELECT id, nombre, correo, sexo, esperanza, privilegio, precursor,
			        fecha_nacimiento, fecha_bautismo, direccion, telefono_familiar,
			        telefono, grupo, capitan, auxiliar, estado, observaciones, created_at
			 FROM publicador
			 WHERE grupo = $1
			 ORDER BY nombre`,
			[grupo]
		)
		return result.rows as Publicador[]
	}

	async create(data: Publicador): Promise<Publicador> {
		const id = generateUUID()
		const result = await pool.query(
			`INSERT INTO publicador (
				id, nombre, correo, sexo, esperanza, privilegio, precursor,
				fecha_nacimiento, fecha_bautismo, direccion, telefono_familiar,
				telefono, grupo, capitan, auxiliar, estado, observaciones
			) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
			RETURNING id`,
			[
				id,
				data.nombre,
				data.correo ?? null,
				data.sexo ?? null,
				data.esperanza ?? null,
				data.privilegio ?? null,
				data.precursor ?? null,
				data.fecha_nacimiento ?? null,
				data.fecha_bautismo ?? null,
				data.direccion ?? null,
				data.telefono_familiar ?? null,
				data.telefono ?? null,
				data.grupo ?? null,
				data.capitan ?? false,
				data.auxiliar ?? false,
				data.estado ?? null,
				data.observaciones ?? null,
			]
		)
		return this.findById(result.rows[0].id) as Promise<Publicador>
	}

	async update(id: string, data: Partial<Publicador>): Promise<Publicador | null> {
		const result = await pool.query(
			`UPDATE publicador
			 SET nombre=$1, correo=$2, sexo=$3, esperanza=$4,
			     privilegio=$5, precursor=$6, fecha_nacimiento=$7, fecha_bautismo=$8,
			     direccion=$9, telefono_familiar=$10, telefono=$11, grupo=$12,
			     capitan=$13, auxiliar=$14, estado=$15, observaciones=$16
			 WHERE id=$17
			 RETURNING id`,
			[
				data.nombre ?? null,
				data.correo ?? null,
				data.sexo ?? null,
				data.esperanza ?? null,
				data.privilegio ?? null,
				data.precursor ?? null,
				data.fecha_nacimiento ?? null,
				data.fecha_bautismo ?? null,
				data.direccion ?? null,
				data.telefono_familiar ?? null,
				data.telefono ?? null,
				data.grupo ?? null,
				data.capitan ?? false,
				data.auxiliar ?? false,
				data.estado ?? null,
				data.observaciones ?? null,
				id,
			]
		)
		if (result.rowCount === 0) return null
		return this.findById(id)
	}

	async delete(id: string): Promise<boolean> {
		const result = await pool.query(
			`DELETE FROM publicador WHERE id = $1`,
			[id]
		)
		return (result.rowCount ?? 0) > 0
	}
}
