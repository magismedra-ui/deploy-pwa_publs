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
	IonModal,
	IonToggle,
} from '@ionic/react'
import React, { useState, useEffect } from 'react'
import { arrowBackOutline } from 'ionicons/icons'
import { apiService } from '../services/api'
import { useLoadSequence } from '../hooks/useLoadSequence'
import { Publicador, Registro } from '../types'

const errMsg = (e: unknown): string => {
	const err = e as { response?: { data?: { error?: { message?: string } } }; message?: string }
	return err?.response?.data?.error?.message || err?.message || 'Error'
}

interface FormInforme {
	predico: boolean
	cursos: string
	horas: string
	precursor: string
	notas: string
}

const FORM_DEFAULT: FormInforme = {
	predico: true,
	cursos: '0',
	horas: '0',
	precursor: 'Publicador',
	notas: '',
}

interface MetaRegistro {
	idpublicador?: string | number
	anno_servicio?: number
	mes?: string
}

const Registros: React.FC = () => {
	const [registros, setRegistros] = useState<Registro[]>([])
	const [publicadores, setPublicadores] = useState<Publicador[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [editingRegistro, setEditingRegistro] = useState<Registro | null>(null)
	const [form, setForm] = useState<FormInforme>(FORM_DEFAULT)
	const [meta, setMeta] = useState<MetaRegistro>({})
	const [saving, setSaving] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const [toast, setToast] = useState<{
		show: boolean
		message: string
		color: 'success' | 'danger'
	}>({ show: false, message: '', color: 'success' })

	const loadSeq = useLoadSequence()

	const loadData = async (opts?: { silent?: boolean }) => {
		const silent = Boolean(opts?.silent)
		const seq = loadSeq.next()
		if (!silent) setLoading(true)
		setError(null)
		try {
			const [regData, pubData] = await Promise.all([
				apiService.get<Registro[]>('/registro'),
				apiService.get<Publicador[]>('/publicador'),
			])
			if (!loadSeq.isCurrent(seq)) return
			const list = Array.isArray(regData) ? regData : []
			setRegistros(
				list.sort((a, b) => {
					const ay = a.anno_servicio ?? 0
					const by = b.anno_servicio ?? 0
					if (by !== ay) return by - ay
					return String(b.mes ?? '').localeCompare(String(a.mes ?? ''))
				}),
			)
			setPublicadores(Array.isArray(pubData) ? pubData : [])
		} catch (e: unknown) {
			if (loadSeq.isCurrent(seq)) {
				setError(errMsg(e) || 'Error al cargar datos')
			}
		} finally {
			if (!silent && loadSeq.isCurrent(seq)) setLoading(false)
		}
	}

	useEffect(() => {
		void loadData()
	}, [])

	const nombrePublicador = (idpub: string | number | undefined) => {
		const id = String(idpub ?? '')
		const p = publicadores.find((x) => String(x.id) === id)
		return p?.nombre ?? '—'
	}

	const openEdit = (registro: Registro) => {
		setEditingRegistro(registro)
		setMeta({
			idpublicador: registro.idpublicador,
			anno_servicio: registro.anno_servicio,
			mes: registro.mes,
		})
		setForm({
			predico: registro.predico ?? true,
			cursos: String(registro.cursos ?? 0),
			horas: String(registro.horas ?? 0),
			precursor: registro.precursor ?? 'Publicador',
			notas: registro.notas ?? '',
		})
		setShowModal(true)
	}

	const closeModal = () => {
		setShowModal(false)
		setEditingRegistro(null)
		setMeta({})
		setForm(FORM_DEFAULT)
	}

	const handleSave = async () => {
		if (!editingRegistro?.id) {
			setToast({ show: true, message: 'No hay registro para guardar', color: 'danger' })
			return
		}
		if (!meta.idpublicador) {
			setToast({ show: true, message: 'Elige un publicador', color: 'danger' })
			return
		}
		if (!meta.mes?.trim() || meta.anno_servicio == null) {
			setToast({ show: true, message: 'Indica mes y año de servicio', color: 'danger' })
			return
		}
		setSaving(true)
		try {
			const payload = {
				idpublicador: meta.idpublicador,
				anno_servicio: meta.anno_servicio,
				mes: meta.mes,
				predico: form.predico,
				cursos: Number(form.cursos) || 0,
				horas:
					form.precursor === 'Publicador'
						? 0
						: Number(form.horas) || 0,
				precursor: form.precursor,
				notas: form.notas,
			}
			await apiService.put(
				`/registro/${encodeURIComponent(String(editingRegistro.id))}`,
				payload,
			)
			setToast({ show: true, message: 'Informe actualizado', color: 'success' })
			closeModal()
			await loadData({ silent: true })
		} catch (e: unknown) {
			setToast({ show: true, message: errMsg(e), color: 'danger' })
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async (id: string) => {
		setIsDeleting(true)
		try {
			await apiService.delete(`/registro/${encodeURIComponent(id)}`)
			setRegistros((prev) => prev.filter((r) => String(r.id) !== String(id)))
			await loadData({ silent: true })
			setToast({ show: true, message: 'Registro eliminado', color: 'success' })
		} catch (e: unknown) {
			setToast({ show: true, message: errMsg(e), color: 'danger' })
		} finally {
			setIsDeleting(false)
		}
	}

	const requestDelete = (id: string) => {
		if (!window.confirm('¿Seguro que deseas eliminar este registro?')) return
		void handleDelete(id)
	}

	const mesDisplay =
		meta.mes && meta.anno_servicio != null
			? `${meta.mes} ${meta.anno_servicio}`
			: ''

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
						Registros
					</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent fullscreen>
				{loading && (
					<div style={{ textAlign: 'center', padding: '2rem', marginTop: 20 }}>
						<IonSpinner name="crescent" />
						<p style={{ marginTop: 12, color: 'var(--ion-color-medium)' }}>
							Cargando...
						</p>
					</div>
				)}
				{!loading && registros.length === 0 && (
					<div
						style={{
							textAlign: 'center',
							padding: '2rem',
							marginTop: 20,
							color: 'var(--ion-color-medium)',
						}}
					>
						<p>No hay registros.</p>
					</div>
				)}
				{!loading && registros.length > 0 && (
					<div style={{ padding: '0 12px', marginTop: 20 }}>
						{registros.map((registro) => (
							<div
								key={String(registro.id)}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									gap: 12,
									flexWrap: 'wrap',
									padding: '12px 16px',
									marginBottom: 8,
									borderRadius: 10,
									background: 'var(--ion-item-background, #1e1e2e)',
									boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
								}}
							>
								<div style={{ flex: '1 1 160px', minWidth: 0 }}>
									<p style={{ margin: 0, fontWeight: 600, fontSize: '0.92rem' }}>
										{nombrePublicador(registro.idpublicador)}
									</p>
									<p style={{ margin: '4px 0 0', fontSize: '0.78rem', opacity: 0.85 }}>
										{registro.mes ?? '—'} {registro.anno_servicio ?? ''}
									</p>
									<p style={{ margin: '4px 0 0', fontSize: '0.75rem', opacity: 0.65 }}>
										Horas: {registro.horas ?? 0}
										{registro.predico != null
											? ` · Predicó: ${registro.predico ? 'Sí' : 'No'}`
											: ''}
									</p>
								</div>
								<div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
									<IonButton
										size="small"
										color="primary"
										fill="solid"
										onClick={() => openEdit(registro)}
									>
										Editar
									</IonButton>
									<IonButton
										size="small"
										color="danger"
										fill="solid"
										onClick={() =>
											requestDelete(String(registro.id))
										}
									>
										Eliminar
									</IonButton>
								</div>
							</div>
						))}
					</div>
				)}

			</IonContent>

			<IonModal
				key={showModal ? 'open' : 'closed'}
				isOpen={showModal}
				onDidDismiss={closeModal}
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
							<IonButton onClick={closeModal} style={{ color: '#ffffff' }}>
								<IonIcon icon={arrowBackOutline} slot="icon-only" />
							</IonButton>
						</IonButtons>
						<IonTitle
							style={{
								color: '#ffffff',
								fontWeight: 700,
								fontSize: '0.95rem',
							}}
						>
							EDITAR INFORME
						</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent
					className="ion-padding"
					style={{ '--background': '#1D68DF' } as React.CSSProperties}
				>
					<div
						style={{
							background: '#041955',
							borderRadius: 12,
							padding: '12px 16px 16px',
						}}
					>
						{/* Nombre publicador */}
						<div
							style={{
								background: '#1D68DF',
								borderRadius: 8,
								padding: '10px 14px',
								marginBottom: 16,
							}}
						>
							<p
								style={{
									margin: 0,
									fontWeight: 700,
									fontSize: '0.95rem',
									color: '#fff',
								}}
							>
								{nombrePublicador(meta.idpublicador)}
							</p>
						</div>

						<div style={{ marginBottom: 12 }}>
							<label
								style={{
									fontSize: '0.72rem',
									color: 'rgba(255,255,255,0.6)',
									display: 'block',
									marginBottom: 4,
								}}
							>
								Mes
							</label>
							<input
								value={mesDisplay}
								readOnly
								style={{
									width: '100%',
									padding: '8px 10px',
									borderRadius: 8,
									border: '1px solid #333',
									background: '#12122a',
									color: 'rgba(255,255,255,0.5)',
									fontSize: '0.9rem',
									boxSizing: 'border-box',
								}}
							/>
						</div>

						<div
							style={{
								marginBottom: 12,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
						>
							<label style={{ fontSize: '0.9rem', color: '#fff' }}>
								Participó en Predicación
							</label>
							<IonToggle
								checked={form.predico}
								onIonChange={(e) =>
									setForm((f) => ({ ...f, predico: e.detail.checked }))
								}
							/>
						</div>

						<div
							style={{
								marginBottom: 12,
								opacity: form.predico ? 1 : 0.35,
							}}
						>
							<label
								style={{
									fontSize: '0.72rem',
									color: 'rgba(255,255,255,0.6)',
									display: 'block',
									marginBottom: 4,
								}}
							>
								Privilegio
							</label>
							<select
								value={form.precursor}
								disabled={!form.predico}
								onChange={(e) =>
									setForm((f) => ({ ...f, precursor: e.target.value }))
								}
								style={{
									width: '100%',
									padding: '10px 12px',
									borderRadius: 8,
									border: '1px solid #333',
									background: '#12122a',
									color: '#ffffff',
									fontSize: '0.95rem',
									boxSizing: 'border-box',
								}}
							>
								<option value="Publicador">Publicador</option>
								<option value="PA">PA (Precursor Auxiliar)</option>
								<option value="PR">PR (Precursor Regular)</option>
							</select>
						</div>

						<div
							style={{
								marginBottom: 12,
								opacity: form.predico ? 1 : 0.35,
							}}
						>
							<label
								style={{
									fontSize: '0.72rem',
									color: 'rgba(255,255,255,0.6)',
									display: 'block',
									marginBottom: 4,
								}}
							>
								Cursos Bíblicos
							</label>
							<input
								type="number"
								min={0}
								value={form.cursos}
								disabled={!form.predico}
								onChange={(e) =>
									setForm((f) => ({ ...f, cursos: e.target.value }))
								}
								style={{
									width: '100%',
									padding: '8px 10px',
									borderRadius: 8,
									border: '1px solid #333',
									background: '#12122a',
									color: '#ffffff',
									fontSize: '0.9rem',
									boxSizing: 'border-box',
								}}
							/>
						</div>

						<div
							style={{
								marginBottom: 12,
								opacity:
									form.predico && form.precursor !== 'Publicador' ? 1 : 0.35,
							}}
						>
							<label
								style={{
									fontSize: '0.72rem',
									color: 'rgba(255,255,255,0.6)',
									display: 'block',
									marginBottom: 4,
								}}
							>
								Horas
							</label>
							<input
								type="number"
								min={0}
								value={
									form.precursor === 'Publicador' ? '0' : form.horas
								}
								disabled={!form.predico || form.precursor === 'Publicador'}
								onChange={(e) =>
									setForm((f) => ({ ...f, horas: e.target.value }))
								}
								style={{
									width: '100%',
									padding: '8px 10px',
									borderRadius: 8,
									border: '1px solid #333',
									background: '#12122a',
									color: '#ffffff',
									fontSize: '0.9rem',
									boxSizing: 'border-box',
								}}
							/>
						</div>

						<div style={{ marginBottom: 16 }}>
							<label
								style={{
									fontSize: '0.72rem',
									color: 'rgba(255,255,255,0.6)',
									display: 'block',
									marginBottom: 4,
								}}
							>
								Notas / Observaciones
							</label>
							<textarea
								value={form.notas}
								rows={3}
								onChange={(e) =>
									setForm((f) => ({ ...f, notas: e.target.value }))
								}
								placeholder="Observaciones opcionales..."
								style={{
									width: '100%',
									padding: '8px 10px',
									borderRadius: 8,
									border: '1px solid #333',
									background: '#12122a',
									color: '#ffffff',
									fontSize: '0.9rem',
									resize: 'none',
									boxSizing: 'border-box',
								}}
							/>
						</div>

						<div style={{ paddingTop: 8 }}>
							<IonButton
								expand="block"
								onClick={() => void handleSave()}
								disabled={saving}
							>
								{saving ? (
									<IonSpinner name="crescent" />
								) : (
									'Actualizar Informe'
								)}
							</IonButton>
						</div>
					</div>
				</IonContent>
			</IonModal>

			<IonLoading isOpen={isDeleting} message="Eliminando..." />
			<IonToast
				isOpen={toast.show}
				message={toast.message}
				color={toast.color}
				duration={2500}
				position="bottom"
				onDidDismiss={() => setToast((t) => ({ ...t, show: false }))}
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

export default Registros
