import { Capacitor } from '@capacitor/core'
import { apiService } from './api'
import { databaseService } from './database.service'
import { registroRepository } from '../repositories/registro.repository'
import { getLocally } from '../lib/localDb'
import { Registro } from '../types'

/**
 * Obtiene todos los registros.
 * En navegador (PWA): API REST. En móvil (nativo): SQLite.
 */
export async function getRegistros(): Promise<Registro[]> {
	const isNative = Capacitor.isNativePlatform()
	const dbReady = databaseService.isInitialized() && databaseService.isNative()

	if (isNative && dbReady) {
		return registroRepository.findAll()
	}

	try {
		const data = await apiService.get<Registro[]>('/registro')
		return Array.isArray(data) ? data : []
	} catch (err) {
		const offline =
			typeof navigator !== 'undefined' && !navigator.onLine
		if (!offline) throw err
		const local = await getLocally('registros') as unknown as Registro[]
		return Array.isArray(local) ? local : []
	}
}
