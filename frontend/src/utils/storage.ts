import { Preferences } from '@capacitor/preferences'
import { AuthUser } from '../types'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'user_data'

export const storage = {
	async setToken(token: string): Promise<void> {
		await Preferences.set({ key: TOKEN_KEY, value: token })
	},

	async getToken(): Promise<string | null> {
		const { value } = await Preferences.get({ key: TOKEN_KEY })
		return value || null
	},

	async removeToken(): Promise<void> {
		await Preferences.remove({ key: TOKEN_KEY })
	},

	async setUser(user: AuthUser): Promise<void> {
		await Preferences.set({ key: USER_KEY, value: JSON.stringify(user) })
	},

	async getUser(): Promise<AuthUser | null> {
		const { value } = await Preferences.get({ key: USER_KEY })
		return value ? JSON.parse(value) : null
	},

	async removeUser(): Promise<void> {
		await Preferences.remove({ key: USER_KEY })
	},

	async clear(): Promise<void> {
		await Preferences.clear()
	}
}
