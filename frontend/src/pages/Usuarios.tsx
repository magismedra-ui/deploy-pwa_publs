import type { FC } from 'react'
import {
	IonContent,
	IonHeader,
	IonPage,
	IonTitle,
	IonToolbar,
} from '@ionic/react'

/**
 * Pantalla destino de Configuración → Usuarios.
 * Contenido de gestión pendiente de implementar.
 */
const Usuarios: FC = () => {
	return (
		<IonPage>
			<IonHeader>
				<IonToolbar
					style={{ '--background': '#000000', '--color': '#ffffff' } as any}
				>
					<IonTitle style={{ color: '#ffffff' }}>Usuarios</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen className="ion-padding">
				<p style={{ color: 'var(--ion-color-medium, #666)' }}>
					Gestión de usuarios (en desarrollo).
				</p>
			</IonContent>
		</IonPage>
	)
}

export default Usuarios
