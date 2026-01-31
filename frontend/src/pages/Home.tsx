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
	IonIcon,
	IonText
} from '@ionic/react'
import { useHistory } from 'react-router-dom'
import {
	peopleOutline,
	calendarOutline,
	documentTextOutline,
	personOutline,
	settingsOutline
} from 'ionicons/icons'
import { useAuth } from '../hooks/useAuth'

const Home: React.FC = () => {
	const history = useHistory()
	const { user } = useAuth()

	return (
		<IonPage className="home-page">
			<IonHeader className="home-header">
				<IonToolbar>
					<IonTitle>TJPubls</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen className="home-content">
				{user?.userName && (
					<IonText className="ion-padding">
						<p>Hola, {user.userName}</p>
					</IonText>
				)}
				<IonGrid className="home-grid">
					<IonRow className="home-row">
						<IonCol size="6" className="home-col">
							<IonCard button onClick={() => history.push('/tabs/grupos')} className="home-card">
								<IonCardHeader>
									<IonIcon icon={peopleOutline} className="home-card-icon" />
									<IonCardTitle className="home-card-title">Grupos</IonCardTitle>
								</IonCardHeader>
							</IonCard>
						</IonCol>
						<IonCol size="6" className="home-col">
							<IonCard button onClick={() => history.push('/tabs/publicadores')} className="home-card">
								<IonCardHeader>
									<IonIcon icon={personOutline} className="home-card-icon" />
									<IonCardTitle className="home-card-title">Publicadores</IonCardTitle>
								</IonCardHeader>
							</IonCard>
						</IonCol>
					</IonRow>
					<IonRow className="home-row">
						<IonCol size="6" className="home-col">
							<IonCard button onClick={() => history.push('/tabs/asistencias')} className="home-card">
								<IonCardHeader>
									<IonIcon icon={calendarOutline} className="home-card-icon" />
									<IonCardTitle className="home-card-title">Asistencias</IonCardTitle>
								</IonCardHeader>
							</IonCard>
						</IonCol>
						<IonCol size="6" className="home-col">
							<IonCard button onClick={() => history.push('/tabs/registros')} className="home-card">
								<IonCardHeader>
									<IonIcon icon={documentTextOutline} className="home-card-icon" />
									<IonCardTitle className="home-card-title">Registros</IonCardTitle>
								</IonCardHeader>
							</IonCard>
						</IonCol>
					</IonRow>
					<IonRow className="home-row">
						<IonCol size="6" className="home-col">
							<IonCard button onClick={() => history.push('/tabs/addinfopubl')} className="home-card">
								<IonCardHeader>
									<IonIcon icon={documentTextOutline} className="home-card-icon" />
									<IonCardTitle className="home-card-title">Info Publicador</IonCardTitle>
								</IonCardHeader>
							</IonCard>
						</IonCol>
						<IonCol size="6" className="home-col">
							<IonCard button onClick={() => history.push('/tabs/publs')} className="home-card">
								<IonCardHeader>
									<IonIcon icon={peopleOutline} className="home-card-icon" />
									<IonCardTitle className="home-card-title">Gestión Publs</IonCardTitle>
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
