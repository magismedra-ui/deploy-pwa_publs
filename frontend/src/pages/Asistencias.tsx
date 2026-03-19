import {
	IonContent, IonPage, IonHeader, IonToolbar, IonTitle,
	IonButton, IonIcon,
	IonFab, IonFabButton, IonModal, IonButtons, IonSpinner, IonAlert
} from '@ionic/react'
import { useState, useEffect } from 'react'
import { add, arrowBackOutline } from 'ionicons/icons'
import { apiService } from '../services/api'
import { Asistencia } from '../types'

const Asistencias: React.FC = () => {
	const [asistencias, setAsistencias] = useState<Asistencia[]>([])
	const [loading, setLoading] = useState(true)
	const [showModal, setShowModal] = useState(false)
	const [editingAsistencia, setEditingAsistencia] = useState<Asistencia | null>(null)
	const [form, setForm] = useState({ fecha: '', presencial: '', zoom: '' })
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

	useEffect(() => { loadAsistencias() }, [])

	const loadAsistencias = async () => {
		setLoading(true)
		try {
			const data = await apiService.get<Asistencia[]>('/asistencia')
			setAsistencias(Array.isArray(data) ? data.sort((a, b) =>
				new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
			) : [])
		} catch (e: any) {
			setError(e.message || 'Error al cargar asistencias')
		} finally {
			setLoading(false)
		}
	}

	const openNew = () => {
		setEditingAsistencia(null)
		setForm({ fecha: new Date().toISOString().split('T')[0], presencial: '', zoom: '' })
		setShowModal(true)
	}

	const openEdit = (a: Asistencia) => {
		setEditingAsistencia(a)
		setForm({
			fecha: typeof a.fecha === 'string' ? a.fecha.split('T')[0] : new Date(a.fecha).toISOString().split('T')[0],
			presencial: String(a.presencial ?? ''),
			zoom: String(a.zoom ?? '')
		})
		setShowModal(true)
	}

	const closeModal = () => {
		setShowModal(false)
		setEditingAsistencia(null)
	}

	const handleSave = async () => {
		setSaving(true)
		try {
			const payload = {
				fecha: form.fecha,
				presencial: Number(form.presencial) || 0,
				zoom: Number(form.zoom) || 0,
			}
			if (editingAsistencia) {
				await apiService.put(`/asistencia/${editingAsistencia.id}`, payload)
			} else {
				await apiService.post('/asistencia', payload)
			}
			closeModal()
			await loadAsistencias()
		} catch (e: any) {
			setError(e?.response?.data?.error?.message || e.message || 'Error al guardar')
		} finally {
			setSaving(false)
		}
	}

	const handleDelete = async (id: string) => {
		try {
			await apiService.delete(`/asistencia/${id}`)
			await loadAsistencias()
		} catch (e: any) {
			setError(e.message || 'Error al eliminar')
		}
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar color="primary">
					<IonTitle>Asistencias</IonTitle>
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
						<IonTitle style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem' }}>
							{editingAsistencia ? 'EDITAR ASISTENCIA' : 'NUEVA ASISTENCIA'}
						</IonTitle>
					</IonToolbar>
				</IonHeader>
				<IonContent className="ion-padding" style={{ '--background': '#1D68DF' } as any}>
					<div style={{ background: '#041955', borderRadius: 12, padding: '16px' }}>
						<div style={{ marginBottom: 12 }}>
							<label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }}>Fecha</label>
							<input
								type="date"
								value={form.fecha}
								onChange={(e) => setForm(f => ({ ...f, fecha: e.target.value }))}
								style={{
									width: '100%', padding: '8px 10px', borderRadius: 8,
									border: '1px solid #333', background: '#12122a',
									color: '#ffffff', fontSize: '0.9rem', boxSizing: 'border-box'
								}}
							/>
						</div>
						<div style={{ marginBottom: 12 }}>
							<label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }}>Presencial</label>
							<input
								type="number" min={0}
								value={form.presencial}
								onChange={(e) => setForm(f => ({ ...f, presencial: e.target.value }))}
								placeholder="0"
								style={{
									width: '100%', padding: '8px 10px', borderRadius: 8,
									border: '1px solid #333', background: '#12122a',
									color: '#ffffff', fontSize: '0.9rem', boxSizing: 'border-box'
								}}
							/>
						</div>
						<div style={{ marginBottom: 20 }}>
							<label style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 4 }}>Zoom</label>
							<input
								type="number" min={0}
								value={form.zoom}
								onChange={(e) => setForm(f => ({ ...f, zoom: e.target.value }))}
								placeholder="0"
								style={{
									width: '100%', padding: '8px 10px', borderRadius: 8,
									border: '1px solid #333', background: '#12122a',
									color: '#ffffff', fontSize: '0.9rem', boxSizing: 'border-box'
								}}
							/>
						</div>
						<IonButton expand="block" onClick={handleSave} disabled={saving}>
							{saving ? <IonSpinner name="crescent" /> : (editingAsistencia ? 'Actualizar' : 'Guardar')}
						</IonButton>
					</div>
				</IonContent>
			</IonModal>

			<IonContent fullscreen>
				{loading && (
					<div style={{ textAlign: 'center', padding: '2rem' }}>
						<IonSpinner name="crescent" />
					</div>
				)}
				{!loading && asistencias.length === 0 && (
					<div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ion-color-medium)' }}>
						<p>No hay asistencias registradas.</p>
					</div>
				)}
				{!loading && asistencias.length > 0 && (
					<div style={{ padding: '0 12px' }}>
						{asistencias.map((a) => (
							<div
								key={a.id}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '12px 16px',
									marginBottom: 8,
									borderRadius: 10,
									background: 'var(--ion-item-background, #1e1e2e)',
									boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
								}}
							>
								<div>
									<p style={{ margin: 0, fontWeight: 600, fontSize: '0.92rem' }}>
										{new Date(a.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
									</p>
									<p style={{ margin: '4px 0 0', fontSize: '0.78rem', opacity: 0.7 }}>
										Presencial: {a.presencial ?? 0} · Zoom: {a.zoom ?? 0}
									</p>
								</div>
								<div style={{ display: 'flex', gap: 8 }}>
									<button
										onClick={() => openEdit(a)}
										style={{
											background: '#1D68DF',
											border: 'none',
											borderRadius: 8,
											cursor: 'pointer',
											color: '#fff',
											fontSize: '0.8rem',
											padding: '6px 12px',
											fontWeight: 600,
										}}
									>
										Editar
									</button>
									<button
										onClick={() => setConfirmDelete(String(a.id))}
										style={{
											background: '#eb445a',
											border: 'none',
											borderRadius: 8,
											cursor: 'pointer',
											color: '#fff',
											fontSize: '0.8rem',
											padding: '6px 12px',
											fontWeight: 600,
										}}
									>
										Eliminar
									</button>
								</div>
							</div>
						))}
					</div>
				)}
				<IonFab vertical="bottom" horizontal="end" slot="fixed">
					<IonFabButton onClick={openNew}>
						<IonIcon icon={add} />
					</IonFabButton>
				</IonFab>
			</IonContent>

			<IonAlert
				isOpen={Boolean(confirmDelete)}
				onDidDismiss={() => setConfirmDelete(null)}
				header="Eliminar"
				message="¿Seguro que deseas eliminar esta asistencia?"
				buttons={[
					{ text: 'Cancelar', role: 'cancel' },
					{ text: 'Eliminar', role: 'destructive', handler: () => handleDelete(confirmDelete!) }
				]}
			/>
			<IonAlert
				isOpen={Boolean(error)}
				onDidDismiss={() => setError(null)}
				header="Error"
				message={error || ''}
				buttons={['OK']}
			/>
		</IonPage>
	)
}

export default Asistencias