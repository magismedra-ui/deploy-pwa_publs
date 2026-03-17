import {
	IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
	IonButtons, IonButton, IonList, IonItem, IonLabel,
	IonModal, IonToggle, IonSpinner, IonIcon,
} from '@ionic/react'
import { useState, useEffect, Fragment } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import { documentTextOutline, homeOutline, arrowBackOutline } from 'ionicons/icons'
import { Capacitor } from '@capacitor/core'
import { apiService } from '../services/api'
import { databaseService } from '../services/database.service'
import { registroRepository } from '../repositories/registro.repository'
import { Publicador, Registro } from '../types'

const MESES = [
	'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
	'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function getMesAnterior(): { mes: string; anno: number } {
	const d = new Date()
	d.setDate(1)
	d.setMonth(d.getMonth() - 1)
	return { mes: MESES[d.getMonth()], anno: d.getFullYear() }
}

async function getPublicadoresByGrupo(grupoId: number): Promise<Publicador[]> {
	const all = await apiService.get<Publicador[]>('/publicador')
	return (Array.isArray(all) ? all : []).filter(
		(p) => p.grupo != null && Number(p.grupo) === grupoId
	)
}

async function saveRegistro(payload: Omit<Registro, 'id'>): Promise<void> {
	const isNative = Capacitor.isNativePlatform()
	if (isNative && databaseService.isInitialized() && databaseService.isNative()) {
		await registroRepository.create(payload as Registro)
	} else {
		await apiService.post('/registro', payload)
	}
}

interface FormState {
	predico: boolean
	cursos: string
	horas: string
	precursor: string
	notas: string
}

const FORM_DEFAULT: FormState = {
	predico: true,
	cursos: '0',
	horas: '0',
	precursor: 'Publicador',
	notas: ''
}

