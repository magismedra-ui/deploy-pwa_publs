import {
	IonButton, IonButtons, IonCard,
	IonCardContent, IonCardHeader, IonCardSubtitle,
	IonCheckbox, IonCol, IonContent, IonFab, IonFabButton, IonGrid,
	IonHeader, IonIcon, IonItem, IonModal, IonPage, IonRow,
	IonSpinner, IonTitle, IonToolbar
} from '@ionic/react'
import { useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { addOutline, arrowBackOutline } from 'ionicons/icons'
import { useAuth } from '../hooks/useAuth'
import { getPublicadores } from '../services/publicador.service'
import { getAsistencias } from '../services/asistencia.service'
import { getRegistros } from '../services/registro.service'
import { apiService } from '../services/api'
import { Publicador, Asistencia, Registro } from '../types'
import styles from './Home.module.scss'

export interface GrupoCard {
	id: number
	name: string
	color: string
	capitan: string
	auxiliar: string
	cantidad: number
	route: string
}

const COLORES_GRUPOS = ['#63e263', '#3dc2ff', '#ffc409', '#eb445a', '#ff8c00']

function buildGruposFromPublicadores(publicadores: Publicador[]): GrupoCard[] {
	const byGrupo = new Map<number, Publicador[]>()
	for (const p of publicadores) {
		const g = p.grupo != null ? Number(p.grupo) : 0
		if (g <= 0 || isNaN(g)) continue
		if (!byGrupo.has(g)) byGrupo.set(g, [])
		byGrupo.get(g)!.push(p)
	}
	const sortedIds = Array.from(byGrupo.keys()).sort((a, b) => a - b)
	return sortedIds.map((grupoId, index) => {
		const list = byGrupo.get(grupoId)!
		const capitan = list.find((p) => Boolean(p.capitan))?.nombre ?? ''
		const auxiliar = list.find((p) => Boolean(p.auxiliar))?.nombre ?? ''
		const color = COLORES_GRUPOS[index % COLORES_GRUPOS.length]
		return {
			id: grupoId,
			name: `Grupo ${grupoId}`,
			color,
			capitan,
			auxiliar,
			cantidad: list.length,
			route: '/tabs/grupos'
		}
	})
}

// --- Tipos Información Reciente (id 1, 2, 3) ---
const MESES_ES: string[] = [
	'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
	'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

/** Formato: "Enero 31/2026" para fecha_registro de Asistencia */
function formatFechaRegistro(fecha: string): string {
	if (!fecha || typeof fecha !== 'string') return ''
	const d = new Date(fecha)
	if (isNaN(d.getTime())) return fecha
	const dia = d.getDate()
	const mesIndex = d.getMonth()
	const anno = d.getFullYear()
	return `${MESES_ES[mesIndex]} ${dia}/${anno}`
}

function formatFechaActual(): string {
	const d = new Date()
	const day = String(d.getDate()).padStart(2, '0')
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const year = d.getFullYear()
	return `${day}/${month}/${year}`
}

function getPrimerDiaMesAnterior(): { anno: number; mes: string; mesNombre: string } {
	const d = new Date()
	d.setDate(1)
	d.setMonth(d.getMonth() - 1)
	const anno = d.getFullYear()
	const mesIndex = d.getMonth()
	const mesNombre = MESES_ES[mesIndex]
	return { anno, mes: mesNombre, mesNombre }
}

export interface InfoRecienteBase {
	id: number
	note: string
	fecha: string
	color: string
	complete: boolean
}

export interface InfoRecienteCongregacion extends InfoRecienteBase {
	id: 1
	publicadores: number
	p_auxiliares: number
	p_regulares: number
	p_nobautizados: number
	total: number
}

export interface InfoRecienteAsistencia extends InfoRecienteBase {
	id: 2
	fecha_registro: string
	presencia: number
	zoom: number
	total: number
}

export interface GrupoEstadoInforme {
	grupoId: number
	faltan: number
	texto: string
}

export interface InfoRecienteInformes extends InfoRecienteBase {
	id: 3
	anno: number
	mes: string
	gruposEstado: GrupoEstadoInforme[]
}

/** Info a la sucursal (último mes en tabla registro) */
export interface InfoRecienteSucursal extends InfoRecienteBase {
	id: 4
	mesTitulo: string
	n1: number
	n2: number
	n3: number
	n4: number
	n5: number
	n6: number
	n7: number
	n8: number
}

export type InfoRecienteItem =
	| InfoRecienteCongregacion
	| InfoRecienteAsistencia
	| InfoRecienteSucursal
	| InfoRecienteInformes

function normalizarPrecursor(val: string | undefined): string {
	if (val == null || typeof val !== 'string') return ''
	return val.trim().toUpperCase()
}

/** Registro de servicio: PUBLICADOR o PUBLICADOR NO BAUTIZADO */
function esPrecursorPublicadorServicio(p: string | undefined): boolean {
	const v = normalizarPrecursor(p)
	return v === 'PUBLICADOR' || v === 'PUBLICADOR NO BAUTIZADO'
}

/** Precursor auxiliar: PA o texto completo en BD */
function esPrecursorPAServicio(p: string | undefined): boolean {
	const v = normalizarPrecursor(p)
	return (
		v === 'PA' ||
		v === 'PRECURSOR AUXILIAR' ||
		v === 'PRECURSORA AUXILIAR'
	)
}

/** Precursor regular: PR o texto completo en BD */
function esPrecursorPRServicio(p: string | undefined): boolean {
	const v = normalizarPrecursor(p)
	return (
		v === 'PR' ||
		v === 'PRECURSOR REGULAR' ||
		v === 'PRECURSORA REGULAR'
	)
}

/** Alinea el mes de la BD con MESES_ES (mayúsculas/minúsculas) */
function mesNombreCanon(mes: string): string | null {
	const t = mes.trim()
	const idx = MESES_ES.findIndex(
		(m) => m.toLowerCase() === t.toLowerCase(),
	)
	return idx >= 0 ? MESES_ES[idx] : null
}

/** Solo registros con predico verdadero (API puede enviar boolean o 1/0) */
function registroPredicoSi(r: Registro): boolean {
	if (r.predico === true) return true
	if (r.predico === false) return false
	if (typeof r.predico === 'number') return r.predico === 1
	return false
}

function getUltimoMesRegistro(
	registros: Registro[],
): { mesNombre: string; anno: number } | null {
	let best: { y: number; m: number; mesNombre: string } | null = null
	for (const r of registros) {
		if (r.mes == null || r.anno_servicio == null) continue
		const canon = mesNombreCanon(String(r.mes))
		if (!canon) continue
		const anno = Number(r.anno_servicio)
		if (isNaN(anno)) continue
		const mi = MESES_ES.indexOf(canon)
		if (mi < 0) continue
		if (
			!best ||
			anno > best.y ||
			(anno === best.y && mi > best.m)
		) {
			best = { y: anno, m: mi, mesNombre: canon }
		}
	}
	return best ? { mesNombre: best.mesNombre, anno: best.y } : null
}

function buildInfoSucursal(
	registros: Registro[],
	fecha: string,
): InfoRecienteSucursal {
	const registrosConPredico = registros.filter((r) => registroPredicoSi(r))
	const ultimo = getUltimoMesRegistro(registrosConPredico)
	const colorSucursal = '#3dc2ff'

	if (!ultimo) {
		return {
			id: 4,
			note: 'Info a la sucursal mes: —',
			fecha,
			color: colorSucursal,
			complete: true,
			mesTitulo: '—',
			n1: 0,
			n2: 0,
			n3: 0,
			n4: 0,
			n5: 0,
			n6: 0,
			n7: 0,
			n8: 0,
		}
	}

	const { mesNombre, anno } = ultimo
	const delMes = registrosConPredico.filter((r) => {
		const rAnno =
			r.anno_servicio != null ? Number(r.anno_servicio) : null
		const rMes = r.mes != null ? mesNombreCanon(String(r.mes)) : null
		return rAnno === anno && rMes === mesNombre
	})

	const pub = delMes.filter((r) => esPrecursorPublicadorServicio(r.precursor))
	const n1 = pub.length
	const n2 = pub.reduce((s, r) => s + (Number(r.cursos) || 0), 0)

	const pa = delMes.filter((r) => esPrecursorPAServicio(r.precursor))
	const n3 = pa.length
	const n4 = pa.reduce((s, r) => s + (Number(r.horas) || 0), 0)
	const n5 = pa.reduce((s, r) => s + (Number(r.cursos) || 0), 0)

	const pr = delMes.filter((r) => esPrecursorPRServicio(r.precursor))
	const n6 = pr.length
	const n7 = pr.reduce((s, r) => s + (Number(r.horas) || 0), 0)
	const n8 = pr.reduce((s, r) => s + (Number(r.cursos) || 0), 0)

	return {
		id: 4,
		note: `Info a la sucursal mes: ${mesNombre} ${anno}`,
		fecha,
		color: colorSucursal,
		complete: true,
		mesTitulo: `${mesNombre} ${anno}`,
		n1,
		n2,
		n3,
		n4,
		n5,
		n6,
		n7,
		n8,
	}
}

function buildInfoCongregacion(
	publicadores: Publicador[],
	fecha: string
): InfoRecienteCongregacion {
	const pub = publicadores.filter(
		(p) => normalizarPrecursor(p.precursor) === 'PUBLICADOR'
	).length
	const pAux = publicadores.filter((p) => {
		const v = normalizarPrecursor(p.precursor)
		return v === 'PRECURSOR AUXILIAR' || v === 'PRECURSORA AUXILIAR'
	}).length
	const pReg = publicadores.filter((p) => {
		const v = normalizarPrecursor(p.precursor)
		return v === 'PRECURSOR REGULAR' || v === 'PRECURSORA REGULAR'
	}).length
	const pNoBaut = publicadores.filter(
		(p) => normalizarPrecursor(p.precursor) === 'PUBLICADOR NO BAUTIZADO'
	).length
	const total = pub + pAux + pReg + pNoBaut
	return {
		id: 1,
		note: 'Info de congregación.',
		fecha,
		color: '#63e263',
		complete: true,
		publicadores: pub,
		p_auxiliares: pAux,
		p_regulares: pReg,
		p_nobautizados: pNoBaut,
		total
	}
}

function buildInfoAsistencia(
	asistencias: Asistencia[],
	fecha: string
): InfoRecienteAsistencia {
	const ordenadas = [...asistencias].sort((a, b) => {
		const da = new Date(a.fecha).getTime()
		const db = new Date(b.fecha).getTime()
		return db - da
	})
	const ultima = ordenadas[0]
	const fechaRegistro = ultima?.fecha
		? (typeof ultima.fecha === 'string'
			? ultima.fecha
			: new Date(ultima.fecha).toISOString().split('T')[0])
		: ''
	const presencia = Number(ultima?.presencial ?? 0) || 0
	const zoom = Number(ultima?.zoom ?? 0) || 0
	const total = presencia + zoom
	return {
		id: 2,
		note: 'Asistencia',
		fecha,
		color: '#3dc2ff',
		complete: true,
		fecha_registro: fechaRegistro,
		presencia,
		zoom,
		total,
	}
}

function buildInfoInformes(
	publicadores: Publicador[],
	registros: Registro[],
	fecha: string
): InfoRecienteInformes {
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
	return {
		id: 3,
		note: 'Estado de los Informes',
		fecha,
		anno,
		mes: mesNombre,
		color: '#ffffff',
		complete: true,
		gruposEstado
	}
}

function buildInformacionReciente(
	publicadores: Publicador[],
	asistencias: Asistencia[],
	registros: Registro[]
): InfoRecienteItem[] {
	const fecha = formatFechaActual()
	return [
		buildInfoCongregacion(publicadores, fecha),
		buildInfoAsistencia(asistencias, fecha),
		buildInfoSucursal(registros, fecha),
		buildInfoInformes(publicadores, registros, fecha),
	]
}

const Home: React.FC = () => {
	const history = useHistory()
	const location = useLocation()
	const { logout, user, isAuthenticated } = useAuth()
	const [grupos, setGrupos] = useState<GrupoCard[]>([])
	const [informacionReciente, setInformacionReciente] = useState<InfoRecienteItem[]>([])
	const [loading, setLoading] = useState(true)
	const [errorGrupos, setErrorGrupos] = useState<string | null>(null)
	const [errorInfo, setErrorInfo] = useState<string | null>(null)
	const [showAsistenciaModal, setShowAsistenciaModal] = useState(false)
	const [asistenciaForm, setAsistenciaForm] = useState({ fecha: '', presencial: '', zoom: '' })
	const [savingAsistencia, setSavingAsistencia] = useState(false)
	const [asistenciaError, setAsistenciaError] = useState<string | null>(null)
	const [editingAsistenciaId, setEditingAsistenciaId] = useState<string | null>(null)

	// Cargar datos al montar y cuando el usuario esté autenticado (p. ej. tras login)
	useEffect(() => {
		if (!isAuthenticated) return

		async function load() {
			setLoading(true)
			setErrorGrupos(null)
			setErrorInfo(null)
			try {
				const [publicadores, asistencias, registros] = await Promise.all([
					getPublicadores(),
					getAsistencias(),
					getRegistros()
				])
				setGrupos(buildGruposFromPublicadores(publicadores))
				setInformacionReciente(
					buildInformacionReciente(publicadores, asistencias, registros)
				)
				setLoading(false)
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : 'Error al cargar datos'
				setErrorGrupos(msg)
				setErrorInfo(msg)
				setLoading(false)
			}
		}
		load()
	}, [isAuthenticated])

	const handleLogout = async () => {
		await logout()
	}

	const openAsistenciaModal = () => {
		const active = document.activeElement as HTMLElement | null
		if (active && typeof active.blur === 'function') {
			active.blur()
		}
		setEditingAsistenciaId(null)
		setAsistenciaForm({ fecha: '', presencial: '', zoom: '' })
		setShowAsistenciaModal(true)
	}

	const handleSaveAsistencia = async () => {
		setSavingAsistencia(true)
		setAsistenciaError(null)
		try {
			const payload: Partial<Asistencia> = {
				fecha: asistenciaForm.fecha,
				presencial: Number(asistenciaForm.presencial) || 0,
				zoom: Number(asistenciaForm.zoom) || 0,
			}
			if (editingAsistenciaId) {
				await apiService.put(`/asistencia/${editingAsistenciaId}`, payload)
			} else {
				await apiService.post('/asistencia', payload)
			}
			setShowAsistenciaModal(false)
			// Recargar datos
			const [publicadores, asistencias, registros] = await Promise.all([
				getPublicadores(),
				getAsistencias(),
				getRegistros()
			])
			setGrupos(buildGruposFromPublicadores(publicadores))
			setInformacionReciente(buildInformacionReciente(publicadores, asistencias, registros))
		} catch (e: any) {
			setAsistenciaError(e?.response?.data?.error?.message || e.message || 'Error al guardar')
		} finally {
			setSavingAsistencia(false)
		}
	}

	useEffect(() => {
		const params = new URLSearchParams(location.search)
		if (params.get('openAsistencia') === '1') {
			openAsistenciaModal()
			history.replace('/tabs/home')
		}
	}, [location.search])

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar className={styles.toolbarBackground}>
					<IonButtons slot="start" >
						<h4>Inicio</h4>
					</IonButtons>

					<IonButtons slot="end">
						<IonButton onClick={handleLogout}>
							Cerrar Sesión
						</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>

				<IonGrid>
					<IonRow className="ion-justify-content-center">
						<IonCol size="12" className="ion-text-center ion-padding-top">
							<h4>Congregación Alto Bosque</h4>
							<IonCardSubtitle className={ styles.heading }>
								20149
							</IonCardSubtitle>
							<IonCardSubtitle className={ styles.heading }>
								{user?.userName ?? 'Usuario'}
							</IonCardSubtitle>
						</IonCol>
					</IonRow>

					<IonRow>
						<IonCol size="12" className="ion-padding-start ion-padding-top ion-padding-bottom">
							<IonCardSubtitle className={ styles.heading }>
								Grupos
							</IonCardSubtitle>
						</IonCol>
					</IonRow>
				</IonGrid>

				{ loading && (
					<div className="ion-text-center ion-padding">
						<IonSpinner name="crescent" />
						<p>Cargando...</p>
					</div>
				) }
				{ errorGrupos && !loading && (
					<div className="ion-padding ion-text-center">
						<p className={ styles.slideCountText } style={{ color: 'var(--ion-color-warning)' }}>
							{ errorGrupos }
						</p>
					</div>
				) }
				{ !loading && !errorGrupos && grupos.length === 0 && (
					<div className="ion-padding ion-text-center">
						<p className={styles.slideCountText} style={{ color: 'var(--ion-color-medium)' }}>
							No hay grupos. Ejecuta init-user en la base de producción (Neon).
						</p>
					</div>
				) }
				{ !loading && !errorGrupos && grupos.length > 0 && (
				<div id="slider" className={ `${styles.categorySlider} ion-padding-bottom` } role="region" aria-label="Grupos">
					{ grupos.map((category, index) => (
						<div key={ `categorySlide_${index}` } className={ styles.slideItem }>
							<IonCol className="ion-text-left">
								<IonCard
									style={{ cursor: 'pointer' }}
									onClick={() =>
										history.push(
											`/tabs/ingresar-informes/${category.id}/${encodeURIComponent(category.name)}`
										)
									}
								>
									<IonCardHeader className="ion-no-padding">
										<div className={ styles.slideCount }>
											<p className={ styles.slideCountText }><span className={ styles.highlightColor }>Capitán:</span> { category.capitan }</p>
											<p className={ styles.noPadding }><span className={ styles.highlightColor }>Auxiliar:</span> { category.auxiliar }</p>
											<p className={ styles.noPadding }><span className={ styles.highlightColor }>Cantidad:</span> { category.cantidad }</p>
										</div>
										<div className={ styles.slideHeader }>
											<h6>{ category.name }</h6>
										</div>
									</IonCardHeader>
									<IonCardContent>
										<div className={ styles.categoryColor } style={{ borderBottom: `2px solid ${category.color}` }} />
									</IonCardContent>
								</IonCard>
							</IonCol>
						</div>
					))}
				</div>
				) }

				<IonGrid className={ styles.bottomContainer }>
					<IonRow>
						<IonCol size="12" className="ion-padding-start">
							<IonCardSubtitle className={ styles.heading }>
								Información Reciente
							</IonCardSubtitle>
						</IonCol>
					</IonRow>
					
					<div className={ styles.recentNotes }>
						{ errorInfo && informacionReciente.length === 0 && !loading && (
							<div className="ion-padding ion-text-center">
								<p className={ styles.slideCountText } style={{ color: 'var(--ion-color-warning)' }}>
									{ errorInfo }
								</p>
							</div>
						) }
						{ informacionReciente.filter((note) => note.id !== 3).map((note) => (
							<IonRow
								key={ `note_${note.id}` }
								id={ `noteRow_${note.id}` }
								className={note.id === 4 ? styles.infoSucursalCardWrap : undefined}
							>
								<IonCol size="12">
									<IonItem>
										<IonCheckbox
											className={ styles.noteCheckbox }
											checked={ note.complete }
											disabled={ false }
											style={{
												['--border-color' as string]:
													note.id === 4 ? '#ffc409' : note.color,
												['--checkbox-background' as string]: 'transparent',
												['--checkbox-background-checked' as string]:
													note.id === 4 ? '#ffc409' : note.color,
												['--border-color-checked' as string]:
													note.id === 4 ? '#ffc409' : note.color,
												['--checkmark-color' as string]: '#ffffff',
											}}
											slot="start"
										/>
										<div className={ `${styles.noteContent} ion-padding-bottom` }>
											<p style={{ textAlign: 'left', color: '#7994d8', display: 'flex', justifyContent: 'space-between', alignItems: 'left',paddingBottom: '0.6rem',paddingTop: '0.8rem' }}>
												<span style={{ fontSize: '0.90rem', textAlign: 'left' }}>{ note.note }</span>
												<span style={{ fontSize: '0.60rem', textAlign: 'right' }}>{ note.fecha }</span>
											</p>
											{ note.id === 1 && (
												<>
													<p className={ styles.slideCountText } style={{ color: note.color, paddingLeft: '0.2rem', fontSize: '0.70rem' }}><span style={{ color: note.color }}>Publicadores:</span> { note.publicadores }</p>
													<p className={ styles.slideCountText } style={{ color: note.color, paddingLeft: '0.2rem', fontSize: '0.70rem' }}><span style={{ color: note.color }}>P. auxiliares:</span> { note.p_auxiliares }</p>
													<p className={ styles.slideCountText } style={{ color: note.color, paddingLeft: '0.2rem', fontSize: '0.70rem' }}><span style={{ color: note.color }}>P. regulares:</span> { note.p_regulares }</p>
													<p className={ styles.slideCountText } style={{ color: note.color, paddingLeft: '0.2rem', fontSize: '0.70rem' }}><span style={{ color: note.color }}>P. no bautizados:</span> { note.p_nobautizados }</p>
													<p className={ styles.slideCountText } style={{ color: note.color, paddingLeft: '0.2rem', fontSize: '0.70rem' }}><span style={{ color: note.color }}>Total:</span> { note.total }</p>
												</>
											) }
											{ note.id === 2 && (
												<>
													<p className={ styles.slideCountText } style={{ color: note.color, paddingLeft: '0.2rem', fontSize: '0.70rem' }}><span style={{ color: note.color }}>Fecha registro:</span> { formatFechaRegistro(note.fecha_registro) }</p>
													<p className={ styles.slideCountText } style={{ color: note.color, paddingLeft: '0.2rem', fontSize: '0.70rem' }}><span style={{ color: note.color }}>Presencia:</span> { note.presencia }</p>
													<p className={ styles.slideCountText } style={{ color: note.color, paddingLeft: '0.2rem', fontSize: '0.70rem' }}><span style={{ color: note.color }}>Zoom:</span> { note.zoom }</p>
													<p className={ styles.slideCountText } style={{ color: note.color, paddingLeft: '0.2rem', fontSize: '0.70rem' }}><span style={{ color: note.color }}>Total:</span> { note.total }</p>
												</>
											) }
											{ note.id === 4 && (
												<>
													<p
														className={ styles.slideCountText }
														style={{
															color: '#ffc409',
															paddingLeft: '0.2rem',
															fontSize: '0.70rem',
														}}
													>
														<span style={{ color: '#ffc409' }}>Publicadores:</span>{' '}
														{ note.n1 },{' '}
														<span style={{ color: '#ffc409' }}>C. bíblicos:</span>{' '}
														{ note.n2 }
													</p>
													<p
														className={ styles.slideCountText }
														style={{
															color: '#ffc409',
															paddingLeft: '0.2rem',
															fontSize: '0.70rem',
														}}
													>
														<span style={{ color: '#ffc409' }}>P. A:</span>{' '}
														{ note.n3 },{' '}
														<span style={{ color: '#ffc409' }}>Horas:</span>{' '}
														{ note.n4 },{' '}
														<span style={{ color: '#ffc409' }}>C. bíblicos:</span>{' '}
														{ note.n5 }
													</p>
													<p
														className={ styles.slideCountText }
														style={{
															color: '#ffc409',
															paddingLeft: '0.2rem',
															fontSize: '0.70rem',
														}}
													>
														<span style={{ color: '#ffc409' }}>P. R:</span>{' '}
														{ note.n6 },{' '}
														<span style={{ color: '#ffc409' }}>Horas:</span>{' '}
														{ note.n7 },{' '}
														<span style={{ color: '#ffc409' }}>C. bíblicos:</span>{' '}
														{ note.n8 }
													</p>
												</>
											) }
										</div>
									</IonItem>
								</IonCol>
							</IonRow>
						))}
					</div>
				</IonGrid>

				<IonFab vertical="bottom" horizontal="end" slot="fixed" className="ion-padding">
					<IonFabButton onClick={openAsistenciaModal}>
						<IonIcon icon={ addOutline } />
					</IonFabButton>
				</IonFab>

			</IonContent>

			<IonModal
				key={showAsistenciaModal ? 'open' : 'closed'}
				isOpen={showAsistenciaModal}
				onDidDismiss={() => setShowAsistenciaModal(false)}
			>
				<IonHeader>
					<IonToolbar style={{ '--background': '#000000', '--color': '#ffffff' } as any}>
						<IonButtons slot="start">
							<IonButton onClick={() => setShowAsistenciaModal(false)} style={{ color: '#ffffff' }}>
								<IonIcon icon={arrowBackOutline} slot="icon-only" />
							</IonButton>
						</IonButtons>
						<IonTitle style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem' }}>
							ASISTENCIA
						</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding" style={{ '--background': '#1D68DF' } as any}>
					<div style={{ background: '#041955', borderRadius: 12, padding: '16px' }}>
						<div style={{ marginBottom: 12 }}>
							<label style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 4 }}>Fecha</label>
							<input
								type="date"
								value={asistenciaForm.fecha}
								onChange={(e) => setAsistenciaForm(f => ({ ...f, fecha: e.target.value }))}
								className="asistencia-date-input"
								style={{
									width: '100%', padding: '8px 10px', borderRadius: 8,
									border: '1px solid #333', background: '#12122a',
									color: '#ffffff', fontSize: '0.9rem', boxSizing: 'border-box'
								}}
							/>
						</div>
						<div style={{ marginBottom: 12 }}>
							<label style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 4 }}>Presencial</label>
							<input
								type="number"
								min={0}
								value={asistenciaForm.presencial}
								onChange={(e) => setAsistenciaForm(f => ({ ...f, presencial: e.target.value }))}
								placeholder="0"
								style={{
									width: '100%', padding: '8px 10px', borderRadius: 8,
									border: '1px solid #333', background: '#12122a',
									color: '#ffffff', fontSize: '0.9rem', boxSizing: 'border-box'
								}}
							/>
						</div>
						<div style={{ marginBottom: 20 }}>
							<label style={{ fontSize: '0.72rem', color: 'var(--ion-color-medium)', display: 'block', marginBottom: 4 }}>Zoom</label>
							<input
								type="number"
								min={0}
								value={asistenciaForm.zoom}
								onChange={(e) => setAsistenciaForm(f => ({ ...f, zoom: e.target.value }))}
								placeholder="0"
								style={{
									width: '100%', padding: '8px 10px', borderRadius: 8,
									border: '1px solid #333', background: '#12122a',
									color: '#ffffff', fontSize: '0.9rem', boxSizing: 'border-box'
								}}
							/>
						</div>
						{asistenciaError && (
							<p style={{ color: '#ff4444', fontSize: '0.8rem', marginBottom: 12 }}>{asistenciaError}</p>
						)}
						<IonButton expand="block" onClick={handleSaveAsistencia} disabled={savingAsistencia}>
							{savingAsistencia ? <IonSpinner name="crescent" /> : (editingAsistenciaId ? 'Actualizar' : 'Guardar Asistencia')}
						</IonButton>
					</div>
				</IonContent>
			</IonModal>

		</IonPage>
	);
};

export default Home;

