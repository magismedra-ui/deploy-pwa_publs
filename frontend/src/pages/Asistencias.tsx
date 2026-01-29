import {
	IonContent,
	IonPage,
	IonHeader,
	IonToolbar,
	IonTitle,
	IonButton,
	IonList,
	IonItem,
	IonLabel,
	IonIcon,
	IonFab,
	IonFabButton,
	IonModal,
	IonInput,
	IonLoading,
	IonAlert
} from '@ionic/react'
import { useState, useEffect } from 'react'
import { add, create, trash } from 'ionicons/icons'
import { asistenciaRepository } from '../repositories/asistencia.repository'
import { Asistencia } from '../types'

const Asistencias: React.FC = () => {
	const [asistencias, setAsistencias] = useState<Asistencia[]>([])
	const [loading, setLoading] = useState(true)
	const [showModal, setShowModal] = useState(false)
	const [editingAsistencia, setEditingAsistencia] = useState<Asistencia | null>(null)
	const [formData, setFormData] = useState<Partial<Asistencia>>({})
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		loadAsistencias()
	}, [])

	const loadAsistencias = async () => {
		try {
			const data = await asistenciaRepository.findAll()
			setAsistencias(data)
		} catch (err: any) {
			setError(err.message || 'Error al cargar asistencias')
		} finally {
			setLoading(false)
		}
	}

	const handleSave = async () => {
		try {
			if (editingAsistencia) {
				await asistenciaRepository.update(editingAsistencia.id!, formData)
			} else {
				await asistenciaRepository.create(formData as Asistencia)
			}
			setShowModal(false)
			setFormData({})
			setEditingAsistencia(null)
			await loadAsistencias()
		} catch (err: any) {
			setError(err.message || 'Error al guardar asistencia')
		}
	}

	const handleEdit = (asistencia: Asistencia) => {
		setEditingAsistencia(asistencia)
		setFormData(asistencia)
		setShowModal(true)
	}

	const handleDelete = async (id: string) => {
		try {
			await asistenciaRepository.delete(id)
			await loadAsistencias()
		} catch (err: any) {
			setError(err.message || 'Error al eliminar asistencia')
		}
	}

	const handleNew = () => {
		setEditingAsistencia(null)
		setFormData({})
		setShowModal(true)
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Asistencias</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				{loading ? (
					<IonLoading isOpen={true} message="Cargando..." />
				) : (
					<>
						<IonList>
							{asistencias.map((asistencia) => (
								<IonItem key={asistencia.id}>
									<IonLabel>
										<h2>{new Date(asistencia.fecha).toLocaleDateString()}</h2>
										<p>Presencial: {asistencia.presencial || 0}</p>
										<p>Zoom: {asistencia.zoom || 0}</p>
										<p>{asistencia.syncStatus}</p>
									</IonLabel>
									<IonButton
										fill="clear"
										onClick={() => handleEdit(asistencia)}
									>
										<IonIcon icon={create} />
									</IonButton>
									<IonButton
										fill="clear"
										color="danger"
										onClick={() => handleDelete(asistencia.id!)}
									>
										<IonIcon icon={trash} />
									</IonButton>
								</IonItem>
							))}
						</IonList>
						<IonFab vertical="bottom" horizontal="end" slot="fixed">
							<IonFabButton onClick={handleNew}>
								<IonIcon icon={add} />
							</IonFabButton>
						</IonFab>
					</>
				)}
				<IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
					<IonHeader>
						<IonToolbar>
							<IonTitle>
								{editingAsistencia ? 'Editar' : 'Nueva'} Asistencia
							</IonTitle>
							<IonButton slot="end" onClick={() => setShowModal(false)}>
								Cerrar
							</IonButton>
						</IonToolbar>
					</IonHeader>
					<IonContent>
						<IonItem>
							<IonInput
								type="date"
								label="Fecha"
								labelPlacement="stacked"
								value={
									formData.fecha
										? new Date(formData.fecha).toISOString().split('T')[0]
										: ''
								}
								onIonInput={(e) =>
									setFormData({ ...formData, fecha: e.detail.value as string })
								}
							/>
						</IonItem>
						<IonItem>
							<IonInput
								type="number"
								label="Presencial"
								labelPlacement="stacked"
								value={formData.presencial?.toString() || ''}
								onIonInput={(e) => {
									const value = e.detail.value as string
									setFormData({
										...formData,
										presencial: value ? parseInt(value) : 0
									})
								}}
							/>
						</IonItem>
						<IonItem>
							<IonInput
								type="number"
								label="Zoom"
								labelPlacement="stacked"
								value={formData.zoom?.toString() || ''}
								onIonInput={(e) => {
									const value = e.detail.value as string
									setFormData({
										...formData,
										zoom: value ? parseInt(value) : 0
									})
								}}
							/>
						</IonItem>
						<IonButton expand="block" onClick={handleSave} style={{ margin: '20px' }}>
							Guardar
						</IonButton>
					</IonContent>
				</IonModal>
				<IonAlert
					isOpen={Boolean(error)}
					onDidDismiss={() => setError(null)}
					header="Error"
					message={error || ''}
					buttons={[{ text: 'OK', handler: () => setError(null) }]}
				/>
			</IonContent>
		</IonPage>
	)
}

export default Asistencias
