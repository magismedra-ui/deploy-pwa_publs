import { Capacitor } from '@capacitor/core'
import { apiService } from './api'
import { databaseService } from './database.service'
import { asistenciaRepository } from '../repositories/asistencia.repository'
import { Asistencia } from '../types'

/**
 * Obtiene todas las asistencias.
 * En navegador (PWA): API REST. En móvil (nativo): SQLite.
 */
export async function getAsistencias(): Promise<Asistencia[]> {
	const isNative = Capacitor.isNativePlatform()
	const dbReady = databaseService.isInitialized() && databaseService.isNative()

	if (isNative && dbReady) {
		return asistenciaRepository.findAll()
	}

	const data = await apiService.get<Asistencia[]>('/asistencia')
	return Array.isArray(data) ? data : []
}
