import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
	throw new Error(
		'DATABASE_URL no está definida. Crea un archivo .env en backend/ ' +
			'copiando .env.example y asigna la URL de PostgreSQL (Neon o local).'
	)
}

const pool = new Pool({
	connectionString,
	ssl: connectionString.includes('sslmode=require')
		? { rejectUnauthorized: false }
		: false,
	max: 10,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 10000,
})

export default pool
