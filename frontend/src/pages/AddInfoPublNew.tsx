import React from 'react'
import {
	IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
	IonButtons, IonBackButton, IonToast,
} from '@ionic/react'
import { useHistory } from 'react-router-dom'
import { useState } from 'react'
import { AddInfoPublForm } from '../components/AddInfoPublForm'
import { useAddInfoPubl } from '../hooks/useAddInfoPubl'
import type { AddInfoPublPayload } from '../hooks/useAddInfoPubl'

// ─────────────────────────────────────────────────────────────────────────────
// Página: Nuevo registro de Info Adicional del Publicador
// Ruta: /tabs/addinfopubl/new
// ─────────────────────────────────────────────────────────────────────────────
const AddInfoPublNew: React.FC = () => {
	const history = useHistory()
	const { create } = useAddInfoPubl()
	const [toast, setToast] = useState<{ show: boolean; message: string; color: string }>({
		show: false, message: '', color: 'success',
	})

	const handleSubmit = async (data: AddInfoPublPayload) => {
		try {
			await create.mutateAsync(data)
			setToast({ show: true, message: 'Registro guardado correctamente', color: 'success' })
			setTimeout(() => history.goBack(), 800)
		} catch (err: any) {
			setToast({ show: true, message: err.message || 'Error al guardar', color: 'danger' })
		}
	}

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar color="primary">
					<IonButtons slot="start">
						<IonBackButton defaultHref="/tabs/addinfopubl" />
					</IonButtons>
					<IonTitle>Nueva Info Adicional</IonTitle>
				</IonToolbar>
			</IonHeader>

			<IonContent fullscreen>
				<AddInfoPublForm
					onSubmit={handleSubmit}
					onCancel={() => history.goBack()}
					isSubmitting={create.isPending}
				/>
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

export default AddInfoPublNew
