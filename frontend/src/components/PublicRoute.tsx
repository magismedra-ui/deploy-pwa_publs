import { Redirect, Route } from 'react-router-dom'
import type { ComponentProps } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { AuthLoadingScreen } from './AuthLoadingScreen'

export const PublicRoute: React.FC<ComponentProps<typeof Route>> = ({
	children,
	...rest
}) => {
	const { isAuthenticated, loading } = useAuthContext()

	if (loading) {
		return <AuthLoadingScreen />
	}

	if (isAuthenticated) {
		return <Redirect to="/tabs/home" />
	}

	return <Route {...rest}>{children}</Route>
}
