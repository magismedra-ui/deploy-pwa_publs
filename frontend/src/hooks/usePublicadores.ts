import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '../services/api'
import {
	getLocally,
	saveLocally,
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
	id: string | number
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
			} catch (err) {
				// Solo usar IndexedDB offline; con red, datos locales pueden tener IDs incompatibles con el API
				const offline =
					typeof navigator !== 'undefined' && !navigator.onLine
				if (offline) {
					return getLocally(STORE) as Promise<Publicador[]>
				}
				if (err instanceof Error) throw err
				throw new Error(String(err))
			}
		},
	})

	// ── Create ─────────────────────────────────────────────────────────────
	const create = useMutation<Publicador, Error, PublicadorPayload>({
		mutationFn: async (payload) => {
			const created = await apiService.post<Publicador>(ENDPOINT, payload)
			return { ...created, _syncStatus: 'synced' as const }
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
			const updated = await apiService.put<Publicador>(
				`${ENDPOINT}/${id}`,
				cleanPayload,
			)
			const result = { ...updated, _syncStatus: 'synced' as const }
			await saveLocally(STORE, [result])
			return result
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
			await apiService.delete(`${ENDPOINT}/${id}`)
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
	}
}
