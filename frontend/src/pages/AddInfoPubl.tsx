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
	IonInput,
	IonSpinner,
	IonToast,
	IonButtons,
	IonItem,
	IonSelect,
	IonSelectOption,
	IonLabel,
	IonTextarea,
	IonToggle,
	useIonAlert,
} from '@ionic/react'
import { useState, useEffect, useRef } from 'react'
import { add, refreshOutline, arrowBackOutline, trashOutline } from 'ionicons/icons'
import { apiService } from '../services/api'
import { useLoadSequence } from '../hooks/useLoadSequence'
import { AddInfoPubl, Publicador } from '../types'

const errMsg = (e: unknown): string => {
	const err = e as {
		response?: { data?: { error?: { message?: string } } }
		message?: string
	}
	return err?.response?.data?.error?.message || err?.message || 'Error'
}

/** Respuesta de GET /addinfopubl (join con publicador en backend) */
interface AddInfoRow extends AddInfoPubl {
	publicador_nombre?: string
}

interface AddInfoPublPageProps {
	embedded?: boolean
}

function rowPastoreo(row: AddInfoRow): boolean {
	if (typeof row.pastoreo === 'boolean') return row.pastoreo
	return false
}

function fechaInputValue(f: Date | string | undefined): string {
	if (f == null || f === '') return ''
	try {
		const d = typeof f === 'string' ? new Date(f) : f
		if (Number.isNaN(d.getTime())) return ''
		return d.toISOString().split('T')[0]
	} catch {
		return ''
	}
}

/** Id estable para API (evita filas sin id tras caché / formas raras del JSON). */
function resolveAddInfoRowId(row: AddInfoRow | null | undefined): string {
	if (row == null) return ''
	const r = row as unknown as Record<string, unknown>
	const raw = r.id ?? r.Id ?? r.ID
	if (raw == null) return ''
	const s = String(raw).trim()
	if (s === '' || s === 'undefined' || s === 'null') return ''
	return s
}

