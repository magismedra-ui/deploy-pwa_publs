import { randomUUID } from 'crypto'

export const generateUUID = (): string => {
	return randomUUID()
}

/**
 * Formato 8-4-4-4-12 hexadecimal con guiones.
 * No exige variante RFC estricta en el 4º grupo (evita rechazar UUID de MySQL u otros).
 */
export const isValidUUID = (uuid: string): boolean => {
	const t = String(uuid).trim()
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
		t,
	)
}
