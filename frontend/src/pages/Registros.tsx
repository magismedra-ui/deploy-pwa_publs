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
	IonSelectOption
} from '@ionic/react'
import { useState, useEffect } from 'react'
import { add, create, trash } from 'ionicons/icons'
import { registroRepository } from '../repositories/registro.repository'
import { publicadorRepository } from '../repositories/publicador.repository'
import { Registro, Publicador } from '../types'

const Registros: React.FC = () => {
	const [registros, setRegistros] = useState<Registro[]>([])
	const [publicadores, setPublicadores] = useState<Publicador[]>([])
	const [loading, setLoading] = useState(true)
	const [showModal, setShowModal] = useState(false)
	const [editingRegistro, setEditingRegistro] = useState<Registro | null>(null)
	const [formData, setFormData] = useState<Partial<Registro>>({})
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		loadData()
	}, [])

	const loadData = async () => {
		try {
			const [registrosData, publicadoresData] = await Promise.all([
				registroRepository.findAll(),
				publicadorRepository.findAll()
			])
			setRegistros(registrosData)
			setPublicadores(publicadoresData)
		} catch (err: any) {
			setError(err.message || 'Error al cargar datos')
		} finally {
			setLoading(false)
		}
	}

	const handleSave = async () => {
		try {
			if (editingRegistro) {
				await registroRepository.update(editingRegistro.id!, formData)
			} else {
				await registroRepository.create(formData as Registro)
			}
			setShowModal(false)
			setFormData({})
			setEditingRegistro(null)
			await loadData()
		} catch (err: any) {
			setError(err.message || 'Error al guardar registro')
		}
	}

	const handleEdit = (registro: Registro) => {
		setEditingRegistro(registro)
		setFormData(registro)
		setShowModal(true)
	}

	const handleDelete = async (id: string) => {
		try {
			await registroRepository.delete(id)
			await loadData()
		} catch (err: any) {
			setError(err.message || 'Error al eliminar registro')
		}
	}

	const handleNew = () => {
		setEditingRegistro(null)
		setFormData({})
		setShowModal(true)
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Registros</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				{loading ? (
					<IonLoading isOpen={true} message="Cargando..." />
				) : (
					<>
						<IonList>
							{registros.map((registro) => {
								const publicador = publicadores.find(
									(p) => p.id === registro.idpublicador
								)
								return (
									<IonItem key={registro.id}>
										<IonLabel>
											<h2>
												{publicador?.nombre || 'Sin publicador'} -{' '}
												{registro.mes} {registro.anno_servicio}
											</h2>
											<p>Horas: {registro.horas || 0}</p>
											<p>{registro.syncStatus}</p>
										</IonLabel>
										<IonButton
											fill="clear"
											onClick={() => handleEdit(registro)}
										>
											<IonIcon icon={create} />
										</IonButton>
										<IonButton
											fill="clear"
											color="danger"
											onClick={() => handleDelete(registro.id!)}
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
								{editingRegistro ? 'Editar' : 'Nuevo'} Registro
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
								type="number"
								label="Año"
								labelPlacement="stacked"
								value={formData.anno_servicio?.toString() || ''}
								onIonInput={(e) => {
									const value = e.detail.value as string
									setFormData({
										...formData,
										anno_servicio: value ? parseInt(value) : undefined
									})
								}}
							/>
						</IonItem>
						<IonItem>
							<IonInput
								label="Mes"
								labelPlacement="stacked"
								value={formData.mes || ''}
								onIonInput={(e) =>
									setFormData({ ...formData, mes: e.detail.value as string })
								}
							/>
						</IonItem>
						<IonItem>
							<IonInput
								type="number"
								label="Horas"
								labelPlacement="stacked"
								value={formData.horas?.toString() || ''}
								onIonInput={(e) => {
									const value = e.detail.value as string
									setFormData({
										...formData,
										horas: value ? parseInt(value) : undefined
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
					buttons={[{ text: 'OK', role: 'cancel' }]}
				/>
			</IonContent>
		</IonPage>
	)
}

export default Registros
