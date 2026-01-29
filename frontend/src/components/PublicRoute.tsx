import { Redirect, Route, RouteProps } from 'react-router-dom'
import { useAuthContext } from '../contexts/AuthContext'
import { IonLoading } from '@ionic/react'

export const PublicRoute: React.FC<RouteProps> = ({ children, ...rest }) => {
	const { isAuthenticated, loading } = useAuthContext()

	if (loading) {
		return <IonLoading isOpen={true} message="Cargando..." />
	}

	if (isAuthenticated) {
		return <Redirect to="/tabs/home" />
	}

	return <Route {...rest}>{children}</Route>
}
