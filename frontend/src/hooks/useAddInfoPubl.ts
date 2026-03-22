import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../services/api'
import { getLocally, saveLocally, addToSyncQueue, omitLocalFields } from '../lib/localDb'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
export interface AddInfoPublPayload {
	/** UUID del publicador (misma columna que en API / PostgreSQL) */
	idpublicador: string
	fecha?: string | null
	observaciones?: string | null
	/** Por defecto false */
	pastoreo?: boolean
}

export interface AddInfoPubl extends AddInfoPublPayload {
	/** UUID del registro; valores negativos solo en borrador offline */
	id: string | number
	_syncStatus?: 'pending' | 'synced'
	_deleted?: boolean
}

const QUERY_KEY = ['addinfopubl'] as const
const ENDPOINT = '/addinfopubl'
const STORE = 'addinfopubl' as const

// ─────────────────────────────────────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────────────────────────────────────
export function useAddInfoPubl() {
	const queryClient = useQueryClient()

	// ── Query ──────────────────────────────────────────────────────────────
	const query = useQuery<AddInfoPubl[]>({
		queryKey: QUERY_KEY,
		networkMode: 'always',
		staleTime: 2 * 60 * 1000,
		queryFn: async () => {
			try {
				const remote = await apiService.get<AddInfoPubl[]>(ENDPOINT)
				const withSync = remote.map((a) => ({ ...a, _syncStatus: 'synced' as const }))
				await saveLocally(STORE, withSync)
				return withSync
			} catch {
				return getLocally(STORE) as Promise<AddInfoPubl[]>
			}
		},
	})

	// ── Create ─────────────────────────────────────────────────────────────
	const create = useMutation<AddInfoPubl, Error, AddInfoPublPayload>({
		mutationFn: async (payload) => {
			const cleanPayload = omitLocalFields(payload as unknown as Record<string, unknown>)
			try {
				const created = await apiService.post<AddInfoPubl>(ENDPOINT, cleanPayload)
				return { ...created, _syncStatus: 'synced' as const }
			} catch (err) {
				// Solo cola offline cuando no hay red; si hay error 4xx/5xx con red, propagar
				const offline =
					typeof navigator !== 'undefined' && !navigator.onLine
				if (!offline) {
					if (err instanceof Error) throw err
					throw new Error(String(err))
				}
				const tempId = -Date.now()
				const local: AddInfoPubl = { ...payload, id: tempId, _syncStatus: 'pending' }
				await saveLocally(STORE, [local])
				await addToSyncQueue('create', 'addinfopubl', cleanPayload as unknown as Record<string, unknown>)
				return local
			}
		},
		onSuccess: (data) => {
			queryClient.setQueryData<AddInfoPubl[]>(QUERY_KEY, (old = []) => [...old, data])
		},
	})

	// ── Update ─────────────────────────────────────────────────────────────
	const update = useMutation<AddInfoPubl, Error, { id: string | number; payload: Partial<AddInfoPublPayload> }>({
		mutationFn: async ({ id, payload }) => {
			const cleanPayload = omitLocalFields(payload as Record<string, unknown>)
			try {
				const updated = await apiService.put<AddInfoPubl>(`${ENDPOINT}/${id}`, cleanPayload)
				const result = { ...updated, _syncStatus: 'synced' as const }
				await saveLocally(STORE, [result])
				return result
			} catch (err) {
				const offline =
					typeof navigator !== 'undefined' && !navigator.onLine
				if (!offline) {
					if (err instanceof Error) throw err
					throw new Error(String(err))
				}
				const existing = (await getLocally(STORE) as AddInfoPubl[]).find((a) => a.id === id)
				const local: AddInfoPubl = {
					id,
					idpublicador: payload.idpublicador ?? existing?.idpublicador ?? '',
					fecha: payload.fecha ?? existing?.fecha ?? null,
					observaciones: payload.observaciones ?? existing?.observaciones ?? null,
					pastoreo: payload.pastoreo ?? existing?.pastoreo ?? false,
					_syncStatus: 'pending',
				}
				await saveLocally(STORE, [local])
				await addToSyncQueue('update', 'addinfopubl', { id, ...cleanPayload })
				return local
			}
		},
		onSuccess: (data) => {
			queryClient.setQueryData<AddInfoPubl[]>(QUERY_KEY, (old = []) =>
				old.map((a) => (a.id === data.id ? data : a))
			)
		},
	})

	// ── Delete ─────────────────────────────────────────────────────────────
	const remove = useMutation<void, Error, string | number>({
		mutationFn: async (id) => {
			try {
				await apiService.delete(`${ENDPOINT}/${id}`)
			} catch (err) {
				const offline =
					typeof navigator !== 'undefined' && !navigator.onLine
				if (!offline) {
					if (err instanceof Error) throw err
					throw new Error(String(err))
				}
				const existing = (await getLocally(STORE) as AddInfoPubl[]).find((a) => a.id === id)
				if (existing) {
					await saveLocally(STORE, [{ ...existing, _deleted: true, _syncStatus: 'pending' }])
				}
				await addToSyncQueue('delete', 'addinfopubl', { id })
			}
		},
		onSuccess: (_data, id) => {
			queryClient.setQueryData<AddInfoPubl[]>(QUERY_KEY, (old = []) =>
				old.filter((a) => a.id !== id)
			)
		},
	})

	return {
		addInfoPubl: query.data ?? [],
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
		create,
		update,
		remove,
	}
}
