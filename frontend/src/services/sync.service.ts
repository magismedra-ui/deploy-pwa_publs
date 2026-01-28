import { SQLiteDBConnection } from '@capacitor-community/sqlite'
import { databaseService } from './database.service'
import { apiService } from './api'
import { Network } from '@capacitor/network'
import { BaseEntity } from '../types'

interface SyncQueueItem {
	id: string
	table_name: string
	record_id: string
	operation: 'create' | 'update' | 'delete'
	data: string
	created_at: string
}

export class SyncService {
	private isSyncing = false
	private syncInterval: number | null = null

	async startAutoSync(intervalMs: number = 30000): Promise<void> {
		if (this.syncInterval) {
			return
		}

		this.syncInterval = window.setInterval(async () => {
			const status = await Network.getStatus()
			if (status.connected) {
				await this.sync()
			}
		}, intervalMs)

		await this.sync()
	}

	stopAutoSync(): void {
		if (this.syncInterval) {
			clearInterval(this.syncInterval)
			this.syncInterval = null
		}
	}

	async sync(): Promise<void> {
		if (this.isSyncing) return

		const status = await Network.getStatus()
		if (!status.connected) {
			return
		}

		this.isSyncing = true

		try {
			const db = await databaseService.getConnection()
			if (!db) return

			const queueResult = await db.query(
				'SELECT * FROM sync_queue ORDER BY created_at ASC'
			)
			const queueItems = queueResult.values as SyncQueueItem[]

			for (const item of queueItems) {
				try {
					await this.processSyncItem(item, db)
					await db.run('DELETE FROM sync_queue WHERE id = ?', [item.id])
				} catch (error) {
					console.error(`Error sincronizando item ${item.id}:`, error)
				}
			}

			await this.pullChanges()
		} catch (error) {
			console.error('Error en sincronización:', error)
		} finally {
			this.isSyncing = false
		}
	}

	private async processSyncItem(
		item: SyncQueueItem,
		db: SQLiteDBConnection
	): Promise<void> {
		const data = JSON.parse(item.data) as BaseEntity
		const endpoint = `/api/v1/${item.table_name}`

		try {
			switch (item.operation) {
				case 'create':
					await apiService.post(`${endpoint}`, data)
					break
				case 'update':
					await apiService.put(`${endpoint}/${item.record_id}`, data)
					break
				case 'delete':
					await apiService.delete(`${endpoint}/${item.record_id}`)
					break
			}

			await db.run(
				`UPDATE ${item.table_name} SET syncStatus = 'synced' WHERE id = ?`,
				[item.record_id]
			)
		} catch (error) {
			await db.run(
				`UPDATE ${item.table_name} SET syncStatus = 'conflict' WHERE id = ?`,
				[item.record_id]
			)
			throw error
		}
	}

	private async pullChanges(): Promise<void> {
		const db = await databaseService.getConnection()
		if (!db) return

		const tables = [
			'grupo',
			'role',
			'publicador',
			'usuario',
			'asistencia',
			'registro',
			'addinfopubl'
		]

		for (const table of tables) {
			try {
				const serverData = await apiService.get<any[]>(`/${table}`)

				for (const item of serverData) {
					const existing = await db.query(
						`SELECT * FROM ${table} WHERE id = ?`,
						[item.id]
					)

					if (existing.values && existing.values.length > 0) {
						const local = existing.values[0] as any
						const serverDate = new Date(item.updatedAt || 0)
						const localDate = new Date(local.updatedAt || 0)
						if (serverDate > localDate && local.syncStatus !== 'pending') {
							await this.updateLocalRecord(db, table, item)
						}
					} else {
						await this.insertLocalRecord(db, table, item)
					}
				}
			} catch (error) {
				console.error(`Error pulling ${table}:`, error)
			}
		}
	}

	private async updateLocalRecord(
		db: SQLiteDBConnection,
		table: string,
		data: any
	): Promise<void> {
		const fields = Object.keys(data)
			.filter((key) => key !== 'id')
			.map((key) => `${key} = ?`)
			.join(', ')

		const values = Object.keys(data)
			.filter((key) => key !== 'id')
			.map((key) => {
				const val = data[key]
				if (val === true) return 1
				if (val === false) return 0
				if (val instanceof Date) return val.toISOString()
				return val === null || val === undefined ? null : val
			})

		await db.run(
			`UPDATE ${table} SET ${fields}, syncStatus = 'synced' WHERE id = ?`,
			[...values, data.id]
		)
	}

	private async insertLocalRecord(
		db: SQLiteDBConnection,
		table: string,
		data: any
	): Promise<void> {
		const fields = Object.keys(data).join(', ')
		const placeholders = Object.keys(data).map(() => '?').join(', ')
		const values = Object.values(data).map((val: any) => {
			if (val === true) return 1
			if (val === false) return 0
			if (val instanceof Date) return val.toISOString()
			return val === null || val === undefined ? null : val
		})

		await db.run(
			`INSERT OR REPLACE INTO ${table} (${fields}) VALUES (${placeholders})`,
			values
		)
	}
}

export const syncService = new SyncService()
