import React, { useState, useEffect } from 'react'
import {
	IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
	IonSegment, IonSegmentButton, IonLabel, IonFab, IonFabButton,
	IonIcon, IonButtons, IonButton,
} from '@ionic/react'
import { add, logOutOutline } from 'ionicons/icons'
import { useHistory } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { syncOfflineQueue } from '../hooks/usePublicadores'

// ── Listas de cada entidad ────────────────────────────────────────────────
import Publicadores from './Publicadores'
import Grupos from './Grupos'
import Asistencias from './Asistencias'
import Registros from './Registros'
import AddInfoPubl from './AddInfoPubl'

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
type ActiveTab = 'publicadores' | 'grupos' | 'asistencias' | 'registros' | 'addinfopubl'

const TAB_LABELS: Record<ActiveTab, string> = {
	publicadores: 'Publicadores',
	grupos:       'Grupos',
	asistencias:  'Asistencias',
	registros:    'Registros',
	addinfopubl:  'Info Adicional',
}

const fabRoutes: Record<ActiveTab, string> = {
	publicadores: '/tabs/publicadores/new',
	grupos:       '/tabs/grupos/new',
	asistencias:  '/tabs/asistencias/new',
	registros:    '/tabs/registros/new',
	addinfopubl:  '/tabs/addinfopubl/new',
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente Dashboard
// ─────────────────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
	const history = useHistory()
	const queryClient = useQueryClient()
	const { logout } = useAuth()

	const [activeTab, setActiveTab] = useState<ActiveTab>('publicadores')
	const [isOnline, setIsOnline] = useState(navigator.onLine)

	// ── Banner online/offline ────────────────────────────────────────────
	useEffect(() => {
		const handleOnline = () => setIsOnline(true)
		const handleOffline = () => setIsOnline(false)
		window.addEventListener('online', handleOnline)
		window.addEventListener('offline', handleOffline)
		return () => {
			window.removeEventListener('online', handleOnline)
			window.removeEventListener('offline', handleOffline)
		}
	}, [])

	// ── Sync — UN SOLO listener (patrón boilerplate) ─────────────────────
	useEffect(() => {
		const handleOnline = async () => {
			await syncOfflineQueue()
			// Invalidar todas las queries para refrescar datos
			await queryClient.invalidateQueries()
		}
		window.addEventListener('online', handleOnline)
		return () => window.removeEventListener('online', handleOnline)
	}, [queryClient])

	// ── Logout ───────────────────────────────────────────────────────────
	const handleLogout = async () => {
		await logout()
		history.replace('/login')
	}

	// ── Render del tab activo ────────────────────────────────────────────
	const renderContent = () => {
		switch (activeTab) {
			case 'publicadores': return <Publicadores embedded />
			case 'grupos':       return <Grupos />
			case 'asistencias':  return <Asistencias />
			case 'registros':    return <Registros />
			case 'addinfopubl':  return <AddInfoPubl />
		}
	}

	return (
		<IonPage>
			{/* ── Header ──────────────────────────────────────────────── */}
			<IonHeader>
				<IonToolbar color="primary">
					<IonTitle>
						TJPubls
						<div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 400 }}>
							Congregación Alto Bosque
						</div>
					</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={handleLogout} title="Cerrar sesión">
							<IonIcon icon={logOutOutline} slot="icon-only" />
						</IonButton>
					</IonButtons>
				</IonToolbar>

				{/* ── Banner online/offline ────────────────────────────── */}
				<div
					style={{
						backgroundColor: isOnline ? '#2dd36f' : '#eb445a',
						color:           '#ffffff',
						fontSize:        '0.75rem',
						textAlign:       'center',
						padding:         '3px 0',
						transition:      'background-color 0.3s',
					}}
				>
					{isOnline
						? '● En línea'
						: '● Sin conexión — Los cambios se sincronizarán'}
				</div>

				{/* ── Tabs (IonSegment scrollable) ─────────────────────── */}
				<IonToolbar>
					<IonSegment
						scrollable
						value={activeTab}
						onIonChange={(e) => setActiveTab(e.detail.value as ActiveTab)}
					>
						{(Object.keys(TAB_LABELS) as ActiveTab[]).map((tab) => (
							<IonSegmentButton key={tab} value={tab}>
								<IonLabel>{TAB_LABELS[tab]}</IonLabel>
							</IonSegmentButton>
						))}
					</IonSegment>
				</IonToolbar>
			</IonHeader>

			{/* ── Contenido del tab activo ─────────────────────────────── */}
			<IonContent fullscreen>
				{renderContent()}

				{/* ── FAB ─────────────────────────────────────────────── */}
				<IonFab slot="fixed" vertical="bottom" horizontal="end">
					<IonFabButton
						color="primary"
						onClick={() =>
							activeTab === 'asistencias'
								? history.push('/tabs/home?openAsistencia=1')
								: history.push(fabRoutes[activeTab])
						}
					>
						<IonIcon icon={add} />
					</IonFabButton>
				</IonFab>
			</IonContent>
		</IonPage>
	)
}

export default Dashboard
