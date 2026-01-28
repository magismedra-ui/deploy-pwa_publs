import { CapacitorSQLite, SQLiteDBConnection } from '@capacitor-community/sqlite'
import { Capacitor } from '@capacitor/core'

const DB_NAME = 'tjpubls_db'

class DatabaseService {
	private db: SQLiteDBConnection | null = null
	private initialized: boolean = false

	async initialize(): Promise<void> {
		if (this.initialized) {
			return
		}

		if (!Capacitor.isNativePlatform()) {
			console.log('SQLite solo está disponible en plataformas nativas')
			this.initialized = true
			return
		}

		try {
			this.db = await CapacitorSQLite.createConnection({
				database: DB_NAME,
				encrypted: false,
				mode: 'no-encryption',
				readOnly: false
			})

			await this.db.open()
			await this.createTables()
			this.initialized = true
			console.log('SQLite inicializado correctamente')
		} catch (error) {
			console.error('Error inicializando SQLite:', error)
			throw error
		}
	}

	private async createTables(): Promise<void> {
		if (!this.db) return

		const tables = [
			`CREATE TABLE IF NOT EXISTS grupo (
				id TEXT PRIMARY KEY,
				nombre TEXT NOT NULL,
				updatedAt INTEGER,
				deleted INTEGER DEFAULT 0,
				syncStatus TEXT DEFAULT 'pending'
			)`,
			`CREATE TABLE IF NOT EXISTS role (
				id TEXT PRIMARY KEY,
				role TEXT NOT NULL,
				updatedAt INTEGER,
				deleted INTEGER DEFAULT 0,
				syncStatus TEXT DEFAULT 'pending'
			)`,
			`CREATE TABLE IF NOT EXISTS publicador (
				id TEXT PRIMARY KEY,
				nombre TEXT,
				correo TEXT,
				sexo TEXT,
				esperanza TEXT,
				privilegio TEXT,
				precursor TEXT,
				fecha_nacimiento TEXT,
				fecha_bautismo TEXT,
				direccion TEXT,
				telefono_familiar INTEGER,
				grupo TEXT,
				observaciones TEXT,
				estado TEXT,
				capitan INTEGER DEFAULT 0,
				auxiliar INTEGER DEFAULT 0,
				telefono INTEGER,
				updatedAt INTEGER,
				deleted INTEGER DEFAULT 0,
				syncStatus TEXT DEFAULT 'pending'
			)`,
			`CREATE TABLE IF NOT EXISTS usuario (
				id TEXT PRIMARY KEY,
				idpublicador TEXT,
				idrole TEXT,
				password TEXT,
				email TEXT,
				updatedAt INTEGER,
				deleted INTEGER DEFAULT 0,
				syncStatus TEXT DEFAULT 'pending'
			)`,
			`CREATE TABLE IF NOT EXISTS asistencia (
				id TEXT PRIMARY KEY,
				fecha TEXT,
				presencial INTEGER,
				zoom INTEGER,
				updatedAt INTEGER,
				deleted INTEGER DEFAULT 0,
				syncStatus TEXT DEFAULT 'pending'
			)`,
			`CREATE TABLE IF NOT EXISTS registro (
				id TEXT PRIMARY KEY,
				anno_servicio INTEGER,
				mes TEXT,
				predico INTEGER DEFAULT 0,
				cursos INTEGER,
				precursor TEXT,
				horas INTEGER,
				notas TEXT,
				idpublicador TEXT,
				updatedAt INTEGER,
				deleted INTEGER DEFAULT 0,
				syncStatus TEXT DEFAULT 'pending'
			)`,
			`CREATE TABLE IF NOT EXISTS addinfopubl (
				id TEXT PRIMARY KEY,
				fecha TEXT,
				observaciones TEXT,
				idpublicador TEXT,
				updatedAt INTEGER,
				deleted INTEGER DEFAULT 0,
				syncStatus TEXT DEFAULT 'pending'
			)`
		]

		for (const table of tables) {
			try {
				await this.db.execute(table)
			} catch (error) {
				console.error(`Error creando tabla: ${table.substring(0, 50)}...`, error)
				throw error
			}
		}
	}

	getConnection(): SQLiteDBConnection | null {
		return this.db
	}

	isInitialized(): boolean {
		return this.initialized
	}

	isNative(): boolean {
		return Capacitor.isNativePlatform()
	}

	async close(): Promise<void> {
		if (this.db) {
			try {
				await CapacitorSQLite.closeConnection({ database: DB_NAME })
				this.db = null
				this.initialized = false
			} catch (error) {
				console.error('Error cerrando conexión SQLite:', error)
				throw error
			}
		}
	}
}

export const databaseService = new DatabaseService()
