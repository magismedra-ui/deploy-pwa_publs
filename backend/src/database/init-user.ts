import 'dotenv/config'
import pool from '../config/database'
import { hashPassword } from '../utils/password'

const DEFAULT_EMAIL = 'magismedra@gmail.com'
const DEFAULT_PASSWORD = 'h8m5d4'

const waitForDB = async (maxRetries = 30): Promise<void> => {
	for (let i = 0; i < maxRetries; i++) {
		try {
			await pool.query('SELECT 1')
			return
		} catch (error) {
			if (i === maxRetries - 1) {
				throw error
			}
			await new Promise(resolve => setTimeout(resolve, 1000))
		}
	}
}

const initUser = async () => {
	try {
		await waitForDB()

		// 1. Role: id INTEGER (serial)
		let roleId: number
		const rolesResult = await pool.query(
			"SELECT id FROM role WHERE role = 'Admin'"
		)
		const existingRole = rolesResult.rows[0] as { id: number } | undefined
		if (existingRole) {
			roleId = existingRole.id
			console.log('ℹ️  Rol Admin ya existe')
		} else {
			const resRole = await pool.query(
				"INSERT INTO role (role) VALUES ($1) RETURNING id",
				['Admin']
			)
			roleId = resRole.rows[0].id
			console.log('✅ Rol Admin creado (id: ' + roleId + ')')
		}

		// 2. Grupo: id INTEGER (serial)
		let grupoId: number
		const gruposResult = await pool.query(
			"SELECT id FROM grupo WHERE nombre = 'GRUPO 1'"
		)
		const existingGrupo = gruposResult.rows[0] as { id: number } | undefined
		if (existingGrupo) {
			grupoId = existingGrupo.id
			console.log('ℹ️  Grupo GRUPO 1 ya existe')
		} else {
			const resGrupo = await pool.query(
				'INSERT INTO grupo (nombre) VALUES ($1) RETURNING id',
				['GRUPO 1']
			)
			grupoId = resGrupo.rows[0].id
			console.log('✅ Grupo GRUPO 1 creado (id: ' + grupoId + ')')
		}

		// 3. Publicador: id INTEGER (serial)
		let publicadorId: number
		const publsResult = await pool.query(
			'SELECT id FROM publicador WHERE correo = $1',
			[DEFAULT_EMAIL]
		)
		if (publsResult.rows.length > 0) {
			publicadorId = publsResult.rows[0].id
			console.log('ℹ️  Publicador ya existe')
		} else {
			const resPub = await pool.query(
				`INSERT INTO publicador (
					nombre, correo, sexo, esperanza, privilegio, precursor,
					fecha_nacimiento, fecha_bautismo, direccion, telefono_familiar,
					grupo, observaciones, estado, capitan, auxiliar, telefono
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
				[
					'HERNAN MEDRANO VILLADIEGO',
					'magismedra@gmail.com',
					'HOMBRE',
					'OTRAS OVEJAS',
					'ANCIANO',
					'PUBLICADOR',
					'1969-11-14',
					'1992-07-25',
					'Urb Buena Vista',
					3054508915,
					grupoId,
					'Secretario actual de la congregación',
					'ACTIVO',
					true,
					false,
					3005620334
				]
			)
			publicadorId = resPub.rows[0].id
			console.log('✅ Publicador creado (id: ' + publicadorId + ')')
		}

		// 4. Usuario: id INTEGER (serial)
		const usersResult = await pool.query(
			'SELECT id FROM usuario WHERE email = $1',
			[DEFAULT_EMAIL]
		)
		if (usersResult.rows.length === 0) {
			const hashedPassword = await hashPassword(DEFAULT_PASSWORD)
			await pool.query(
				'INSERT INTO usuario (email, idpublicador, idrole, password) VALUES ($1,$2,$3,$4)',
				[DEFAULT_EMAIL, publicadorId, roleId, hashedPassword]
			)
			console.log('✅ Usuario creado: ' + DEFAULT_EMAIL)
		} else {
			console.log('ℹ️  Usuario ' + DEFAULT_EMAIL + ' ya existe')
		}
	} catch (error: unknown) {
		const err = error as { code?: string; message?: string }
		if (err.message?.includes('does not exist') || err.message?.includes('relation')) {
			console.log('⚠️  Las tablas aún no están creadas. Verifique el schema en Neon.')
		} else {
			console.error('❌ Error al inicializar usuario:', err.message || error)
		}
	}
}

initUser()
	.then(() => process.exit(0))
	.catch(() => process.exit(0))