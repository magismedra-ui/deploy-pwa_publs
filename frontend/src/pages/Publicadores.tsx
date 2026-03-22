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
	IonToast,
	IonAlert,
	IonModal,
	IonToggle,
} from '@ionic/react'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
	add,
	arrowBackOutline,
	refreshOutline,
} from 'ionicons/icons'
import { apiService } from '../services/api'
import { useLoadSequence } from '../hooks/useLoadSequence'
import { Publicador } from '../types'

const errMsg = (e: unknown): string => {
	const err = e as {
		response?: { data?: { error?: { message?: string } } }
		message?: string
	}
	return err?.response?.data?.error?.message || err?.message || 'Error'
}

const BG_CARD_DEFAULT = 'var(--ion-item-background, #1e1e2e)'
const BG_INACTIVO_IRREGULAR = '#ffc409'
const BG_EXPULSADO_SANCION = '#cf3c4f'

function normalizeEstadoPublicador(estado: string | undefined): string {
	const e = (estado ?? 'ACTIVO').trim().toUpperCase()
	return e || 'ACTIVO'
}

function cardBackgroundForEstado(estado: string | undefined): string {
	const e = normalizeEstadoPublicador(estado)
	if (e === 'INACTIVO' || e === 'IRREGULAR') return BG_INACTIVO_IRREGULAR
	if (
		e === 'EXPULSADO'
		|| e === 'DESASOCIADO'
		|| e === 'APOSTATA'
	) {
		return BG_EXPULSADO_SANCION
	}
	return BG_CARD_DEFAULT
}

interface ResumenEstados {
	activos: number
	inactivos: number
	expulsados: number
	desasociados: number
	apostatas: number
}

function contarPorEstado(list: Publicador[]): ResumenEstados {
	const r: ResumenEstados = {
		activos: 0,
		inactivos: 0,
		expulsados: 0,
		desasociados: 0,
		apostatas: 0,
	}
	for (const p of list) {
		const e = normalizeEstadoPublicador(p.estado)
		if (e === 'ACTIVO') r.activos += 1
		else if (e === 'INACTIVO' || e === 'IRREGULAR') r.inactivos += 1
		else if (e === 'EXPULSADO') r.expulsados += 1
		else if (e === 'DESASOCIADO') r.desasociados += 1
		else if (e === 'APOSTATA') r.apostatas += 1
		else r.activos += 1
	}
	return r
}

const SEXOS = ['HOMBRE', 'MUJER']
const ESPERANZAS = ['OTRAS OVEJAS', 'UNGIDO']
const PRIVILEGIOS = [
	'ANCIANO',
	'SIERVO MINISTERIAL',
	'PUBLICADOR',
	'PUBLICADORA',
]
const PRECURSORES = [
	'PUBLICADOR',
	'PUBLICADORA',
	'PRECURSOR AUXILIAR',
	'PRECURSORA AUXILIAR',
	'PRECURSOR REGULAR',
	'PRECURSORA REGULAR',
	'PUBLICADOR NO BAUTIZADO',
]
const ESTADOS = [
	'ACTIVO',
	'INACTIVO',
	'IRREGULAR',
	'EXPULSADO',
	'DESASOCIADO',
	'APOSTATA',
]

interface FormPub {
	nombre: string
	correo: string
	sexo: string
	esperanza: string
	privilegio: string
	precursor: string
	fecha_nacimiento: string
	fecha_bautismo: string
	direccion: string
	telefono_familiar: string
	telefono: string
	grupo: string
	observaciones: string
	estado: string
	capitan: boolean
	auxiliar: boolean
}

const FORM_DEFAULT: FormPub = {
	nombre: '',
	correo: '',
	sexo: 'HOMBRE',
	esperanza: 'OTRAS OVEJAS',
	privilegio: 'PUBLICADOR',
	precursor: 'PUBLICADOR',
	fecha_nacimiento: '',
	fecha_bautismo: '',
	direccion: '',
	telefono_familiar: '',
	telefono: '',
	grupo: '',
	observaciones: '',
	estado: 'ACTIVO',
	capitan: false,
	auxiliar: false,
}

const inputStyle: React.CSSProperties = {
	width: '100%',
	padding: '8px 10px',
	borderRadius: 8,
	border: '1px solid #333',
	background: '#12122a',
	color: '#ffffff',
	fontSize: '0.88rem',
	boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
	fontSize: '0.7rem',
	color: 'rgba(255,255,255,0.6)',
	display: 'block',
	marginBottom: 4,
}

const selectStyle: React.CSSProperties = {
	...inputStyle,
	appearance: 'auto',
}

