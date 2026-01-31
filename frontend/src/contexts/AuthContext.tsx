import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '../services/auth.service'
import { AuthResponse, AuthUser } from '../types'

interface AuthContextType {
	isAuthenticated: boolean
	user: AuthUser | null
	loading: boolean
	login: (email: string, password: string) => Promise<AuthResponse>
	logout: () => Promise<void>
	checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuthContext = () => {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuthContext debe usarse dentro de AuthProvider')
	}
	return context
}

interface AuthProviderProps {
	children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
	const [user, setUser] = useState<AuthUser | null>(null)
	const [loading, setLoading] = useState<boolean>(true)

	useEffect(() => {
		checkAuth()
	}, [])

	const checkAuth = async () => {
		try {
			const authenticated = await authService.isAuthenticated()
			const currentUser = await authService.getCurrentUser()
			setIsAuthenticated(authenticated)
			setUser(currentUser)
		} catch (error) {
			setIsAuthenticated(false)
			setUser(null)
		} finally {
			setLoading(false)
		}
	}

	const login = async (email: string, password: string): Promise<AuthResponse> => {
		const response = await authService.login({ email, password })
		setIsAuthenticated(true)
		const currentUser = await authService.getCurrentUser()
		setUser(currentUser)
		return response
	}

	const logout = async (): Promise<void> => {
		await authService.logout()
		setIsAuthenticated(false)
		setUser(null)
		// Usar window.location para navegar cuando history no está disponible
		if (typeof window !== 'undefined') {
			window.location.href = '/login'
		}
	}

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated,
				user,
				loading,
				login,
				logout,
				checkAuth
			}}
		>
			{children}
		</AuthContext.Provider>
	)
}
