import { Capacitor } from '@capacitor/core'
import { apiService } from './api'
import { databaseService } from './database.service'
import { registroRepository } from '../repositories/registro.repository'
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

	const data = await apiService.get<Registro[]>('/registro')
	return Array.isArray(data) ? data : []
}
