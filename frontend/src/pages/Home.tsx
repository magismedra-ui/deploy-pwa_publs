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
	IonGrid,
	IonRow,
	IonCol,
	IonIcon
} from '@ionic/react'
import { useHistory } from 'react-router-dom'
import {
	peopleOutline,
	calendarOutline,
	documentTextOutline,
	personOutline,
	settingsOutline
} from 'ionicons/icons'

const Home: React.FC = () => {
	const history = useHistory()

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>TJPubls</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen className="ion-padding">
				<IonGrid>
					<IonRow>
						<IonCol size="6">
							<IonCard button onClick={() => history.push('/tabs/grupos')}>
								<IonCardHeader>
									<IonIcon icon={peopleOutline} size="large" />
									<IonCardTitle>Grupos</IonCardTitle>
								</IonCardHeader>
							</IonCard>
						</IonCol>
						<IonCol size="6">
							<IonCard button onClick={() => history.push('/tabs/publicadores')}>
								<IonCardHeader>
									<IonIcon icon={personOutline} size="large" />
									<IonCardTitle>Publicadores</IonCardTitle>
								</IonCardHeader>
							</IonCard>
						</IonCol>
					</IonRow>
					<IonRow>
						<IonCol size="6">
							<IonCard button onClick={() => history.push('/tabs/asistencias')}>
								<IonCardHeader>
									<IonIcon icon={calendarOutline} size="large" />
									<IonCardTitle>Asistencias</IonCardTitle>
								</IonCardHeader>
							</IonCard>
						</IonCol>
						<IonCol size="6">
							<IonCard button onClick={() => history.push('/tabs/registros')}>
								<IonCardHeader>
									<IonIcon icon={documentTextOutline} size="large" />
									<IonCardTitle>Registros</IonCardTitle>
								</IonCardHeader>
							</IonCard>
						</IonCol>
					</IonRow>
					<IonRow>
						<IonCol size="6">
							<IonCard button onClick={() => history.push('/tabs/addinfopubl')}>
								<IonCardHeader>
									<IonIcon icon={documentTextOutline} size="large" />
									<IonCardTitle>Info Publicador</IonCardTitle>
								</IonCardHeader>
							</IonCard>
						</IonCol>
						<IonCol size="6">
							<IonCard button onClick={() => history.push('/tabs/publs')}>
								<IonCardHeader>
									<IonIcon icon={peopleOutline} size="large" />
									<IonCardTitle>Gestión Publs</IonCardTitle>
								</IonCardHeader>
							</IonCard>
						</IonCol>
					</IonRow>
				</IonGrid>
			</IonContent>
		</IonPage>
	)
}

export default Home
