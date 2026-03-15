import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

// ─────────────────────────────────────────────────────────────────────────────
// Schema — refleja exactamente las tablas de Neon PostgreSQL (snake_case)
// Los campos con prefijo _ son de tracking LOCAL y NO se envían al backend.
// ─────────────────────────────────────────────────────────────────────────────
interface TJPublsDB extends DBSchema {
	publicadores: {
		key: number
		value: {
			id: number
			nombre: string
			correo?: string | null
			sexo?: string | null
			esperanza?: string | null
			privilegio?: string | null
			precursor?: string | null
			fecha_nacimiento?: string | null
			fecha_bautismo?: string | null
			direccion?: string | null
			telefono_familiar?: number | null
			telefono?: number | null
			grupo?: number | null
			capitan?: boolean | null
			auxiliar?: boolean | null
			estado?: string | null
			observaciones?: string | null
			created_at?: string | null
			_syncStatus?: 'pending' | 'synced'
			_deleted?: boolean
		}
	}
	grupos: {
		key: number
		value: {
			id: number
			nombre: string
			_syncStatus?: 'pending' | 'synced'
			_deleted?: boolean
		}
	}
	asistencias: {
		key: number
		value: {
			id: number
			fecha?: string | null
			presencial?: number | null
			zoom?: number | null
			_syncStatus?: 'pending' | 'synced'
			_deleted?: boolean
		}
	}
	registros: {
		key: number
		value: {
			id: number
			idpublicador: number
			anno_servicio?: number | null
			mes?: string | null
			predico?: boolean | null
			horas?: number | null
			cursos?: number | null
			precursor?: string | null
			notas?: string | null
			_syncStatus?: 'pending' | 'synced'
			_deleted?: boolean
		}
	}
	addinfopubl: {
		key: number
		value: {
			id: number
			idpublicador: number
			fecha?: string | null
			observaciones?: string | null
			_syncStatus?: 'pending' | 'synced'
			_deleted?: boolean
		}
	}
	syncQueue: {
		key: number
		value: {
			id?: number
			action: 'create' | 'update' | 'delete'
			entity: string
			data: Record<string, unknown>
			timestamp: number
		}
		autoIncrement: true
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos de stores disponibles (excluye syncQueue para las helpers genéricas)
// ─────────────────────────────────────────────────────────────────────────────
export type DataStore = Exclude<keyof TJPublsDB, 'syncQueue'>

// ─────────────────────────────────────────────────────────────────────────────
// Singleton de la conexión
// ─────────────────────────────────────────────────────────────────────────────
let dbPromise: Promise<IDBPDatabase<TJPublsDB>> | null = null

export function getDb(): Promise<IDBPDatabase<TJPublsDB>> {
	if (!dbPromise) {
		dbPromise = openDB<TJPublsDB>('tjpubls-idb', 1, {
			upgrade(db) {
				if (!db.objectStoreNames.contains('publicadores')) {
					db.createObjectStore('publicadores', { keyPath: 'id' })
				}
				if (!db.objectStoreNames.contains('grupos')) {
					db.createObjectStore('grupos', { keyPath: 'id' })
				}
				if (!db.objectStoreNames.contains('asistencias')) {
					db.createObjectStore('asistencias', { keyPath: 'id' })
				}
				if (!db.objectStoreNames.contains('registros')) {
					db.createObjectStore('registros', { keyPath: 'id' })
				}
				if (!db.objectStoreNames.contains('addinfopubl')) {
					db.createObjectStore('addinfopubl', { keyPath: 'id' })
				}
				if (!db.objectStoreNames.contains('syncQueue')) {
					db.createObjectStore('syncQueue', {
						keyPath: 'id',
						autoIncrement: true,
					})
				}
			},
		})
	}
	return dbPromise
}

// ─────────────────────────────────────────────────────────────────────────────
// saveLocally — guarda un array de items en el store indicado.
// Preserva IDs negativos (registros creados offline antes de sincronizar).
// ─────────────────────────────────────────────────────────────────────────────
export async function saveLocally<S extends DataStore>(
	store: S,
	items: TJPublsDB[S]['value'][]
): Promise<void> {
	const db = await getDb()
	// Cast necesario: idb requiere el literal exacto del store name
	const storeName = store as 'publicadores' | 'grupos' | 'asistencias' | 'registros' | 'addinfopubl'
	const tx = db.transaction(storeName, 'readwrite')
	const objectStore = tx.objectStore(storeName)

	for (const item of items) {
		// Preservar registros con ID negativo (offline) que aún no se han sincronizado
		const existing = await objectStore.get((item as any).id)
		if (existing && typeof (existing as any).id === 'number' && (existing as any).id < 0) {
			// No sobreescribir registros offline pendientes
			continue
		}
		await objectStore.put(item as any)
	}

	await tx.done
}

// ─────────────────────────────────────────────────────────────────────────────
// getLocally — devuelve todos los registros del store, filtrando los marcados
// como _deleted: true (borrado lógico local).
// ─────────────────────────────────────────────────────────────────────────────
export async function getLocally<S extends DataStore>(
	store: S
): Promise<TJPublsDB[S]['value'][]> {
	const db = await getDb()
	// Cast necesario: idb requiere el literal exacto del store name
	const storeName = store as 'publicadores' | 'grupos' | 'asistencias' | 'registros' | 'addinfopubl'
	const all = await db.getAll(storeName)
	return all.filter((item) => !(item as any)._deleted) as TJPublsDB[S]['value'][]
}

// ─────────────────────────────────────────────────────────────────────────────
// syncQueue helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Agrega una operación a la cola de sincronización. */
export async function addToSyncQueue(
	action: 'create' | 'update' | 'delete',
	entity: string,
	data: Record<string, unknown>
): Promise<void> {
	const db = await getDb()
	await db.add('syncQueue', {
		action,
		entity,
		// Filtrar campos locales (prefijo _) antes de encolar hacia el backend
		data: omitLocalFields(data),
		timestamp: Date.now(),
	})
}

/** Devuelve todos los items pendientes en la cola, ordenados por timestamp. */
export async function getSyncQueue(): Promise<TJPublsDB['syncQueue']['value'][]> {
	const db = await getDb()
	const all = await db.getAll('syncQueue')
	return all.sort((a, b) => a.timestamp - b.timestamp)
}

/** Elimina todos los items de la cola (tras sincronización exitosa). */
export async function clearSyncQueue(): Promise<void> {
	const db = await getDb()
	await db.clear('syncQueue')
}

/** Elimina un item específico de la cola por su id. */
export async function removeSyncQueueItem(id: number): Promise<void> {
	const db = await getDb()
	await db.delete('syncQueue', id)
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidad: omite campos con prefijo _ (tracking local) antes de enviar al API
// ─────────────────────────────────────────────────────────────────────────────
export function omitLocalFields(data: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(data).filter(([key]) => !key.startsWith('_'))
	)
}
