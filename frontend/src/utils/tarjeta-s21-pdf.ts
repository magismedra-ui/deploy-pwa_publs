import axios from 'axios'
import { Publicador } from '../types'
import { storage } from './storage'

/**
 * Obtiene el PDF S-21 del backend (misma petición que el botón verde en Publs).
 */
export async function fetchTarjetaS21PdfBytes(
	pub: Publicador,
): Promise<Uint8Array | null> {
	if (!pub.id) return null
	try {
		const token = await storage.getToken()
		const apiBaseUrl =
			import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
		const endpoint = `${apiBaseUrl}/publicador/${pub.id}/tarjeta-s21`
		const res = await axios.get(endpoint, {
			responseType: 'arraybuffer',
			headers: token ? { Authorization: `Bearer ${token}` } : undefined,
		})
		return new Uint8Array(res.data)
	} catch {
		return null
	}
}
