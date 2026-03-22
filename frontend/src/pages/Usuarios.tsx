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
	IonAlert,
	IonModal,
	IonItem,
	IonSelect,
	IonSelectOption,
	IonLabel,
	IonToast,
	IonFab,
	IonFabButton,
} from '@ionic/react'
import React, { useState, useEffect, useCallback } from 'react'
import { add, arrowBackOutline, createOutline } from 'ionicons/icons'
import { apiService } from '../services/api'
import { useLoadSequence } from '../hooks/useLoadSequence'
import { Publicador, Role, Usuario } from '../types'

const errMsg = (e: unknown): string => {
	const err = e as {
		response?: { data?: { error?: { message?: string } } }
		message?: string
	}
	return err?.response?.data?.error?.message || err?.message || 'Error'
}

interface FormUsuario {
	email: string
	password: string
	idrole: string
	idpublicador: string
}

const FORM_EMPTY: FormUsuario = {
	email: '',
	password: '',
	idrole: '',
	idpublicador: '',
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

const Usuarios: React.FC = () => {
	const [usuarios, setUsuarios] = useState<Usuario[]>([])
	const [roles, setRoles] = useState<Role[]>([])
	const [publicadores, setPublicadores] = useState<Publicador[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
	const [form, setForm] = useState<FormUsuario>(FORM_EMPTY)
	const [saving, setSaving] = useState(false)
	const [toast, setToast] = useState<{
		show: boolean
		message: string
		color: 'success' | 'danger'
	}>({ show: false, message: '', color: 'success' })

	const loadSeq = useLoadSequence()

	const nombreRol = useCallback(
		(idrole: string | undefined) => {
			if (!idrole) return '—'
			const r = roles.find((x) => String(x.id) === String(idrole))
			return r?.role ?? idrole
		},
		[roles],
	)

	const nombrePublicador = useCallback(
		(idpub: string | number | undefined) => {
			if (idpub == null || idpub === '') return '—'
			const p = publicadores.find(
				(x) => String(x.id) === String(idpub),
			)
			return p?.nombre?.trim() || `ID ${String(idpub)}`
		},
		[publicadores],
	)

	async function loadData(opts?: { silent?: boolean }) {
		const silent = Boolean(opts?.silent)
		const seq = loadSeq.next()
		if (!silent) setLoading(true)
		setError(null)
		try {
			const uData = await apiService.get<Usuario[]>('/usuario')
			if (!loadSeq.isCurrent(seq)) return
			setUsuarios(
				Array.isArray(uData)
					? uData.sort((a, b) =>
							(a.email || '').localeCompare(b.email || '', 'es'),
						)
					: [],
			)
			try {
				const rData = await apiService.get<Role[]>('/role')
				if (loadSeq.isCurrent(seq)) {
					setRoles(Array.isArray(rData) ? rData : [])
				}
			} catch {
				if (loadSeq.isCurrent(seq)) setRoles([])
			}
			try {
				const pData = await apiService.get<Publicador[]>('/publicador')
				if (!loadSeq.isCurrent(seq)) return
				const list = Array.isArray(pData) ? pData : []
				setPublicadores(
					list.sort((a, b) =>
						(a.nombre || '').localeCompare(b.nombre || '', 'es'),
					),
				)
			} catch {
				if (loadSeq.isCurrent(seq)) setPublicadores([])
			}
		} catch (e: unknown) {
			if (loadSeq.isCurrent(seq)) setError(errMsg(e))
		} finally {
			if (!silent && loadSeq.isCurrent(seq)) setLoading(false)
		}
	}

	useEffect(() => {
		void loadData()
	}, [])

	const closeModal = () => {
		setShowModal(false)
		setEditingUsuario(null)
		setForm(FORM_EMPTY)
	}

	const openCreate = () => {
		;(document.activeElement as HTMLElement | null)?.blur()
		setEditingUsuario(null)
		const firstRole = roles[0]?.id
		setForm({
			...FORM_EMPTY,
			idrole: firstRole ? String(firstRole) : '',
		})
		setShowModal(true)
	}

	const openEdit = (u: Usuario) => {
		;(document.activeElement as HTMLElement | null)?.blur()
		setEditingUsuario(u)
		setForm({
			email: u.email ?? '',
			password: '',
			idrole: u.idrole ? String(u.idrole) : '',
			idpublicador: u.idpublicador ? String(u.idpublicador) : '',
		})
		setShowModal(true)
	}

	const handleSave = async () => {
		const email = form.email.trim()
		if (!email) {
			setToast({
				show: true,
				message: 'Indica el correo',
				color: 'danger',
			})
			return
		}
		if (!form.idrole) {
			setToast({
				show: true,
				message: 'Selecciona un rol',
				color: 'danger',
			})
			return
		}
		if (!editingUsuario && !form.password.trim()) {
			setToast({
				show: true,
				message: 'Indica la contraseña',
				color: 'danger',
			})
			return
		}
		if (!editingUsuario && form.password.trim().length < 6) {
			setToast({
				show: true,
				message: 'La contraseña debe tener al menos 6 caracteres',
				color: 'danger',
			})
			return
		}

		const pwdTrim = form.password.trim()
		if (editingUsuario && pwdTrim && pwdTrim.length < 6) {
			setToast({
				show: true,
				message: 'La nueva contraseña debe tener al menos 6 caracteres',
				color: 'danger',
			})
			return
		}

		const idpub = form.idpublicador.trim()
		const payloadPub = idpub ? idpub : null

		setSaving(true)
		try {
			if (editingUsuario?.id) {
				const body: {
					email: string
					idrole: string
					idpublicador: string | null
					password?: string
				} = {
					email,
					idrole: form.idrole,
					idpublicador: payloadPub,
				}
				if (pwdTrim) body.password = form.password
				await apiService.put(
					`/usuario/${encodeURIComponent(String(editingUsuario.id))}`,
					body,
				)
				setToast({
					show: true,
					message: 'Usuario actualizado',
					color: 'success',
				})
			} else {
				await apiService.post<Usuario>('/usuario', {
					email,
					password: form.password,
					idrole: form.idrole,
					idpublicador: payloadPub,
				})
				setToast({
					show: true,
					message: 'Usuario creado',
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

	const listContent = (
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
			{!loading && usuarios.length === 0 && (
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
					<p>No hay usuarios registrados.</p>
					<p style={{ marginTop: 8, fontSize: '0.85rem' }}>
						Pulsa + para crear uno.
					</p>
				</div>
			)}
			{!loading && usuarios.length > 0 && (
				<div
					style={{
						padding: '12px 16px',
						paddingBottom:
							'calc(5.5rem + env(safe-area-inset-bottom, 0px))',
					}}
				>
					{usuarios.map((u) => (
						<div
							key={String(u.id)}
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
									{u.email || '—'}
								</p>
								<p
									style={{
										margin: '6px 0 0',
										fontSize: '0.78rem',
										opacity: 0.85,
									}}
								>
									Rol: {nombreRol(u.idrole)}
								</p>
								{u.idpublicador ? (
									<p
										style={{
											margin: '4px 0 0',
											fontSize: '0.72rem',
											opacity: 0.65,
										}}
									>
										Publicador:{' '}
										{nombrePublicador(u.idpublicador)}
									</p>
								) : null}
							</div>
							<button
								type="button"
								aria-label={`Editar ${u.email}`}
								title="Editar usuario"
								onClick={(e) => {
									e.preventDefault()
									e.stopPropagation()
									openEdit(u)
								}}
								style={{
									flexShrink: 0,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									width: 40,
									height: 40,
									border: 'none',
									borderRadius: 10,
									background:
										'rgba(29, 104, 223, 0.35)',
									color: 'var(--ion-color-primary, #3880ff)',
									cursor: 'pointer',
								}}
							>
								<IonIcon
									icon={createOutline}
									style={{ fontSize: 20 }}
								/>
							</button>
						</div>
					))}
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
					<IonTitle style={{ color: '#ffffff' }}>
						{editingUsuario ? 'Actualizar usuario' : 'Nuevo usuario'}
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
					<div style={{ marginBottom: 12 }}>
						<label style={labelStyle}>Correo *</label>
						<input
							style={inputStyle}
							type="email"
							autoComplete="email"
							value={form.email}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									email: e.target.value,
								}))
							}
						/>
					</div>
					<div style={{ marginBottom: 12 }}>
						<label style={labelStyle}>
							{editingUsuario
								? 'Nueva contraseña (opcional)'
								: 'Contraseña *'}
						</label>
						<input
							style={inputStyle}
							type="password"
							autoComplete="new-password"
							value={form.password}
							onChange={(e) =>
								setForm((f) => ({
									...f,
									password: e.target.value,
								}))
							}
						/>
						{editingUsuario ? (
							<p
								style={{
									fontSize: '0.68rem',
									opacity: 0.75,
									marginTop: 6,
									color: 'rgba(255,255,255,0.75)',
								}}
							>
								Déjala vacía si no deseas cambiarla.
							</p>
						) : null}
					</div>
					<IonItem
						style={
							{
								'--background': 'transparent',
								'--border-color': 'rgba(255,255,255,0.2)',
							} as React.CSSProperties
						}
					>
						<IonLabel position="stacked" style={{ color: '#fff' }}>
							Rol *
						</IonLabel>
						<IonSelect
							interface="popover"
							value={form.idrole || undefined}
							placeholder="Selecciona rol"
							onIonChange={(e) =>
								setForm((f) => ({
									...f,
									idrole: String(e.detail.value ?? ''),
								}))
							}
						>
							{roles.map((r) => (
								<IonSelectOption
									key={String(r.id)}
									value={String(r.id)}
								>
									{r.role}
								</IonSelectOption>
							))}
						</IonSelect>
					</IonItem>
					<IonItem
						style={
							{
								'--background': 'transparent',
								'--border-color': 'rgba(255,255,255,0.2)',
								marginTop: 8,
							} as React.CSSProperties
						}
					>
						<IonLabel position="stacked" style={{ color: '#fff' }}>
							Publicador (opcional)
						</IonLabel>
						<IonSelect
							interface="popover"
							value={
								form.idpublicador
									? form.idpublicador
									: '__none__'
							}
							onIonChange={(e) => {
								const v = e.detail.value
								setForm((f) => ({
									...f,
									idpublicador:
										v === '__none__' || v == null
											? ''
											: String(v),
								}))
							}}
						>
							<IonSelectOption value="__none__">
								Sin publicador
							</IonSelectOption>
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
					<IonButton
						type="button"
						expand="block"
						style={{ marginTop: 20 }}
						onClick={() => void handleSave()}
						disabled={saving}
					>
						{saving ? (
							<IonSpinner name="crescent" />
						) : editingUsuario ? (
							'Guardar cambios'
						) : (
							'Crear usuario'
						)}
					</IonButton>
				</div>
			</IonContent>
		</IonModal>
	)

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
						Usuarios
					</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent fullscreen>
				{listContent}
				{formModal}
				{!loading && (
					<IonFab vertical="bottom" horizontal="end" slot="fixed">
						<IonFabButton
							onClick={openCreate}
							aria-label="Crear usuario"
							title="Crear usuario"
						>
							<IonIcon icon={add} />
						</IonFabButton>
					</IonFab>
				)}
			</IonContent>

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

export default Usuarios
