import axios, { AxiosInstance, AxiosError } from 'axios'
import { storage } from '../utils/storage'
import { ApiResponse } from '../types'

const API_BASE_URL =
	import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

class ApiService {
	private client: AxiosInstance

	constructor() {
		this.client = axios.create({
			baseURL: API_BASE_URL,
			timeout: 30000,
			headers: {
				'Content-Type': 'application/json',
				// Evita 304 Not Modified con cuerpo vacío (Axios no rellena data)
				'Cache-Control': 'no-cache',
				Pragma: 'no-cache',
			},
		})

		this.client.interceptors.request.use(
			async (config) => {
				const token = await storage.getToken()
				if (token) {
					config.headers.Authorization = `Bearer ${token}`
				}
				return config
			},
			(error) => {
				return Promise.reject(error)
			}
		)

		this.client.interceptors.response.use(
			(response) => response,
			async (error: AxiosError<ApiResponse<any>>) => {
				if (error.response?.status === 401) {
					await storage.removeToken()
					await storage.removeUser()
					if (window.location.pathname !== '/login') {
						window.location.href = '/login'
					}
				}
				return Promise.reject(error)
			}
		)
	}

	async get<T>(url: string): Promise<T> {
		const { data } = await this.client.get<ApiResponse<T>>(url, {
			// Rompe caché HTTP/CDN (p. ej. Render) que devolvía 304 sin JSON
			params: { _t: Date.now() },
		})
		if (data == null || typeof data !== 'object') {
			throw new Error(
				'Respuesta vacía del servidor. Prueba a recargar la página.',
			)
		}
		if (!data.success) {
			throw new Error(data.error?.message || 'Error en la petición')
		}
		return data.data as T
	}

	async post<T>(url: string, payload?: any): Promise<T> {
		const { data } = await this.client.post<ApiResponse<T>>(url, payload)
		if (data == null || typeof data !== 'object') {
			throw new Error(
				'Respuesta vacía del servidor. Prueba a recargar la página.',
			)
		}
		if (!data.success) {
			throw new Error(data.error?.message || 'Error en la petición')
		}
		// data.data puede ser null en teoría; el alta de usuario debe devolver fila
		if (data.data === undefined) {
			throw new Error(data.error?.message || 'Error en la petición')
		}
		return data.data as T
	}

	async put<T>(url: string, payload?: any): Promise<T> {
		const { data } = await this.client.put<ApiResponse<T>>(url, payload)
		if (!data.success || !data.data) {
			throw new Error(data.error?.message || 'Error en la petición')
		}
		return data.data
	}

	async patch<T>(url: string, payload?: any): Promise<T> {
		const { data } = await this.client.patch<ApiResponse<T>>(url, payload)
		if (!data.success) {
			throw new Error(data.error?.message || 'Error en la petición')
		}
		return data.data as T
	}

	async delete(url: string): Promise<void> {
		const { data } = await this.client.delete<ApiResponse<void>>(url)
		if (data == null || typeof data !== 'object') {
			return
		}
		if ('success' in data && data.success === false) {
			throw new Error(data.error?.message || 'Error en la petición')
		}
	}
}

export const apiService = new ApiService()
