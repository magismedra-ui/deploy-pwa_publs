import pool from '../config/database'
import { Registro } from '../types'

export class RegistroRepository {
	async findAll(): Promise<Registro[]> {
		const result = await pool.query(
			`SELECT id, idpublicador, anno_servicio, mes, predico, horas, cursos, precursor, notas
			 FROM registro
			 ORDER BY anno_servicio DESC, mes DESC`
		)
		return result.rows as Registro[]
	}

	async findById(id: string): Promise<Registro | null> {
		const result = await pool.query(
			`SELECT id, idpublicador, anno_servicio, mes, predico, horas, cursos, precursor, notas
			 FROM registro
			 WHERE id = $1`,
			[id]
		)
		return result.rows[0] || null
	}

	async findByPublicador(idpublicador: string): Promise<Registro[]> {
		const result = await pool.query(
			`SELECT id, idpublicador, anno_servicio, mes, predico, horas, cursos, precursor, notas
			 FROM registro
			 WHERE idpublicador = $1
			 ORDER BY anno_servicio DESC, mes DESC`,
			[idpublicador]
		)
		return result.rows as Registro[]
	}

	async create(data: Registro): Promise<Registro> {
		const result = await pool.query(
			`INSERT INTO registro (idpublicador, anno_servicio, mes, predico, horas, cursos, precursor, notas)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
			 RETURNING id`,
			[
				Number(data.idpublicador),
				data.anno_servicio ?? null,
				data.mes ?? null,
				data.predico ?? false,
				data.horas ?? null,
				data.cursos ?? null,
				data.precursor ?? null,
				data.notas ?? null,
			]
		)
		return this.findById(result.rows[0].id) as Promise<Registro>
	}

	async update(id: string, data: Partial<Registro>): Promise<Registro | null> {
		const result = await pool.query(
			`UPDATE registro
			 SET idpublicador=$1, anno_servicio=$2, mes=$3, predico=$4,
			     horas=$5, cursos=$6, precursor=$7, notas=$8
			 WHERE id=$9
			 RETURNING id`,
			[
				data.idpublicador ?? null,
				data.anno_servicio ?? null,
				data.mes ?? null,
				data.predico ?? false,
				data.horas ?? null,
				data.cursos ?? null,
				data.precursor ?? null,
				data.notas ?? null,
				id,
			]
		)
		if (result.rowCount === 0) return null
		return this.findById(id)
	}

	async delete(id: string): Promise<boolean> {
		const result = await pool.query(
			`DELETE FROM registro WHERE id = $1`,
			[id]
		)
		return (result.rowCount ?? 0) > 0
	}
}
