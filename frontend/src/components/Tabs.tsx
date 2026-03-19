import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonRouterOutlet } from '@ionic/react'
import { homeOutline, documentTextOutline, peopleOutline, settingsOutline } from 'ionicons/icons'
import { Route, Redirect, useLocation } from 'react-router-dom'
import Home from '../pages/Home'
import Reports from '../pages/Reports'
import Publs from '../pages/Publs'
import Settings from '../pages/Settings'
import Grupos from '../pages/Grupos'
import Publicadores from '../pages/Publicadores'
import Asistencias from '../pages/Asistencias'
import Registros from '../pages/Registros'
import AddInfoPubl from '../pages/AddInfoPubl'
import AddInfoPublNew from '../pages/AddInfoPublNew'
import AddInfoPublEdit from '../pages/AddInfoPublEdit'
import Dashboard from '../pages/Dashboard'
import IngresarInformes from '../pages/IngresarInformes'

const Tabs: React.FC = () => {
	const location = useLocation()
	const activePath = location.pathname
	const tabSegment =
		activePath.split('/tabs/')[1]?.split('/')[0]?.trim() || ''

	const activeTab = (
		tabSegment === 'home' ||
		tabSegment === 'reports' ||
		tabSegment === 'publs' ||
		tabSegment === 'settings'
	)
		? tabSegment
		: null

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
					<Publs />
				</Route>
				<Route exact path="/tabs/settings">
					<Settings />
				</Route>
				<Route exact path="/tabs/grupos">
					<Grupos />
				</Route>
				<Route exact path="/tabs/publicadores">
					<Publicadores />
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
					className={activeTab === 'home' ? 'tab-active' : undefined}
				>
					<IonIcon icon={homeOutline} />
					<IonLabel>Inicio</IonLabel>
				</IonTabButton>
				<IonTabButton
					tab="reports"
					href="/tabs/reports"
					className={activeTab === 'reports' ? 'tab-active' : undefined}
				>
					<IonIcon icon={documentTextOutline} />
					<IonLabel>Reportes</IonLabel>
				</IonTabButton>
				<IonTabButton
					tab="publs"
					href="/tabs/publs"
					className={activeTab === 'publs' ? 'tab-active' : undefined}
				>
					<IonIcon icon={peopleOutline} />
					<IonLabel>Publicadores</IonLabel>
				</IonTabButton>
				<IonTabButton
					tab="settings"
					href="/tabs/settings"
					className={activeTab === 'settings' ? 'tab-active' : undefined}
				>
					<IonIcon icon={settingsOutline} />
					<IonLabel>Configuración</IonLabel>
				</IonTabButton>
			</IonTabBar>
		</IonTabs>
	)
}

export default Tabs
