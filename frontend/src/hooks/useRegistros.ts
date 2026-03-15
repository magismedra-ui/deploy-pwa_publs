import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../services/api'
import { getLocally, saveLocally, addToSyncQueue, omitLocalFields } from '../lib/localDb'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
export interface RegistroPayload {
	idpublicador: number
	anno_servicio?: number | null
	mes?: string | null
	predico?: boolean | null
	horas?: number | null
	cursos?: number | null
	precursor?: string | null
	notas?: string | null
}

export interface Registro extends RegistroPayload {
	id: number
	_syncStatus?: 'pending' | 'synced'
	_deleted?: boolean
}

const QUERY_KEY = ['registros'] as const
const ENDPOINT = '/registro'
const STORE = 'registros' as const

// ─────────────────────────────────────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────────────────────────────────────
export function useRegistros() {
	const queryClient = useQueryClient()

	// ── Query ──────────────────────────────────────────────────────────────
	const query = useQuery<Registro[]>({
		queryKey: QUERY_KEY,
		networkMode: 'always',
		staleTime: 2 * 60 * 1000,
		queryFn: async () => {
			try {
				const remote = await apiService.get<Registro[]>(ENDPOINT)
				const withSync = remote.map((r) => ({ ...r, _syncStatus: 'synced' as const }))
				await saveLocally(STORE, withSync)
				return withSync
			} catch {
				return getLocally(STORE) as Promise<Registro[]>
			}
		},
	})

	// ── Create ─────────────────────────────────────────────────────────────
	const create = useMutation<Registro, Error, RegistroPayload>({
		mutationFn: async (payload) => {
		const cleanPayload = omitLocalFields(payload as unknown as Record<string, unknown>)
		try {
			const created = await apiService.post<Registro>(ENDPOINT, cleanPayload)
				return { ...created, _syncStatus: 'synced' as const }
			} catch {
				const tempId = -Date.now()
				const local: Registro = { ...payload, id: tempId, _syncStatus: 'pending' }
				await saveLocally(STORE, [local])
				await addToSyncQueue('create', 'registro', cleanPayload as unknown as Record<string, unknown>)
				return local
			}
		},
		onSuccess: (data) => {
			queryClient.setQueryData<Registro[]>(QUERY_KEY, (old = []) => [...old, data])
		},
	})

	// ── Update ─────────────────────────────────────────────────────────────
	const update = useMutation<Registro, Error, { id: number; payload: Partial<RegistroPayload> }>({
		mutationFn: async ({ id, payload }) => {
			const cleanPayload = omitLocalFields(payload as Record<string, unknown>)
			try {
				const updated = await apiService.put<Registro>(`${ENDPOINT}/${id}`, cleanPayload)
				const result = { ...updated, _syncStatus: 'synced' as const }
				await saveLocally(STORE, [result])
				return result
			} catch {
				const existing = (await getLocally(STORE) as Registro[]).find((r) => r.id === id)
				const local: Registro = {
					id,
					idpublicador: payload.idpublicador ?? existing?.idpublicador ?? 0,
					anno_servicio: payload.anno_servicio ?? existing?.anno_servicio ?? null,
					mes: payload.mes ?? existing?.mes ?? null,
					predico: payload.predico ?? existing?.predico ?? null,
					horas: payload.horas ?? existing?.horas ?? null,
					cursos: payload.cursos ?? existing?.cursos ?? null,
					precursor: payload.precursor ?? existing?.precursor ?? null,
					notas: payload.notas ?? existing?.notas ?? null,
					_syncStatus: 'pending',
				}
				await saveLocally(STORE, [local])
				await addToSyncQueue('update', 'registro', { id, ...cleanPayload })
				return local
			}
		},
		onSuccess: (data) => {
			queryClient.setQueryData<Registro[]>(QUERY_KEY, (old = []) =>
				old.map((r) => (r.id === data.id ? data : r))
			)
		},
	})

	// ── Delete ─────────────────────────────────────────────────────────────
	const remove = useMutation<void, Error, number>({
		mutationFn: async (id) => {
			try {
				await apiService.delete(`${ENDPOINT}/${id}`)
			} catch {
				const existing = (await getLocally(STORE) as Registro[]).find((r) => r.id === id)
				if (existing) {
					await saveLocally(STORE, [{ ...existing, _deleted: true, _syncStatus: 'pending' }])
				}
				await addToSyncQueue('delete', 'registro', { id })
			}
		},
		onSuccess: (_data, id) => {
			queryClient.setQueryData<Registro[]>(QUERY_KEY, (old = []) =>
				old.filter((r) => r.id !== id)
			)
		},
	})

	return {
		registros: query.data ?? [],
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		refetch: query.refetch,
		create,
		update,
		remove,
	}
}
