import {
	IonContent, IonPage, IonHeader, IonToolbar, IonTitle,
	IonSpinner, IonIcon, IonSearchbar, IonModal, IonButtons,
	IonButton, IonToggle, IonAlert
} from '@ionic/react'
import React, { useState, useEffect } from 'react'
import { createOutline, downloadOutline, arrowBackOutline } from 'ionicons/icons'
import { apiService } from '../services/api'
import { Publicador } from '../types'

const SEXOS = ['HOMBRE', 'MUJER']
const ESPERANZAS = ['OTRAS OVEJAS', 'UNGIDO']
const PRIVILEGIOS = ['ANCIANO', 'SIERVO MINISTERIAL', 'PUBLICADOR', 'PUBLICADORA']
const PRECURSORES = ['PUBLICADOR', 'PUBLICADORA', 'PRECURSOR AUXILIAR', 'PRECURSORA AUXILIAR', 'PRECURSOR REGULAR', 'PRECURSORA REGULAR', 'PUBLICADOR NO BAUTIZADO']
const ESTADOS = ['ACTIVO', 'INACTIVO', 'IRREGULAR']

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
	nombre: '', correo: '', sexo: 'HOMBRE', esperanza: 'OTRAS OVEJAS',
	privilegio: 'PUBLICADOR', precursor: 'PUBLICADOR',
	fecha_nacimiento: '', fecha_bautismo: '', direccion: '',
	telefono_familiar: '', telefono: '', grupo: '',
	observaciones: '', estado: 'ACTIVO', capitan: false, auxiliar: false
}

const inputStyle: React.CSSProperties = {
	width: '100%', padding: '8px 10px', borderRadius: 8,
	border: '1px solid #333', background: '#12122a',
	color: '#ffffff', fontSize: '0.88rem', boxSizing: 'border-box'
}

const labelStyle: React.CSSProperties = {
	fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)',
	display: 'block', marginBottom: 4
}

const selectStyle: React.CSSProperties = {
	...inputStyle, appearance: 'auto'
}

