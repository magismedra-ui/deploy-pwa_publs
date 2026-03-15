import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../services/api'
import {
	getLocally,
	saveLocally,
	addToSyncQueue,
	getSyncQueue,
	removeSyncQueueItem,
	omitLocalFields,
} from '../lib/localDb'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
export interface PublicadorPayload {
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
}

export interface Publicador extends PublicadorPayload {
	id: number
	created_at?: string | null
	_syncStatus?: 'pending' | 'synced'
	_deleted?: boolean
}

const QUERY_KEY = ['publicadores'] as const
const ENDPOINT = '/publicador'
const STORE = 'publicadores' as const

// ─────────────────────────────────────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────────────────────────────────────
export function usePublicadores() {
	const queryClient = useQueryClient()

	// ── Query ──────────────────────────────────────────────────────────────
	const query = useQuery<Publicador[]>({
		queryKey: QUERY_KEY,
		networkMode: 'always',
		staleTime: 2 * 60 * 1000, // 2 minutos
		queryFn: async () => {
			try {
				const remote = await apiService.get<Publicador[]>(ENDPOINT)
				const withSync = remote.map((p) => ({ ...p, _syncStatus: 'synced' as const }))
				await saveLocally(STORE, withSync)
				return withSync
			} catch {
				// Offline: devolver datos locales
				return getLocally(STORE) as Promise<Publicador[]>
			}
		},
	})

	// ── Create ─────────────────────────────────────────────────────────────
	const create = useMutation<Publicador, Error, PublicadorPayload>({
		mutationFn: async (payload) => {
			try {
				const created = await apiService.post<Publicador>(ENDPOINT, payload)
				return { ...created, _syncStatus: 'synced' as const }
			} catch {
				// Offline: crear con ID negativo temporal
				const tempId = -Date.now()
				const local: Publicador = { ...payload, id: tempId, _syncStatus: 'pending' }
				await saveLocally(STORE, [local])
				await addToSyncQueue('create', 'publicador', payload as unknown as Record<string, unknown>)
				return local
			}
		},
		onSuccess: (data) => {
			queryClient.setQueryData<Publicador[]>(QUERY_KEY, (old = []) => [...old, data])
		},
	})

	// ── Update ─────────────────────────────────────────────────────────────
	const update = useMutation<Publicador, Error, { id: number; payload: Partial<PublicadorPayload> }>({
		mutationFn: async ({ id, payload }) => {
			// Limpiar campos _ antes de enviar al backend
			const cleanPayload = omitLocalFields(payload as Record<string, unknown>)

			try {
				const updated = await apiService.put<Publicador>(`${ENDPOINT}/${id}`, cleanPayload)
				const result = { ...updated, _syncStatus: 'synced' as const }
				await saveLocally(STORE, [result])
				return result
			} catch {
				// Offline: actualizar localmente
				const existing = (await getLocally(STORE) as Publicador[]).find((p) => p.id === id)
				const local: Publicador = {
					id,
					nombre: payload.nombre ?? existing?.nombre ?? '',
					correo: payload.correo ?? existing?.correo ?? null,
					sexo: payload.sexo ?? existing?.sexo ?? null,
					esperanza: payload.esperanza ?? existing?.esperanza ?? null,
					privilegio: payload.privilegio ?? existing?.privilegio ?? null,
					precursor: payload.precursor ?? existing?.precursor ?? null,
					fecha_nacimiento: payload.fecha_nacimiento ?? existing?.fecha_nacimiento ?? null,
					fecha_bautismo: payload.fecha_bautismo ?? existing?.fecha_bautismo ?? null,
					direccion: payload.direccion ?? existing?.direccion ?? null,
					telefono_familiar: payload.telefono_familiar ?? existing?.telefono_familiar ?? null,
					telefono: payload.telefono ?? existing?.telefono ?? null,
					grupo: payload.grupo ?? existing?.grupo ?? null,
					capitan: payload.capitan ?? existing?.capitan ?? null,
					auxiliar: payload.auxiliar ?? existing?.auxiliar ?? null,
					estado: payload.estado ?? existing?.estado ?? null,
					observaciones: payload.observaciones ?? existing?.observaciones ?? null,
					created_at: existing?.created_at ?? null,
					_syncStatus: 'pending',
				}
				await saveLocally(STORE, [local])
				await addToSyncQueue('update', 'publicador', { id, ...cleanPayload })
				return local
			}
		},
		onSuccess: (data) => {
			queryClient.setQueryData<Publicador[]>(QUERY_KEY, (old = []) =>
				old.map((p) => (p.id === data.id ? data : p))
			)
		},
	})

	// ── Delete ─────────────────────────────────────────────────────────────
	const remove = useMutation<void, Error, number>({
		mutationFn: async (id) => {
			try {
				await apiService.delete(`${ENDPOINT}/${id}`)
			} catch {
				// Offline: marcar como eliminado localmente
				const existing = (await getLocally(STORE) as Publicador[]).find((p) => p.id === id)
				if (existing) {
					await saveLocally(STORE, [{ ...existing, _deleted: true, _syncStatus: 'pending' }])
				}
				await addToSyncQueue('delete', 'publicador', { id })
			}
		},
		onSuccess: (_data, id) => {
			queryClient.setQueryData<Publicador[]>(QUERY_KEY, (old = []) =>
				old.filter((p) => p.id !== id)
			)
		},
	})

	return {
		publicadores: query.data ?? [],
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
		create,
		update,
		remove,
		syncOfflineQueue,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// syncOfflineQueue — procesa la cola de operaciones pendientes
// ─────────────────────────────────────────────────────────────────────────────
export async function syncOfflineQueue(): Promise<void> {
	const queue = await getSyncQueue()
	for (const item of queue) {
		try {
			const { action, entity, data } = item
			const endpoint = `/${entity}`
			if (action === 'create') {
				await apiService.post(endpoint, data)
			} else if (action === 'update') {
				const { id, ...rest } = data as { id: number; [key: string]: unknown }
				await apiService.put(`${endpoint}/${id}`, rest)
			} else if (action === 'delete') {
				const { id } = data as { id: number }
				await apiService.delete(`${endpoint}/${id}`)
			}
			await removeSyncQueueItem(item.id!)
		} catch (err) {
			console.warn(`Error sincronizando item ${item.id}:`, err)
		}
	}
}
