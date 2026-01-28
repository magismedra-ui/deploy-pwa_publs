import {
	IonContent,
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonItem,
	IonLabel,
	IonInput,
	IonButton,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardTitle,
	IonLoading,
	IonAlert,
	IonText
} from '@ionic/react'
import { useState, FormEvent } from 'react'
import { useHistory } from 'react-router-dom'
import { useAuthContext } from '../contexts/AuthContext'

const Login: React.FC = () => {
	const [email, setEmail] = useState('magismedra@gmail.com')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const { login } = useAuthContext()
	const history = useHistory()

	const handleLogin = async (e: FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError(null)

		if (!email || !password) {
			setError('Por favor completa todos los campos')
			setLoading(false)
			return
		}

		try {
			await login(email, password)
			history.push('/tabs/home')
		} catch (err: any) {
			setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar color="primary">
					<IonTitle>TJPubls</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen className="ion-padding">
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						minHeight: '100%',
						padding: '20px'
					}}
				>
					<IonCard style={{ width: '100%', maxWidth: '400px' }}>
						<IonCardHeader>
							<IonCardTitle>Iniciar Sesión</IonCardTitle>
						</IonCardHeader>
						<IonCardContent>
							<form onSubmit={handleLogin}>
								<IonItem>
									<IonLabel position="stacked">Email *</IonLabel>
									<IonInput
										type="email"
										value={email}
										onIonInput={(e) => setEmail(e.detail.value!)}
										placeholder="tu@email.com"
										required
										autocomplete="email"
									/>
								</IonItem>
								<IonItem>
									<IonLabel position="stacked">Contraseña *</IonLabel>
									<IonInput
										type="password"
										value={password}
										onIonInput={(e) => setPassword(e.detail.value!)}
										placeholder="Ingresa tu contraseña"
										required
										autocomplete="current-password"
									/>
								</IonItem>
								<IonButton
									expand="block"
									type="submit"
									disabled={loading}
									style={{ marginTop: '20px' }}
								>
									{loading ? 'Iniciando...' : 'Iniciar Sesión'}
								</IonButton>
							</form>
						</IonCardContent>
					</IonCard>
				</div>
				<IonLoading isOpen={loading} message="Iniciando sesión..." />
				<IonAlert
					isOpen={!!error}
					onDidDismiss={() => setError(null)}
					header="Error de Autenticación"
					message={error || ''}
					buttons={['OK']}
				/>
			</IonContent>
		</IonPage>
	)
}

export default Login
