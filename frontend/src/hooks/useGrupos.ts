import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../services/api'
import { getLocally, saveLocally, addToSyncQueue, omitLocalFields } from '../lib/localDb'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
export interface GrupoPayload {
	nombre: string
}

export interface Grupo extends GrupoPayload {
	id: number
	_syncStatus?: 'pending' | 'synced'
	_deleted?: boolean
}

const QUERY_KEY = ['grupos'] as const
const ENDPOINT = '/grupo'
const STORE = 'grupos' as const

// ─────────────────────────────────────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────────────────────────────────────
export function useGrupos() {
	const queryClient = useQueryClient()

	// ── Query ──────────────────────────────────────────────────────────────
	const query = useQuery<Grupo[]>({
		queryKey: QUERY_KEY,
		networkMode: 'always',
		staleTime: 2 * 60 * 1000,
		queryFn: async () => {
			try {
				const remote = await apiService.get<Grupo[]>(ENDPOINT)
				const withSync = remote.map((g) => ({ ...g, _syncStatus: 'synced' as const }))
				await saveLocally(STORE, withSync)
				return withSync
			} catch {
				return getLocally(STORE) as Promise<Grupo[]>
			}
		},
	})

	// ── Create ─────────────────────────────────────────────────────────────
	const create = useMutation<Grupo, Error, GrupoPayload>({
		mutationFn: async (payload) => {
			try {
				const created = await apiService.post<Grupo>(ENDPOINT, payload)
				return { ...created, _syncStatus: 'synced' as const }
			} catch {
				const tempId = -Date.now()
				const local: Grupo = { ...payload, id: tempId, _syncStatus: 'pending' }
				await saveLocally(STORE, [local])
				await addToSyncQueue('create', 'grupo', payload as unknown as Record<string, unknown>)
				return local
			}
		},
		onSuccess: (data) => {
			queryClient.setQueryData<Grupo[]>(QUERY_KEY, (old = []) => [...old, data])
		},
	})

	// ── Update ─────────────────────────────────────────────────────────────
	const update = useMutation<Grupo, Error, { id: number; payload: Partial<GrupoPayload> }>({
		mutationFn: async ({ id, payload }) => {
			const cleanPayload = omitLocalFields(payload as Record<string, unknown>)
			try {
				const updated = await apiService.put<Grupo>(`${ENDPOINT}/${id}`, cleanPayload)
				const result = { ...updated, _syncStatus: 'synced' as const }
				await saveLocally(STORE, [result])
				return result
			} catch {
				const existing = (await getLocally(STORE) as Grupo[]).find((g) => g.id === id)
				const local: Grupo = {
					id,
					nombre: payload.nombre ?? existing?.nombre ?? '',
					_syncStatus: 'pending',
				}
				await saveLocally(STORE, [local])
				await addToSyncQueue('update', 'grupo', { id, ...cleanPayload })
				return local
			}
		},
		onSuccess: (data) => {
			queryClient.setQueryData<Grupo[]>(QUERY_KEY, (old = []) =>
				old.map((g) => (g.id === data.id ? data : g))
			)
		},
	})

	// ── Delete ─────────────────────────────────────────────────────────────
	const remove = useMutation<void, Error, number>({
		mutationFn: async (id) => {
			try {
				await apiService.delete(`${ENDPOINT}/${id}`)
			} catch {
				const existing = (await getLocally(STORE) as Grupo[]).find((g) => g.id === id)
				if (existing) {
					await saveLocally(STORE, [{ ...existing, _deleted: true, _syncStatus: 'pending' }])
				}
				await addToSyncQueue('delete', 'grupo', { id })
			}
		},
		onSuccess: (_data, id) => {
			queryClient.setQueryData<Grupo[]>(QUERY_KEY, (old = []) =>
				old.filter((g) => g.id !== id)
			)
		},
	})

	return {
		grupos: query.data ?? [],
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
		create,
		update,
		remove,
	}
}
