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
						<IonCardTitle>Gestión de Publicadores</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						<IonItem
							button
							detail={false}
							routerLink="/tabs/grupos"
							routerDirection="forward"
						>
							<IonIcon icon={peopleOutline} slot="start" />
							<IonLabel>
								<h2>Grupos</h2>
								<p>Administrar grupos de publicadores</p>
							</IonLabel>
						</IonItem>
						<IonItem
							button
							detail={false}
							routerLink="/tabs/publicadores"
							routerDirection="forward"
						>
							<IonIcon icon={personOutline} slot="start" />
							<IonLabel>
								<h2>Publicadores</h2>
								<p>Gestionar información de publicadores</p>
							</IonLabel>
						</IonItem>
						<IonItem
							button
							detail={false}
							routerLink="/tabs/usuarios"
							routerDirection="forward"
						>
							<IonIcon icon={peopleCircleOutline} slot="start" />
							<IonLabel>
								<h2>Usuarios</h2>
								<p>Gestionar usuarios</p>
							</IonLabel>
						</IonItem>
						<IonItem
							button
							detail={false}
							routerLink="/tabs/registros"
							routerDirection="forward"
						>
							<IonIcon icon={documentTextOutline} slot="start" />
							<IonLabel>
								<h2>Registros</h2>
								<p>Ver y editar registros de servicio</p>
							</IonLabel>
						</IonItem>
						<IonItem
							button
							detail={false}
							routerLink="/tabs/addinfopubl"
							routerDirection="forward"
						>
							<IonIcon icon={documentTextOutline} slot="start" />
							<IonLabel>
								<h2>Información Adicional</h2>
								<p>Información adicional de publicadores</p>
							</IonLabel>
						</IonItem>
						<IonItem
							button
							detail={false}
							routerLink="/tabs/asistencias"
							routerDirection="forward"
						>
							<IonIcon icon={documentTextOutline} slot="start" />
							<IonLabel>
								<h2>Asistencias</h2>
								<p>Gestionar asistencias</p>
							</IonLabel>
						</IonItem>
					</IonCardContent>
				</IonCard>
			</IonContent>
		</IonPage>
	)
}

export default Settings
