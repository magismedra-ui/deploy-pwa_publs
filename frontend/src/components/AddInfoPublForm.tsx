import React, { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
	IonItem, IonLabel, IonSelect, IonSelectOption,
	IonDatetime, IonTextarea, IonButton, IonSpinner,
	IonList, IonNote, IonToggle,
} from '@ionic/react'
import { usePublicadores } from '../hooks/usePublicadores'
import type { AddInfoPublPayload } from '../hooks/useAddInfoPubl'

// ─────────────────────────────────────────────────────────────────────────────
// Zod schema
// ─────────────────────────────────────────────────────────────────────────────
const schema = z.object({
	idpublicador:  z.number({ message: 'Publicador requerido' }),
	fecha:         z.string().optional().nullable(),
	observaciones: z.string().optional().nullable(),
	pastoreo:      z.boolean(),
})

interface FormValues {
	idpublicador: number
	fecha?: string | null
	observaciones?: string | null
	pastoreo: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
	/** Si se pasa idpublicador fijo (desde detalle de publicador), el select queda oculto */
	fixedPublicadorId?: number
	defaultValues?: Partial<FormValues>
	onSubmit: (data: AddInfoPublPayload) => void
	onCancel?: () => void
	isSubmitting?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────
export const AddInfoPublForm: React.FC<Props> = ({
	fixedPublicadorId,
	defaultValues,
	onSubmit,
	onCancel,
	isSubmitting,
}) => {
	const { publicadores } = usePublicadores()

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema) as any,
		defaultValues: {
			idpublicador:  fixedPublicadorId,
			fecha:         null,
			observaciones: null,
			pastoreo:      false,
			...defaultValues,
		},
	})

	useEffect(() => {
		if (defaultValues) {
			reset({
				idpublicador:  fixedPublicadorId ?? defaultValues.idpublicador,
				fecha:         defaultValues.fecha ?? null,
				observaciones: defaultValues.observaciones ?? null,
				pastoreo:      defaultValues.pastoreo ?? false,
			})
		}
	}, [defaultValues, fixedPublicadorId, reset])

	const handleFormSubmit = (values: FormValues) => {
		const payload: AddInfoPublPayload = {
			idpublicador:  values.idpublicador,
			fecha:         values.fecha ?? null,
			observaciones: values.observaciones ?? null,
			pastoreo:      values.pastoreo ?? false,
		}
		onSubmit(payload)
	}

	return (
		<form onSubmit={handleSubmit(handleFormSubmit)}>
			<IonList>

				{/* idpublicador — oculto si viene fijo desde detalle */}
				{!fixedPublicadorId && (
					<IonItem>
						<IonLabel position="stacked">Publicador *</IonLabel>
						<Controller
							name="idpublicador"
							control={control}
							render={({ field }) => (
								<IonSelect
									value={field.value}
									onIonChange={(e) => field.onChange(Number(e.detail.value))}
									placeholder="Seleccionar publicador"
								>
									{publicadores.map((p) => (
										<IonSelectOption key={p.id} value={p.id}>{p.nombre}</IonSelectOption>
									))}
								</IonSelect>
							)}
						/>
						{errors.idpublicador && (
							<IonNote color="danger" slot="error">{errors.idpublicador.message}</IonNote>
						)}
					</IonItem>
				)}

				{/* fecha */}
				<IonItem>
					<IonLabel position="stacked">Fecha</IonLabel>
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

				{/* observaciones */}
				<IonItem>
					<IonLabel position="stacked">Observaciones</IonLabel>
					<Controller
						name="observaciones"
						control={control}
						render={({ field }) => (
							<IonTextarea
								rows={4}
								value={field.value ?? ''}
								onIonChange={(e) => field.onChange(e.detail.value ?? null)}
								placeholder="Información adicional del publicador..."
							/>
						)}
					/>
				</IonItem>

				<IonItem>
					<IonLabel>Pastoreo</IonLabel>
					<Controller
						name="pastoreo"
						control={control}
						render={({ field }) => (
							<IonToggle
								slot="end"
								checked={field.value ?? false}
								onIonChange={(e) =>
									field.onChange(Boolean(e.detail.checked))
								}
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

export default AddInfoPublForm
