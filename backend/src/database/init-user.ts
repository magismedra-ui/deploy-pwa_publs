import dotenv from 'dotenv'
import { getPool } from '../config/database'
import { hashPassword } from '../utils/password'
import { generateUUID } from '../utils/uuid'

dotenv.config()

const DEFAULT_EMAIL = 'magismedra@gmail.com'
const DEFAULT_PASSWORD = 'h8m5d4'

const waitForDB = async (maxRetries = 30): Promise<void> => {
	for (let i = 0; i < maxRetries; i++) {
		try {
			const pool = getPool()
			await pool.execute('SELECT 1')
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
		const pool = getPool()

		// 1. Role: id UUID, role "Admin"
		let roleId: string
		const [roles] = await pool.execute(
			"SELECT id FROM role WHERE role = 'Admin' AND (deleted = FALSE OR deleted IS NULL)"
		)
		const existingRole = (roles as { id: string }[])[0]
		if (existingRole) {
			roleId = existingRole.id
			console.log('ℹ️  Rol Admin ya existe')
		} else {
			roleId = generateUUID()
			await pool.execute(
				'INSERT INTO role (id, role) VALUES (?, ?)',
				[roleId, 'Admin']
			)
			console.log('✅ Rol Admin creado')
		}

		// 2. Grupo: id auto-increment, nombre "GRUPO 1"
		let grupoId: number
		const [grupos] = await pool.execute(
			"SELECT id FROM grupo WHERE nombre = 'GRUPO 1' AND (deleted = FALSE OR deleted IS NULL)"
		)
		const existingGrupo = (grupos as { id: number }[])[0]
		if (existingGrupo) {
			grupoId = existingGrupo.id
			console.log('ℹ️  Grupo GRUPO 1 ya existe')
		} else {
			const [resGrupo] = await pool.execute(
				'INSERT INTO grupo (nombre) VALUES (?)',
				['GRUPO 1']
			)
			grupoId = (resGrupo as { insertId: number }).insertId
			console.log('✅ Grupo GRUPO 1 creado (id: ' + grupoId + ')')
		}

		// 3. Publicador
		const [publs] = await pool.execute(
			'SELECT id FROM publicador WHERE correo = ? AND (deleted = FALSE OR deleted IS NULL)',
			[DEFAULT_EMAIL]
		)
		let publicadorId: string
		if ((publs as { id: string }[]).length > 0) {
			publicadorId = (publs as { id: string }[])[0].id
			console.log('ℹ️  Publicador ya existe')
		} else {
			publicadorId = generateUUID()
			await pool.execute(
				`INSERT INTO publicador (
					id, nombre, correo, sexo, esperanza, privilegio, precursor,
					fecha_nacimiento, fecha_bautismo, direccion, telefono_familiar,
					grupo, observaciones, estado, capitan, auxiliar, telefono
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
		const [users] = await pool.execute(
			'SELECT id FROM usuario WHERE email = ? AND (deleted = FALSE OR deleted IS NULL)',
			[DEFAULT_EMAIL]
		)
		if ((users as { id: string }[]).length === 0) {
			const hashedPassword = await hashPassword(DEFAULT_PASSWORD)
			const usuarioId = generateUUID()
			await pool.execute(
				'INSERT INTO usuario (id, email, idpublicador, idrole, password) VALUES (?, ?, ?, ?, ?)',
				[usuarioId, DEFAULT_EMAIL, publicadorId, roleId, hashedPassword]
			)
			console.log('✅ Usuario creado: ' + DEFAULT_EMAIL)
		} else {
			console.log('ℹ️  Usuario ' + DEFAULT_EMAIL + ' ya existe')
		}
	} catch (error: unknown) {
		const err = error as { code?: string; message?: string }
		if (err.code === 'ER_NO_SUCH_TABLE' || err.message?.includes("doesn't exist")) {
			console.log('⚠️  Las tablas aún no están creadas. Ejecute init-db y vuelva a correr init-user.')
		} else {
			console.error('❌ Error al inicializar usuario:', err.message || error)
		}
	}
}

initUser()
	.then(() => process.exit(0))
	.catch(() => process.exit(0))
