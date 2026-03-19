import {
	IonContent, IonPage, IonHeader, IonToolbar, IonTitle,
	IonButton, IonItem, IonLabel, IonInput, IonLoading, IonAlert,
	IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon
} from '@ionic/react'
import { useState } from 'react'
import { useHistory } from 'react-router-dom'
import { peopleOutline, personOutline, documentTextOutline } from 'ionicons/icons'
import { authService } from '../services/auth.service'
import { syncService } from '../services/sync.service'
import { useAuth } from '../hooks/useAuth'
import { ChangePasswordRequest } from '../types'

const Settings: React.FC = () => {
	const { user, logout } = useAuth()
	const history = useHistory()
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	const handleChangePassword = async () => {
		if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
		if (newPassword.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
		setLoading(true); setError(null); setSuccess(null)
		try {
			const data: ChangePasswordRequest = { currentPassword, newPassword }
			await authService.changePassword(data)
			setSuccess('Contraseña actualizada correctamente')
			setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
		} catch (err: any) {
			setError(err.message || 'Error al cambiar contraseña')
		} finally { setLoading(false) }
	}

	const handleSync = async () => {
		setLoading(true)
		try {
			await syncService.sync()
			setSuccess('Sincronización completada')
		} catch (err: any) {
			setError(err.message || 'Error en la sincronización')
		} finally { setLoading(false) }
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Configuración</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen className="ion-padding">

				{/* Gestión de Publicadores */}
				<IonCard>
					<IonCardHeader>
						<IonCardTitle>Gestión de Publicadores</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						<IonItem button onClick={() => history.push('/tabs/grupos')}>
							<IonIcon icon={peopleOutline} slot="start" />
							<IonLabel><h2>Grupos</h2><p>Administrar grupos de publicadores</p></IonLabel>
						</IonItem>
						<IonItem button onClick={() => history.push('/tabs/publicadores')}>
							<IonIcon icon={personOutline} slot="start" />
							<IonLabel><h2>Publicadores</h2><p>Gestionar información de publicadores</p></IonLabel>
						</IonItem>
						<IonItem button onClick={() => history.push('/tabs/registros')}>
							<IonIcon icon={documentTextOutline} slot="start" />
							<IonLabel><h2>Registros</h2><p>Ver y editar registros de servicio</p></IonLabel>
						</IonItem>
						<IonItem button onClick={() => history.push('/tabs/addinfopubl')}>
							<IonIcon icon={documentTextOutline} slot="start" />
							<IonLabel><h2>Información Adicional</h2><p>Información adicional de publicadores</p></IonLabel>
						</IonItem>
						<IonItem button onClick={() => history.push('/tabs/asistencias')}>
							<IonIcon icon={documentTextOutline} slot="start" />
							<IonLabel><h2>Asistencias</h2><p>Gestionar asistencias</p></IonLabel>
						</IonItem>
					</IonCardContent>
				</IonCard>

				{/* Usuario */}
				<IonCard>
					<IonCardHeader><IonCardTitle>Usuario</IonCardTitle></IonCardHeader>
					<IonCardContent>
						<IonItem><IonLabel><h2>Nombre</h2><p>{user?.userName ?? '—'}</p></IonLabel></IonItem>
						<IonItem><IonLabel><h2>Rol</h2><p>{user?.roleName ?? '—'}</p></IonLabel></IonItem>
						<IonItem><IonLabel><h2>Email</h2><p>{user?.email}</p></IonLabel></IonItem>
					</IonCardContent>
				</IonCard>

				{/* Cambiar Contraseña */}
				<IonCard>
					<IonCardHeader><IonCardTitle>Cambiar Contraseña</IonCardTitle></IonCardHeader>
					<IonCardContent>
						<IonItem>
							<IonInput type="password" label="Contraseña Actual" labelPlacement="stacked"
								value={currentPassword} onIonInput={(e) => setCurrentPassword(e.detail.value as string)} />
						</IonItem>
						<IonItem>
							<IonInput type="password" label="Nueva Contraseña" labelPlacement="stacked"
								value={newPassword} onIonInput={(e) => setNewPassword(e.detail.value as string)} />
						</IonItem>
						<IonItem>
							<IonInput type="password" label="Confirmar Contraseña" labelPlacement="stacked"
								value={confirmPassword} onIonInput={(e) => setConfirmPassword(e.detail.value as string)} />
						</IonItem>
						<IonButton expand="block" onClick={handleChangePassword} style={{ marginTop: '20px' }}>
							Cambiar Contraseña
						</IonButton>
					</IonCardContent>
				</IonCard>

				{/* Sincronización */}
				<IonCard>
					<IonCardHeader><IonCardTitle>Sincronización</IonCardTitle></IonCardHeader>
					<IonCardContent>
						<IonButton expand="block" onClick={handleSync}>Sincronizar Ahora</IonButton>
					</IonCardContent>
				</IonCard>

				{/* Sesión */}
				<IonCard>
					<IonCardHeader><IonCardTitle>Sesión</IonCardTitle></IonCardHeader>
					<IonCardContent>
						<IonButton expand="block" color="danger" onClick={logout}>Cerrar Sesión</IonButton>
					</IonCardContent>
				</IonCard>

				<IonLoading isOpen={loading} message="Procesando..." />
				<IonAlert isOpen={Boolean(error)} onDidDismiss={() => setError(null)} header="Error" message={error || ''} buttons={['OK']} />
				<IonAlert isOpen={Boolean(success)} onDidDismiss={() => setSuccess(null)} header="Éxito" message={success || ''} buttons={['OK']} />
			</IonContent>
		</IonPage>
	)
}

export default Settings
