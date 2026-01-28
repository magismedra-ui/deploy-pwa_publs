export type SyncStatus = 'pending' | 'synced' | 'conflict'

export interface BaseEntity {
	updatedAt?: Date | string
	syncStatus?: SyncStatus
	deleted?: boolean
}

export interface AddInfoPubl extends BaseEntity {
	id?: string
	fecha: Date | string
	observaciones?: string
	idpublicador: string
}

export interface Asistencia extends BaseEntity {
	id?: string
	fecha: Date | string
	presencial?: number
	zoom?: number
}

export interface Grupo extends BaseEntity {
	id?: string
	nombre: string
}

export interface Publicador extends BaseEntity {
	id?: string
	nombre: string
	correo?: string
	sexo?: string
	esperanza?: string
	privilegio?: string
	precursor?: string
	fecha_nacimiento?: Date | string
	fecha_bautismo?: Date | string
	direccion?: string
	telefono_familiar?: number
	grupo?: string
	observaciones?: string
	estado?: string
	created_at?: Date | string
	capitan?: boolean
	auxiliar?: boolean
	telefono?: number
}

export interface Registro extends BaseEntity {
	id?: string
	anno_servicio?: number
	mes?: string
	predico?: boolean
	cursos?: number
	precursor?: string
	horas?: number
	notas?: string
	idpublicador: string
}

export interface Role extends BaseEntity {
	id?: string
	role: string
}

export interface Usuario extends BaseEntity {
	id?: string
	idpublicador?: string
	idrole: string
	password: string
	email: string
}

export interface LoginRequest {
	email: string
	password: string
}

export interface AuthResponse {
	token: string
	usuario: {
		id: string
		email: string
		idpublicador?: string
		idrole: string
	}
}

export interface JwtPayload {
	userId: string
	email: string
	idrole: string
}

export interface ChangePasswordRequest {
	currentPassword: string
	newPassword: string
}