function pubToForm(pub: Publicador): FormPub {
	return {
		nombre: pub.nombre ?? '',
		correo: pub.correo ?? '',
		sexo: pub.sexo ?? 'HOMBRE',
		esperanza: pub.esperanza ?? 'OTRAS OVEJAS',
		privilegio: pub.privilegio ?? 'PUBLICADOR',
		precursor: pub.precursor ?? 'PUBLICADOR',
		fecha_nacimiento: pub.fecha_nacimiento
			? String(pub.fecha_nacimiento).split('T')[0]
			: '',
		fecha_bautismo: pub.fecha_bautismo
			? String(pub.fecha_bautismo).split('T')[0]
			: '',
		direccion: pub.direccion ?? '',
		telefono_familiar: pub.telefono_familiar
			? String(pub.telefono_familiar)
			: '',
		telefono: pub.telefono ? String(pub.telefono) : '',
		grupo: pub.grupo ? String(pub.grupo) : '',
		observaciones: pub.observaciones ?? '',
		estado: pub.estado ?? 'ACTIVO',
		capitan: pub.capitan ?? false,
		auxiliar: pub.auxiliar ?? false,
	}
}

function formPayload(form: FormPub) {
	return {
		...form,
		telefono_familiar: Number(form.telefono_familiar) || null,
		telefono: Number(form.telefono) || null,
		grupo: Number(form.grupo) || null,
	}
}

interface PublicadoresProps {
	embedded?: boolean
}

