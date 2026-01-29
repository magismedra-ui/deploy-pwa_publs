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
import { publicadorRepository } from '../repositories/publicador.repository'
import { grupoRepository } from '../repositories/grupo.repository'
import { Publicador, Grupo } from '../types'

const Publicadores: React.FC = () => {
	const [publicadores, setPublicadores] = useState<Publicador[]>([])
	const [grupos, setGrupos] = useState<Grupo[]>([])
	const [loading, setLoading] = useState(true)
	const [showModal, setShowModal] = useState(false)
	const [editingPublicador, setEditingPublicador] = useState<Publicador | null>(null)
	const [formData, setFormData] = useState<Partial<Publicador>>({})
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		loadData()
	}, [])

	const loadData = async () => {
		try {
			const [publicadoresData, gruposData] = await Promise.all([
				publicadorRepository.findAll(),
				grupoRepository.findAll()
			])
			setPublicadores(publicadoresData)
			setGrupos(gruposData)
		} catch (err: any) {
			setError(err.message || 'Error al cargar datos')
		} finally {
			setLoading(false)
		}
	}

	const handleSave = async () => {
		try {
			if (editingPublicador) {
				await publicadorRepository.update(editingPublicador.id!, formData)
			} else {
				await publicadorRepository.create(formData as Publicador)
			}
			setShowModal(false)
			setFormData({})
			setEditingPublicador(null)
			await loadData()
		} catch (err: any) {
			setError(err.message || 'Error al guardar publicador')
		}
	}

	const handleEdit = (publicador: Publicador) => {
		setEditingPublicador(publicador)
		setFormData(publicador)
		setShowModal(true)
	}

	const handleDelete = async (id: string) => {
		try {
			await publicadorRepository.delete(id)
			await loadData()
		} catch (err: any) {
			setError(err.message || 'Error al eliminar publicador')
		}
	}

	const handleNew = () => {
		setEditingPublicador(null)
		setFormData({})
		setShowModal(true)
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Publicadores</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				{loading ? (
					<IonLoading isOpen={true} message="Cargando..." />
				) : (
					<>
						<IonList>
							{publicadores.map((publicador) => (
								<IonItem key={publicador.id}>
									<IonLabel>
										<h2>{publicador.nombre}</h2>
										<p>{publicador.correo}</p>
										<p>{publicador.syncStatus}</p>
									</IonLabel>
									<IonButton
										fill="clear"
										onClick={() => handleEdit(publicador)}
									>
										<IonIcon icon={create} />
									</IonButton>
									<IonButton
										fill="clear"
										color="danger"
										onClick={() => handleDelete(publicador.id!)}
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
								{editingPublicador ? 'Editar' : 'Nuevo'} Publicador
							</IonTitle>
							<IonButton slot="end" onClick={() => setShowModal(false)}>
								Cerrar
							</IonButton>
						</IonToolbar>
					</IonHeader>
					<IonContent>
						<IonItem>
							<IonInput
								label="Nombre *"
								labelPlacement="stacked"
								value={formData.nombre || ''}
								onIonInput={(e) =>
									setFormData({ ...formData, nombre: e.detail.value as string })
								}
								placeholder="Nombre"
								required
							/>
						</IonItem>
						<IonItem>
							<IonInput
								type="email"
								label="Email"
								labelPlacement="stacked"
								value={formData.correo || ''}
								onIonInput={(e) =>
									setFormData({ ...formData, correo: e.detail.value as string })
								}
								placeholder="Email"
							/>
						</IonItem>
						<IonItem>
							<IonSelect
								label="Grupo"
								labelPlacement="stacked"
								value={formData.grupo}
								onSelectionChange={(e) =>
									setFormData({ ...formData, grupo: e.detail.value })
								}
							>
								<IonSelectOption value={undefined}>Sin grupo</IonSelectOption>
								{grupos.map((grupo) => (
									<IonSelectOption key={grupo.id} value={grupo.id}>
										{grupo.nombre}
									</IonSelectOption>
								))}
							</IonSelect>
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

export default Publicadores
