import pool from '../config/database'
import { Usuario } from '../types'

function mapUsuarioRow(row: Record<string, unknown>): Usuario {
	return {
		id: row.id != null ? String(row.id) : undefined,
		idrole: row.idrole != null ? String(row.idrole) : '',
		idpublicador:
			row.idpublicador != null ? String(row.idpublicador) : undefined,
		email: String(row.email ?? ''),
		password:
			row.password !== undefined ? String(row.password) : '',
	}
}

export class UsuarioRepository {
	async findAll(): Promise<Usuario[]> {
		const result = await pool.query(
			`SELECT id, idpublicador, idrole, email
			 FROM usuario
			 ORDER BY email`
		)
		return result.rows.map((r) => mapUsuarioRow(r as Record<string, unknown>))
	}

	async findById(id: string): Promise<Usuario | null> {
		const result = await pool.query(
			`SELECT id, idpublicador, idrole, email
			 FROM usuario
			 WHERE id = $1`,
			[id]
		)
		const row = result.rows[0]
		return row ? mapUsuarioRow(row as Record<string, unknown>) : null
	}

	async findByEmail(email: string): Promise<Usuario | null> {
		const result = await pool.query(
			`SELECT id, idpublicador, idrole, email, password
			 FROM usuario
			 WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`,
			[email]
		)
		const row = result.rows[0]
		return row ? mapUsuarioRow(row as Record<string, unknown>) : null
	}

	async create(data: Usuario): Promise<Usuario> {
		const idpubRaw = data.idpublicador
		const idpublicador =
			idpubRaw != null && String(idpubRaw).trim() !== ''
				? String(idpubRaw).trim()
				: null
		// id lo genera SERIAL / secuencia (PostgreSQL), no UUID — ver init-user.ts
		const result = await pool.query(
			`INSERT INTO usuario (idpublicador, idrole, email, password)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id, idpublicador, idrole, email`,
			[idpublicador, data.idrole, data.email, data.password],
		)
		const row = result.rows[0]
		if (!row) {
			throw new Error('No se pudo crear el usuario')
		}
		return mapUsuarioRow(row as Record<string, unknown>)
	}

	async update(id: string, data: Partial<Usuario>): Promise<Usuario | null> {
		const existing = await this.findById(id)
		if (!existing) return null

		const idpublicador =
			data.idpublicador !== undefined
				? data.idpublicador
				: existing.idpublicador
		const idrole =
			data.idrole !== undefined ? data.idrole : existing.idrole
		const email = data.email !== undefined ? data.email : existing.email

		if (data.password) {
			const result = await pool.query(
				`UPDATE usuario
				 SET idpublicador=$1, idrole=$2, email=$3, password=$4
				 WHERE id=$5
				 RETURNING id`,
				[idpublicador ?? null, idrole, email, data.password, id],
			)
			if (result.rowCount === 0) return null
		} else {
			const result = await pool.query(
				`UPDATE usuario
				 SET idpublicador=$1, idrole=$2, email=$3
				 WHERE id=$4
				 RETURNING id`,
				[idpublicador ?? null, idrole, email, id],
			)
			if (result.rowCount === 0) return null
		}
		return this.findById(id)
	}

	async updatePassword(id: string, hashedPassword: string): Promise<boolean> {
		const result = await pool.query(
			`UPDATE usuario SET password=$1 WHERE id=$2`,
			[hashedPassword, id]
		)
		return (result.rowCount ?? 0) > 0
	}

	async delete(id: string): Promise<boolean> {
		const result = await pool.query(
			`DELETE FROM usuario WHERE id = $1`,
			[id]
		)
		return (result.rowCount ?? 0) > 0
	}
}
