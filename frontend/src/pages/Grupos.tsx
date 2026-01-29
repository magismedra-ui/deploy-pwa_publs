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
import { grupoRepository } from '../repositories/grupo.repository'
import { Grupo } from '../types'
import { generateUUID } from '../utils/uuid'

const Grupos: React.FC = () => {
	const [grupos, setGrupos] = useState<Grupo[]>([])
	const [loading, setLoading] = useState(true)
	const [showModal, setShowModal] = useState(false)
	const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null)
	const [nombre, setNombre] = useState('')
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		loadGrupos()
	}, [])

	const loadGrupos = async () => {
		try {
			const data = await grupoRepository.findAll()
			setGrupos(data)
		} catch (err: any) {
			setError(err.message || 'Error al cargar grupos')
		} finally {
			setLoading(false)
		}
	}

	const handleSave = async () => {
		try {
			if (editingGrupo) {
				await grupoRepository.update(editingGrupo.id!, { nombre })
			} else {
				await grupoRepository.create({ nombre })
			}
			setShowModal(false)
			setNombre('')
			setEditingGrupo(null)
			await loadGrupos()
		} catch (err: any) {
			setError(err.message || 'Error al guardar grupo')
		}
	}

	const handleEdit = (grupo: Grupo) => {
		setEditingGrupo(grupo)
		setNombre(grupo.nombre)
		setShowModal(true)
	}

	const handleDelete = async (id: string) => {
		try {
			await grupoRepository.delete(id)
			await loadGrupos()
		} catch (err: any) {
			setError(err.message || 'Error al eliminar grupo')
		}
	}

	const handleNew = () => {
		setEditingGrupo(null)
		setNombre('')
		setShowModal(true)
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Grupos</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				{loading ? (
					<IonLoading isOpen={true} message="Cargando..." />
				) : (
					<>
						<IonList>
							{grupos.map((grupo) => (
								<IonItem key={grupo.id}>
									<IonLabel>
										<h2>{grupo.nombre}</h2>
										<p>{grupo.syncStatus}</p>
									</IonLabel>
									<IonButton
										fill="clear"
										onClick={() => handleEdit(grupo)}
									>
										<IonIcon icon={create} />
									</IonButton>
									<IonButton
										fill="clear"
										color="danger"
										onClick={() => handleDelete(grupo.id!)}
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
							<IonTitle>{editingGrupo ? 'Editar' : 'Nuevo'} Grupo</IonTitle>
							<IonButton slot="end" onClick={() => setShowModal(false)}>
								Cerrar
							</IonButton>
						</IonToolbar>
					</IonHeader>
					<IonContent>
						<IonItem>
							<IonInput
								label="Nombre"
								labelPlacement="stacked"
								value={nombre}
								onIonInput={(e) => setNombre(e.detail.value as string)}
								placeholder="Nombre del grupo"
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

export default Grupos
