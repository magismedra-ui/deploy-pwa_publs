import {
	IonContent,
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButton,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardSubtitle,
	IonCardTitle,
	IonItem,
	IonLabel,
	IonIcon,
	IonSpinner,
	IonModal,
	IonButtons,
	IonFab,
	IonFabButton,
	IonToast,
} from '@ionic/react'
import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { AddInfoPublForm } from '../components/AddInfoPublForm'
import {
	useAddInfoPubl,
	type AddInfoPublPayload,
} from '../hooks/useAddInfoPubl'
import {
	statsChartOutline,
	createOutline,
	arrowBackOutline,
	add,
	eyeOutline,
	checkmarkCircle,
	closeCircle,
} from 'ionicons/icons'
import { apiService } from '../services/api'
import { getPublicadores } from '../services/publicador.service'
import { getRegistros } from '../services/registro.service'
import { getAsistencias } from '../services/asistencia.service'
import { Publicador, Registro, Asistencia, AddInfoPubl } from '../types'

interface AddInfoPublListRow extends AddInfoPubl {
	publicador_nombre?: string
}

interface GrupoEstadoInforme {
	grupoId: number
	faltan: number
	texto: string
}

const MESES_ES: string[] = [
	'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
	'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function getPrimerDiaMesAnterior(): { anno: number; mesNombre: string } {
	const d = new Date()
	d.setDate(1)
	d.setMonth(d.getMonth() - 1)
	const anno = d.getFullYear()
	const mesIndex = d.getMonth()
	const mesNombre = MESES_ES[mesIndex]
	return { anno, mesNombre }
}

function buildEstadoInformes(
	publicadores: Publicador[],
	registros: Registro[],
): { anno: number; mesNombre: string; gruposEstado: GrupoEstadoInforme[] } {
	const { anno, mesNombre } = getPrimerDiaMesAnterior()
	const idToGrupo = new Map<string, number>()
	for (const p of publicadores) {
		const g = p.grupo != null ? Number(p.grupo) : 0
		if (g > 0 && p.id) idToGrupo.set(p.id, g)
	}
	const cantidadPorGrupo = new Map<number, number>()
	for (const p of publicadores) {
		const g = p.grupo != null ? Number(p.grupo) : 0
		if (g <= 0 || isNaN(g)) continue
		cantidadPorGrupo.set(g, (cantidadPorGrupo.get(g) ?? 0) + 1)
	}
	const registrosMes = registros.filter((r) => {
		const rAnno = r.anno_servicio != null ? Number(r.anno_servicio) : null
		const rMes = r.mes != null ? String(r.mes).trim() : ''
		return rAnno === anno && rMes === mesNombre
	})
	const reportadosPorGrupo = new Map<number, number>()
	for (const r of registrosMes) {
		const grupo = idToGrupo.get(String(r.idpublicador))
		if (grupo != null) {
			reportadosPorGrupo.set(grupo, (reportadosPorGrupo.get(grupo) ?? 0) + 1)
		}
	}
	const gruposOrdenados = Array.from(cantidadPorGrupo.keys()).sort((a, b) => a - b)
	const gruposEstado: GrupoEstadoInforme[] = gruposOrdenados.map((grupoId) => {
		const cantidad = cantidadPorGrupo.get(grupoId) ?? 0
		const reportados = reportadosPorGrupo.get(grupoId) ?? 0
		const faltan = Math.max(0, cantidad - reportados)
		const texto =
			faltan === 0 ? 'Informes completos' : `${faltan} Faltan por informar`
		return { grupoId, faltan, texto }
	})
	return { anno, mesNombre, gruposEstado }
}

function formatFecha(fecha: string | Date): string {
	const d = new Date(fecha)
	if (isNaN(d.getTime())) return String(fecha)
	const dia = String(d.getUTCDate()).padStart(2, '0')
	const mes = String(d.getUTCMonth() + 1).padStart(2, '0')
	const anno = d.getUTCFullYear()
	return `${dia}/${mes}/${anno}`
}

function nombreAddInfoPubl(row: AddInfoPublListRow): string {
	return row.publicador_nombre?.trim() || '—'
}

function pastoreoEsTrue(row: AddInfoPublListRow): boolean {
	if (row.pastoreo === true) return true
	if (row.pastoreo === false) return false
	if (typeof row.pastoreo === 'number') return row.pastoreo !== 0
	return Boolean(row.pastoreo)
}

const ADD_INFO_TEXT: React.CSSProperties = { color: '#ffffff' }

