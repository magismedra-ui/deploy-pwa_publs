import { AuthUser } from '../types'
import { JwtPayloadDecoded } from '../types'

/**
 * Decodifica el payload del JWT sin verificar firma (solo lectura en cliente).
 * El payload contiene: idusuario, nombre, rol, email, iat, exp
 */
export const decodeJwtPayload = (token: string): JwtPayloadDecoded | null => {
	try {
		const parts = token.split('.')
		if (parts.length !== 3) return null
		const payload = parts[1]
		const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
		return JSON.parse(decoded) as JwtPayloadDecoded
	} catch {
		return null
	}
}

export const userFromToken = (token: string): AuthUser | null => {
	const payload = decodeJwtPayload(token)
	if (!payload) return null
	return {
		id: payload.idusuario,
		email: payload.email,
		userName: payload.nombre,
		roleName: payload.rol
	}
}
