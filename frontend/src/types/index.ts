export type SyncStatus = 'pending' | 'synced' | 'conflict'

export interface BaseEntity {
	id?: string
	updatedAt?: Date | string
	syncStatus?: SyncStatus
	deleted?: boolean
}

export interface AddInfoPubl extends BaseEntity {
	fecha: Date | string
	observaciones?: string
	idpublicador: string
}

export interface Asistencia extends BaseEntity {
	fecha: Date | string
	presencial?: number
	zoom?: number
}

export interface Grupo extends BaseEntity {
	id?: string   // BaseEntity usa string; el hook useGrupos usa number internamente
	nombre: string
	nroGrupo?: number | null
}

export interface Publicador extends BaseEntity {
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
	grupo?: number
	observaciones?: string
	estado?: string
	created_at?: Date | string
	capitan?: boolean
	auxiliar?: boolean
	telefono?: number
}

export interface Registro extends BaseEntity {
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
	role: string
}

export interface Usuario extends BaseEntity {
	idpublicador?: string
	idrole: string
	password?: string
	email: string
}

export interface LoginRequest {
	email: string
	password: string
}

export interface AuthUser {
	id: string
	email: string
	idpublicador?: string
	idrole: string
	userName: string
	roleName: string
}

export interface AuthResponse {
	token: string
}

export interface JwtPayloadDecoded {
	idusuario: string
	nombre: string
	rol: string
	email: string
	iat?: number
	exp?: number
}

export interface ChangePasswordRequest {
	currentPassword: string
	newPassword: string
}

export interface ApiResponse<T> {
	success: boolean
	data?: T
	error?: {
		message: string
	}
}
