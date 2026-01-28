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
	IonIcon
} from '@ionic/react'
import { documentTextOutline, statsChartOutline, calendarOutline } from 'ionicons/icons'

const Reports: React.FC = () => {
	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Reportes</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen className="ion-padding">
				<IonCard>
					<IonCardHeader>
						<IonCardTitle>Reportes Disponibles</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						<IonItem button>
							<IonIcon icon={statsChartOutline} slot="start" />
							<IonLabel>
								<h2>Estadísticas Generales</h2>
								<p>Vista general de métricas y estadísticas</p>
							</IonLabel>
						</IonItem>
						<IonItem button>
							<IonIcon icon={calendarOutline} slot="start" />
							<IonLabel>
								<h2>Reportes de Asistencia</h2>
								<p>Análisis de asistencia por período</p>
							</IonLabel>
						</IonItem>
						<IonItem button>
							<IonIcon icon={documentTextOutline} slot="start" />
							<IonLabel>
								<h2>Reportes de Registros</h2>
								<p>Informes de servicio y actividad</p>
							</IonLabel>
						</IonItem>
					</IonCardContent>
				</IonCard>
			</IonContent>
		</IonPage>
	)
}

export default Reports
