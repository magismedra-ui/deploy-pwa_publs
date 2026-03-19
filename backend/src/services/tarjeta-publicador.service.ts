import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fs from 'fs/promises'
import { Publicador, Registro } from '../types'

const TEMPLATE_DEFAULT_PATH = 'C:/Users/LENOVO/AppData/Roaming/Cursor/User/workspaceStorage/a3f12c29231948dc7877fed093bde9f1/pdfs/S-21_S_TARJETA_PUBLICADOR_EDITABLE.pdf'

const PRECUSOR_SKIP = new Set<string>([
	'PUBLICADOR',
	'PUBLICADORA',
	'PUBLICADOR NO BAUTIZADO',
])

const SERVICE_MONTHS: Array<{ mes: string; y: number }> = [
	{ mes: 'Septiembre', y: 628 },
	{ mes: 'Octubre', y: 608 },
	{ mes: 'Noviembre', y: 588 },
	{ mes: 'Diciembre', y: 568 },
	{ mes: 'Enero', y: 549 },
	{ mes: 'Febrero', y: 529 },
	{ mes: 'Marzo', y: 509 },
	{ mes: 'Abril', y: 489 },
	{ mes: 'Mayo', y: 469 },
	{ mes: 'Junio', y: 450 },
	{ mes: 'Julio', y: 430 },
	{ mes: 'Agosto', y: 410 },
]

// Estas coordenadas salen del template (marcadores internos del PDF).
// Columna izquierda (participación): X
// Columna derecha (horas): texto numérico
const X_PARTICIPACION = 130
const X_HORAS = 271

const NAME_X = 70
const NAME_Y = 765

const TOTAL_X = 308
const TOTAL_Y = 389

export class TarjetaPublicadorService {
	async generarTarjetaS21(publicador: Publicador, registros: Registro[]): Promise<Uint8Array> {
		const templatePath = process.env.S21_TEMPLATE_PATH || TEMPLATE_DEFAULT_PATH
		const templateBytes = await fs.readFile(templatePath)

		const doc = await PDFDocument.load(templateBytes)
		const page = doc.getPage(0)
		const font = await doc.embedFont(StandardFonts.Helvetica)

		const annoMasReciente = registros[0]?.anno_servicio
		const registrosAnno = typeof annoMasReciente === 'number'
			? registros.filter((r) => r.anno_servicio === annoMasReciente)
			: []

		const precursor = publicador.precursor
		const esPrecursor = precursor != null && !PRECUSOR_SKIP.has(String(precursor))

		const registrosPorMes = new Map<string, Registro>()
		for (const r of registrosAnno) {
			if (r.mes) registrosPorMes.set(String(r.mes), r)
		}

		// Nombre (al menos lo básico)
		page.drawText(publicador.nombre || '—', {
			x: NAME_X,
			y: NAME_Y,
			size: 10,
			font,
			color: rgb(0, 0, 0),
		})

		let totalHoras = 0
		let totalParticipaciones = 0

		for (const m of SERVICE_MONTHS) {
			const r = registrosPorMes.get(m.mes)

			if (esPrecursor) {
				const horas = r?.horas ?? null
				const horasNum = typeof horas === 'number' ? horas : Number(horas)
				if (!isNaN(horasNum)) {
					totalHoras += horasNum
					page.drawText(String(horasNum), {
						x: X_HORAS,
						y: m.y - 3,
						size: 8,
						font,
						color: rgb(0, 0, 0),
					})
				}
			} else {
				if (r?.predico) {
					totalParticipaciones += 1
					page.drawText('X', {
						x: X_PARTICIPACION,
						y: m.y - 3,
						size: 10,
						font,
						color: rgb(0, 0, 0),
					})
				}
			}
		}

		page.drawText(esPrecursor ? String(totalHoras) : String(totalParticipaciones), {
			x: TOTAL_X,
			y: TOTAL_Y,
			size: 9,
			font,
			color: rgb(0, 0, 0),
		})

		if (typeof annoMasReciente === 'number') {
			page.drawText(String(annoMasReciente), {
				x: 220,
				y: 671,
				size: 9,
				font,
				color: rgb(0, 0, 0),
			})
		}

		return await doc.save()
	}
}

