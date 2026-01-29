import {
	IonContent,
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButton,
	IonItem,
	IonLabel,
	IonInput,
	IonLoading,
	IonAlert,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle
} from '@ionic/react'
import { useState } from 'react'
import { authService } from '../services/auth.service'
import { syncService } from '../services/sync.service'
import { useAuth } from '../hooks/useAuth'
import { ChangePasswordRequest } from '../types'

const Settings: React.FC = () => {
	const { user, logout } = useAuth()
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	const handleChangePassword = async () => {
		if (newPassword !== confirmPassword) {
			setError('Las contraseñas no coinciden')
			return
		}

		if (newPassword.length < 6) {
			setError('La contraseña debe tener al menos 6 caracteres')
			return
		}

		setLoading(true)
		setError(null)
		setSuccess(null)

		try {
			const data: ChangePasswordRequest = {
				currentPassword,
				newPassword
			}
			await authService.changePassword(data)
			setSuccess('Contraseña actualizada correctamente')
			setCurrentPassword('')
			setNewPassword('')
			setConfirmPassword('')
		} catch (err: any) {
			setError(err.message || 'Error al cambiar contraseña')
		} finally {
			setLoading(false)
		}
	}

	const handleSync = async () => {
		setLoading(true)
		try {
			await syncService.sync()
			setSuccess('Sincronización completada')
		} catch (err: any) {
			setError(err.message || 'Error en la sincronización')
		} finally {
			setLoading(false)
		}
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Configuración</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				<IonCard>
					<IonCardHeader>
						<IonCardTitle>Usuario</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						<IonItem>
							<IonLabel>
								<h2>Email</h2>
								<p>{user?.email}</p>
							</IonLabel>
						</IonItem>
					</IonCardContent>
				</IonCard>

				<IonCard>
					<IonCardHeader>
						<IonCardTitle>Cambiar Contraseña</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						<IonItem>
							<IonInput
								type="password"
								label="Contraseña Actual"
								labelPlacement="stacked"
								value={currentPassword}
								onIonInput={(e) => setCurrentPassword(e.detail.value as string)}
							/>
						</IonItem>
						<IonItem>
							<IonInput
								type="password"
								label="Nueva Contraseña"
								labelPlacement="stacked"
								value={newPassword}
								onIonInput={(e) => setNewPassword(e.detail.value as string)}
							/>
						</IonItem>
						<IonItem>
							<IonInput
								type="password"
								label="Confirmar Contraseña"
								labelPlacement="stacked"
								value={confirmPassword}
								onIonInput={(e) => setConfirmPassword(e.detail.value as string)}
							/>
						</IonItem>
						<IonButton expand="block" onClick={handleChangePassword} style={{ marginTop: '20px' }}>
							Cambiar Contraseña
						</IonButton>
					</IonCardContent>
				</IonCard>

				<IonCard>
					<IonCardHeader>
						<IonCardTitle>Sincronización</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						<IonButton expand="block" onClick={handleSync}>
							Sincronizar Ahora
						</IonButton>
					</IonCardContent>
				</IonCard>

				<IonCard>
					<IonCardHeader>
						<IonCardTitle>Sesión</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						<IonButton expand="block" color="danger" onClick={logout}>
							Cerrar Sesión
						</IonButton>
					</IonCardContent>
				</IonCard>

				<IonLoading isOpen={loading} message="Procesando..." />
				<IonAlert
					isOpen={Boolean(error)}
					onDidDismiss={() => setError(null)}
					header="Error"
					message={error || ''}
					buttons={[{ text: 'OK', handler: () => setError(null) }]}
				/>
				<IonAlert
					isOpen={Boolean(success)}
					onDidDismiss={() => setSuccess(null)}
					header="Éxito"
					message={success || ''}
					buttons={[{ text: 'OK', handler: () => setSuccess(null) }]}
				/>
			</IonContent>
		</IonPage>
	)
}

export default Settings
