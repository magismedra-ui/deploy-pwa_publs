import { SyncStatus } from '../types'
import { generateUUID } from './uuid'

export const buildUpdateQuery = (
	data: Record<string, any>,
	excludeFields: string[] = ['id', 'created_at']
): { updates: string[]; values: any[] } => {
	const updates: string[] = []
	const values: any[] = []

	Object.keys(data).forEach((key) => {
		if (data[key] !== undefined && !excludeFields.includes(key)) {
			updates.push(`${key} = ?`)
			values.push(data[key])
		}
	})

	if (updates.length > 0) {
		updates.push('updatedAt = CURRENT_TIMESTAMP')
		if (data.syncStatus === undefined) {
			updates.push("syncStatus = 'pending'")
		}
	}

	return { updates, values }
}

export interface BuildCreateOptions {
	skipId?: boolean
}

export const buildCreateQuery = (
	data: Record<string, any>,
	excludeFields: string[] = ['id', 'updatedAt'],
	options: BuildCreateOptions = {}
): { fields: string[]; placeholders: string[]; values: any[]; generatedId?: string } => {
	const fields: string[] = []
	const placeholders: string[] = []
	const values: any[] = []
	let generatedId: string | undefined

	if (!options.skipId && !data.id) {
		generatedId = generateUUID()
		fields.push('id')
		placeholders.push('?')
		values.push(generatedId)
	}

	Object.keys(data).forEach((key) => {
		if (data[key] !== undefined && !excludeFields.includes(key)) {
			fields.push(key)
			placeholders.push('?')
			values.push(data[key])
		}
	})

	if (!fields.some(f => f === 'syncStatus')) {
		fields.push('syncStatus')
		placeholders.push('?')
		values.push(data.syncStatus || 'pending')
	}

	if (!fields.some(f => f === 'deleted')) {
		fields.push('deleted')
		placeholders.push('?')
		values.push(data.deleted !== undefined ? data.deleted : false)
	}

	return { fields, placeholders, values, generatedId }
}
