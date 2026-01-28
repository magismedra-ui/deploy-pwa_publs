import dotenv from 'dotenv'
import { getPool } from '../config/database'
import { hashPassword } from '../utils/password'

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

		let roleId: string

		try {
			const [roles] = await pool.execute('SELECT id FROM role LIMIT 1')
			roleId = (roles as any[])[0]?.id
		} catch (error) {
			console.log('⚠️  Tabla role no existe aún, esperando...')
			await new Promise(resolve => setTimeout(resolve, 2000))
			const [roles] = await pool.execute('SELECT id FROM role LIMIT 1')
			roleId = (roles as any[])[0]?.id
		}

		if (!roleId) {
			console.log('⚠️  No se encontró ningún rol. Creando rol por defecto...')
			const [result] = await pool.execute('INSERT INTO role (id, role) VALUES (UUID(), ?)', ['admin'])
			const [newRole] = await pool.execute('SELECT id FROM role WHERE role = ?', ['admin'])
			roleId = (newRole as any[])[0]?.id
			console.log(`✅ Rol creado con ID: ${roleId}`)
		}

		const [users] = await pool.execute(
			'SELECT id FROM usuario WHERE email = ?',
			[DEFAULT_EMAIL]
		)

		if ((users as any[]).length === 0) {
			const hashedPassword = await hashPassword(DEFAULT_PASSWORD)
			await pool.execute(
				'INSERT INTO usuario (email, password, idrole) VALUES (?, ?, ?)',
				[DEFAULT_EMAIL, hashedPassword, roleId]
			)
			console.log(`✅ Usuario creado: ${DEFAULT_EMAIL}`)
		} else {
			console.log(`ℹ️  Usuario ${DEFAULT_EMAIL} ya existe`)
		}
	} catch (error: any) {
		if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes('doesn\'t exist')) {
			console.log('⚠️  Las tablas aún no están creadas, el usuario se creará en el siguiente inicio')
		} else {
			console.error('❌ Error al inicializar usuario:', error.message || error)
		}
	}
}

initUser()
	.then(() => {
		process.exit(0)
	})
	.catch(() => {
		process.exit(0)
	})
