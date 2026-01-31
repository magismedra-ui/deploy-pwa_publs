import { apiService } from './api'
import { storage } from '../utils/storage'
import { userFromToken } from '../utils/jwt'
import { LoginRequest, AuthResponse, AuthUser, ChangePasswordRequest } from '../types'

export class AuthService {
	async login(credentials: LoginRequest): Promise<AuthResponse> {
		const response = await apiService.post<AuthResponse>('/auth/login', credentials)
		await storage.setToken(response.token)
		return response
	}

	async logout(): Promise<void> {
		await storage.removeToken()
		await storage.removeUser()
	}

	async changePassword(data: ChangePasswordRequest): Promise<void> {
		await apiService.patch('/usuario/change-password', data)
	}

	async isAuthenticated(): Promise<boolean> {
		const token = await storage.getToken()
		return !!token
	}

	async getCurrentUser(): Promise<AuthUser | null> {
		const token = await storage.getToken()
		if (!token) return null
		return userFromToken(token)
	}

	async getToken(): Promise<string | null> {
		return await storage.getToken()
	}
}

export const authService = new AuthService()
