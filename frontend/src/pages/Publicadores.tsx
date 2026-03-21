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
	IonSpinner,
} from '@ionic/react'
import { PDFDocument } from 'pdf-lib'
import { useState, useEffect } from 'react'
import { add, create, trash, downloadOutline } from 'ionicons/icons'
import { publicadorRepository } from '../repositories/publicador.repository'
import { grupoRepository } from '../repositories/grupo.repository'
import { Publicador, Grupo } from '../types'
import { fetchTarjetaS21PdfBytes } from '../utils/tarjeta-s21-pdf'

const Publicadores: React.FC = () => {
	const [publicadores, setPublicadores] = useState<Publicador[]>([])
	const [grupos, setGrupos] = useState<Grupo[]>([])
	const [loading, setLoading] = useState(true)
	const [showModal, setShowModal] = useState(false)
	const [editingPublicador, setEditingPublicador] = useState<Publicador | null>(null)
	const [formData, setFormData] = useState<Partial<Publicador>>({})
	const [error, setError] = useState<string | null>(null)
	const [downloadingAll, setDownloadingAll] = useState(false)

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

	const handleGenerarPDFBytes = (pub: Publicador) =>
		fetchTarjetaS21PdfBytes(pub)

	const handleDescargarTodos = async () => {
		if (publicadores.length === 0) return
		setDownloadingAll(true)
		try {
			const pdfsIndividuales: Uint8Array[] = []
			for (const pub of publicadores) {
				const bytes = await handleGenerarPDFBytes(pub)
				if (bytes) pdfsIndividuales.push(bytes)
			}
			const mergedDoc = await PDFDocument.create()
			for (const pdfBytes of pdfsIndividuales) {
				const srcDoc = await PDFDocument.load(pdfBytes)
				const pages = await mergedDoc.copyPages(
					srcDoc,
					srcDoc.getPageIndices(),
				)
				for (const page of pages) mergedDoc.addPage(page)
			}
			const mergedBytes = await mergedDoc.save()
			const blob = new Blob([mergedBytes as BlobPart], {
				type: 'application/pdf',
			})
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = 'S-21_Todos_los_Publicadores.pdf'
			a.click()
			URL.revokeObjectURL(url)
		} catch (err: any) {
			setError(err.message || 'Error al generar PDF masivo')
		} finally {
			setDownloadingAll(false)
		}
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar style={{ '--background': '#000000', '--color': '#ffffff' } as any}>
					<IonTitle style={{ color: '#ffffff' }}>Publicadores</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				{loading ? (
					<IonLoading isOpen={true} message="Cargando..." />
				) : (
					<>
						{/* Padding inferior para que la fila TOTAL no quede tapada por IonFab */}
						<div style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}>
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
								<IonItem key="total-publicadores" lines="full">
									<IonLabel>
										<h2>TOTAL DE PUBLICADORES</h2>
										<p>{publicadores.length}</p>
									</IonLabel>
									<IonButton
										fill="solid"
										color="success"
										onClick={handleDescargarTodos}
										disabled={downloadingAll || publicadores.length === 0}
									>
										{downloadingAll ? (
											<IonSpinner
												name="crescent"
												style={{ width: 18, height: 18 }}
											/>
										) : (
											<IonIcon icon={downloadOutline} />
										)}
									</IonButton>
								</IonItem>
							</IonList>
						</div>
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
								onIonChange={(e) =>
									setFormData({ ...formData, grupo: e.detail.value })
								}
							>
								<IonSelectOption value={undefined}>Sin grupo</IonSelectOption>
								{grupos.map((grupo) => (
									<IonSelectOption key={grupo.id} value={grupo.id}>
										{grupo.nroGrupo != null
											? `Grupo ${grupo.nroGrupo} – ${grupo.nombre}`
											: grupo.nombre}
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
					buttons={['OK']}
				/>
			</IonContent>
		</IonPage>
	)
}

export default Publicadores
