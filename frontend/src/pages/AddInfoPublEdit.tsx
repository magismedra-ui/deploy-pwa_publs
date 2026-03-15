import React, { useEffect, useState } from 'react'
import {
	IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
	IonButtons, IonBackButton, IonToast, IonLoading,
} from '@ionic/react'
import { useHistory, useParams } from 'react-router-dom'
import { AddInfoPublForm } from '../components/AddInfoPublForm'
import { useAddInfoPubl } from '../hooks/useAddInfoPubl'
import { getLocally } from '../lib/localDb'
import { apiService } from '../services/api'
import type { AddInfoPublPayload } from '../hooks/useAddInfoPubl'

// ─────────────────────────────────────────────────────────────────────────────
// Página: Editar registro de Info Adicional del Publicador
// Ruta: /tabs/addinfopubl/:id
// ─────────────────────────────────────────────────────────────────────────────
const AddInfoPublEdit: React.FC = () => {
	const params = useParams() as { id: string }
	const { id } = params
	const history = useHistory()
	const { update } = useAddInfoPubl()

	const [defaultValues, setDefaultValues] = useState<Partial<AddInfoPublPayload> | undefined>()
	const [loading, setLoading] = useState(true)
	const [toast, setToast] = useState<{ show: boolean; message: string; color: string }>({
		show: false, message: '', color: 'success',
	})

	// ── Carga offline-first ──────────────────────────────────────────────
	useEffect(() => {
		const load = async () => {
			setLoading(true)
			try {
				// Detectar offline ANTES de fetch
				if (!navigator.onLine) {
					const local = await getLocally('addinfopubl')
					const found = local.find((a) => a.id === Number(id))
					if (found) {
						const { _syncStatus, _deleted, ...clean } = found as any
						setDefaultValues(clean)
						return
					}
				}
				const data = await apiService.get<AddInfoPublPayload>(`/addinfopubl/${id}`)
				setDefaultValues(data)
			} catch {
				// Fallback a IndexedDB
				const local = await getLocally('addinfopubl')
				const found = local.find((a) => a.id === Number(id))
				if (found) {
					const { _syncStatus, _deleted, ...clean } = found as any
					setDefaultValues(clean)
				}
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [id])

	const handleSubmit = async (data: AddInfoPublPayload) => {
		try {
			await update.mutateAsync({ id: Number(id), payload: data })
			setToast({ show: true, message: 'Registro actualizado correctamente', color: 'success' })
			setTimeout(() => history.goBack(), 800)
		} catch (err: any) {
			setToast({ show: true, message: err.message || 'Error al actualizar', color: 'danger' })
		}
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar color="primary">
					<IonButtons slot="start">
						<IonBackButton defaultHref="/tabs/addinfopubl" />
					</IonButtons>
					<IonTitle>Editar Info Adicional</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent fullscreen>
				<IonLoading isOpen={loading} message="Cargando..." />

				{!loading && (
					<AddInfoPublForm
						defaultValues={defaultValues}
						onSubmit={handleSubmit}
						onCancel={() => history.goBack()}
						isSubmitting={update.isPending}
					/>
				)}
			</IonContent>

			<IonToast
				isOpen={toast.show}
				message={toast.message}
				color={toast.color as any}
				duration={2000}
				onDidDismiss={() => setToast((t) => ({ ...t, show: false }))}
			/>
		</IonPage>
	)
}

export default AddInfoPublEdit
