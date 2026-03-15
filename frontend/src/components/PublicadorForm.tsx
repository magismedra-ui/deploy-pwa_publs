import React, { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
	IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
	IonToggle, IonTextarea, IonDatetime, IonButton, IonSpinner,
	IonList, IonListHeader, IonNote,
} from '@ionic/react'
import { useGrupos } from '../hooks/useGrupos'
import { getLocally } from '../lib/localDb'
import { apiService } from '../services/api'
import type { PublicadorPayload } from '../hooks/usePublicadores'

// ─────────────────────────────────────────────────────────────────────────────
// Zod schema — campos exactos del schema Neon
// NOTA: sin .default() para evitar incompatibilidad con react-hook-form + Zod v4
// El default de 'estado' se maneja en defaultValues del useForm
// ─────────────────────────────────────────────────────────────────────────────
const schema = z.object({
	nombre:            z.string().min(2, 'Nombre requerido'),
	correo:            z.string().email('Correo inválido').optional().or(z.literal('')),
	sexo:              z.enum(['M', 'F']).optional(),
	esperanza:         z.enum(['ungido', 'otras_ovejas']).optional(),
	privilegio:        z.enum(['anciano', 'siervo_ministerial', 'publicador']).optional(),
	precursor:         z.enum(['regular', 'auxiliar', 'especial', 'ninguno']).optional(),
	fecha_nacimiento:  z.string().optional(),
	fecha_bautismo:    z.string().optional(),
	direccion:         z.string().optional(),
	telefono_familiar: z.number().optional().nullable(),
	telefono:          z.number().optional().nullable(),
	grupo:             z.number().optional().nullable(),
	capitan:           z.boolean().optional(),
	auxiliar:          z.boolean().optional(),
	estado:            z.enum(['activo', 'inactivo']).optional(),
	observaciones:     z.string().optional(),
})

type FormValues = z.infer<typeof schema>

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
	id?: number
	onSubmit: (data: PublicadorPayload) => void
	onCancel?: () => void
	isSubmitting?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────
