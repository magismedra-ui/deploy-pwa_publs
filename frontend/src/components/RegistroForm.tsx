import React, { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
	IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
	IonToggle, IonTextarea, IonButton, IonSpinner,
	IonList, IonListHeader, IonNote,
} from '@ionic/react'
import { usePublicadores } from '../hooks/usePublicadores'
import type { RegistroPayload } from '../hooks/useRegistros'

// ─────────────────────────────────────────────────────────────────────────────
// Zod schema
// ─────────────────────────────────────────────────────────────────────────────
const MESES = ['enero','febrero','marzo','abril','mayo','junio',
               'julio','agosto','septiembre','octubre','noviembre','diciembre'] as const

const schema = z.object({
	idpublicador: z.number({ message: 'Publicador requerido' }),
	anno_servicio: z.number().optional().nullable(),
	mes:           z.enum(MESES).optional(),
	predico:       z.boolean().optional(),
	horas:         z.number().optional().nullable(),
	cursos:        z.number().optional().nullable(),
	precursor:     z.enum(['regular', 'auxiliar', 'especial', 'ninguno']).optional(),
	notas:         z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
	defaultValues?: Partial<FormValues>
	onSubmit: (data: RegistroPayload) => void
	onCancel?: () => void
	isSubmitting?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────
export const RegistroForm: React.FC<Props> = ({ defaultValues, onSubmit, onCancel, isSubmitting }) => {
	const { publicadores } = usePublicadores()

	const {
		control,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: defaultValues ?? {},
	})

	useEffect(() => {
		if (defaultValues) reset(defaultValues)
	}, [defaultValues, reset])

	const precursor = watch('precursor')
	const showHoras = precursor && precursor !== 'ninguno'

	const handleFormSubmit = (values: FormValues) => {
		const payload: RegistroPayload = {
			...values,
			horas:  values.horas ?? null,
			cursos: values.cursos ?? null,
		}
		onSubmit(payload)
	}

	return (
		<form onSubmit={handleSubmit(handleFormSubmit)}>
			<IonList>

				{/* ── Publicador ────────────────────────────────────────── */}
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
								{publicadores
									.filter((p) => p.estado === 'activo')
									.map((p) => (
										<IonSelectOption key={p.id} value={p.id}>{p.nombre}</IonSelectOption>
									))}
							</IonSelect>
						)}
					/>
					{errors.idpublicador && (
						<IonNote color="danger" slot="error">{errors.idpublicador.message}</IonNote>
					)}
				</IonItem>

				{/* ── Período ───────────────────────────────────────────── */}
				<IonListHeader><IonLabel>Período de servicio</IonLabel></IonListHeader>

				{/* anno_servicio */}
				<IonItem>
					<IonLabel position="stacked">Año de servicio</IonLabel>
					<Controller
						name="anno_servicio"
						control={control}
						render={({ field }) => (
							<IonInput
								type="number"
								value={field.value?.toString() ?? ''}
								onIonChange={(e) => {
									const v = e.detail.value
									field.onChange(v ? Number(v) : null)
								}}
								placeholder={new Date().getFullYear().toString()}
							/>
						)}
					/>
				</IonItem>

				{/* mes */}
				<IonItem>
					<IonLabel position="stacked">Mes</IonLabel>
					<Controller
						name="mes"
						control={control}
						render={({ field }) => (
							<IonSelect
								value={field.value}
								onIonChange={(e) => field.onChange(e.detail.value)}
								placeholder="Seleccionar mes"
							>
								{MESES.map((m) => (
									<IonSelectOption key={m} value={m}>
										{m.charAt(0).toUpperCase() + m.slice(1)}
									</IonSelectOption>
								))}
							</IonSelect>
						)}
					/>
				</IonItem>

				{/* ── Actividad ─────────────────────────────────────────── */}
				<IonListHeader><IonLabel>Actividad</IonLabel></IonListHeader>

				{/* predico */}
				<IonItem>
					<IonLabel>¿Predicó?</IonLabel>
					<Controller
						name="predico"
						control={control}
						render={({ field }) => (
							<IonToggle
								checked={field.value ?? false}
								onIonChange={(e) => field.onChange(e.detail.checked)}
								slot="end"
							/>
						)}
					/>
				</IonItem>

				{/* precursor */}
				<IonItem>
					<IonLabel position="stacked">Tipo de precursor (este mes)</IonLabel>
					<Controller
						name="precursor"
						control={control}
						render={({ field }) => (
							<IonSelect
								value={field.value}
								onIonChange={(e) => field.onChange(e.detail.value)}
								placeholder="Seleccionar"
							>
								<IonSelectOption value="regular">Regular</IonSelectOption>
								<IonSelectOption value="auxiliar">Auxiliar</IonSelectOption>
								<IonSelectOption value="especial">Especial</IonSelectOption>
								<IonSelectOption value="ninguno">Ninguno</IonSelectOption>
							</IonSelect>
						)}
					/>
				</IonItem>

				{/* horas — solo si precursor != ninguno */}
				{showHoras && (
					<IonItem>
						<IonLabel position="stacked">Horas</IonLabel>
						<Controller
							name="horas"
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
								/>
							)}
						/>
					</IonItem>
				)}

				{/* cursos */}
				<IonItem>
					<IonLabel position="stacked">Cursos bíblicos</IonLabel>
					<Controller
						name="cursos"
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
							/>
						)}
					/>
				</IonItem>

				{/* notas */}
				<IonItem>
					<IonLabel position="stacked">Notas</IonLabel>
					<Controller
						name="notas"
						control={control}
						render={({ field }) => (
							<IonTextarea
								rows={3}
								value={field.value ?? ''}
								onIonChange={(e) => field.onChange(e.detail.value)}
								placeholder="Observaciones del mes..."
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

export default RegistroForm
