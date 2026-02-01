import {
	IonButton, IonButtons, IonCard,
	IonCardContent, IonCardHeader, IonCardSubtitle,
	IonCheckbox, IonCol, IonContent, IonFab, IonFabButton, IonGrid,
	IonHeader, IonIcon, IonItem, IonPage, IonRow, IonToolbar
} from '@ionic/react';
import { useHistory } from 'react-router-dom'
import { addOutline } from 'ionicons/icons'
import { useAuth } from '../hooks/useAuth'
import styles from './Home.module.scss'

// Datos mock para grupos (paleta referencia: verde #63e263, azul #3dc2ff)
const grupos = [
	{
		id: 1,
		name: 'Grupo 1',
		color: '#63e263',
		capitan: 'Hernan Medrano',
		auxiliar: 'Juan Perez',
		cantidad: 10,
		route: '/tabs/grupos'
	},
	{
		id: 2,
		name: 'Grupo 2',
		color: '#3dc2ff',
		capitan: 'Hernan Medrano',
		auxiliar: 'Juan Perez',
		cantidad: 11,
		route: '/tabs/publicadores'
	},
	{
		id: 3,
		name: 'Grupo 3',
		color: '#77ccff',
		capitan: 'Hernan Medrano',
		auxiliar: 'Juan Perez',
		cantidad: 12,
		route: '/tabs/asistencias'
	},
	{
		id: 4,
		name: 'Grupo 4',
		color: '#63e263',
		capitan: 'Hernan Medrano',
		auxiliar: 'Juan Perez',
		cantidad: 13,
		route: '/tabs/registros'
	},
	{
		id: 5,
		name: 'Grupo 5',
		color: '#63e263',
		capitan: 'Hernan Medrano',
		auxiliar: 'Juan Perez',
		cantidad: 14,
		route: '/tabs/registros'
	}
]

// Datos mock para información reciente (paleta: verde #63e263, azul #3dc2ff, magenta #ff00ff, naranja #ff8c00)
const informacionReciente = [
	{
		id: 1,
		note: 'Inf congr.',
		fecha: '12/06/2024',
		color: '#63e263',
		numPubs: 67,
		numPrec: 10,
		complete: false

	},
	{
		id: 2,
		note: 'asistencia',
		fecha: '12/06/2024',
		color: '#3dc2ff',
		numPubs: 0,
		numPrec: 0,
		complete: false
	},
	{
		id: 3,
		note: 'Promedios mensuales',
		fecha: '12/06/2024',
		color: '#ff00ff',
		numPubs: 0,
		numPrec: 0,
		complete: false
	},
	{
		id: 4,
		note: 'Pendientes por informes',
		fecha: '12/06/2024',
		color: '#ff8c00',
		numPubs: 2,
		numPrec: 1,
		complete: false
	},
	{
		id: 5,
		note: 'Pendientes por informes',
		fecha: '12/06/2024',
		color: '#ff8c00',
		numPubs: 2,
		numPrec: 1,
		complete: false
	}
]

const Home: React.FC = () => {
	const history = useHistory()
	const { user, logout } = useAuth()

	const handleLogout = () => {
		logout()
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar className={styles.toolbarBackground}>
					<IonButtons slot="start" >
						<h4>Inicio</h4>
					</IonButtons>

					<IonButtons slot="end">
						<IonButton onClick={handleLogout}>
							Cerrar Sesión
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>

				<IonGrid>
					<IonRow className="ion-justify-content-center">
						<IonCol size="12" className="ion-text-center ion-padding-top">
							<h4>Congregación Alto Bosque</h4>
							<IonCardSubtitle className={ styles.heading }>
								20149
							</IonCardSubtitle>
							<IonCardSubtitle className={ styles.heading }>
								Hernan Medrano
							</IonCardSubtitle>
						</IonCol>
					</IonRow>

					<IonRow>
						<IonCol size="12" className="ion-padding-start ion-padding-top ion-padding-bottom">
							<IonCardSubtitle className={ styles.heading }>
								Grupos
							</IonCardSubtitle>
						</IonCol>
					</IonRow>
				</IonGrid>

				<div id="slider" className={ `${styles.categorySlider} ion-padding-bottom` } role="region" aria-label="Grupos">
					{ grupos.map((category, index) => (
						<div key={ `categorySlide_${index}` } className={ styles.slideItem }>
							<IonCol className="ion-text-left">
								<IonCard>
									<IonCardHeader className="ion-no-padding">
										<div className={ styles.slideCount }>
											<p className={ styles.slideCountText }><span className={ styles.highlightColor }>Capitán:</span> { category.capitan }</p>
											<p className={ styles.noPadding }><span className={ styles.highlightColor }>Auxiliar:</span> { category.auxiliar }</p>
											<p className={ styles.noPadding }><span className={ styles.highlightColor }>Cantidad:</span> { category.cantidad }</p>
										</div>
										<div className={ styles.slideHeader }>
											<h6>{ category.name }</h6>
										</div>
									</IonCardHeader>
									<IonCardContent>
										<div className={ styles.categoryColor } style={{ borderBottom: `2px solid ${category.color}` }} />
									</IonCardContent>
								</IonCard>
							</IonCol>
						</div>
					))}
				</div>

				<IonGrid className={ styles.bottomContainer }>
					<IonRow>
						<IonCol size="12" className="ion-padding-start">
							<IonCardSubtitle className={ styles.heading }>
								Información Reciente
							</IonCardSubtitle>
						</IonCol>
					</IonRow>
					
					<div className={ styles.recentNotes }>
						{ informacionReciente.map((note) => (
							<IonRow key={ `note_${note.id}` } id={ `noteRow_${note.id}` }>
								<IonCol size="12">
									<IonItem>
										<IonCheckbox
											className={ styles.noteCheckbox }
											checked={ note.complete }
											style={{
												['--border-color' as string]: note.color,
												['--checkbox-background' as string]: 'transparent',
												['--checkbox-background-checked' as string]: note.color,
												['--border-color-checked' as string]: note.color,
												['--checkmark-color' as string]: '#ffffff'
											}}
											slot="start"
										/>
										<div className={ `${styles.noteContent} ion-padding-bottom` }>
											<h4 style={ note.complete ? { textDecoration: 'line-through', opacity: 0.6, textAlign: 'left', color: '#3dc2ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } : { textAlign: 'left', color: '#3dc2ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }>
												<span>{ note.note }</span>
												<span style={{ fontSize: '0.75rem' }}>{ note.fecha }</span>
											</h4>
											<p className={ styles.slideCountText } style={{ color: note.color, paddingLeft: '1rem' }}><span style={{ color: note.color }}>NroP:</span> { note.numPubs }</p>
											<p className={ styles.slideCountText } style={{ color: note.color, paddingLeft: '1rem' }}><span style={{ color: note.color }}>NroPrc:</span> { note.numPrec }</p>
										</div>
									</IonItem>
								</IonCol>
							</IonRow>
						))}
					</div>
				</IonGrid>

				<IonFab vertical="bottom" horizontal="end" slot="fixed" className="ion-padding">
					<IonFabButton routerLink="/add">
						<IonIcon icon={ addOutline } />
					</IonFabButton>
				</IonFab>
			</IonContent>
		</IonPage>
	);
};

export default Home;