const AddInfoPublPage: React.FC<AddInfoPublPageProps> = ({
	embedded = false,
}) => {
	const [items, setItems] = useState<AddInfoRow[]>([])
	const [publicadores, setPublicadores] = useState<Publicador[]>([])
	const [loading, setLoading] = useState(true)
	const [showModal, setShowModal] = useState(false)
	const [editing, setEditing] = useState<AddInfoRow | null>(null)
	const [idpublicador, setIdpublicador] = useState('')
	const [fecha, setFecha] = useState('')
	const [observaciones, setObservaciones] = useState('')
	const [pastoreo, setPastoreo] = useState(false)
	const [saving, setSaving] = useState(false)
	const [toast, setToast] = useState<{
		show: boolean
		message: string
		color: 'success' | 'danger'
	}>({ show: false, message: '', color: 'success' })
	const [deleting, setDeleting] = useState(false)
	const [presentDeleteAlert] = useIonAlert()
	/** Id del registro al abrir “Actualizar”; no depender solo de `editing` al guardar. */
	const persistEditIdRef = useRef<string>('')

	const loadSeq = useLoadSequence()

	const loadData = async (opts?: { silent?: boolean }) => {
		const silent = Boolean(opts?.silent)
		const seq = loadSeq.next()
		if (!silent) setLoading(true)
		try {
			const [infoRes, pubRes] = await Promise.all([
				apiService.get<AddInfoRow[]>('/addinfopubl'),
				apiService.get<Publicador[]>('/publicador'),
			])
			if (!loadSeq.isCurrent(seq)) return
			const rawList = Array.isArray(infoRes) ? infoRes : []
			const list = rawList.map((row) => {
				const rid = resolveAddInfoRowId(row)
				return rid ? { ...row, id: rid } : row
			})
			setItems(list)
			setPublicadores(
				Array.isArray(pubRes)
					? pubRes.sort((a, b) =>
							String(a.nombre || '').localeCompare(
								String(b.nombre || ''),
								'es',
							),
						)
					: [],
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
		void loadData()
	}, [])

	const closeModal = () => {
		persistEditIdRef.current = ''
		setShowModal(false)
		setEditing(null)
		setIdpublicador('')
		setFecha('')
		setObservaciones('')
		setPastoreo(false)
	}

	const handleActualizar = (row: AddInfoRow) => {
		persistEditIdRef.current = resolveAddInfoRowId(row)
		setEditing(row)
		setIdpublicador(String(row.idpublicador ?? ''))
		setFecha(fechaInputValue(row.fecha))
		setObservaciones(String(row.observaciones ?? ''))
		setPastoreo(rowPastoreo(row))
		setShowModal(true)
	}

	const handleNew = () => {
		persistEditIdRef.current = ''
		setEditing(null)
		setIdpublicador('')
		setFecha('')
		setObservaciones('')
		setPastoreo(false)
		setShowModal(true)
	}

	const handleSave = async () => {
		if (!editing) {
			if (!idpublicador.trim()) {
				setToast({
					show: true,
					message: 'Selecciona un publicador',
					color: 'danger',
				})
				return
			}
		}
		setSaving(true)
		try {
			const recordId =
				persistEditIdRef.current ||
				(editing ? resolveAddInfoRowId(editing) : '')
			if (recordId !== '') {
				await apiService.put<AddInfoPubl>(
					`/addinfopubl/${encodeURIComponent(recordId)}`,
					{
						fecha: fecha.trim() || null,
						observaciones: observaciones.trim() || null,
						pastoreo,
					},
				)
				setToast({
					show: true,
					message: 'Información actualizada',
					color: 'success',
				})
			} else {
				await apiService.post<AddInfoPubl>('/addinfopubl', {
					idpublicador: idpublicador.trim(),
					fecha: fecha.trim() || null,
					observaciones: observaciones.trim() || null,
					pastoreo,
				})
				setToast({
					show: true,
					message: 'Información creada',
					color: 'success',
				})
			}
			closeModal()
			await loadData({ silent: true })
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

	const nombrePublicador = (row: AddInfoRow) =>
		row.publicador_nombre?.trim() ||
		publicadores.find((p) => String(p.id) === String(row.idpublicador))
			?.nombre ||
		'Publicador'

	const runDeleteById = (id: string) => {
		const clean = id.trim()
		if (!clean) return
		setDeleting(true)
		void (async () => {
			try {
				await apiService.delete(
					`/addinfopubl/${encodeURIComponent(clean)}`,
				)
				setToast({
					show: true,
					message: 'Registro eliminado',
					color: 'success',
				})
				await loadData({ silent: true })
			} catch (e: unknown) {
				setToast({
					show: true,
					message: errMsg(e),
					color: 'danger',
				})
			} finally {
				setDeleting(false)
			}
		})()
	}

	const openDeleteConfirmation = (row: AddInfoRow) => {
		const id = resolveAddInfoRowId(row)
		if (!id) {
			setToast({
				show: true,
				message:
					'Este registro no tiene id válido. Recarga con conexión.',
				color: 'danger',
			})
			return
		}
		void presentDeleteAlert({
			header: 'Eliminar registro',
			message: `¿Eliminar el registro de ${nombrePublicador(row)}? Esta acción no se puede deshacer.`,
			buttons: [
				{ text: 'Cancelar', role: 'cancel' },
				{
					text: 'Eliminar',
					role: 'destructive',
					handler: () => {
						queueMicrotask(() => runDeleteById(id))
					},
				},
			],
		})
	}

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
			{!loading && items.length === 0 && (
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
					<p>No hay registros de información adicional.</p>
					<p style={{ marginTop: 8, fontSize: '0.85rem' }}>
						Pulsa + para crear uno.
					</p>
				</div>
			)}
			{!loading && items.length > 0 && (
				<div
					style={{
						padding: embedded ? '0 4px' : '12px 16px',
						paddingBottom:
							'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
					}}
				>
					{items.map((row) => (
						<div
							key={String(row.id)}
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
									{nombrePublicador(row)}
								</p>
								<p
									style={{
										margin: '6px 0 0',
										fontSize: '0.78rem',
										opacity: 0.85,
									}}
								>
									{row.fecha
										? new Date(row.fecha).toLocaleDateString(
												'es',
											)
										: '—'}
								</p>
								{row.observaciones ? (
									<p
										style={{
											margin: '6px 0 0',
											fontSize: '0.72rem',
											opacity: 0.7,
										}}
									>
										{row.observaciones}
									</p>
								) : null}
								<p
									style={{
										margin: '6px 0 0',
										fontSize: '0.72rem',
										opacity: 0.75,
									}}
								>
									Pastoreo:{' '}
									{rowPastoreo(row) ? 'Sí' : 'No'}
								</p>
							</div>
							<div
								style={{
									display: 'flex',
									flexShrink: 0,
									alignItems: 'center',
									gap: 8,
								}}
							>
								<button
									type="button"
									aria-label="Actualizar registro"
									title="Actualizar"
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										handleActualizar(row)
									}}
									disabled={deleting}
									style={{
										display: 'flex',
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
								<button
									type="button"
									aria-label="Eliminar registro"
									title="Eliminar"
									onClick={(e) => {
										e.preventDefault()
										e.stopPropagation()
										openDeleteConfirmation(row)
									}}
									disabled={deleting}
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										width: 44,
										height: 44,
										border: 'none',
										borderRadius: 10,
										background: 'rgba(235, 68, 90, 0.2)',
										color: '#eb445a',
										cursor: 'pointer',
									}}
								>
									<IonIcon
										icon={trashOutline}
										style={{ fontSize: 22 }}
									/>
								</button>
							</div>
						</div>
					))}
				</div>
			)}
			{!loading && (
				<IonFab vertical="bottom" horizontal="end" slot="fixed">
					<IonFabButton
						onClick={handleNew}
						aria-label="Nueva información"
					>
						<IonIcon icon={add} />
					</IonFabButton>
				</IonFab>
			)}
		</>
	)

	const formModal =
		showModal ? (
			<div
				className="addinfopubl-form-overlay"
				style={{
					position: 'fixed',
					inset: 0,
					zIndex: 100000,
					background: 'var(--ion-background-color, #121212)',
				}}
				role="presentation"
				onClick={() => closeModal()}
			>
				<IonPage
					style={{ pointerEvents: 'auto' }}
					onClick={(e) => e.stopPropagation()}
				>
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
									<IonIcon
										icon={arrowBackOutline}
										slot="icon-only"
									/>
								</IonButton>
							</IonButtons>
							<IonTitle style={{ color: '#ffffff' }}>
								{editing
									? 'Actualizar información'
									: 'Nueva información'}
							</IonTitle>
						</IonToolbar>
					</IonHeader>
					<IonContent className="ion-padding">
						{!editing ? (
							<IonItem lines="full">
								<IonSelect
									interface="popover"
									interfaceOptions={{
										cssClass:
											'addinfopubl-publicador-select-overlay',
									}}
									label="Publicador *"
									labelPlacement="stacked"
									placeholder="Selecciona"
									value={idpublicador || undefined}
									onIonChange={(e) =>
										setIdpublicador(
											String(e.detail.value ?? ''),
										)
									}
								>
									{publicadores.map((p) => (
										<IonSelectOption
											key={String(p.id)}
											value={String(p.id)}
										>
											{p.nombre}
										</IonSelectOption>
									))}
								</IonSelect>
							</IonItem>
						) : (
							<IonItem lines="none">
								<IonLabel>
									<p
										style={{
											fontSize: '0.75rem',
											opacity: 0.7,
										}}
									>
										Publicador
									</p>
									<p style={{ fontWeight: 600 }}>
										{nombrePublicador(editing)}
									</p>
								</IonLabel>
							</IonItem>
						)}
						<IonItem lines="full">
							<IonInput
								type="date"
								label="Fecha"
								labelPlacement="stacked"
								value={fecha}
								onIonInput={(e) =>
									setFecha(String(e.detail.value ?? ''))
								}
							/>
						</IonItem>
						<IonItem lines="none">
							<IonTextarea
								label="Observaciones"
								labelPlacement="stacked"
								value={observaciones}
								onIonInput={(e) =>
									setObservaciones(
										String(e.detail.value ?? ''),
									)
								}
								rows={4}
								autoGrow
							/>
						</IonItem>
						<IonItem lines="none">
							<IonLabel>Pastoreo</IonLabel>
							<IonToggle
								slot="end"
								checked={pastoreo}
								onIonChange={(e) =>
									setPastoreo(Boolean(e.detail.checked))
								}
							/>
						</IonItem>
						<IonButton
							type="button"
							expand="block"
							style={{ marginTop: 20 }}
							onClick={() => void handleSave()}
							disabled={saving}
						>
							{saving ? (
								<IonSpinner name="crescent" />
							) : editing ? (
								'Actualizar'
							) : (
								'Guardar'
							)}
						</IonButton>
					</IonContent>
				</IonPage>
			</div>
		) : null

	const overlays = (
		<>
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
		</>
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
						Info Publicador
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

export default AddInfoPublPage