const Publicadores: React.FC<PublicadoresProps> = ({ embedded = false }) => {
	const [publicadores, setPublicadores] = useState<Publicador[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [toast, setToast] = useState<{
		show: boolean
		message: string
		color: 'success' | 'danger'
	}>({ show: false, message: '', color: 'success' })

	const [showModal, setShowModal] = useState(false)
	const [editingPub, setEditingPub] = useState<Publicador | null>(null)
	const [form, setForm] = useState<FormPub>(FORM_DEFAULT)
	const [saving, setSaving] = useState(false)

	const loadSeq = useLoadSequence()

	const F = useCallback(
		({ label, children }: { label: string; children: React.ReactNode }) => (
			<div style={{ marginBottom: 12 }}>
				<label style={labelStyle}>{label}</label>
				{children}
			</div>
		),
		[],
	)

	const resumen = useMemo(
		() => contarPorEstado(publicadores),
		[publicadores],
	)

	async function loadData(opts?: { silent?: boolean }) {
		const silent = Boolean(opts?.silent)
		const seq = loadSeq.next()
		if (!silent) setLoading(true)
		try {
			const data = await apiService.get<Publicador[]>('/publicador')
			if (!loadSeq.isCurrent(seq)) return
			const list = Array.isArray(data) ? data : []
			setPublicadores(
				list.sort((a, b) =>
					(a.nombre || '').localeCompare(b.nombre || '', 'es'),
				),
			)
		} catch (e: unknown) {
			if (loadSeq.isCurrent(seq)) setError(errMsg(e))
		} finally {
			if (!silent && loadSeq.isCurrent(seq)) setLoading(false)
		}
	}

	useEffect(() => {
		void loadData()
	}, [])

	const openNew = () => {
		;(document.activeElement as HTMLElement | null)?.blur()
		setEditingPub(null)
		setForm(FORM_DEFAULT)
		setShowModal(true)
	}

	const openEdit = (pub: Publicador) => {
		;(document.activeElement as HTMLElement | null)?.blur()
		if (pub.id == null) return
		setEditingPub(pub)
		setForm(pubToForm(pub))
		setShowModal(true)
	}

	const closeModal = () => {
		setShowModal(false)
		setEditingPub(null)
		setForm(FORM_DEFAULT)
	}

	const handleSave = async () => {
		const nombre = form.nombre.trim()
		if (!nombre) {
			setToast({
				show: true,
				message: 'Indica el nombre del publicador',
				color: 'danger',
			})
			return
		}
		setSaving(true)
		try {
			const payload = formPayload(form)
			if (editingPub?.id != null) {
				await apiService.put(
					`/publicador/${encodeURIComponent(String(editingPub.id))}`,
					payload,
				)
				setToast({
					show: true,
					message: 'Publicador actualizado',
					color: 'success',
				})
			} else {
				await apiService.post<Publicador>('/publicador', payload)
				setToast({
					show: true,
					message: 'Publicador creado',
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
			{!loading && (
				<div
					style={{
						padding: embedded ? '0 4px' : '12px 16px',
						paddingBottom:
							'calc(1rem + env(safe-area-inset-bottom, 0px))',
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'flex-start',
							justifyContent: 'space-between',
							gap: 12,
							padding: '14px 16px',
							marginBottom: 12,
							borderRadius: 10,
							background: '#50c8ff',
							color: '#000000',
						}}
					>
						<div style={{ flex: 1, minWidth: 0 }}>
							<p
								style={{
									margin: 0,
									fontSize: '0.75rem',
									letterSpacing: '0.04em',
									color: '#000000',
								}}
							>
								TOTAL DE PUBLICADORES
							</p>
							<div
								style={{
									marginTop: 8,
									fontSize: '0.8rem',
									lineHeight: 1.5,
									color: '#000000',
								}}
							>
								<p style={{ margin: '2px 0' }}>
									Activos {resumen.activos}
								</p>
								<p style={{ margin: '2px 0' }}>
									Inactivos {resumen.inactivos}
								</p>
								<p style={{ margin: '2px 0' }}>
									Expulsados {resumen.expulsados}
								</p>
								<p style={{ margin: '2px 0' }}>
									Desasociados {resumen.desasociados}
								</p>
								<p style={{ margin: '2px 0' }}>
									Apóstatas {resumen.apostatas}
								</p>
							</div>
						</div>
						<button
							type="button"
							aria-label="Nuevo publicador"
							title="Nuevo publicador"
							onClick={(e) => {
								e.preventDefault()
								e.stopPropagation()
								openNew()
							}}
							style={{
								flexShrink: 0,
								margin: 0,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								width: 44,
								height: 44,
								border: 'none',
								borderRadius: 10,
								background: 'var(--ion-color-success, #2dd36f)',
								color: '#fff',
								cursor: 'pointer',
								boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
							}}
						>
							<IonIcon icon={add} style={{ fontSize: 22 }} />
						</button>
					</div>

					{publicadores.length === 0 && (
						<p
							style={{
								textAlign: 'center',
								color: 'var(--ion-color-medium)',
								padding: '1rem',
							}}
						>
							No hay publicadores registrados.
						</p>
					)}

					{publicadores.map((pub) => {
						const cardBg = cardBackgroundForEstado(pub.estado)
						const isYellow = cardBg === BG_INACTIVO_IRREGULAR
						const isRed = cardBg === BG_EXPULSADO_SANCION
						const nombreColor = isYellow
							? '#1a1a1a'
							: isRed
								? '#ffffff'
								: undefined
						const estadoLabel = normalizeEstadoPublicador(pub.estado)
						const subColor = isYellow
							? '#2c2c2c'
							: isRed
								? 'rgba(255,255,255,0.92)'
								: undefined
						const btnBg = isYellow
							? 'rgba(0,0,0,0.12)'
							: isRed
								? 'rgba(255,255,255,0.22)'
								: 'rgba(29, 104, 223, 0.35)'
						const btnColor = isYellow
							? '#1a1a1a'
							: isRed
								? '#ffffff'
								: 'var(--ion-color-primary, #3880ff)'
						return (
						<div
							key={String(pub.id)}
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 12,
								padding: '12px 16px',
								marginBottom: 8,
								borderRadius: 10,
								background: cardBg,
								boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
							}}
						>
							<div style={{ flex: 1, minWidth: 0 }}>
								<p
									style={{
										margin: 0,
										fontWeight: 600,
										fontSize: '0.92rem',
										color: nombreColor,
									}}
								>
									{pub.nombre}
								</p>
								<p
									style={{
										margin: '4px 0 0',
										fontSize: '0.78rem',
										opacity: subColor ? 1 : 0.7,
										color: subColor,
										wordBreak: 'break-word',
									}}
								>
									{estadoLabel}
								</p>
							</div>
							<button
								type="button"
								aria-label={`Actualizar ${pub.nombre}`}
								title="Actualizar publicador"
								onClick={(e) => {
									e.preventDefault()
									e.stopPropagation()
									openEdit(pub)
								}}
								style={{
									flexShrink: 0,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: 44,
									height: 44,
									border: 'none',
									borderRadius: 10,
									background: btnBg,
									color: btnColor,
									cursor: 'pointer',
								}}
							>
								<IonIcon
									icon={refreshOutline}
									style={{ fontSize: 22 }}
								/>
							</button>
						</div>
						)
					})}
				</div>
			)}
		</>
	)

	const formModal = (
		<IonModal
			key={showModal ? 'open' : 'closed'}
			isOpen={showModal}
			onDidDismiss={closeModal}
			backdropDismiss
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
						{editingPub ? 'ACTUALIZAR PUBLICADOR' : 'NUEVO PUBLICADOR'}
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
						padding: 16,
					}}
				>
					<F label="Nombre *">
						<input
							style={inputStyle}
							value={form.nombre}
							onChange={(e) =>
								setForm((f) => ({ ...f, nombre: e.target.value }))
							}
						/>
					</F>
					<F label="Correo">
						<input
							style={inputStyle}
							type="email"
							value={form.correo}
							onChange={(e) =>
								setForm((f) => ({ ...f, correo: e.target.value }))
							}
						/>
					</F>
					<F label="Sexo">
						<select
							style={selectStyle}
							value={form.sexo}
							onChange={(e) =>
								setForm((f) => ({ ...f, sexo: e.target.value }))
							}
						>
							{SEXOS.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
					</F>
					<F label="Esperanza">
						<select
							style={selectStyle}
							value={form.esperanza}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									esperanza: e.target.value,
								}))
							}
						>
							{ESPERANZAS.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
					</F>
					<F label="Privilegio">
						<select
							style={selectStyle}
							value={form.privilegio}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									privilegio: e.target.value,
								}))
							}
						>
							{PRIVILEGIOS.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
					</F>
					<F label="Precursor">
						<select
							style={selectStyle}
							value={form.precursor}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									precursor: e.target.value,
								}))
							}
						>
							{PRECURSORES.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
					</F>
					<F label="Fecha Nacimiento">
						<input
							style={inputStyle}
							type="date"
							value={form.fecha_nacimiento}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									fecha_nacimiento: e.target.value,
								}))
							}
						/>
					</F>
					<F label="Fecha Bautismo">
						<input
							style={inputStyle}
							type="date"
							value={form.fecha_bautismo}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									fecha_bautismo: e.target.value,
								}))
							}
						/>
					</F>
					<F label="Dirección">
						<input
							style={inputStyle}
							value={form.direccion}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									direccion: e.target.value,
								}))
							}
						/>
					</F>
					<F label="Tel. Familiar">
						<input
							style={inputStyle}
							type="number"
							value={form.telefono_familiar}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									telefono_familiar: e.target.value,
								}))
							}
						/>
					</F>
					<F label="Tel. Personal">
						<input
							style={inputStyle}
							type="number"
							value={form.telefono}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									telefono: e.target.value,
								}))
							}
						/>
					</F>
					<F label="Grupo (número)">
						<input
							style={inputStyle}
							type="number"
							value={form.grupo}
							onChange={(e) =>
								setForm((f) => ({ ...f, grupo: e.target.value }))
							}
						/>
					</F>
					<F label="Estado">
						<select
							style={selectStyle}
							value={form.estado}
							onChange={(e) =>
								setForm((f) => ({ ...f, estado: e.target.value }))
							}
						>
							{ESTADOS.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
					</F>
					<div
						style={{
							marginBottom: 12,
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
						}}
					>
						<label
							style={{ color: '#fff', fontSize: '0.88rem' }}
						>
							Capitán de grupo
						</label>
						<IonToggle
							checked={form.capitan}
							onIonChange={(e) =>
								setForm((f) => ({
									...f,
									capitan: e.detail.checked,
								}))
							}
						/>
					</div>
					<div
						style={{
							marginBottom: 12,
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
						}}
					>
						<label
							style={{ color: '#fff', fontSize: '0.88rem' }}
						>
							Auxiliar de grupo
						</label>
						<IonToggle
							checked={form.auxiliar}
							onIonChange={(e) =>
								setForm((f) => ({
									...f,
									auxiliar: e.detail.checked,
								}))
							}
						/>
					</div>
					<F label="Observaciones">
						<textarea
							style={
								{ ...inputStyle, resize: 'none' } as React.CSSProperties
							}
							rows={3}
							value={form.observaciones}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									observaciones: e.target.value,
								}))
							}
						/>
					</F>

					<IonButton
						type="button"
						expand="block"
						onClick={() => void handleSave()}
						disabled={saving}
						style={{ marginTop: 8 }}
					>
						{saving ? (
							<IonSpinner name="crescent" />
						) : editingPub ? (
							'Actualizar publicador'
						) : (
							'Guardar publicador'
						)}
					</IonButton>
				</div>
			</IonContent>
		</IonModal>
	)

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
			<IonAlert
				isOpen={Boolean(error)}
				onDidDismiss={() => setError(null)}
				header="Error"
				message={error || ''}
				buttons={[{ text: 'OK', role: 'cancel' }]}
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
						Publicadores
					</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent fullscreen>
				{listBody}
				{formModal}
			</IonContent>
			{overlays}
		</IonPage>
	)
}

export default Publicadores
