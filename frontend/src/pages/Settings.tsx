import {
	IonContent,
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonItem,
	IonLabel,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonIcon,
} from '@ionic/react'
import React from 'react'
import {
	peopleOutline,
	personOutline,
	documentTextOutline,
	peopleCircleOutline,
} from 'ionicons/icons'

const WHITE_TEXT_STYLE: React.CSSProperties = { color: '#ffffff' }

const Settings: React.FC = () => {
	return (
		<IonPage>
			<IonHeader>
				<IonToolbar
					style={
						{
							'--background': '#000000',
							'--color': '#ffffff',
						} as React.CSSProperties
					}
				>
					<IonTitle style={{ color: '#ffffff' }}>
						Configuración
					</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen className="ion-padding">
				<IonCard>
					<IonCardHeader>
						<IonCardTitle style={WHITE_TEXT_STYLE}>
							Gestión de Publicadores
						</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						<IonItem
							button
							detail={false}
							routerLink="/tabs/grupos"
							routerDirection="forward"
							style={
								{
									'--color': '#ffffff',
									'--border-color': '#ffffff',
								} as React.CSSProperties
							}
						>
							<IonIcon
								icon={peopleOutline}
								slot="start"
								style={WHITE_TEXT_STYLE}
							/>
							<IonLabel>
								<h2 style={WHITE_TEXT_STYLE}>Grupos</h2>
								<p style={WHITE_TEXT_STYLE}>
									Administrar grupos de publicadores
								</p>
							</IonLabel>
						</IonItem>
						<IonItem
							button
							detail={false}
							routerLink="/tabs/publicadores"
							routerDirection="forward"
							style={
								{
									'--color': '#ffffff',
									'--border-color': '#ffffff',
								} as React.CSSProperties
							}
						>
							<IonIcon
								icon={personOutline}
								slot="start"
								style={WHITE_TEXT_STYLE}
							/>
							<IonLabel>
								<h2 style={WHITE_TEXT_STYLE}>Publicadores</h2>
								<p style={WHITE_TEXT_STYLE}>
									Gestionar información de publicadores
								</p>
							</IonLabel>
						</IonItem>
						<IonItem
							button
							detail={false}
							routerLink="/tabs/usuarios"
							routerDirection="forward"
							style={
								{
									'--color': '#ffffff',
									'--border-color': '#ffffff',
								} as React.CSSProperties
							}
						>
							<IonIcon
								icon={peopleCircleOutline}
								slot="start"
								style={WHITE_TEXT_STYLE}
							/>
							<IonLabel>
								<h2 style={WHITE_TEXT_STYLE}>Usuarios</h2>
								<p style={WHITE_TEXT_STYLE}>Gestionar usuarios</p>
							</IonLabel>
						</IonItem>
						<IonItem
							button
							detail={false}
							routerLink="/tabs/registros"
							routerDirection="forward"
							style={
								{
									'--color': '#ffffff',
									'--border-color': '#ffffff',
								} as React.CSSProperties
							}
						>
							<IonIcon
								icon={documentTextOutline}
								slot="start"
								style={WHITE_TEXT_STYLE}
							/>
							<IonLabel>
								<h2 style={WHITE_TEXT_STYLE}>Registros</h2>
								<p style={WHITE_TEXT_STYLE}>
									Ver y editar registros de servicio
								</p>
							</IonLabel>
						</IonItem>
						<IonItem
							button
							detail={false}
							routerLink="/tabs/addinfopubl"
							routerDirection="forward"
							style={
								{
									'--color': '#ffffff',
									'--border-color': '#ffffff',
								} as React.CSSProperties
							}
						>
							<IonIcon
								icon={documentTextOutline}
								slot="start"
								style={WHITE_TEXT_STYLE}
							/>
							<IonLabel>
								<h2 style={WHITE_TEXT_STYLE}>Información Adicional</h2>
								<p style={WHITE_TEXT_STYLE}>
									Información adicional de publicadores
								</p>
							</IonLabel>
						</IonItem>
						<IonItem
							button
							detail={false}
							routerLink="/tabs/asistencias"
							routerDirection="forward"
							style={
								{
									'--color': '#ffffff',
									'--border-color': '#ffffff',
								} as React.CSSProperties
							}
						>
							<IonIcon
								icon={documentTextOutline}
								slot="start"
								style={WHITE_TEXT_STYLE}
							/>
							<IonLabel>
								<h2 style={WHITE_TEXT_STYLE}>Asistencias</h2>
								<p style={WHITE_TEXT_STYLE}>Gestionar asistencias</p>
							</IonLabel>
						</IonItem>
					</IonCardContent>
				</IonCard>
			</IonContent>
		</IonPage>
	)
}

export default Settings
