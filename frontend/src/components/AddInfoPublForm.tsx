import React, { useEffect, useId, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
	IonItem, IonLabel, IonSelect, IonSelectOption,
	IonDatetime, IonPopover, IonTextarea, IonButton,
	IonSpinner, IonList, IonNote, IonToggle,
} from '@ionic/react'
import { usePublicadores } from '../hooks/usePublicadores'
import type { AddInfoPublPayload } from '../hooks/useAddInfoPubl'

// ─────────────────────────────────────────────────────────────────────────────
// Zod schema
// ─────────────────────────────────────────────────────────────────────────────
const schema = z.object({
	/** UUID string (no usar Number(): rompe con UUID) */
	idpublicador: z
		.string({ message: 'Publicador requerido' })
		.min(1, 'Publicador requerido'),
	fecha:         z.string().optional().nullable(),
	observaciones: z.string().optional().nullable(),
	pastoreo:      z.boolean(),
})

interface FormValues {
	idpublicador: string
	fecha?: string | null
	observaciones?: string | null
	pastoreo: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
	/** Si se pasa idpublicador fijo (UUID), el select queda oculto */
	fixedPublicadorId?: string
	defaultValues?: Partial<FormValues>
	onSubmit: (data: AddInfoPublPayload) => void
	onCancel?: () => void
	isSubmitting?: boolean
}

function formatFechaMostrar(iso: string | null | undefined): string {
	if (iso == null || iso === '') return ''
	try {
		const d = new Date(iso)
		if (Number.isNaN(d.getTime())) return String(iso)
		const dia = String(d.getUTCDate()).padStart(2, '0')
		const mes = String(d.getUTCMonth() + 1).padStart(2, '0')
		const anno = d.getUTCFullYear()
		return `${dia}/${mes}/${anno}`
	} catch {
		return ''
	}
}

interface FechaPopoverFieldProps {
	value: string | null | undefined
	onChange: (v: string | null) => void
	triggerId: string
}

/** Fecha con popover: evita ion-datetime inline (bloque blanco / altura enorme) */
function FechaPopoverField({
	value,
	onChange,
	triggerId,
}: FechaPopoverFieldProps) {
	const popoverRef = useRef<HTMLIonPopoverElement>(null)

	return (
		<>
			<IonItem lines="none" className="addinfopubl-fecha-item">
				<IonLabel position="stacked">Fecha</IonLabel>
				<IonButton
					type="button"
					id={triggerId}
					expand="block"
					fill="outline"
					className="addinfopubl-fecha-btn"
				>
					{formatFechaMostrar(value) || 'Seleccionar fecha'}
				</IonButton>
			</IonItem>
			<IonPopover
				ref={popoverRef}
				trigger={triggerId}
				triggerAction="click"
				className="addinfopubl-datetime-popover"
			>
				<IonDatetime
					presentation="date"
					locale="es-ES"
					firstDayOfWeek={1}
					color="dark"
					value={value ?? undefined}
					onIonChange={(e) => {
						const v = (e.detail.value as string) ?? null
						onChange(v)
						if (v != null && v !== '') {
							void popoverRef.current?.dismiss()
						}
					}}
					className="addinfopubl-ion-datetime"
				/>
			</IonPopover>
		</>
	)
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
	const fechaTriggerId = `addinfopubl-fecha-tr-${useId().replace(/:/g, '')}`
	const { publicadores } = usePublicadores()

	const {
		control,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema) as any,
		defaultValues: {
			fecha:         null,
			observaciones: null,
			pastoreo:      false,
			...defaultValues,
			idpublicador:
				fixedPublicadorId ??
				defaultValues?.idpublicador ??
				'',
		},
	})

	useEffect(() => {
		if (defaultValues) {
			reset({
				idpublicador: String(
					fixedPublicadorId ?? defaultValues.idpublicador ?? '',
				),
				fecha:         defaultValues.fecha ?? null,
				observaciones: defaultValues.observaciones ?? null,
				pastoreo:      defaultValues.pastoreo ?? false,
			})
		}
	}, [defaultValues, fixedPublicadorId, reset])

	const handleFormSubmit = (values: FormValues) => {
		const payload: AddInfoPublPayload = {
			idpublicador:  String(values.idpublicador ?? '').trim(),
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
									interface="alert"
									interfaceOptions={{
										cssClass: 'addinfopubl-publicador-select-overlay',
									}}
									value={field.value}
									onIonChange={(e) =>
										field.onChange(String(e.detail.value ?? ''))
									}
									placeholder="Seleccionar publicador"
								>
									{publicadores.map((p) => (
										<IonSelectOption
											key={String(p.id)}
											value={String(p.id)}
										>
											{p.nombre}
										</IonSelectOption>
									))}
								</IonSelect>
							)}
						/>
						{errors.idpublicador && (
							<IonNote color="danger" slot="error">{errors.idpublicador.message}</IonNote>
						)}
					</IonItem>
				)}

				{/* fecha: popover (no inline; tema oscuro) */}
				<Controller
					name="fecha"
					control={control}
					render={({ field }) => (
						<FechaPopoverField
							value={field.value}
							onChange={field.onChange}
							triggerId={fechaTriggerId}
						/>
					)}
				/>

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
