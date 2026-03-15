import React, { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
	IonItem, IonLabel, IonInput, IonDatetime,
	IonButton, IonSpinner, IonList, IonListHeader,
} from '@ionic/react'
import type { AsistenciaPayload } from '../hooks/useAsistencias'

// ─────────────────────────────────────────────────────────────────────────────
// Zod schema
// NOTA: el campo id de asistencia NO tiene autoincrement en Neon.
// El id se genera en el frontend (Math.floor(Date.now() / 1000)) o lo maneja
// el backend. No se incluye en el formulario.
// ─────────────────────────────────────────────────────────────────────────────
const schema = z.object({
	fecha:      z.string().optional().nullable(),
	presencial: z.number().optional().nullable(),
	zoom:       z.number().optional().nullable(),
})

type FormValues = z.infer<typeof schema>

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
	defaultValues?: Partial<FormValues>
	onSubmit: (data: AsistenciaPayload) => void
	onCancel?: () => void
	isSubmitting?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────
export const AsistenciaForm: React.FC<Props> = ({ defaultValues, onSubmit, onCancel, isSubmitting }) => {
	const {
		control,
		handleSubmit,
		reset,
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			fecha:      null,
			presencial: null,
			zoom:       null,
			...defaultValues,
		},
	})

	useEffect(() => {
		if (defaultValues) reset(defaultValues)
	}, [defaultValues, reset])

	const handleFormSubmit = (values: FormValues) => {
		// Generar id si el backend no lo maneja automáticamente
		const payload: AsistenciaPayload = {
			id:         Math.floor(Date.now() / 1000),
			fecha:      values.fecha ?? null,
			presencial: values.presencial ?? null,
			zoom:       values.zoom ?? null,
		}
		onSubmit(payload)
	}

	return (
		<form onSubmit={handleSubmit(handleFormSubmit)}>
			<IonList>

				<IonListHeader><IonLabel>Registro de asistencia</IonLabel></IonListHeader>

				{/* fecha */}
				<IonItem>
					<IonLabel position="stacked">Fecha de reunión</IonLabel>
					<Controller
						name="fecha"
						control={control}
						render={({ field }) => (
							<IonDatetime
								presentation="date"
								value={field.value ?? undefined}
								onIonChange={(e) => field.onChange(e.detail.value as string ?? null)}
							/>
						)}
					/>
				</IonItem>

				{/* presencial */}
				<IonItem>
					<IonLabel position="stacked">Asistencia presencial</IonLabel>
					<Controller
						name="presencial"
						control={control}
						render={({ field }) => (
							<IonInput
								type="number"
								value={field.value?.toString() ?? ''}
								onIonChange={(e) => {
									const v = e.detail.value
									field.onChange(v ? Number(v) : null)
								}}
								placeholder="0"
								min="0"
							/>
						)}
					/>
				</IonItem>

				{/* zoom */}
				<IonItem>
					<IonLabel position="stacked">Asistencia por Zoom</IonLabel>
					<Controller
						name="zoom"
						control={control}
						render={({ field }) => (
							<IonInput
								type="number"
								value={field.value?.toString() ?? ''}
								onIonChange={(e) => {
									const v = e.detail.value
									field.onChange(v ? Number(v) : null)
								}}
								placeholder="0"
								min="0"
							/>
						)}
					/>
				</IonItem>

			</IonList>

			{/* ── Botones ───────────────────────────────────────────────── */}
			<div style={{ display: 'flex', gap: '0.5rem', padding: '1rem' }}>
				{onCancel && (
					<IonButton fill="outline" expand="block" onClick={onCancel} style={{ flex: 1 }}>
						Cancelar
					</IonButton>
				)}
				<IonButton type="submit" expand="block" disabled={isSubmitting} style={{ flex: 1 }}>
					{isSubmitting ? <IonSpinner name="crescent" /> : 'Guardar'}
				</IonButton>
			</div>
		</form>
	)
}

export default AsistenciaForm
