import {
	IonContent,
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonItem,
	IonLabel,
	IonIcon,
} from '@ionic/react'
import { useHistory } from 'react-router-dom'
import { peopleOutline, personOutline, documentTextOutline } from 'ionicons/icons'

const Publs: React.FC = () => {
	const history = useHistory()

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Publicadores</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen className="ion-padding">
				<IonCard>
					<IonCardHeader>
						<IonCardTitle>Gestión de Publicadores</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						<IonItem button onClick={() => history.push('/tabs/grupos')}>
							<IonIcon icon={peopleOutline} slot="start" />
							<IonLabel>
								<h2>Grupos</h2>
								<p>Administrar grupos de publicadores</p>
							</IonLabel>
						</IonItem>
						<IonItem button onClick={() => history.push('/tabs/publicadores')}>
							<IonIcon icon={personOutline} slot="start" />
							<IonLabel>
								<h2>Publicadores</h2>
								<p>Gestionar información de publicadores</p>
							</IonLabel>
						</IonItem>
						<IonItem button onClick={() => history.push('/tabs/registros')}>
							<IonIcon icon={documentTextOutline} slot="start" />
							<IonLabel>
								<h2>Registros</h2>
								<p>Ver y editar registros de servicio</p>
							</IonLabel>
						</IonItem>
						<IonItem button onClick={() => history.push('/tabs/addinfopubl')}>
							<IonIcon icon={documentTextOutline} slot="start" />
							<IonLabel>
								<h2>Información Adicional</h2>
								<p>Información adicional de publicadores</p>
							</IonLabel>
						</IonItem>
						<IonItem button onClick={() => history.push('/tabs/asistencias')}>
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

export default Publs
