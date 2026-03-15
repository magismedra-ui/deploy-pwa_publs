import 'dotenv/config'
import pool from '../config/database'
import { hashPassword } from '../utils/password'
import { generateUUID } from '../utils/uuid'

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

		// 1. Role: id UUID, role "Admin"
		let roleId: string
		const rolesResult = await pool.query(
			"SELECT id FROM role WHERE role = 'Admin'"
		)
		const existingRole = rolesResult.rows[0] as { id: string } | undefined
		if (existingRole) {
			roleId = existingRole.id
			console.log('ℹ️  Rol Admin ya existe')
		} else {
			roleId = generateUUID()
			await pool.query(
				'INSERT INTO role (id, role) VALUES ($1, $2)',
				[roleId, 'Admin']
			)
			console.log('✅ Rol Admin creado')
		}

		// 2. Grupo: nombre "GRUPO 1"
		let grupoId: string
		const gruposResult = await pool.query(
			"SELECT id FROM grupo WHERE nombre = 'GRUPO 1'"
		)
		const existingGrupo = gruposResult.rows[0] as { id: string } | undefined
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

		// 3. Publicador
		const publsResult = await pool.query(
			'SELECT id FROM publicador WHERE correo = $1',
			[DEFAULT_EMAIL]
		)
		let publicadorId: string
		if (publsResult.rows.length > 0) {
			publicadorId = publsResult.rows[0].id
			console.log('ℹ️  Publicador ya existe')
		} else {
			publicadorId = generateUUID()
			await pool.query(
				`INSERT INTO publicador (
					id, nombre, correo, sexo, esperanza, privilegio, precursor,
					fecha_nacimiento, fecha_bautismo, direccion, telefono_familiar,
					grupo, observaciones, estado, capitan, auxiliar, telefono
				) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
				[
					publicadorId,
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
			console.log('✅ Publicador creado')
		}

		// 4. Usuario
		const usersResult = await pool.query(
			'SELECT id FROM usuario WHERE email = $1',
			[DEFAULT_EMAIL]
		)
		if (usersResult.rows.length === 0) {
			const hashedPassword = await hashPassword(DEFAULT_PASSWORD)
			const usuarioId = generateUUID()
			await pool.query(
				'INSERT INTO usuario (id, email, idpublicador, idrole, password) VALUES ($1,$2,$3,$4,$5)',
				[usuarioId, DEFAULT_EMAIL, publicadorId, roleId, hashedPassword]
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
