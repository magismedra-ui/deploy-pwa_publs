import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { Redirect, Route } from 'react-router-dom'
import { type ComponentType, type FC, type ReactNode, useEffect } from 'react'

const Router = IonReactRouter as ComponentType<{ children?: ReactNode }>
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

import Login from './pages/Login'
import Tabs from './components/Tabs'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PublicRoute } from './components/PublicRoute'
import { AuthProvider } from './contexts/AuthContext'
import { databaseService } from './services/database.service'
import { syncService } from './services/sync.service'

import '@ionic/react/css/core.css'
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'
import '@ionic/react/css/padding.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/display.css'
import './theme.css'

setupIonicReact()

const App: FC = () => {
	useEffect(() => {
		const initializeApp = async () => {
			if (Capacitor.isNativePlatform()) {
				try {
					await StatusBar.setStyle({ style: Style.Light })
					await databaseService.initialize()
					await syncService.startAutoSync()
				} catch (error) {
					console.error('Error inicializando app:', error)
				}
			}
		}

		initializeApp()
	}, [])

	return (
		<IonApp>
			<AuthProvider>
				<Router>
					<IonRouterOutlet>
						<PublicRoute exact path="/login">
							<Login />
						</PublicRoute>
						<ProtectedRoute path="/tabs">
							<Tabs />
						</ProtectedRoute>
						<Route exact path="/">
							<Redirect to="/tabs/home" />
						</Route>
						<Route>
							<Redirect to="/tabs/home" />
						</Route>
					</IonRouterOutlet>
				</Router>
			</AuthProvider>
		</IonApp>
	)
}

export default App
