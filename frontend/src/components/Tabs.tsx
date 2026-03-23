import {
	IonTabs,
	IonTabBar,
	IonTabButton,
	IonIcon,
	IonLabel,
	IonRouterOutlet,
	useIonToast,
} from '@ionic/react'
import { homeOutline, documentTextOutline, peopleOutline, settingsOutline } from 'ionicons/icons'
import { Route, Redirect, useHistory, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from '../pages/Home'
import Reports from '../pages/Reports'
import Publs from '../pages/Publs'
import Settings from '../pages/Settings'
import Grupos from '../pages/Grupos'
import Publicadores from '../pages/Publicadores'
import Usuarios from '../pages/Usuarios'
import Asistencias from '../pages/Asistencias'
import Registros from '../pages/Registros'
import AddInfoPubl from '../pages/AddInfoPubl'
import AddInfoPublNew from '../pages/AddInfoPublNew'
import AddInfoPublEdit from '../pages/AddInfoPublEdit'
import Dashboard from '../pages/Dashboard'
import IngresarInformes from '../pages/IngresarInformes'
import { useAuthContext } from '../contexts/AuthContext'

const Tabs: React.FC = () => {
	const location = useLocation()
	const history = useHistory()
	const { user } = useAuthContext()
	const [presentToast] = useIonToast()
	const normalizedRole = (user?.roleName || user?.idrole || '')
		.toString()
		.trim()
		.toLowerCase()
	const isAdmin = normalizedRole === 'admin'
	const restrictedPaths = [
		'/tabs/publs',
		'/tabs/publicadores',
		'/tabs/settings',
	]

	useEffect(() => {
		if (!isAdmin && restrictedPaths.includes(location.pathname)) {
			presentToast({
				message: 'No tienes acceso a este tab',
				duration: 2000,
			})
			history.replace('/tabs/home')
		}
	}, [history, isAdmin, location.pathname, presentToast])

	const handleBlockedTabAccess = (ev: CustomEvent<void>) => {
		if (isAdmin) return
		ev.preventDefault()
		presentToast({
			message: 'No tienes acceso a este tab',
			duration: 2000,
		})
		if (location.pathname !== '/tabs/home') {
			history.replace('/tabs/home')
		}
	}

	return (
		<IonTabs>
			<IonRouterOutlet>
				<Route exact path="/tabs/home">
					<Home />
				</Route>
				<Route exact path="/tabs/reports">
					<Reports />
				</Route>
				<Route exact path="/tabs/publs">
					{isAdmin ? <Publs /> : <Redirect to="/tabs/home" />}
				</Route>
				<Route exact path="/tabs/settings">
					{isAdmin ? <Settings /> : <Redirect to="/tabs/home" />}
				</Route>
				<Route exact path="/tabs/grupos">
					<Grupos />
				</Route>
				<Route exact path="/tabs/publicadores">
					{isAdmin ? <Publicadores /> : <Redirect to="/tabs/home" />}
				</Route>
				<Route exact path="/tabs/usuarios">
					<Usuarios />
				</Route>
				<Route exact path="/tabs/asistencias">
					<Asistencias />
				</Route>
				<Route exact path="/tabs/registros">
					<Registros />
				</Route>
				<Route exact path="/tabs/ingresar-informes/:grupoId/:grupoNombre">
					<IngresarInformes />
				</Route>
				<Route exact path="/tabs/addinfopubl">
					<AddInfoPubl />
				</Route>
				<Route exact path="/tabs/addinfopubl/new">
					<AddInfoPublNew />
				</Route>
				<Route exact path="/tabs/addinfopubl/:id">
					<AddInfoPublEdit />
				</Route>
				<Route exact path="/tabs/dashboard">
					<Dashboard />
				</Route>
				<Route exact path="/tabs">
					<Redirect to="/tabs/home" />
				</Route>
			</IonRouterOutlet>
			<IonTabBar slot="bottom">
				<IonTabButton
					tab="home"
					href="/tabs/home"
				>
					<IonIcon icon={homeOutline} />
					<IonLabel>Inicio</IonLabel>
				</IonTabButton>
				<IonTabButton
					tab="reports"
					href="/tabs/reports"
				>
					<IonIcon icon={documentTextOutline} />
					<IonLabel>Reportes</IonLabel>
				</IonTabButton>
				<IonTabButton
					tab="publs"
					href="/tabs/publs"
					onClick={handleBlockedTabAccess}
				>
					<IonIcon icon={peopleOutline} />
					<IonLabel>Publicadores</IonLabel>
				</IonTabButton>
				<IonTabButton
					tab="settings"
					href="/tabs/settings"
					onClick={handleBlockedTabAccess}
				>
					<IonIcon icon={settingsOutline} />
					<IonLabel>Configuración</IonLabel>
				</IonTabButton>
			</IonTabBar>
		</IonTabs>
	)
}

export default Tabs
