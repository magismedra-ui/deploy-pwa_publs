import {
	IonContent,
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonItem,
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
import { useState, FormEvent, useRef, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useAuthContext } from '../contexts/AuthContext'

const Login: React.FC = () => {
	const emailRef = useRef<HTMLIonInputElement>(null)
	const passwordRef = useRef<HTMLIonInputElement>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const { login, isAuthenticated } = useAuthContext()
	const history = useHistory()

	// Navegar cuando el usuario se autentique (solo si no estamos en la página de login)
	useEffect(() => {
		if (isAuthenticated && !loading && window.location.pathname === '/login') {
			history.push('/tabs/home')
		}
	}, [isAuthenticated, loading, history])

	// Establecer valor inicial después del montaje para evitar problemas de observación
	useEffect(() => {
		if (emailRef.current) {
			const emailInput = emailRef.current.getElementsByTagName('input')[0] as HTMLInputElement
			if (emailInput && !emailInput.value) {
				emailInput.value = 'magismedra@gmail.com'
			}
		}
	}, [])

	const handleLogin = async (e: FormEvent) => {
		e.preventDefault()
		setLoading(true)
		setError(null)

		// Leer valores directamente del elemento nativo del input
		const emailElement = emailRef.current?.getElementsByTagName('input')[0] as HTMLInputElement
		const passwordElement = passwordRef.current?.getElementsByTagName('input')[0] as HTMLInputElement
		
		const email = emailElement?.value || ''
		const password = passwordElement?.value || ''

		if (!email || !password) {
			setError('Por favor completa todos los campos')
			setLoading(false)
			return
		}

		try {
			await login(email, password)
			// La navegación se manejará automáticamente por el useEffect cuando isAuthenticated cambie
		} catch (err: any) {
			setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<IonPage className="login-page">
			<IonContent fullscreen className="ion-padding login-content">
				<div className="login-wrapper">
					<div className="login-container">
					<IonCard className="login-card">
						<IonCardHeader>
							<IonCardTitle className="login-card-title">Iniciar Sesión</IonCardTitle>
						</IonCardHeader>
						<IonCardContent>
							<form onSubmit={handleLogin} className="login-form">
								<IonItem className="login-item">
									<IonInput
										ref={emailRef}
										type="email"
										label="Email"
										labelPlacement="stacked"
										required
										autocomplete="email"
										className="login-input"
									/>
								</IonItem>
								<IonItem className="login-item">
									<IonInput
										ref={passwordRef}
										type="password"
										label="Contraseña"
										labelPlacement="stacked"
										required
										autocomplete="current-password"
										className="login-input"
									/>
								</IonItem>
								<IonButton
									expand="block"
									type="submit"
									color="primary"
									disabled={loading}
									className="login-button"
								>
									{loading ? 'Iniciando...' : 'Entrar'}
								</IonButton>
							</form>
						</IonCardContent>
					</IonCard>
					</div>
				</div>
				<IonLoading isOpen={loading} message="Iniciando sesión..." />
				<IonAlert
					isOpen={Boolean(error)}
					onDidDismiss={() => setError(null)}
					header="Error de Autenticación"
					message={error || ''}
					buttons={[{ text: 'OK', handler: () => setError(null) }]}
				/>
			</IonContent>
		</IonPage>
	)
}

export default Login
