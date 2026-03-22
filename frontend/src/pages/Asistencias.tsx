import {
	IonContent,
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButton,
	IonIcon,
	IonButtons,
	IonSpinner,
	IonLoading,
	IonToast,
	IonAlert,
} from '@ionic/react'
import React, { useState, useEffect } from 'react'
import { arrowBackOutline } from 'ionicons/icons'
import { apiService } from '../services/api'
import { Asistencia } from '../types'

const Asistencias: React.FC = () => {
	const [asistencias, setAsistencias] = useState<Asistencia[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [isDeleting, setIsDeleting] = useState(false)

	const [toast, setToast] = useState<{
		show: boolean
		message: string
		color: 'success' | 'danger'
	}>({ show: false, message: '', color: 'success' })

	const deleteErrorMessage = (e: unknown): string => {
		const err = e as {
			response?: { data?: { error?: { message?: string } } }
			message?: string
		}
		return (
			err?.response?.data?.error?.message
			|| err?.message
			|| 'Error al eliminar'
		)
	}

	async function loadAsistencias(opts?: { silent?: boolean }) {
		const silent = Boolean(opts?.silent)
		if (!silent) setLoading(true)
		try {
			const data = await apiService.get<Asistencia[]>('/asistencia')
			setAsistencias(Array.isArray(data) ? data.sort((a, b) =>
				new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
			) : [])
		} catch (e: any) {
			setError(e.message || 'Error al cargar asistencias')
		} finally {
			if (!silent) setLoading(false)
		}
	}

	useEffect(() => {
		void loadAsistencias()
	}, [])

	const handleDelete = async (id: string) => {
		setIsDeleting(true)
		setError(null)
		try {
			await apiService.delete(`/asistencia/${encodeURIComponent(id)}`)
			setAsistencias((prev) =>
				prev.filter((a) => String(a.id) !== String(id)),
			)
			await loadAsistencias({ silent: true })
			setToast({
				show: true,
				message: 'Asistencia eliminada correctamente',
				color: 'success',
			})
		} catch (e: unknown) {
			console.error('[Asistencias] handleDelete error:', e)
			setToast({
				show: true,
				message: deleteErrorMessage(e),
				color: 'danger',
			})
		} finally {
			setIsDeleting(false)
		}
	}

	const requestDelete = (id: string) => {
		const ok = window.confirm(
			'¿Seguro que deseas eliminar esta asistencia?',
		)
		if (!ok) return
		void handleDelete(id)
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar
					style={
						{
							'--background': '#000000',
							'--color': '#ffffff',
						} as React.CSSProperties
					}
				>
					<IonButtons slot="start">
						<IonButton
							routerLink="/tabs/settings"
							routerDirection="back"
							style={{ color: '#ffffff' }}
							aria-label="Volver a configuración"
						>
							<IonIcon icon={arrowBackOutline} slot="icon-only" />
						</IonButton>
					</IonButtons>
					<IonTitle
						style={{
							color: '#ffffff',
							textAlign: 'center',
						}}
					>
						Asistencias
					</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent fullscreen>
				{loading && (
					<div style={{ textAlign: 'center', padding: '2rem', marginTop: 20 }}>
						<IonSpinner name="crescent" />
					</div>
				)}
				{!loading && asistencias.length === 0 && (
					<div
						style={{
							textAlign: 'center',
							padding: '2rem',
							marginTop: 20,
							color: 'var(--ion-color-medium)',
						}}
					>
						<p>No hay asistencias registradas.</p>
					</div>
				)}
				{!loading && asistencias.length > 0 && (
					<div style={{ padding: '0 12px', marginTop: 20 }}>
						{asistencias.map((a) => (
							<div
								key={String(a.id)}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									gap: 12,
									padding: '12px 16px',
									marginBottom: 8,
									borderRadius: 10,
									background: 'var(--ion-item-background, #1e1e2e)',
									boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
								}}
							>
								<div style={{ flex: 1, minWidth: 0 }}>
									<p style={{ margin: 0, fontWeight: 600, fontSize: '0.92rem' }}>
										{new Date(a.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
									</p>
									<p style={{ margin: '4px 0 0', fontSize: '0.78rem', opacity: 0.7 }}>
										Presencial: {a.presencial ?? 0} · Zoom: {a.zoom ?? 0}
									</p>
								</div>
								<IonButton
									size="small"
									color="danger"
									fill="solid"
									style={{ flexShrink: 0 }}
									onClick={() => requestDelete(String(a.id))}
								>
									Eliminar
								</IonButton>
							</div>
						))}
					</div>
				)}
			</IonContent>

			<IonLoading isOpen={isDeleting} message="Eliminando..." />
			<IonToast
				isOpen={toast.show}
				message={toast.message}
				color={toast.color}
				duration={2500}
				position="bottom"
				onDidDismiss={() =>
					setToast((t) => ({ ...t, show: false }))
				}
			/>
			<IonAlert
				isOpen={Boolean(error)}
				onDidDismiss={() => setError(null)}
				header="Error"
				message={error || ''}
				buttons={[{ text: 'OK', role: 'cancel' }]}
			/>
		</IonPage>
	)
}

export default Asistencias
