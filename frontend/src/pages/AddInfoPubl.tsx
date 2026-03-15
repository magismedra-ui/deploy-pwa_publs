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
	IonAlert,
	IonSelect,
	IonSelectOption,
	IonTextarea
} from '@ionic/react'
import { useState, useEffect } from 'react'
import { add, create, trash } from 'ionicons/icons'
import { addinfopublRepository } from '../repositories/addinfopubl.repository'
import { publicadorRepository } from '../repositories/publicador.repository'
import { AddInfoPubl, Publicador } from '../types'

const AddInfoPublPage: React.FC = () => {
	const [addinfopubl, setAddinfopubl] = useState<AddInfoPubl[]>([])
	const [publicadores, setPublicadores] = useState<Publicador[]>([])
	const [loading, setLoading] = useState(true)
	const [showModal, setShowModal] = useState(false)
	const [editingInfo, setEditingInfo] = useState<AddInfoPubl | null>(null)
	const [formData, setFormData] = useState<Partial<AddInfoPubl>>({})
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		loadData()
	}, [])

	const loadData = async () => {
		try {
			const [infoData, publicadoresData] = await Promise.all([
				addinfopublRepository.findAll(),
				publicadorRepository.findAll()
			])
			setAddinfopubl(infoData)
			setPublicadores(publicadoresData)
		} catch (err: any) {
			setError(err.message || 'Error al cargar datos')
		} finally {
			setLoading(false)
		}
	}

	const handleSave = async () => {
		try {
			if (editingInfo) {
				await addinfopublRepository.update(editingInfo.id!, formData)
			} else {
				await addinfopublRepository.create(formData as AddInfoPubl)
			}
			setShowModal(false)
			setFormData({})
			setEditingInfo(null)
			await loadData()
		} catch (err: any) {
			setError(err.message || 'Error al guardar información')
		}
	}

	const handleEdit = (info: AddInfoPubl) => {
		setEditingInfo(info)
		setFormData(info)
		setShowModal(true)
	}

	const handleDelete = async (id: string) => {
		try {
			await addinfopublRepository.delete(id)
			await loadData()
		} catch (err: any) {
			setError(err.message || 'Error al eliminar información')
		}
	}

	const handleNew = () => {
		setEditingInfo(null)
		setFormData({})
		setShowModal(true)
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Info Publicador</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				{loading ? (
					<IonLoading isOpen={true} message="Cargando..." />
				) : (
					<>
						<IonList>
							{addinfopubl.map((info) => {
								const publicador = publicadores.find(
									(p) => p.id === info.idpublicador
								)
								return (
									<IonItem key={info.id}>
										<IonLabel>
											<h2>{publicador?.nombre || 'Sin publicador'}</h2>
											<p>{new Date(info.fecha).toLocaleDateString()}</p>
											<p>{info.observaciones}</p>
											<p>{info.syncStatus}</p>
										</IonLabel>
										<IonButton fill="clear" onClick={() => handleEdit(info)}>
											<IonIcon icon={create} />
										</IonButton>
										<IonButton
											fill="clear"
											color="danger"
											onClick={() => handleDelete(info.id!)}
										>
											<IonIcon icon={trash} />
										</IonButton>
									</IonItem>
								)
							})}
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
								{editingInfo ? 'Editar' : 'Nueva'} Información
							</IonTitle>
							<IonButton slot="end" onClick={() => setShowModal(false)}>
								Cerrar
							</IonButton>
						</IonToolbar>
					</IonHeader>
					<IonContent>
						<IonItem>
							<IonSelect
								label="Publicador *"
								labelPlacement="stacked"
								value={formData.idpublicador}
								onIonChange={(e) =>
									setFormData({ ...formData, idpublicador: e.detail.value })
								}
							>
								{publicadores.map((publicador) => (
									<IonSelectOption key={publicador.id} value={publicador.id}>
										{publicador.nombre}
									</IonSelectOption>
								))}
							</IonSelect>
						</IonItem>
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
							<IonTextarea
								label="Observaciones"
								labelPlacement="stacked"
								value={formData.observaciones || ''}
								onIonInput={(e) =>
									setFormData({ ...formData, observaciones: e.detail.value as string })
								}
								rows={4}
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
					buttons={['OK']}
				/>
			</IonContent>
		</IonPage>
	)
}

export default AddInfoPublPage
