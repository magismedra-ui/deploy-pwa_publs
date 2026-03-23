import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../services/api'
import { getLocally, saveLocally, omitLocalFields } from '../lib/localDb'

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
			const created = await apiService.post<Asistencia>(ENDPOINT, cleanPayload)
			return { ...created, _syncStatus: 'synced' as const }
		},
		onSuccess: (data) => {
			queryClient.setQueryData<Asistencia[]>(QUERY_KEY, (old = []) => [...old, data])
		},
	})

	// ── Update ─────────────────────────────────────────────────────────────
	const update = useMutation<Asistencia, Error, { id: number; payload: Partial<AsistenciaPayload> }>({
		mutationFn: async ({ id, payload }) => {
			const cleanPayload = omitLocalFields(payload as Record<string, unknown>)
			const updated = await apiService.put<Asistencia>(
				`${ENDPOINT}/${id}`,
				cleanPayload,
			)
			const result = { ...updated, _syncStatus: 'synced' as const }
			await saveLocally(STORE, [result])
			return result
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
			await apiService.delete(`${ENDPOINT}/${id}`)
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
