import { Preferences } from '@capacitor/preferences'
import { AuthUser } from '../types'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'user_data'
let memoryToken: string | null = null
let memoryUser: AuthUser | null = null

export const storage = {
	async setToken(token: string): Promise<void> {
		memoryToken = token
		try {
			await Preferences.set({ key: TOKEN_KEY, value: token })
		} catch {
			// Fallback en memoria cuando el navegador bloquea datos del sitio.
		}
	},

	async getToken(): Promise<string | null> {
		try {
			const { value } = await Preferences.get({ key: TOKEN_KEY })
			return value || memoryToken
		} catch {
			return memoryToken
		}
	},

	async removeToken(): Promise<void> {
		memoryToken = null
		try {
			await Preferences.remove({ key: TOKEN_KEY })
		} catch {
			// Sin almacenamiento persistente disponible.
		}
	},

	async setUser(user: AuthUser): Promise<void> {
		memoryUser = user
		try {
			await Preferences.set({ key: USER_KEY, value: JSON.stringify(user) })
		} catch {
			// Fallback en memoria cuando el navegador bloquea datos del sitio.
		}
	},

	async getUser(): Promise<AuthUser | null> {
		try {
			const { value } = await Preferences.get({ key: USER_KEY })
			return value ? JSON.parse(value) : memoryUser
		} catch {
			return memoryUser
		}
	},

	async removeUser(): Promise<void> {
		memoryUser = null
		try {
			await Preferences.remove({ key: USER_KEY })
		} catch {
			// Sin almacenamiento persistente disponible.
		}
	},

	async clear(): Promise<void> {
		memoryToken = null
		memoryUser = null
		try {
			await Preferences.clear()
		} catch {
			// Sin almacenamiento persistente disponible.
		}
	}
}