function mensajeErrorApi(err: unknown): string {
	if (axios.isAxiosError(err)) {
		const d = err.response?.data as { error?: { message?: string } } | undefined
		return d?.error?.message || err.message || 'Error de red'
	}
	if (err instanceof Error) return err.message
	return 'Error desconocido'
}

function filtrarAsistenciasMesActual(asistencias: Asistencia[]): Asistencia[] {
	const ahora = new Date()
	const mesActual = ahora.getMonth()
	const annoActual = ahora.getFullYear()
	return asistencias.filter((a) => {
		const d = new Date(a.fecha)
		return d.getUTCMonth() === mesActual && d.getUTCFullYear() === annoActual
	})
}

const Reports: React.FC = () => {
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [estado, setEstado] = useState<{ anno: number; mesNombre: string; gruposEstado: GrupoEstadoInforme[] } | null>(null)
	const [asistencias, setAsistencias] = useState<Asistencia[]>([])
	const [addInfoRows, setAddInfoRows] = useState<AddInfoPublListRow[]>([])
	const [showAsistenciaEditModal, setShowAsistenciaEditModal] = useState(false)
	const [editingAsistencia, setEditingAsistencia] = useState<Asistencia | null>(null)
	const [asistenciaForm, setAsistenciaForm] = useState({ fecha: '', presencial: '', zoom: '' })
	const [savingAsistencia, setSavingAsistencia] = useState(false)
	const [asistenciaError, setAsistenciaError] = useState<string | null>(null)
	const [showAddInfoDetailModal, setShowAddInfoDetailModal] = useState(false)
	const [addInfoDetailRow, setAddInfoDetailRow] =
		useState<AddInfoPublListRow | null>(null)
	const [showAddInfoNewModal, setShowAddInfoNewModal] = useState(false)
	const [addInfoNewToast, setAddInfoNewToast] = useState<{
		show: boolean
		message: string
		color: 'success' | 'danger'
	}>({ show: false, message: '', color: 'success' })
	const { create } = useAddInfoPubl()
	const queryClient = useQueryClient()

	const reloadAddInfoRows = useCallback(async () => {
		try {
			const addInfoData = await apiService.get<AddInfoPublListRow[]>(
				'/addinfopubl',
			)
			const listAdd = Array.isArray(addInfoData) ? addInfoData : []
			setAddInfoRows(
				listAdd.sort(
					(a, b) =>
						new Date(b.fecha as string).getTime() -
						new Date(a.fecha as string).getTime(),
				),
			)
		} catch (e) {
			console.error('[Reportes] No se pudo recargar addinfopubl:', e)
			// No vaciar la lista: el alta pudo ser OK y fallar solo el GET
		}
	}, [])

	useEffect(() => {
		const load = async () => {
			setLoading(true)
			setError(null)
			try {
				const [publicadores, registros, asistenciasData] =
					await Promise.all([
						getPublicadores(),
						getRegistros(),
						getAsistencias(),
					])
				setEstado(buildEstadoInformes(publicadores, registros))
				setAsistencias(asistenciasData)

				await reloadAddInfoRows()
			} catch (e: any) {
				setError(e.message || 'Error al cargar estado de informes')
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [reloadAddInfoRows])

	const openEditAsistenciaModal = (a: Asistencia) => {
		setEditingAsistencia(a)
		setAsistenciaError(null)
		setAsistenciaForm({
			fecha: typeof a.fecha === 'string'
				? a.fecha.split('T')[0]
				: new Date(a.fecha).toISOString().split('T')[0],
			presencial: String(a.presencial ?? ''),
			zoom: String(a.zoom ?? ''),
		})
		;(document.activeElement as HTMLElement | null)?.blur()
		setShowAsistenciaEditModal(true)
	}

	const closeEditAsistenciaModal = () => {
		setShowAsistenciaEditModal(false)
		setEditingAsistencia(null)
		setAsistenciaError(null)
	}

	const handleSaveEditAsistencia = async () => {
		if (!editingAsistencia?.id) return
		setSavingAsistencia(true)
		setAsistenciaError(null)
		try {
			const payload = {
				fecha: asistenciaForm.fecha,
				presencial: Number(asistenciaForm.presencial) || 0,
				zoom: Number(asistenciaForm.zoom) || 0,
			}
			await apiService.put(`/asistencia/${editingAsistencia.id}`, payload)
			const asistenciasData = await getAsistencias()
			setAsistencias(Array.isArray(asistenciasData) ? asistenciasData : [])
			closeEditAsistenciaModal()
		} catch (e: any) {
			setAsistenciaError(
				e?.response?.data?.error?.message || e.message || 'Error al guardar asistencia',
			)
		} finally {
			setSavingAsistencia(false)
		}
	}

	const openAddInfoDetailModal = (row: AddInfoPublListRow) => {
		setAddInfoDetailRow(row)
		;(document.activeElement as HTMLElement | null)?.blur()
		setShowAddInfoDetailModal(true)
	}

	const closeAddInfoDetailModal = () => {
		setShowAddInfoDetailModal(false)
		setAddInfoDetailRow(null)
	}

	const handleFabNuevoAddInfoPubl = () => {
		;(document.activeElement as HTMLElement | null)?.blur()
		setShowAddInfoNewModal(true)
	}

	const closeAddInfoNewModal = () => {
		setShowAddInfoNewModal(false)
	}

	const handleSubmitNewAddInfo = async (data: AddInfoPublPayload) => {
		try {
			await create.mutateAsync(data)
			await queryClient.invalidateQueries({ queryKey: ['addinfopubl'] })
			setAddInfoNewToast({
				show: true,
				message: 'Registro guardado correctamente',
				color: 'success',
			})
			await reloadAddInfoRows()
			setShowAddInfoNewModal(false)
		} catch (err: unknown) {
			setAddInfoNewToast({
				show: true,
				message: mensajeErrorApi(err),
				color: 'danger',
			})
		}
	}

	return (
		<IonPage className="reports-page">
			<IonHeader>
				<IonToolbar style={{ '--background': '#000000', '--color': '#ffffff' } as any}>
					<IonTitle>Reportes</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen className="ion-padding">
				<IonCard>
					<IonCardHeader>
						<IonCardSubtitle style={{ color: '#2dd36f' }}>
							Estado de los Informes
						</IonCardSubtitle>
						<IonCardTitle style={{ fontSize: '1rem' }}>
							<IonIcon icon={statsChartOutline} style={{ marginRight: 8 }} />
							{estado ? `${estado.mesNombre} / ${estado.anno}` : 'Mes anterior'}
						</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						{loading && (
							<div className="ion-text-center ion-padding">
								<IonSpinner name="crescent" />
								<p>Cargando estado de informes...</p>
							</div>
						)}
						{!loading && error && (
							<p style={{ color: 'var(--ion-color-danger)' }}>{error}</p>
						)}
						{!loading && !error && estado && (
							<>
								<p style={{ fontSize: '0.8rem', marginBottom: 8 }}>
									Mes de servicio: {estado.mesNombre} / {estado.anno}
								</p>
								{estado.gruposEstado.map((g) => (
									<p
										key={g.grupoId}
										style={{ fontSize: '0.8rem', marginBottom: 4 }}
									>
										<span style={{ fontWeight: 600 }}>Grupo {g.grupoId}:</span>{' '}
										{g.faltan === 0 ? 'Informes completos' : `${g.faltan} Faltan por informar`}
									</p>
								))}
							</>
						)}
					</IonCardContent>
				</IonCard>

				<IonCard>
					<IonCardHeader>
						<IonCardSubtitle style={{ color: '#2dd36f' }}>
							Asistencia — últimos registros
						</IonCardSubtitle>
						<IonCardTitle style={{ fontSize: '1rem' }}>
							<IonIcon icon={statsChartOutline} style={{ marginRight: 8 }} />
							Listado de Asistencia
						</IonCardTitle>
					</IonCardHeader>
					<IonCardContent>
						{loading && (
							<div className="ion-text-center ion-padding">
								<IonSpinner name="crescent" />
								<p>Cargando asistencias...</p>
							</div>
						)}
						{!loading && !error && filtrarAsistenciasMesActual(asistencias).length === 0 && (
							<p style={{ fontSize: '0.85rem' }}>
								No hay asistencias registradas este mes.
							</p>
						)}
						{!loading && !error && asistencias.length > 0 && (
							filtrarAsistenciasMesActual(asistencias)
								.slice()
								.sort((a, b) => new Date(b.fecha as any).getTime() - new Date(a.fecha as any).getTime())
								.map((a) => (
									<IonItem key={a.id} lines="full">
										<IonLabel>
											<h2 style={{ fontSize: '0.9rem' }}>
												{formatFecha(a.fecha)}
											</h2>
											<p style={{ fontSize: '0.8rem' }}>
												Presencial: {a.presencial ?? 0} · Zoom: {a.zoom ?? 0}
											</p>
										</IonLabel>
										<IonButton
											slot="end"
											size="small"
											fill="outline"
											color="primary"
											onClick={() => openEditAsistenciaModal(a)}
										>
											<IonIcon icon={createOutline} slot="start" />
											Editar
										</IonButton>
									</IonItem>
								))
						)}
					</IonCardContent>
				</IonCard>

				<IonCard>
					<IonCardHeader>
						<IonCardTitle style={{ fontSize: '1rem' }}>
							<IonIcon icon={statsChartOutline} style={{ marginRight: 8 }} />
							Listado de Info Publicadores
						</IonCardTitle>
						<IonCardSubtitle style={{ color: '#2dd36f', marginTop: 8 }}>
							Guia de actividades de pastoreo
						</IonCardSubtitle>
					</IonCardHeader>
					<IonCardContent>
						{loading && (
							<div className="ion-text-center ion-padding">
								<IonSpinner name="crescent" />
								<p>Cargando información de publicadores...</p>
							</div>
						)}
						{!loading && addInfoRows.length === 0 && (
							<p style={{ fontSize: '0.85rem', ...ADD_INFO_TEXT }}>
								No hay registros de información adicional.
							</p>
						)}
						{!loading &&
							addInfoRows.map((row) => (
								<IonItem
									key={String(row.id)}
									lines="full"
									style={{
										'--color': '#ffffff',
										'--border-color': 'rgba(255,255,255,0.2)',
									} as React.CSSProperties}
								>
									<IonLabel>
										<h2 style={{ fontSize: '0.9rem', ...ADD_INFO_TEXT }}>
											{formatFecha(row.fecha)}
										</h2>
										<p
											style={{
												fontSize: '0.85rem',
												marginTop: 6,
												...ADD_INFO_TEXT,
											}}
										>
											{nombreAddInfoPubl(row)}
										</p>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: 8,
												marginTop: 10,
											}}
										>
											<span style={{ fontSize: '0.8rem', ...ADD_INFO_TEXT }}>
												Pastoreo
											</span>
											<IonIcon
												icon={
													pastoreoEsTrue(row)
														? checkmarkCircle
														: closeCircle
												}
												style={{
													fontSize: '1.35rem',
													color: pastoreoEsTrue(row)
														? '#2dd36f'
														: 'rgba(255,255,255,0.6)',
												}}
												aria-hidden
											/>
										</div>
									</IonLabel>
									<IonButton
										slot="end"
										fill="clear"
										aria-label="Ver detalle"
										onClick={() => openAddInfoDetailModal(row)}
									>
										<IonIcon
											icon={eyeOutline}
											style={{ color: '#ffffff', fontSize: '1.5rem' }}
										/>
									</IonButton>
								</IonItem>
							))}
					</IonCardContent>
				</IonCard>
			</IonContent>

			<IonFab vertical="bottom" horizontal="end" slot="fixed">
				<IonFabButton
					onClick={handleFabNuevoAddInfoPubl}
					aria-label="Nueva información de publicador"
				>
					<IonIcon icon={add} />
				</IonFabButton>
			</IonFab>

			<IonModal
				key={showAddInfoNewModal ? 'addinfo-new-open' : 'addinfo-new-closed'}
				isOpen={showAddInfoNewModal}
				onDidDismiss={closeAddInfoNewModal}
			>
				<IonHeader>
					<IonToolbar style={{ '--background': '#000000', '--color': '#ffffff' } as any}>
						<IonButtons slot="start">
							<IonButton
								onClick={closeAddInfoNewModal}
								style={{ color: '#ffffff' }}
							>
								<IonIcon icon={arrowBackOutline} slot="icon-only" />
							</IonButton>
						</IonButtons>
						<IonTitle style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem' }}>
							NUEVA INFO PUBLICADOR
						</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent fullscreen className="ion-padding" style={{ '--background': '#1D68DF' } as any}>
					<div style={{ background: '#041955', borderRadius: 12, padding: '16px' }}>
						<AddInfoPublForm
							onSubmit={handleSubmitNewAddInfo}
							onCancel={closeAddInfoNewModal}
							isSubmitting={create.isPending}
						/>
					</div>
				</IonContent>
			</IonModal>

			<IonToast
				isOpen={addInfoNewToast.show}
				message={addInfoNewToast.message}
				color={addInfoNewToast.color as any}
				duration={2000}
				onDidDismiss={() =>
					setAddInfoNewToast((t) => ({ ...t, show: false }))
				}
			/>

			<IonModal
				key={showAsistenciaEditModal ? 'open' : 'closed'}
				isOpen={showAsistenciaEditModal}
				onDidDismiss={closeEditAsistenciaModal}
			>
				<IonHeader>
					<IonToolbar style={{ '--background': '#000000', '--color': '#ffffff' } as any}>
						<IonButtons slot="start">
							<IonButton onClick={closeEditAsistenciaModal} style={{ color: '#ffffff' }}>
								<IonIcon icon={arrowBackOutline} slot="icon-only" />
							</IonButton>
						</IonButtons>
						<IonTitle style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem' }}>
							EDITAR ASISTENCIA
						</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding" style={{ '--background': '#1D68DF' } as any}>
					<div style={{ background: '#041955', borderRadius: 12, padding: '16px' }}>
						<div style={{ marginBottom: 12 }}>
							<label
								style={{
									fontSize: '0.72rem',
									color: 'rgba(255,255,255,0.6)',
									display: 'block',
									marginBottom: 4,
								}}
							>
								Fecha
							</label>
							<input
								type="date"
								value={asistenciaForm.fecha}
								onChange={(e) => setAsistenciaForm((f) => ({ ...f, fecha: e.target.value }))}
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
						<div style={{ marginBottom: 12 }}>
							<label
								style={{
									fontSize: '0.72rem',
									color: 'rgba(255,255,255,0.6)',
									display: 'block',
									marginBottom: 4,
								}}
							>
								Presencial
							</label>
							<input
								type="number"
								min={0}
								value={asistenciaForm.presencial}
								onChange={(e) => setAsistenciaForm((f) => ({ ...f, presencial: e.target.value }))}
								placeholder="0"
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
						<div style={{ marginBottom: 20 }}>
							<label
								style={{
									fontSize: '0.72rem',
									color: 'rgba(255,255,255,0.6)',
									display: 'block',
									marginBottom: 4,
								}}
							>
								Zoom
							</label>
							<input
								type="number"
								min={0}
								value={asistenciaForm.zoom}
								onChange={(e) => setAsistenciaForm((f) => ({ ...f, zoom: e.target.value }))}
								placeholder="0"
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

						{asistenciaError && (
							<p style={{ color: 'var(--ion-color-danger)', fontSize: '0.85rem' }}>
								{asistenciaError}
							</p>
						)}

						<IonButton expand="block" onClick={handleSaveEditAsistencia} disabled={savingAsistencia}>
							{savingAsistencia ? <IonSpinner name="crescent" /> : 'Guardar'}
						</IonButton>
					</div>
				</IonContent>
			</IonModal>

			<IonModal
				key={showAddInfoDetailModal ? 'addinfo-open' : 'addinfo-closed'}
				isOpen={showAddInfoDetailModal}
				onDidDismiss={closeAddInfoDetailModal}
			>
				<IonHeader>
					<IonToolbar style={{ '--background': '#000000', '--color': '#ffffff' } as any}>
						<IonButtons slot="start">
							<IonButton
								onClick={closeAddInfoDetailModal}
								style={{ color: '#ffffff' }}
							>
								<IonIcon icon={arrowBackOutline} slot="icon-only" />
							</IonButton>
						</IonButtons>
						<IonTitle style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem' }}>
							INFO PUBLICADOR
						</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding" style={{ '--background': '#1D68DF' } as any}>
					{addInfoDetailRow && (
						<div
							style={{
								background: '#041955',
								borderRadius: 12,
								padding: '16px',
								color: '#ffffff',
							}}
						>
							{[
								{ k: 'Fecha', v: formatFecha(addInfoDetailRow.fecha) },
								{
									k: 'Publicador',
									v: nombreAddInfoPubl(addInfoDetailRow),
								},
								{
									k: 'Pastoreo',
									v: pastoreoEsTrue(addInfoDetailRow) ? 'Sí' : 'No',
								},
								{
									k: 'Observaciones',
									v:
										addInfoDetailRow.observaciones?.trim() ||
										'—',
								},
							].map(({ k, v }) => (
								<div key={k} style={{ marginBottom: 14 }}>
									<p
										style={{
											fontSize: '0.72rem',
											color: 'rgba(255,255,255,0.6)',
											marginBottom: 4,
										}}
									>
										{k}
									</p>
									<p style={{ fontSize: '0.95rem', margin: 0 }}>{v}</p>
								</div>
							))}
						</div>
					)}
				</IonContent>
			</IonModal>
		</IonPage>
	)
}

export default Reports
