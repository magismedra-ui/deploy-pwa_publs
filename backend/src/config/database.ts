import mysql from 'mysql2/promise'
import { Pool } from 'mysql2/promise'

let pool: Pool | null = null

export const getPool = (): Pool => {
	if (!pool) {
		pool = mysql.createPool({
			host: process.env.DB_HOST || 'localhost',
			port: parseInt(process.env.DB_PORT || '3306'),
			user: process.env.DB_USER || 'root',
			password: process.env.DB_PASSWORD || '',
			database: process.env.DB_NAME || 'tjpubls',
			waitForConnections: true,
			connectionLimit: 10,
			queueLimit: 0,
			enableKeepAlive: true,
			keepAliveInitialDelay: 0
		})
	}
	return pool
}

export const closePool = async (): Promise<void> => {
	if (pool) {
		await pool.end()
		pool = null
	}
}
