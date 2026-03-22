import {
	IonContent,
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButton,
	IonIcon,
	IonFab,
	IonFabButton,
	IonModal,
	IonInput,
	IonSpinner,
	IonToast,
	IonButtons,
} from '@ionic/react'
import { useState, useEffect } from 'react'
import { add, refreshOutline, arrowBackOutline } from 'ionicons/icons'
import { apiService } from '../services/api'
import { useLoadSequence } from '../hooks/useLoadSequence'
import { Grupo } from '../types'

const errMsg = (e: unknown): string => {
	const err = e as {
		response?: { data?: { error?: { message?: string } } }
		message?: string
	}
	return err?.response?.data?.error?.message || err?.message || 'Error'
}

interface GruposProps {
	embedded?: boolean
}

const Grupos: React.FC<GruposProps> = ({ embedded = false }) => {
	const [grupos, setGrupos] = useState<Grupo[]>([])
	const [loading, setLoading] = useState(true)
	const [showModal, setShowModal] = useState(false)
	const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null)
	const [nombre, setNombre] = useState('')
	const [saving, setSaving] = useState(false)
	const [toast, setToast] = useState<{
		show: boolean
		message: string
		color: 'success' | 'danger'
	}>({ show: false, message: '', color: 'success' })

	const loadSeq = useLoadSequence()

	const loadGrupos = async (opts?: { silent?: boolean }) => {
		const silent = Boolean(opts?.silent)
		const seq = loadSeq.next()
		if (!silent) setLoading(true)
		try {
			const data = await apiService.get<Grupo[]>('/grupo')
			if (!loadSeq.isCurrent(seq)) return
			const list = Array.isArray(data) ? data : []
			setGrupos(
				list.sort((a, b) =>
					String(a.nombre || '').localeCompare(
						String(b.nombre || ''),
						'es',
					),
				),
			)
		} catch (e: unknown) {
			if (loadSeq.isCurrent(seq)) {
				setToast({
					show: true,
					message: errMsg(e),
					color: 'danger',
				})
			}
		} finally {
			if (!silent && loadSeq.isCurrent(seq)) setLoading(false)
		}
	}

	useEffect(() => {
		void loadGrupos()
	}, [])

	const closeModal = () => {
		setShowModal(false)
		setEditingGrupo(null)
		setNombre('')
	}

	const handleSave = async () => {
		const n = nombre.trim()
		if (!n) {
			setToast({
				show: true,
				message: 'Indica el nombre del grupo',
				color: 'danger',
			})
			return
		}
		setSaving(true)
		try {
			if (editingGrupo?.id != null) {
				await apiService.put<Grupo>(
					`/grupo/${encodeURIComponent(String(editingGrupo.id))}`,
					{ nombre: n },
				)
				setToast({
					show: true,
					message: 'Grupo actualizado',
					color: 'success',
				})
			} else {
				await apiService.post<Grupo>('/grupo', { nombre: n })
				setToast({
					show: true,
					message: 'Grupo creado',
					color: 'success',
				})
			}
			closeModal()
			await loadGrupos({ silent: true })
		} catch (e: unknown) {
			setToast({
				show: true,
				message: errMsg(e),
				color: 'danger',
			})
		} finally {
			setSaving(false)
		}
	}

	const handleActualizar = (grupo: Grupo) => {
		setEditingGrupo(grupo)
		setNombre(grupo.nombre ?? '')
		setShowModal(true)
	}

	const handleNew = () => {
		setEditingGrupo(null)
		setNombre('')
		setShowModal(true)
	}

	const tituloGrupo = (g: Grupo) =>
		g.nroGrupo != null
			? `Grupo ${g.nroGrupo} – ${g.nombre}`
			: g.nombre

	const listBody = (
		<>
			{loading && (
				<div
					style={{
						textAlign: 'center',
						padding: '2rem',
						marginTop: 20,
					}}
				>
					<IonSpinner name="crescent" />
					<p style={{ color: 'var(--ion-color-medium)' }}>
						Cargando...
					</p>
				</div>
			)}
			{!loading && grupos.length === 0 && (
				<div
					style={{
						textAlign: 'center',
						padding: '2rem',
						paddingBottom:
							'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
						marginTop: 20,
						color: 'var(--ion-color-medium)',
					}}
				>
					<p>No hay grupos registrados.</p>
					<p style={{ marginTop: 8, fontSize: '0.85rem' }}>
						Pulsa + para crear uno.
					</p>
				</div>
			)}
			{!loading && grupos.length > 0 && (
				<div
					style={{
						padding: embedded ? '0 4px' : '12px 16px',
						paddingBottom:
							'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
					}}
				>
					{grupos.map((grupo) => (
						<div
							key={String(grupo.id)}
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 10,
								padding: '12px 16px',
								marginBottom: 8,
								borderRadius: 10,
								background:
									'var(--ion-item-background, #1e1e2e)',
								boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
							}}
						>
							<div
								style={{
									flex: 1,
									minWidth: 0,
								}}
							>
								<p
									style={{
										margin: 0,
										fontWeight: 600,
										fontSize: '0.92rem',
									}}
								>
									{tituloGrupo(grupo)}
								</p>
								{grupo.syncStatus ? (
									<p
										style={{
											margin: '6px 0 0',
											fontSize: '0.72rem',
											opacity: 0.65,
										}}
									>
										{grupo.syncStatus}
									</p>
								) : null}
							</div>
							<button
								type="button"
								aria-label={`Actualizar ${grupo.nombre}`}
								title="Actualizar grupo"
								onClick={(e) => {
									e.preventDefault()
									e.stopPropagation()
									handleActualizar(grupo)
								}}
								style={{
									display: 'flex',
									flexShrink: 0,
									alignItems: 'center',
									justifyContent: 'center',
									width: 44,
									height: 44,
									border: 'none',
									borderRadius: 10,
									background:
										'rgba(29, 104, 223, 0.35)',
									color: 'var(--ion-color-primary, #3880ff)',
									cursor: 'pointer',
								}}
							>
								<IonIcon
									icon={refreshOutline}
									style={{ fontSize: 22 }}
								/>
							</button>
						</div>
					))}
				</div>
			)}
			{!loading && (
				<IonFab vertical="bottom" horizontal="end" slot="fixed">
					<IonFabButton onClick={handleNew} aria-label="Nuevo grupo">
						<IonIcon icon={add} />
					</IonFabButton>
				</IonFab>
			)}
		</>
	)

	const formModal = (
		<IonModal
			key={showModal ? 'open' : 'closed'}
			isOpen={showModal}
			onDidDismiss={closeModal}
			backdropDismiss
			className="grupos-form-modal"
		>
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
								type="button"
								onClick={() => closeModal()}
								style={{ color: '#ffffff' }}
								aria-label="Cerrar"
							>
								<IonIcon icon={arrowBackOutline} slot="icon-only" />
							</IonButton>
						</IonButtons>
						<IonTitle style={{ color: '#ffffff' }}>
							{editingGrupo ? 'Actualizar grupo' : 'Nuevo grupo'}
						</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding">
					<IonInput
						label="Nombre"
						labelPlacement="stacked"
						fill="outline"
						value={nombre}
						onIonInput={(e) =>
							setNombre(String(e.detail.value ?? ''))
						}
						placeholder="Nombre del grupo"
					/>
					<IonButton
						type="button"
						expand="block"
						style={{ marginTop: 20 }}
						onClick={() => void handleSave()}
						disabled={saving}
					>
						{saving ? (
							<IonSpinner name="crescent" />
						) : editingGrupo ? (
							'Actualizar'
						) : (
							'Crear grupo'
						)}
					</IonButton>
				</IonContent>
			</IonPage>
		</IonModal>
	)

	const overlays = (
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
	)

	if (embedded) {
		return (
			<>
				{listBody}
				{formModal}
				{overlays}
			</>
		)
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
						Grupos
					</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent fullscreen>
				{listBody}
			</IonContent>
			{formModal}
			{overlays}
		</IonPage>
	)
}

export default Grupos
