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
} from '@ionic/react'
import React, { useEffect, useState } from 'react'
import { statsChartOutline, createOutline, arrowBackOutline } from 'ionicons/icons'
import { apiService } from '../services/api'
import { getPublicadores } from '../services/publicador.service'
import { getRegistros } from '../services/registro.service'
import { getAsistencias } from '../services/asistencia.service'
import { Publicador, Registro, Asistencia } from '../types'

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
	const [showAsistenciaEditModal, setShowAsistenciaEditModal] = useState(false)
	const [editingAsistencia, setEditingAsistencia] = useState<Asistencia | null>(null)
	const [asistenciaForm, setAsistenciaForm] = useState({ fecha: '', presencial: '', zoom: '' })
	const [savingAsistencia, setSavingAsistencia] = useState(false)
	const [asistenciaError, setAsistenciaError] = useState<string | null>(null)

	useEffect(() => {
		const load = async () => {
			setLoading(true)
			setError(null)
			try {
				const [publicadores, registros, asistenciasData] = await Promise.all([
					getPublicadores(),
					getRegistros(),
					getAsistencias(),
				])
				setEstado(buildEstadoInformes(publicadores, registros))
				setAsistencias(asistenciasData)
			} catch (e: any) {
				setError(e.message || 'Error al cargar estado de informes')
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [])

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

	return (
		<IonPage>
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
			</IonContent>

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
		</IonPage>
	)
}

export default Reports
