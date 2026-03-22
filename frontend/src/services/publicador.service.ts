import { Capacitor } from '@capacitor/core'
import { apiService } from './api'
import { databaseService } from './database.service'
import { publicadorRepository } from '../repositories/publicador.repository'
import { Publicador } from '../types'

/**
 * Obtiene todos los publicadores.
 * En navegador (PWA): usa la API REST.
 * En dispositivo móvil (nativo): usa SQLite local.
 */
export async function getPublicadores(): Promise<Publicador[]> {
	const isNative = Capacitor.isNativePlatform()
	const dbReady = databaseService.isInitialized() && databaseService.isNative()

	// Nativo con red: priorizar API para que idpublicador sea UUID del servidor
	// (SQLite local puede tener otros IDs y falla POST /addinfopubl con 404)
	if (isNative && dbReady && typeof navigator !== 'undefined' && navigator.onLine) {
		try {
			const data = await apiService.get<Publicador[]>('/publicador')
			return Array.isArray(data) ? data : []
		} catch {
			// servidor no disponible: seguir con copia local
		}
	}

	if (isNative && dbReady) {
		return publicadorRepository.findAll()
	}

	const data = await apiService.get<Publicador[]>('/publicador')
	return Array.isArray(data) ? data : []
}
