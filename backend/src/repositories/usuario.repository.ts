import pool from '../config/database'
import { Usuario } from '../types'
import { generateUUID } from '../utils/uuid'

export class UsuarioRepository {
	async findAll(): Promise<Usuario[]> {
		const result = await pool.query(
			`SELECT id, idpublicador, idrole, email
			 FROM usuario
			 ORDER BY email`
		)
		return result.rows as Usuario[]
	}

	async findById(id: string): Promise<Usuario | null> {
		const result = await pool.query(
			`SELECT id, idpublicador, idrole, email
			 FROM usuario
			 WHERE id = $1`,
			[id]
		)
		return result.rows[0] || null
	}

	async findByEmail(email: string): Promise<Usuario | null> {
		const result = await pool.query(
			`SELECT id, idpublicador, idrole, email, password
			 FROM usuario
			 WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))`,
			[email]
		)
		return result.rows[0] || null
	}

	async create(data: Usuario): Promise<Usuario> {
		const id = generateUUID()
		const result = await pool.query(
			`INSERT INTO usuario (id, idpublicador, idrole, email, password)
			 VALUES ($1, $2, $3, $4, $5)
			 RETURNING id`,
			[
				id,
				data.idpublicador ?? null,
				data.idrole,
				data.email,
				data.password,
			]
		)
		return this.findById(result.rows[0].id) as Promise<Usuario>
	}

	async update(id: string, data: Partial<Usuario>): Promise<Usuario | null> {
		const result = await pool.query(
			`UPDATE usuario
			 SET idpublicador=$1, idrole=$2, email=$3
			 WHERE id=$4
			 RETURNING id`,
			[
				data.idpublicador ?? null,
				data.idrole ?? null,
				data.email ?? null,
				id,
			]
		)
		if (result.rowCount === 0) return null
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