const IngresarInformes: React.FC = () => {
	const { grupoId, grupoNombre } = useParams() as {
		grupoId: string
		grupoNombre: string
	}
	const history = useHistory()
	const gid = Number(grupoId)
	const nombre = decodeURIComponent(grupoNombre ?? `Grupo ${gid}`)
	const { mes, anno } = getMesAnterior()

	const [publicadores, setPublicadores] = useState<Publicador[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [selectedPub, setSelectedPub] = useState<Publicador | null>(null)
	const [form, setForm] = useState<FormState>(FORM_DEFAULT)
	const [saving, setSaving] = useState(false)
	const [successMsg, setSuccessMsg] = useState<string | null>(null)

	useEffect(() => {
		if (gid > 0) loadPublicadores()
	}, [gid])

	const loadPublicadores = async () => {
		setLoading(true)
		setError(null)
		try {
			const data = await getPublicadoresByGrupo(gid)
			setPublicadores(data.sort((a, b) => a.nombre.localeCompare(b.nombre)))
		} catch (e: any) {
			setError(e.message || 'Error al cargar publicadores')
		} finally {
			setLoading(false)
		}
	}

	const openModal = (pub: Publicador) => {
		setSelectedPub(pub)
		setForm({ ...FORM_DEFAULT, precursor: pub.precursor ?? 'Publicador' })
		setShowModal(true)
	}

	const closeModal = () => {
		setShowModal(false)
		setSelectedPub(null)
	}

	const handleSave = async () => {
		if (!selectedPub) return
		setSaving(true)
		try {
			console.log('Guardando informe', {
				anno,
				mes,
				predico: form.predico,
				cursos: form.cursos,
				horas: form.horas,
				precursor: form.precursor,
				notas: form.notas,
				idpublicador: String(Number(selectedPub.id)),
			})
			await saveRegistro({
				anno_servicio: anno,
				mes,
				predico: form.predico,
				cursos: Number(form.cursos) || 0,
				horas: Number(form.horas) || 0,
				precursor: form.precursor,
				notas: form.notas,
				idpublicador: String(Number(selectedPub.id)),
			})
			closeModal()
			setSuccessMsg(`Informe de ${selectedPub.nombre} guardado`)
		} catch (e: any) {
			console.error('Error al guardar informe', e)
			const apiMsg = e?.response?.data?.message || e?.response?.data?.error
			setError(apiMsg || e.message || 'Error al guardar informe')
		} finally {
			setSaving(false)
		}
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar style={{ '--background': '#000000', '--color': '#ffffff' } as any}>
					<IonTitle style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem' }}>
						INGRESAR INFORMES
					</IonTitle>
					<IonButtons slot="end">
						<IonButton
							onClick={() => history.replace('/tabs/home')}
							style={{ color: '#ffffff' }}
						>
							<IonIcon icon={homeOutline} slot="icon-only" />
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>

			<IonContent fullscreen style={{ '--background': '#1D68DF' } as React.CSSProperties}>
				<div style={{
					background: '#1D68DF',
					color: '#ffffff',
					padding: '12px 16px 14px',
					textAlign: 'center'
				}}>
					<h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{nombre}</h2>
					<p style={{ margin: '4px 0 0', fontSize: '0.82rem', opacity: 0.9 }}>
						Mes de servicio: <strong>{mes} {anno}</strong>
					</p>
				</div>

				{loading && (
					<div style={{ textAlign: 'center', padding: '2rem' }}>
						<IonSpinner name="crescent" />
						<p>Cargando publicadores...</p>
					</div>
				)}

				{!loading && publicadores.length === 0 && (
					<div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ion-color-medium)' }}>
						<p>No hay publicadores en este grupo.</p>
					</div>
				)}

				{!loading && publicadores.length > 0 && (
					<div style={{
						margin: '0 12px',
						borderRadius: 12,
						overflow: 'hidden',
						background: 'var(--ion-background-color, #fff)'
					}}>
						<IonList>
						{publicadores.map((pub, index) => (
							<Fragment key={pub.id}>
								<IonItem lines="none">
									<IonLabel>
										<h2 style={{ fontWeight: 600, fontSize: '0.88rem' }}>{pub.nombre}</h2>
										<p style={{ fontSize: '0.72rem', opacity: 0.65, marginTop: 2 }}>
											{pub.precursor ?? pub.privilegio ?? 'Publicador'}
										</p>
									</IonLabel>
									<IonButton
										slot="end"
										fill="outline"
										size="small"
										onClick={() => openModal(pub)}
									>
										<IonIcon icon={documentTextOutline} slot="start" />
										Informe
									</IonButton>
								</IonItem>
								{index < publicadores.length - 1 && (
									<div
										style={{
											height: 1,
											backgroundColor: '#e0e0e0',
											marginLeft: 16,
											marginRight: 16
										}}
										aria-hidden="true"
									/>
								)}
							</Fragment>
						))}
						</IonList>
					</div>
				)}

				{error && (
					<div
						className="ion-padding"
						style={{ color: 'var(--ion-color-danger)', textAlign: 'center' }}
					>
						{error}
					</div>
				)}
				{successMsg && (
					<div
						className="ion-padding"
						style={{ color: 'var(--ion-color-success)', textAlign: 'center' }}
					>
						{successMsg}
					</div>
				)}

				<IonModal key={showModal ? 'open' : 'closed'} isOpen={showModal} onDidDismiss={closeModal}>
					<IonHeader>
						<IonToolbar style={{ '--background': '#000000', '--color': '#ffffff' } as React.CSSProperties}>
							<IonButtons slot="start">
								<IonButton onClick={closeModal} style={{ color: '#ffffff' }}>
									<IonIcon icon={arrowBackOutline} slot="icon-only" />
								</IonButton>
							</IonButtons>
							<IonTitle style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem' }}>
								INFORME DE PREDICACIÓN
							</IonTitle>
						</IonToolbar>
					</IonHeader>
					<IonContent className="ion-padding" style={{ '--background': '#1D68DF' } as any}>
						{selectedPub && (
							<div
								style={{
									background: '#041955',
									borderRadius: 12,
									padding: '12px 16px 16px',
								}}
							>
								{/* Nombre */}
								<div style={{
									background: '#1D68DF',
									borderRadius: 8,
									padding: '10px 14px',
									marginBottom: 16
								}}>
									<p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
										{selectedPub.nombre}
									</p>
								</div>

								{/* Mes */}
								<div style={{ marginBottom: 12 }}>
									<label style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 4 }}>Mes</label>
									<input
										value={`${mes} ${anno}`}
										readOnly
										style={{
											width: '100%', padding: '8px 10px', borderRadius: 8,
											border: '1px solid #333', background: '#12122a',
											color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', boxSizing: 'border-box'
										}}
									/>
								</div>

								{/* Participó */}
								<div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
									<label style={{ fontSize: '0.9rem', color: '#fff' }}>Participó en Predicación</label>
									<IonToggle
										checked={form.predico}
										onIonChange={(e) => {
											const val = e.detail.checked
											setForm((f) => ({ ...f, predico: val }))
											if (val) {
												setTimeout(() => {
													(document.getElementById('field-precursor') as HTMLSelectElement)?.focus()
												}, 100)
											}
										}}
									/>
								</div>

								{/* Privilegio */}
								<div style={{ marginBottom: 12, opacity: form.predico ? 1 : 0.35 }}>
									<label style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 4 }}>Privilegio</label>
									<select
										id="field-precursor"
										value={form.precursor}
										disabled={!form.predico}
										onChange={(e) => {
											setForm((f) => ({ ...f, precursor: e.target.value }))
											setTimeout(() => {
												(document.getElementById('field-cursos') as HTMLInputElement)?.focus()
											}, 100)
										}}
										style={{
											width: '100%', padding: '10px 12px', borderRadius: 8,
											border: '1px solid #333', background: '#12122a',
											color: '#ffffff', fontSize: '0.95rem',
											appearance: 'auto', boxSizing: 'border-box'
										}}
									>
										<option value="Publicador" style={{ color: '#fff', background: '#1e1e2e' }}>Publicador</option>
										<option value="PA" style={{ color: '#fff', background: '#1e1e2e' }}>PA (Precursor Auxiliar)</option>
										<option value="PR" style={{ color: '#fff', background: '#1e1e2e' }}>PR (Precursor Regular)</option>
									</select>
								</div>

								{/* Cursos Bíblicos */}
								<div style={{ marginBottom: 12, opacity: form.predico ? 1 : 0.35 }}>
									<label style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 4 }}>Cursos Bíblicos</label>
									<input
										id="field-cursos"
										type="number"
										min={0}
										value={form.cursos}
										disabled={!form.predico}
										onChange={(e) => setForm((f) => ({ ...f, cursos: e.target.value }))}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === 'Tab') {
												e.preventDefault()
												if (form.precursor !== 'Publicador') {
													(document.getElementById('field-horas') as HTMLInputElement)?.focus()
												} else {
													(document.getElementById('field-notas') as HTMLTextAreaElement)?.focus()
												}
											}
										}}
										style={{
											width: '100%', padding: '8px 10px', borderRadius: 8,
											border: '1px solid #333', background: '#12122a',
											color: '#ffffff', fontSize: '0.9rem', boxSizing: 'border-box'
										}}
									/>
								</div>

								{/* Horas */}
								<div style={{ marginBottom: 12, opacity: (form.predico && form.precursor !== 'Publicador') ? 1 : 0.35 }}>
									<label style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 4 }}>Horas</label>
									<input
										id="field-horas"
										type="number"
										min={0}
										value={form.precursor === 'Publicador' ? '0' : form.horas}
										disabled={!form.predico || form.precursor === 'Publicador'}
										onChange={(e) => setForm((f) => ({ ...f, horas: e.target.value }))}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === 'Tab') {
												e.preventDefault();
												(document.getElementById('field-notas') as HTMLTextAreaElement)?.focus()
											}
										}}
										style={{
											width: '100%', padding: '8px 10px', borderRadius: 8,
											border: '1px solid #333', background: '#12122a',
											color: '#ffffff', fontSize: '0.9rem', boxSizing: 'border-box'
										}}
									/>
								</div>

								{/* Notas */}
								<div style={{ marginBottom: 16 }}>
									<label style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 4 }}>Notas / Observaciones</label>
									<textarea
										id="field-notas"
										value={form.notas}
										rows={3}
										onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
										placeholder="Observaciones opcionales..."
										style={{
											width: '100%', padding: '8px 10px', borderRadius: 8,
											border: '1px solid #333', background: '#12122a',
											color: '#ffffff', fontSize: '0.9rem',
											resize: 'none', boxSizing: 'border-box'
										}}
									/>
								</div>

								{/* Guardar */}
								<div style={{ paddingTop: 8 }}>
									<IonButton
										expand="block"
										onClick={handleSave}
										disabled={saving}
									>
										{saving ? <IonSpinner name="crescent" /> : 'Guardar Informe'}
									</IonButton>
								</div>
							</div>
						)}
					</IonContent>
				</IonModal>
			</IonContent>
		</IonPage>
	)
}

export default IngresarInformes