export const PublicadorForm: React.FC<Props> = ({ id, onSubmit, onCancel, isSubmitting }) => {
	const { grupos } = useGrupos()

	const {
		control,
		handleSubmit,
		reset,
		watch,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { estado: 'activo' },
	})

	const privilegio = watch('privilegio')
	const showCapitan = privilegio === 'anciano'
	const showAuxiliar = privilegio === 'anciano' || privilegio === 'siervo_ministerial'

	// ── Carga en modo edición ────────────────────────────────────────────
	useEffect(() => {
		if (!id) return
		const load = async () => {
			if (!navigator.onLine) {
				const local = await getLocally('publicadores')
				const found = local.find((p) => p.id === Number(id))
				if (found) {
					const { _syncStatus, _deleted, ...clean } = found as any
					reset(clean)
					return
				}
			}
			try {
				const data = await apiService.get<FormValues>(`/publicador/${id}`)
				reset(data)
			} catch {
				const local = await getLocally('publicadores')
				const found = local.find((p) => p.id === Number(id))
				if (found) {
					const { _syncStatus, _deleted, ...clean } = found as any
					reset(clean)
				}
			}
		}
		load()
	}, [id, reset])

	// ── Submit ───────────────────────────────────────────────────────────
	const handleFormSubmit = (values: FormValues) => {
		const payload: PublicadorPayload = {
			nombre:            values.nombre,
			correo:            values.correo || null,
			sexo:              values.sexo,
			esperanza:         values.esperanza,
			privilegio:        values.privilegio,
			precursor:         values.precursor,
			fecha_nacimiento:  values.fecha_nacimiento,
			fecha_bautismo:    values.fecha_bautismo,
			direccion:         values.direccion,
			telefono:          values.telefono ?? null,
			telefono_familiar: values.telefono_familiar ?? null,
			grupo:             values.grupo ?? null,
			capitan:           values.capitan,
			auxiliar:          values.auxiliar,
			estado:            values.estado ?? 'activo',
			observaciones:     values.observaciones,
		}
		onSubmit(payload)
	}

	return (
		<form onSubmit={handleSubmit(handleFormSubmit)}>
			<IonList>

				{/* ── Datos básicos ─────────────────────────────────────── */}
				<IonListHeader><IonLabel>Datos básicos</IonLabel></IonListHeader>

				{/* nombre */}
				<IonItem>
					<IonLabel position="stacked">Nombre *</IonLabel>
					<Controller
						name="nombre"
						control={control}
						render={({ field }) => (
							<IonInput
								type="text"
								value={field.value ?? ''}
								onIonChange={(e) => field.onChange(e.detail.value)}
								placeholder="Nombre completo"
							/>
						)}
					/>
					{errors.nombre && <IonNote color="danger" slot="error">{errors.nombre.message}</IonNote>}
				</IonItem>

				{/* correo */}
				<IonItem>
					<IonLabel position="stacked">Correo</IonLabel>
					<Controller
						name="correo"
						control={control}
						render={({ field }) => (
							<IonInput
								type="email"
								value={field.value ?? ''}
								onIonChange={(e) => field.onChange(e.detail.value)}
								placeholder="correo@ejemplo.com"
							/>
						)}
					/>
					{errors.correo && <IonNote color="danger" slot="error">{errors.correo.message}</IonNote>}
				</IonItem>

				{/* sexo */}
				<IonItem>
					<IonLabel position="stacked">Sexo</IonLabel>
					<Controller
						name="sexo"
						control={control}
						render={({ field }) => (
							<IonSelect
								value={field.value}
								onIonChange={(e) => field.onChange(e.detail.value)}
								placeholder="Seleccionar"
							>
								<IonSelectOption value="M">Masculino</IonSelectOption>
								<IonSelectOption value="F">Femenino</IonSelectOption>
							</IonSelect>
						)}
					/>
				</IonItem>

				{/* esperanza */}
				<IonItem>
					<IonLabel position="stacked">Esperanza</IonLabel>
					<Controller
						name="esperanza"
						control={control}
						render={({ field }) => (
							<IonSelect
								value={field.value}
								onIonChange={(e) => field.onChange(e.detail.value)}
								placeholder="Seleccionar"
							>
								<IonSelectOption value="ungido">Ungido</IonSelectOption>
								<IonSelectOption value="otras_ovejas">Otras ovejas</IonSelectOption>
							</IonSelect>
						)}
					/>
				</IonItem>

				{/* ── Privilegios ───────────────────────────────────────── */}
				<IonListHeader><IonLabel>Privilegios</IonLabel></IonListHeader>

				{/* privilegio */}
				<IonItem>
					<IonLabel position="stacked">Privilegio</IonLabel>
					<Controller
						name="privilegio"
						control={control}
						render={({ field }) => (
							<IonSelect
								value={field.value}
								onIonChange={(e) => field.onChange(e.detail.value)}
								placeholder="Seleccionar"
							>
								<IonSelectOption value="anciano">Anciano</IonSelectOption>
								<IonSelectOption value="siervo_ministerial">Siervo ministerial</IonSelectOption>
								<IonSelectOption value="publicador">Publicador</IonSelectOption>
							</IonSelect>
						)}
					/>
				</IonItem>

				{/* precursor */}
				<IonItem>
					<IonLabel position="stacked">Precursor</IonLabel>
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

				{/* capitan — solo si anciano */}
				{showCapitan && (
					<IonItem>
						<IonLabel>Capitán de grupo</IonLabel>
						<Controller
							name="capitan"
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
				)}

				{/* auxiliar — si anciano o siervo */}
				{showAuxiliar && (
					<IonItem>
						<IonLabel>Auxiliar de grupo</IonLabel>
						<Controller
							name="auxiliar"
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
				)}

				{/* estado */}
				<IonItem>
					<IonLabel position="stacked">Estado</IonLabel>
					<Controller
						name="estado"
						control={control}
						render={({ field }) => (
							<IonSelect
								value={field.value ?? 'activo'}
								onIonChange={(e) => field.onChange(e.detail.value)}
							>
								<IonSelectOption value="activo">Activo</IonSelectOption>
								<IonSelectOption value="inactivo">Inactivo</IonSelectOption>
							</IonSelect>
						)}
					/>
				</IonItem>

				{/* grupo */}
				<IonItem>
					<IonLabel position="stacked">Grupo</IonLabel>
					<Controller
						name="grupo"
						control={control}
						render={({ field }) => (
							<IonSelect
								value={field.value}
								onIonChange={(e) => field.onChange(e.detail.value ? Number(e.detail.value) : null)}
								placeholder="Sin grupo"
							>
								{grupos.map((g) => (
									<IonSelectOption key={g.id} value={g.id}>{g.nombre}</IonSelectOption>
								))}
							</IonSelect>
						)}
					/>
				</IonItem>

				{/* ── Fechas ────────────────────────────────────────────── */}
				<IonListHeader><IonLabel>Fechas</IonLabel></IonListHeader>

				{/* fecha_nacimiento */}
				<IonItem>
					<IonLabel position="stacked">Fecha de nacimiento</IonLabel>
					<Controller
						name="fecha_nacimiento"
						control={control}
						render={({ field }) => (
							<IonDatetime
								presentation="date"
								value={field.value ?? undefined}
								onIonChange={(e) => field.onChange(e.detail.value as string)}
							/>
						)}
					/>
				</IonItem>

				{/* fecha_bautismo */}
				<IonItem>
					<IonLabel position="stacked">Fecha de bautismo</IonLabel>
					<Controller
						name="fecha_bautismo"
						control={control}
						render={({ field }) => (
							<IonDatetime
								presentation="date"
								value={field.value ?? undefined}
								onIonChange={(e) => field.onChange(e.detail.value as string)}
							/>
						)}
					/>
				</IonItem>

				{/* ── Contacto ──────────────────────────────────────────── */}
				<IonListHeader><IonLabel>Contacto</IonLabel></IonListHeader>

				{/* telefono */}
				<IonItem>
					<IonLabel position="stacked">Teléfono</IonLabel>
					<Controller
						name="telefono"
						control={control}
						render={({ field }) => (
							<IonInput
								type="tel"
								inputmode="numeric"
								value={field.value?.toString() ?? ''}
								onIonChange={(e) => {
									const v = e.detail.value
									field.onChange(v ? Number(v) : null)
								}}
								placeholder="Número de teléfono"
							/>
						)}
					/>
				</IonItem>

				{/* telefono_familiar */}
				<IonItem>
					<IonLabel position="stacked">Teléfono familiar</IonLabel>
					<Controller
						name="telefono_familiar"
						control={control}
						render={({ field }) => (
							<IonInput
								type="tel"
								inputmode="numeric"
								value={field.value?.toString() ?? ''}
								onIonChange={(e) => {
									const v = e.detail.value
									field.onChange(v ? Number(v) : null)
								}}
								placeholder="Número familiar"
							/>
						)}
					/>
				</IonItem>

				{/* direccion */}
				<IonItem>
					<IonLabel position="stacked">Dirección</IonLabel>
					<Controller
						name="direccion"
						control={control}
						render={({ field }) => (
							<IonInput
								type="text"
								value={field.value ?? ''}
								onIonChange={(e) => field.onChange(e.detail.value)}
								placeholder="Dirección"
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
								rows={3}
								value={field.value ?? ''}
								onIonChange={(e) => field.onChange(e.detail.value)}
								placeholder="Notas adicionales..."
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
					{isSubmitting ? <IonSpinner name="crescent" /> : id ? 'Actualizar' : 'Guardar'}
				</IonButton>
			</div>
		</form>
	)
}

export default PublicadorForm
