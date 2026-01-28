import { SQLiteDBConnection } from '@capacitor-community/sqlite'
import { databaseService } from '../services/database.service'
import { BaseEntity, SyncStatus } from '../types'
import { generateUUID } from '../utils/uuid'

export abstract class LocalRepository<T extends BaseEntity> {
	protected abstract tableName: string

	protected getDb(): SQLiteDBConnection | null {
		if (!databaseService.isInitialized() || !databaseService.isNative()) {
			return null
		}
		return databaseService.getConnection()
	}

	async findAll(): Promise<T[]> {
		const db = this.getDb()
		if (!db) return []
		const result = await db.query(
			`SELECT * FROM ${this.tableName} WHERE (deleted = 0 OR deleted IS NULL) ORDER BY updatedAt DESC`
		)
		return this.mapRows((result.values || []) as any[])
	}

	async findById(id: string): Promise<T | null> {
		const db = this.getDb()
		if (!db) return null
		const result = await db.query(
			`SELECT * FROM ${this.tableName} WHERE id = ? AND (deleted = 0 OR deleted IS NULL)`,
			[id]
		)
		const rows = this.mapRows((result.values || []) as any[])
		return rows[0] || null
	}

	async create(data: Omit<T, 'id' | 'updatedAt' | 'syncStatus' | 'deleted'>): Promise<T> {
		const db = this.getDb()
		if (!db) {
			throw new Error('Base de datos no disponible')
		}

		const id = generateUUID()
		const now = Date.now()
		const entity = {
			...data,
			id,
			syncStatus: 'pending' as SyncStatus,
			deleted: 0,
			updatedAt: now
		}

		const fields = Object.keys(entity).join(', ')
		const placeholders = Object.keys(entity).map(() => '?').join(', ')
		const values = this.prepareValues(Object.values(entity))

		await db.run(
			`INSERT INTO ${this.tableName} (${fields}) VALUES (${placeholders})`,
			values
		)

		return this.mapRow(entity) as T
	}

	async update(id: string, data: Partial<Omit<T, 'id' | 'updatedAt' | 'syncStatus' | 'deleted'>>): Promise<T | null> {
		const db = this.getDb()
		if (!db) return null

		const existing = await this.findById(id)
		if (!existing) return null

		const now = Date.now()
		const updates = Object.keys(data)
			.filter((key) => key !== 'id' && key !== 'updatedAt' && key !== 'syncStatus' && key !== 'deleted')
			.map((key) => `${key} = ?`)
			.join(', ')

		const values = Object.keys(data)
			.filter((key) => key !== 'id' && key !== 'updatedAt' && key !== 'syncStatus' && key !== 'deleted')
			.map((key) => {
				const val = data[key as keyof typeof data]
				return this.prepareValue(val)
			})

		if (updates) {
			await db.run(
				`UPDATE ${this.tableName} SET ${updates}, syncStatus = ?, updatedAt = ? WHERE id = ?`,
				[...values, 'pending', now, id]
			)
		} else {
			await db.run(
				`UPDATE ${this.tableName} SET syncStatus = ?, updatedAt = ? WHERE id = ?`,
				['pending', now, id]
			)
		}

		const updated = { ...existing, ...data, syncStatus: 'pending' as SyncStatus, updatedAt: new Date(now) }
		return updated as T
	}

	async delete(id: string): Promise<boolean> {
		const db = this.getDb()
		if (!db) return false

		const existing = await this.findById(id)
		if (!existing) return false

		const now = Date.now()
		await db.run(
			`UPDATE ${this.tableName} SET deleted = 1, syncStatus = ?, updatedAt = ? WHERE id = ?`,
			['pending', now, id]
		)

		return true
	}

	protected prepareValue(value: any): any {
		if (value === null || value === undefined) {
			return null
		}
		if (typeof value === 'boolean') {
			return value ? 1 : 0
		}
		if (value instanceof Date) {
			return value.toISOString().split('T')[0]
		}
		if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
			return value.split('T')[0]
		}
		return value
	}

	protected prepareValues(values: any[]): any[] {
		return values.map((v) => this.prepareValue(v))
	}

	protected mapRow(row: any): any {
		const mapped: any = { ...row }
		
		if (row.deleted !== undefined && row.deleted !== null) {
			mapped.deleted = row.deleted === 1 || row.deleted === true
		}
		
		if (row.updatedAt !== undefined && row.updatedAt !== null) {
			if (typeof row.updatedAt === 'number') {
				mapped.updatedAt = new Date(row.updatedAt)
			} else if (typeof row.updatedAt === 'string') {
				const parsed = parseInt(row.updatedAt, 10)
				mapped.updatedAt = isNaN(parsed) ? new Date(row.updatedAt) : new Date(parsed)
			}
		}
		
		if (row.capitan !== undefined && row.capitan !== null) {
			mapped.capitan = row.capitan === 1 || row.capitan === true
		}
		
		if (row.auxiliar !== undefined && row.auxiliar !== null) {
			mapped.auxiliar = row.auxiliar === 1 || row.auxiliar === true
		}
		
		if (row.predico !== undefined && row.predico !== null) {
			mapped.predico = row.predico === 1 || row.predico === true
		}
		
		if (row.fecha_nacimiento && typeof row.fecha_nacimiento === 'string') {
			mapped.fecha_nacimiento = row.fecha_nacimiento
		}
		
		if (row.fecha_bautismo && typeof row.fecha_bautismo === 'string') {
			mapped.fecha_bautismo = row.fecha_bautismo
		}
		
		if (row.fecha && typeof row.fecha === 'string') {
			mapped.fecha = row.fecha
		}
		
		return mapped
	}

	protected mapRows(rows: any[]): T[] {
		return rows.map((row) => this.mapRow(row) as T)
	}
}
