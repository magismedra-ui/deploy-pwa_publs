import { generateUUID } from './uuid'

/**
 * Construye la parte SET de un UPDATE para PostgreSQL.
 * Retorna los fragmentos "campo = $N" y el array de valores.
 * El índice de los placeholders empieza en `startIndex` (por defecto 1).
 */
export const buildUpdateQuery = (
	data: Record<string, any>,
	excludeFields: string[] = ['id', 'created_at'],
	startIndex: number = 1
): { updates: string[]; values: any[] } => {
	const updates: string[] = []
	const values: any[] = []
	let idx = startIndex

	Object.keys(data).forEach((key) => {
		if (data[key] !== undefined && !excludeFields.includes(key)) {
			updates.push(`${key} = $${idx}`)
			values.push(data[key])
			idx++
		}
	})

	return { updates, values }
}

export interface BuildCreateOptions {
	skipId?: boolean
}

/**
 * Construye los campos, placeholders ($1, $2, …) y valores para un INSERT en PostgreSQL.
 */
export const buildCreateQuery = (
	data: Record<string, any>,
	excludeFields: string[] = ['id', 'updatedAt'],
	options: BuildCreateOptions = {}
): { fields: string[]; placeholders: string[]; values: any[]; generatedId?: string } => {
	const fields: string[] = []
	const placeholders: string[] = []
	const values: any[] = []
	let generatedId: string | undefined
	let idx = 1

	if (!options.skipId && !data.id) {
		generatedId = generateUUID()
		fields.push('id')
		placeholders.push(`$${idx}`)
		values.push(generatedId)
		idx++
	}

	Object.keys(data).forEach((key) => {
		if (data[key] !== undefined && !excludeFields.includes(key)) {
			fields.push(key)
			placeholders.push(`$${idx}`)
			values.push(data[key])
			idx++
		}
	})

	return { fields, placeholders, values, generatedId }
}
