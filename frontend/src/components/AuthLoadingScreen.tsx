import { IonSpinner } from '@ionic/react'

/**
 * Pantalla de carga sin IonLoading (el overlay de Ionic a veces no se retira
 * al desmontar con isOpen=true y deja el modal "Cargando..." fijo).
 */
export function AuthLoadingScreen() {
	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 20000,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 12,
				background: 'var(--ion-background-color, #fff)',
			}}
		>
			<IonSpinner name="crescent" />
			<p
				style={{
					color: 'var(--ion-color-medium)',
					margin: 0,
					fontSize: '0.9rem',
				}}
			>
				Cargando...
			</p>
		</div>
	)
}
