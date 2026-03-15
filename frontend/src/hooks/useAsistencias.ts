import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../services/api'
import { getLocally, saveLocally, addToSyncQueue, omitLocalFields } from '../lib/localDb'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
export interface AsistenciaPayload {
	id?: number   // Asistencia NO tiene autoincrement en Neon; el id se gestiona en frontend/backend
	fecha?: string | null
	presencial?: number | null
	zoom?: number | null
}

export interface Asistencia extends AsistenciaPayload {
	id: number
	_syncStatus?: 'pending' | 'synced'
	_deleted?: boolean
}

const QUERY_KEY = ['asistencias'] as const
const ENDPOINT = '/asistencia'
const STORE = 'asistencias' as const

// ─────────────────────────────────────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────────────────────────────────────
export function useAsistencias() {
	const queryClient = useQueryClient()

	// ── Query ──────────────────────────────────────────────────────────────
	const query = useQuery<Asistencia[]>({
		queryKey: QUERY_KEY,
		networkMode: 'always',
		staleTime: 2 * 60 * 1000,
		queryFn: async () => {
			try {
				const remote = await apiService.get<Asistencia[]>(ENDPOINT)
				const withSync = remote.map((a) => ({ ...a, _syncStatus: 'synced' as const }))
				await saveLocally(STORE, withSync)
				return withSync
			} catch {
				return getLocally(STORE) as Promise<Asistencia[]>
			}
		},
	})

	// ── Create ─────────────────────────────────────────────────────────────
	const create = useMutation<Asistencia, Error, AsistenciaPayload>({
		mutationFn: async (payload) => {
			const cleanPayload = omitLocalFields(payload as Record<string, unknown>)
			try {
				const created = await apiService.post<Asistencia>(ENDPOINT, cleanPayload)
				return { ...created, _syncStatus: 'synced' as const }
			} catch {
				// Offline: ID negativo temporal
				const tempId = -Date.now()
				const local: Asistencia = {
					id: tempId,
					fecha: payload.fecha ?? null,
					presencial: payload.presencial ?? null,
					zoom: payload.zoom ?? null,
					_syncStatus: 'pending',
				}
				await saveLocally(STORE, [local])
				await addToSyncQueue('create', 'asistencia', cleanPayload)
				return local
			}
		},
		onSuccess: (data) => {
			queryClient.setQueryData<Asistencia[]>(QUERY_KEY, (old = []) => [...old, data])
		},
	})

	// ── Update ─────────────────────────────────────────────────────────────
	const update = useMutation<Asistencia, Error, { id: number; payload: Partial<AsistenciaPayload> }>({
		mutationFn: async ({ id, payload }) => {
			const cleanPayload = omitLocalFields(payload as Record<string, unknown>)
			try {
				const updated = await apiService.put<Asistencia>(`${ENDPOINT}/${id}`, cleanPayload)
				const result = { ...updated, _syncStatus: 'synced' as const }
				await saveLocally(STORE, [result])
				return result
			} catch {
				const existing = (await getLocally(STORE) as Asistencia[]).find((a) => a.id === id)
				const local: Asistencia = {
					id,
					fecha: payload.fecha ?? existing?.fecha ?? null,
					presencial: payload.presencial ?? existing?.presencial ?? null,
					zoom: payload.zoom ?? existing?.zoom ?? null,
					_syncStatus: 'pending',
				}
				await saveLocally(STORE, [local])
				await addToSyncQueue('update', 'asistencia', { id, ...cleanPayload })
				return local
			}
		},
		onSuccess: (data) => {
			queryClient.setQueryData<Asistencia[]>(QUERY_KEY, (old = []) =>
				old.map((a) => (a.id === data.id ? data : a))
			)
		},
	})

	// ── Delete ─────────────────────────────────────────────────────────────
	const remove = useMutation<void, Error, number>({
		mutationFn: async (id) => {
			try {
				await apiService.delete(`${ENDPOINT}/${id}`)
			} catch {
				const existing = (await getLocally(STORE) as Asistencia[]).find((a) => a.id === id)
				if (existing) {
					await saveLocally(STORE, [{ ...existing, _deleted: true, _syncStatus: 'pending' }])
				}
				await addToSyncQueue('delete', 'asistencia', { id })
			}
		},
		onSuccess: (_data, id) => {
			queryClient.setQueryData<Asistencia[]>(QUERY_KEY, (old = []) =>
				old.filter((a) => a.id !== id)
			)
		},
	})

	return {
		asistencias: query.data ?? [],
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
		create,
		update,
		remove,
	}
}
