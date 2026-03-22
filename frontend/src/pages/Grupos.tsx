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
} from '@ionic/react'
import { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { add, create, trash, documentTextOutline } from 'ionicons/icons'
import { grupoRepository } from '../repositories/grupo.repository'
import { Grupo } from '../types'

const Grupos: React.FC = () => {
	const history = useHistory()
	const [grupos, setGrupos] = useState<Grupo[]>([])
	const [loading, setLoading] = useState(true)
	const [showModal, setShowModal] = useState(false)
	const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null)
	const [nombre, setNombre] = useState('')
	const [nroGrupo, setNroGrupo] = useState<number | ''>('')
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
			const nro =
				nroGrupo === '' ? null : Number(nroGrupo)
			if (editingGrupo) {
			await grupoRepository.update(editingGrupo.id! as unknown as string, {
					nombre,
					nroGrupo: nro
				})
			} else {
				await grupoRepository.create({
					nombre,
					...(nro != null && { nroGrupo: nro })
				})
			}
			setShowModal(false)
			setNombre('')
			setNroGrupo('')
			setEditingGrupo(null)
			await loadGrupos()
		} catch (err: any) {
			setError(err.message || 'Error al guardar grupo')
		}
	}

	const handleEdit = (grupo: Grupo) => {
		setEditingGrupo(grupo)
		setNombre(grupo.nombre)
		setNroGrupo(grupo.nroGrupo ?? '')
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

	const handleIngresarInformes = (grupo: Grupo) => {
		const gid = grupo.nroGrupo ?? grupo.id
		const nombre =
			grupo.nroGrupo != null
				? `Grupo ${grupo.nroGrupo} – ${grupo.nombre}`
				: grupo.nombre
		const encodedNombre = encodeURIComponent(nombre)
		history.push(`/tabs/ingresar-informes/${gid}/${encodedNombre}`)
	}

	const handleNew = () => {
		setEditingGrupo(null)
		setNombre('')
		setNroGrupo('')
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
										<h2>
											{grupo.nroGrupo != null
												? `Grupo ${grupo.nroGrupo} – ${grupo.nombre}`
												: grupo.nombre}
										</h2>
										<p>{grupo.syncStatus}</p>
									</IonLabel>
									<IonButton
										fill="clear"
										onClick={() => handleIngresarInformes(grupo)}
										title="Ingresar informes"
									>
										<IonIcon icon={documentTextOutline} />
									</IonButton>
									<IonButton
										fill="clear"
										onClick={() => handleEdit(grupo)}
									>
										<IonIcon icon={create} />
									</IonButton>
									<IonButton
										fill="clear"
										color="danger"
									onClick={() => handleDelete(grupo.id! as unknown as string)}
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
								label="Nº Grupo"
								labelPlacement="stacked"
								type="number"
								min={1}
								value={nroGrupo}
								onIonInput={(e) => {
									const v = e.detail.value
									setNroGrupo(v === '' ? '' : Number(v))
								}}
								placeholder="Ej. 1, 2, 3…"
							/>
						</IonItem>
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
					buttons={[{ text: 'OK', role: 'cancel' }]}
				/>
			</IonContent>
		</IonPage>
	)
}

export default Grupos