const Publs: React.FC = () => {
	const [publicadores, setPublicadores] = useState<Publicador[]>([])
	const [filtrados, setFiltrados] = useState<Publicador[]>([])
	const [loading, setLoading] = useState(true)
	const [busqueda, setBusqueda] = useState('')
	const [showModal, setShowModal] = useState(false)
	const [editingPub, setEditingPub] = useState<Publicador | null>(null)
	const [form, setForm] = useState<FormPub>(FORM_DEFAULT)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [successMsg, setSuccessMsg] = useState<string | null>(null)

	useEffect(() => { loadPublicadores() }, [])

	useEffect(() => {
		const q = busqueda.toLowerCase()
		setFiltrados(publicadores.filter(p =>
			p.nombre.toLowerCase().includes(q) ||
			(p.precursor ?? '').toLowerCase().includes(q) ||
			(p.privilegio ?? '').toLowerCase().includes(q)
		))
	}, [busqueda, publicadores])

	const loadPublicadores = async () => {
		setLoading(true)
		try {
			const data = await apiService.get<Publicador[]>('/publicador')
			const sorted = (Array.isArray(data) ? data : []).sort((a, b) => a.nombre.localeCompare(b.nombre))
			setPublicadores(sorted)
			setFiltrados(sorted)
		} catch (e: any) {
			setError(e.message)
		} finally {
			setLoading(false)
		}
	}

	const openEdit = (pub: Publicador) => {
		setEditingPub(pub)
		setForm({
			nombre: pub.nombre ?? '',
			correo: pub.correo ?? '',
			sexo: pub.sexo ?? 'HOMBRE',
			esperanza: pub.esperanza ?? 'OTRAS OVEJAS',
			privilegio: pub.privilegio ?? 'PUBLICADOR',
			precursor: pub.precursor ?? 'PUBLICADOR',
			fecha_nacimiento: pub.fecha_nacimiento ? String(pub.fecha_nacimiento).split('T')[0] : '',
			fecha_bautismo: pub.fecha_bautismo ? String(pub.fecha_bautismo).split('T')[0] : '',
			direccion: pub.direccion ?? '',
			telefono_familiar: pub.telefono_familiar ? String(pub.telefono_familiar) : '',
			telefono: pub.telefono ? String(pub.telefono) : '',
			grupo: pub.grupo ? String(pub.grupo) : '',
			observaciones: pub.observaciones ?? '',
			estado: pub.estado ?? 'ACTIVO',
			capitan: pub.capitan ?? false,
			auxiliar: pub.auxiliar ?? false,
		})
		setShowModal(true)
	}

	const closeModal = () => { setShowModal(false); setEditingPub(null) }

	const handleSave = async () => {
		if (!editingPub) return
		setSaving(true)
		try {
			await apiService.put(`/publicador/${editingPub.id}`, {
				...form,
				telefono_familiar: Number(form.telefono_familiar) || null,
				telefono: Number(form.telefono) || null,
				grupo: Number(form.grupo) || null,
			})
			await loadPublicadores()
			closeModal()
			setSuccessMsg(`${form.nombre} actualizado correctamente`)
		} catch (e: any) {
			setError(e?.response?.data?.error?.message || e.message || 'Error al guardar')
		} finally {
			setSaving(false)
		}
	}

	const handleDownload = (pub: Publicador) => {
		const lines = [
			`Nombre: ${pub.nombre}`, `Correo: ${pub.correo ?? '—'}`,
			`Sexo: ${pub.sexo ?? '—'}`, `Esperanza: ${pub.esperanza ?? '—'}`,
			`Privilegio: ${pub.privilegio ?? '—'}`, `Precursor: ${pub.precursor ?? '—'}`,
			`Fecha Nacimiento: ${pub.fecha_nacimiento ?? '—'}`,
			`Fecha Bautismo: ${pub.fecha_bautismo ?? '—'}`,
			`Dirección: ${pub.direccion ?? '—'}`,
			`Tel. Familiar: ${pub.telefono_familiar ?? '—'}`,
			`Tel. Personal: ${pub.telefono ?? '—'}`,
			`Grupo: ${pub.grupo ?? '—'}`, `Estado: ${pub.estado ?? '—'}`,
			`Capitán: ${pub.capitan ? 'Sí' : 'No'}`,
			`Auxiliar: ${pub.auxiliar ? 'Sí' : 'No'}`,
			`Observaciones: ${pub.observaciones ?? '—'}`,
		].join('\n')
		const blob = new Blob([lines], { type: 'text/plain' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url; a.download = `${pub.nombre.replace(/ /g, '_')}.txt`
		a.click(); URL.revokeObjectURL(url)
	}

	const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
		<div style={{ marginBottom: 12 }}>
			<label style={labelStyle}>{label}</label>
			{children}
		</div>
	)

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Publicadores</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonModal isOpen={showModal} onDidDismiss={closeModal}>
				<IonHeader>
					<IonToolbar style={{ '--background': '#000000', '--color': '#ffffff' } as any}>
						<IonButtons slot="start">
							<IonButton onClick={closeModal} style={{ color: '#ffffff' }}>
								<IonIcon icon={arrowBackOutline} slot="icon-only" />
							</IonButton>
						</IonButtons>
						<IonTitle style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem' }}>
							EDITAR PUBLICADOR
						</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding" style={{ '--background': '#1D68DF' } as any}>
					<div style={{ background: '#041955', borderRadius: 12, padding: 16 }}>

						<F label="Nombre">
							<input style={inputStyle} value={form.nombre}
								onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
						</F>
						<F label="Correo">
							<input style={inputStyle} type="email" value={form.correo}
								onChange={e => setForm(f => ({ ...f, correo: e.target.value }))} />
						</F>
						<F label="Sexo">
							<select style={selectStyle} value={form.sexo}
								onChange={e => setForm(f => ({ ...f, sexo: e.target.value }))}>
								{SEXOS.map(s => <option key={s} value={s}>{s}</option>)}
							</select>
						</F>
						<F label="Esperanza">
							<select style={selectStyle} value={form.esperanza}
								onChange={e => setForm(f => ({ ...f, esperanza: e.target.value }))}>
								{ESPERANZAS.map(s => <option key={s} value={s}>{s}</option>)}
							</select>
						</F>
						<F label="Privilegio">
							<select style={selectStyle} value={form.privilegio}
								onChange={e => setForm(f => ({ ...f, privilegio: e.target.value }))}>
								{PRIVILEGIOS.map(s => <option key={s} value={s}>{s}</option>)}
							</select>
						</F>
						<F label="Precursor">
							<select style={selectStyle} value={form.precursor}
								onChange={e => setForm(f => ({ ...f, precursor: e.target.value }))}>
								{PRECURSORES.map(s => <option key={s} value={s}>{s}</option>)}
							</select>
						</F>
						<F label="Fecha Nacimiento">
							<input style={inputStyle} type="date" value={form.fecha_nacimiento}
								onChange={e => setForm(f => ({ ...f, fecha_nacimiento: e.target.value }))} />
						</F>
						<F label="Fecha Bautismo">
							<input style={inputStyle} type="date" value={form.fecha_bautismo}
								onChange={e => setForm(f => ({ ...f, fecha_bautismo: e.target.value }))} />
						</F>
						<F label="Dirección">
							<input style={inputStyle} value={form.direccion}
								onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} />
						</F>
						<F label="Tel. Familiar">
							<input style={inputStyle} type="number" value={form.telefono_familiar}
								onChange={e => setForm(f => ({ ...f, telefono_familiar: e.target.value }))} />
						</F>
						<F label="Tel. Personal">
							<input style={inputStyle} type="number" value={form.telefono}
								onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
						</F>
						<F label="Grupo (número)">
							<input style={inputStyle} type="number" value={form.grupo}
								onChange={e => setForm(f => ({ ...f, grupo: e.target.value }))} />
						</F>
						<F label="Estado">
							<select style={selectStyle} value={form.estado}
								onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
								{ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
							</select>
						</F>
						<div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<label style={{ color: '#fff', fontSize: '0.88rem' }}>Capitán de grupo</label>
							<IonToggle checked={form.capitan}
								onIonChange={e => setForm(f => ({ ...f, capitan: e.detail.checked }))} />
						</div>
						<div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
							<label style={{ color: '#fff', fontSize: '0.88rem' }}>Auxiliar de grupo</label>
							<IonToggle checked={form.auxiliar}
								onIonChange={e => setForm(f => ({ ...f, auxiliar: e.detail.checked }))} />
						</div>
						<F label="Observaciones">
							<textarea style={{ ...inputStyle, resize: 'none' } as React.CSSProperties}
								rows={3} value={form.observaciones}
								onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} />
						</F>

						<IonButton expand="block" onClick={handleSave} disabled={saving} style={{ marginTop: 8 }}>
							{saving ? <IonSpinner name="crescent" /> : 'Actualizar Publicador'}
						</IonButton>
					</div>
				</IonContent>
			</IonModal>

			<IonContent fullscreen>
				<IonSearchbar
					value={busqueda}
					onIonInput={(e) => setBusqueda(e.detail.value ?? '')}
					placeholder="Buscar publicador..."
					style={{ '--background': '#041955', '--color': '#fff', '--placeholder-color': '#97B4FF' }}
				/>
				{loading && <div style={{ textAlign: 'center', padding: '2rem' }}><IonSpinner name="crescent" /></div>}
				{!loading && (
					<div style={{ padding: '0 12px 80px' }}>
						{filtrados.map((pub) => (
							<div key={pub.id} style={{
								display: 'flex', alignItems: 'center', justifyContent: 'space-between',
								padding: '10px 14px', marginBottom: 8, borderRadius: 10, background: '#041955'
							}}>
								<div style={{ flex: 1, minWidth: 0 }}>
									<p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
										{pub.nombre}
									</p>
									<p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#97B4FF' }}>
										{pub.precursor ?? pub.privilegio ?? 'Publicador'}
									</p>
								</div>
								<div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
									<button onClick={() => openEdit(pub)} style={{
										background: '#1D68DF', border: 'none', borderRadius: 8,
										cursor: 'pointer', color: '#fff', padding: '6px 10px', fontSize: '1rem'
									}}>
										<IonIcon icon={createOutline} />
									</button>
									<button onClick={() => handleDownload(pub)} style={{
										background: '#2dd36f', border: 'none', borderRadius: 8,
										cursor: 'pointer', color: '#fff', padding: '6px 10px', fontSize: '1rem'
									}}>
										<IonIcon icon={downloadOutline} />
									</button>
								</div>
							</div>
						))}
						{filtrados.length === 0 && (
							<p style={{ textAlign: 'center', color: '#97B4FF', marginTop: '2rem' }}>No se encontraron publicadores</p>
						)}
					</div>
				)}
			</IonContent>

			<IonAlert isOpen={Boolean(error)} onDidDismiss={() => setError(null)} header="Error" message={error || ''} buttons={['OK']} />
			<IonAlert isOpen={Boolean(successMsg)} onDidDismiss={() => setSuccessMsg(null)} header="✅ Actualizado" message={successMsg || ''} buttons={['OK']} />
		</IonPage>
	)
}

export default Publs
