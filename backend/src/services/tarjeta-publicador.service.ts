import {
	PDFDocument,
	rgb,
	StandardFonts,
	type PDFPage,
	type PDFFont,
} from 'pdf-lib'
import { Publicador, Registro } from '../types'

// ─── Tipos (forma esperada por el layout S-21) ───────────────────────────────

export interface PublicadorS21 {
	nombre: string
	sexo: 'HOMBRE' | 'MUJER' | string
	esperanza: 'OTRAS OVEJAS' | 'UNGIDO' | string
	/** PUBLICADOR | ANCIANO | SIERVO MINISTERIAL | ... */
	privilegio: string
	fecha_nacimiento: string
	fecha_bautismo: string
}

export interface RegistroS21 {
	anno_servicio: string
	mes: string
	predico: boolean
	cursos: string
	precursor: string
	horas: string
	notas: string
}

// ─── Constantes de layout ───────────────────────────────────────────────────

const PAGE_W = 612
const PAGE_H = 792
const M_LEFT = 50
const M_TOP = 40
const CONTENT_W = PAGE_W - M_LEFT * 2

const COL_W = [80, 75, 65, 72, 90, 130] as const

const MONTHS = [
	'Septiembre',
	'Octubre',
	'Noviembre',
	'Diciembre',
	'Enero',
	'Febrero',
	'Marzo',
	'Abril',
	'Mayo',
	'Junio',
	'Julio',
	'Agosto',
]

const C = {
	black: rgb(0, 0, 0),
	white: rgb(1, 1, 1),
	grayTxt: rgb(0.4, 0.4, 0.4),
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
	try {
		const [y, m, d] = iso.split('-')
		if (!y || !m || !d) return iso
		return `${d}/${m}/${y}`
	} catch {
		return iso
	}
}

function toIsoDate(value: Date | string | undefined): string {
	if (value == null) return ''
	if (typeof value === 'string') {
		const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
		if (m) return `${m[1]}-${m[2]}-${m[3]}`
		const d = new Date(value)
		if (Number.isNaN(d.getTime())) return ''
		const y = d.getFullYear()
		const mo = String(d.getMonth() + 1).padStart(2, '0')
		const day = String(d.getDate()).padStart(2, '0')
		return `${y}-${mo}-${day}`
	}
	const y = value.getFullYear()
	const mo = String(value.getMonth() + 1).padStart(2, '0')
	const day = String(value.getDate()).padStart(2, '0')
	return `${y}-${mo}-${day}`
}

function truncate(
	font: PDFFont,
	text: string,
	size: number,
	maxW: number,
): string {
	let t = text
	while (t.length > 0 && font.widthOfTextAtSize(t, size) > maxW) {
		t = t.slice(0, -1)
	}
	return t
}

function drawTextCentered(
	page: PDFPage,
	font: PDFFont,
	text: string,
	size: number,
	cellX: number,
	cellW: number,
	y: number,
	color = C.black,
) {
	const tw = font.widthOfTextAtSize(text, size)
	page.drawText(text, {
		x: cellX + (cellW - tw) / 2,
		y,
		size,
		font,
		color,
	})
}

function drawTextRight(
	page: PDFPage,
	font: PDFFont,
	text: string,
	size: number,
	cellX: number,
	cellW: number,
	y: number,
	pad = 4,
) {
	const tw = font.widthOfTextAtSize(text, size)
	page.drawText(text, {
		x: cellX + cellW - tw - pad,
		y,
		size,
		font,
		color: C.black,
	})
}

function drawCheckbox(
	page: PDFPage,
	font: PDFFont,
	x: number,
	y: number,
	checked: boolean,
	size = 9,
) {
	page.drawRectangle({
		x,
		y,
		width: size,
		height: size,
		borderColor: C.black,
		borderWidth: 0.7,
		color: C.white,
	})
	if (checked) {
		const mark = 'X'
		const fs = size - 1
		const tw = font.widthOfTextAtSize(mark, fs)
		page.drawText(mark, {
			x: x + (size - tw) / 2,
			y: y + 1.5,
			size: fs,
			font,
			color: C.black,
		})
	}
}

/**
 * Año de servicio (anno_servicio): Septiembre del año N-1 → Agosto del año N
 * (ej. 2026 = sept/2025 … ago/2026). Solo se usan registros del último año
 * vigente (máximo anno_servicio).
 */
function parseAnnoServicio(value: unknown): number | null {
	if (value == null || value === '') return null
	const n = Number(value)
	return Number.isNaN(n) ? null : n
}

function coerceBoolean(value: unknown): boolean {
	if (typeof value === 'boolean') return value
	if (typeof value === 'string') {
		const t = value.trim().toLowerCase()
		return t === 'true' || t === '1'
	}
	if (typeof value === 'number') return value !== 0
	return false
}

/** Coincide el mes de BD con la fila del PDF (Septiembre…Agosto). */
function normalizeNombreMes(mes: string | undefined): string {
	if (!mes) return ''
	const t = mes.trim()
	const lower = t.toLowerCase()
	const canon = MONTHS.find((m) => m.toLowerCase() === lower)
	return canon ?? t
}

/**
 * Precursor auxiliar: texto literal o abreviatura "PA" (según datos de registro).
 * Horas: en blanco solo si precursor es "pub" (sin distinguir mayúsculas).
 */
function precursorParaPdf(raw: string | undefined): string {
	const s = String(raw ?? '').trim()
	const low = s.toLowerCase()
	if (low === 'precursor auxiliar' || low === 'pa') {
		return 'Precursor auxiliar'
	}
	if (low === 'pub') return 'Pub'
	return s
}

/** Mapea un registro de BD al formato del PDF (solo campos de `registro`). */
function registroParaS21(r: Registro): RegistroS21 {
	const annoNum = parseAnnoServicio(r.anno_servicio)
	const anno = annoNum != null ? String(annoNum) : ''
	const mesNombre = normalizeNombreMes(r.mes)

	const cursosRaw = r.cursos
	const cursos =
		cursosRaw != null && String(cursosRaw).trim() !== ''
			? String(cursosRaw)
			: '0'

	const horasRaw = r.horas
	const horas =
		horasRaw != null && String(horasRaw).trim() !== ''
			? String(horasRaw)
			: '0'

	return {
		anno_servicio: anno,
		mes: mesNombre,
		predico: coerceBoolean(r.predico),
		cursos,
		precursor: precursorParaPdf(r.precursor),
		horas,
		notas: r.notas ?? '',
	}
}

function publicadorParaS21(pub: Publicador): PublicadorS21 {
	return {
		nombre: pub.nombre ?? '',
		sexo: pub.sexo ?? '',
		esperanza: pub.esperanza ?? '',
		privilegio: pub.privilegio ?? '',
		fecha_nacimiento: toIsoDate(pub.fecha_nacimiento),
		fecha_bautismo: toIsoDate(pub.fecha_bautismo),
	}
}

function annoMasReciente(registros: Registro[]): number | null {
	let max: number | null = null
	for (const r of registros) {
		const n = parseAnnoServicio(r.anno_servicio)
		if (n != null && (max === null || n > max)) max = n
	}
	return max
}

/**
 * Registros del año de servicio vigente (máximo anno_servicio numérico).
 * Los registros con `anno_servicio` null se incluyen (datos incompletos en BD
 * pero pertenecen al mismo año que el resto del lote vigente).
 * Los que tienen otro año explícito se excluyen.
 */
function registrosDelAnoVigente(registros: Registro[]): Registro[] {
	if (registros.length === 0) return []
	const vigente = annoMasReciente(registros)
	if (vigente == null) return registros
	return registros.filter((r) => {
		const a = parseAnnoServicio(r.anno_servicio)
		if (a === vigente) return true
		if (a == null) return true
		return false
	})
}

// ─── Generador principal ────────────────────────────────────────────────────

export async function generateS21PDF(
	pub: PublicadorS21,
	records: RegistroS21[],
): Promise<Uint8Array> {
	const doc = await PDFDocument.create()
	const fReg = await doc.embedFont(StandardFonts.Helvetica)
	const fBold = await doc.embedFont(StandardFonts.HelveticaBold)
	const page = doc.addPage([PAGE_W, PAGE_H])

	const recByMes = new Map<string, RegistroS21>()
	for (const r of records) {
		recByMes.set(r.mes.toLowerCase(), r)
	}

	const annoVigente = records.length
		? [...records].sort((a, b) =>
				b.anno_servicio.localeCompare(a.anno_servicio),
			)[0].anno_servicio
		: ''

	const TITLE = 'REGISTRO DE PUBLICADOR DE LA CONGREGACIÓN'
	const TITLE_SIZE = 13
	const titleW = fBold.widthOfTextAtSize(TITLE, TITLE_SIZE)
	page.drawText(TITLE, {
		x: M_LEFT + (CONTENT_W - titleW) / 2,
		y: PAGE_H - M_TOP - 14,
		size: TITLE_SIZE,
		font: fBold,
		color: C.black,
	})

	let curY = PAGE_H - M_TOP - 14 - 18
	const LINE_GAP = 18
	const LABEL_SIZE = 10
	const VALUE_SIZE = 10
	const LINE_OFFSET = -2

	page.drawText('Nombre:', {
		x: M_LEFT,
		y: curY,
		size: LABEL_SIZE,
		font: fBold,
		color: C.black,
	})
	const lblNombreW = fBold.widthOfTextAtSize('Nombre:', LABEL_SIZE)
	const lineStart = M_LEFT + lblNombreW + 4
	const lineEndFull = M_LEFT + CONTENT_W
	page.drawLine({
		start: { x: lineStart, y: curY + LINE_OFFSET },
		end: { x: lineEndFull, y: curY + LINE_OFFSET },
		thickness: 0.6,
		color: C.black,
	})
	page.drawText(
		truncate(fReg, pub.nombre, VALUE_SIZE, lineEndFull - lineStart - 4),
		{
			x: lineStart + 2,
			y: curY,
			size: VALUE_SIZE,
			font: fReg,
			color: C.black,
		},
	)

	curY -= LINE_GAP

	const fnLineEnd = M_LEFT + 260
	const CB_COL1 = M_LEFT + 310
	const CB_COL2 = M_LEFT + 395

	page.drawText('Fecha de nacimiento:', {
		x: M_LEFT,
		y: curY,
		size: LABEL_SIZE,
		font: fBold,
		color: C.black,
	})
	const fnLblW = fBold.widthOfTextAtSize(
		'Fecha de nacimiento:',
		LABEL_SIZE,
	)
	page.drawLine({
		start: {
			x: M_LEFT + fnLblW + 4,
			y: curY + LINE_OFFSET,
		},
		end: { x: fnLineEnd, y: curY + LINE_OFFSET },
		thickness: 0.6,
		color: C.black,
	})
	page.drawText(fmtDate(pub.fecha_nacimiento), {
		x: M_LEFT + fnLblW + 6,
		y: curY,
		size: VALUE_SIZE,
		font: fReg,
		color: C.black,
	})

	drawCheckbox(
		page,
		fBold,
		CB_COL1,
		curY - 1,
		pub.sexo.toUpperCase() === 'HOMBRE',
	)
	page.drawText('Hombre', {
		x: CB_COL1 + 13,
		y: curY,
		size: LABEL_SIZE,
		font: fBold,
		color: C.black,
	})

	drawCheckbox(
		page,
		fBold,
		CB_COL2,
		curY - 1,
		pub.esperanza.toUpperCase() === 'OTRAS OVEJAS',
	)
	page.drawText('Otras ovejas', {
		x: CB_COL2 + 13,
		y: curY,
		size: LABEL_SIZE,
		font: fBold,
		color: C.black,
	})

	curY -= LINE_GAP

	page.drawText('Fecha de bautismo:', {
		x: M_LEFT,
		y: curY,
		size: LABEL_SIZE,
		font: fBold,
		color: C.black,
	})
	const fbLblW = fBold.widthOfTextAtSize('Fecha de bautismo:', LABEL_SIZE)
	page.drawLine({
		start: {
			x: M_LEFT + fbLblW + 4,
			y: curY + LINE_OFFSET,
		},
		end: { x: fnLineEnd, y: curY + LINE_OFFSET },
		thickness: 0.6,
		color: C.black,
	})
	page.drawText(fmtDate(pub.fecha_bautismo), {
		x: M_LEFT + fbLblW + 6,
		y: curY,
		size: VALUE_SIZE,
		font: fReg,
		color: C.black,
	})

	drawCheckbox(
		page,
		fBold,
		CB_COL1,
		curY - 1,
		pub.sexo.toUpperCase() === 'MUJER',
	)
	page.drawText('Mujer', {
		x: CB_COL1 + 13,
		y: curY,
		size: LABEL_SIZE,
		font: fBold,
		color: C.black,
	})

	drawCheckbox(
		page,
		fBold,
		CB_COL2,
		curY - 1,
		pub.esperanza.toUpperCase() === 'UNGIDO',
	)
	page.drawText('Ungido', {
		x: CB_COL2 + 13,
		y: curY,
		size: LABEL_SIZE,
		font: fBold,
		color: C.black,
	})

	curY -= LINE_GAP

	const PRIVS: Array<{ lines: string[]; key: string }> = [
		{ lines: ['Anciano'], key: 'ANCIANO' },
		{ lines: ['Siervo ministerial'], key: 'SIERVO MINISTERIAL' },
		{ lines: ['Precursor regular'], key: 'PRECURSOR REGULAR' },
		{ lines: ['Precursor especial'], key: 'PRECURSOR ESPECIAL' },
		{
			lines: ['Misionero que sirve', 'en el campo'],
			key: 'MISIONERO',
		},
	]

	let px = M_LEFT
	for (const priv of PRIVS) {
		drawCheckbox(
			page,
			fBold,
			px,
			curY - 1,
			pub.privilegio.toUpperCase() === priv.key,
		)
		for (let li = 0; li < priv.lines.length; li++) {
			page.drawText(priv.lines[li], {
				x: px + 13,
				y: curY - li * 11,
				size: LABEL_SIZE,
				font: fBold,
				color: C.black,
			})
		}
		const maxLW = Math.max(
			...priv.lines.map((l) => fBold.widthOfTextAtSize(l, LABEL_SIZE)),
		)
		px += 13 + maxLW + 10
	}

	curY -= 10

	const HEADER_H = 44
	const ROW_H = 20
	const TOTAL_H = 20
	const TABLE_TOP = curY - 8

	const COL_HEADERS: string[][] = [
		['Año de', 'servicio', annoVigente],
		['Participación', 'en el', 'ministerio'],
		['Cursos', 'bíblicos'],
		['Precursor', 'auxiliar'],
		['Horas', '(Si es precursor o', 'misionero que', 'sirve en el campo)'],
		['Notas'],
	]

	let cx = M_LEFT
	for (let ci = 0; ci < COL_W.length; ci++) {
		const w = COL_W[ci]
		const lines = COL_HEADERS[ci]
		page.drawRectangle({
			x: cx,
			y: TABLE_TOP - HEADER_H,
			width: w,
			height: HEADER_H,
			color: C.white,
			borderColor: C.black,
			borderWidth: 0.8,
		})
		const lineH = 10
		const totalTextH = lines.length * lineH
		const startY =
			TABLE_TOP - HEADER_H / 2 + totalTextH / 2 - lineH + 2
		for (let li = 0; li < lines.length; li++) {
			drawTextCentered(
				page,
				fBold,
				lines[li],
				7.5,
				cx,
				w,
				startY - li * lineH,
			)
		}
		cx += w
	}

	let totalHoras = 0
	let rowY = TABLE_TOP - HEADER_H

	for (let mi = 0; mi < MONTHS.length; mi++) {
		const mes = MONTHS[mi]
		const rec = recByMes.get(mes.toLowerCase())

		page.drawRectangle({
			x: M_LEFT,
			y: rowY - ROW_H,
			width: CONTENT_W,
			height: ROW_H,
			color: C.white,
		})

		cx = M_LEFT
		const textY = rowY - ROW_H + 6

		drawTextCentered(page, fReg, mes, 9, cx, COL_W[0], textY)
		page.drawRectangle({
			x: cx,
			y: rowY - ROW_H,
			width: COL_W[0],
			height: ROW_H,
			borderColor: C.black,
			borderWidth: 0.6,
		})
		cx += COL_W[0]

		const cbSize = 9
		drawCheckbox(
			page,
			fBold,
			cx + (COL_W[1] - cbSize) / 2,
			rowY - ROW_H + (ROW_H - cbSize) / 2,
			rec?.predico ?? false,
			cbSize,
		)
		page.drawRectangle({
			x: cx,
			y: rowY - ROW_H,
			width: COL_W[1],
			height: ROW_H,
			borderColor: C.black,
			borderWidth: 0.6,
		})
		cx += COL_W[1]

		const cursos =
			rec?.cursos && rec.cursos !== '0' ? rec.cursos : ''
		if (cursos) {
			drawTextCentered(page, fReg, cursos, 9, cx, COL_W[2], textY)
		}
		page.drawRectangle({
			x: cx,
			y: rowY - ROW_H,
			width: COL_W[2],
			height: ROW_H,
			borderColor: C.black,
			borderWidth: 0.6,
		})
		cx += COL_W[2]

		const isAux =
			rec?.precursor?.toLowerCase() === 'precursor auxiliar'
		drawCheckbox(
			page,
			fBold,
			cx + (COL_W[3] - cbSize) / 2,
			rowY - ROW_H + (ROW_H - cbSize) / 2,
			isAux,
			cbSize,
		)
		page.drawRectangle({
			x: cx,
			y: rowY - ROW_H,
			width: COL_W[3],
			height: ROW_H,
			borderColor: C.black,
			borderWidth: 0.6,
		})
		cx += COL_W[3]

		let horasDisplay = ''
		if (rec && rec.precursor.toLowerCase() !== 'pub') {
			horasDisplay = rec.horas !== '0' ? rec.horas : ''
			if (horasDisplay) {
				totalHoras += Number(horasDisplay) || 0
			}
		}
		if (horasDisplay) {
			drawTextCentered(page, fReg, horasDisplay, 9, cx, COL_W[4], textY)
		}
		page.drawRectangle({
			x: cx,
			y: rowY - ROW_H,
			width: COL_W[4],
			height: ROW_H,
			borderColor: C.black,
			borderWidth: 0.6,
		})
		cx += COL_W[4]

		const notas = truncate(fReg, rec?.notas ?? '', 8, COL_W[5] - 8)
		if (notas) {
			page.drawText(notas, {
				x: cx + 4,
				y: textY,
				size: 8,
				font: fReg,
				color: C.black,
			})
		}
		page.drawRectangle({
			x: cx,
			y: rowY - ROW_H,
			width: COL_W[5],
			height: ROW_H,
			borderColor: C.black,
			borderWidth: 0.6,
		})

		rowY -= ROW_H
	}

	const totalY = rowY - TOTAL_H + 6
	const labelSpanW = COL_W[0] + COL_W[1] + COL_W[2] + COL_W[3]
	const cxHoras = M_LEFT + labelSpanW
	const cxNotas = cxHoras + COL_W[4]

	drawTextRight(page, fBold, 'Total', 9, M_LEFT, labelSpanW, totalY)

	if (totalHoras > 0) {
		drawTextCentered(
			page,
			fBold,
			String(totalHoras),
			9,
			cxHoras,
			COL_W[4],
			totalY,
		)
	}
	page.drawRectangle({
		x: cxHoras,
		y: rowY - TOTAL_H,
		width: COL_W[4],
		height: TOTAL_H,
		borderColor: C.black,
		borderWidth: 0.8,
	})

	page.drawRectangle({
		x: cxNotas,
		y: rowY - TOTAL_H,
		width: COL_W[5],
		height: TOTAL_H,
		borderColor: C.black,
		borderWidth: 0.8,
	})

	// Borde exterior — izq y der terminan en fondo de Agosto (no bajan al Total)
	const monthsBottom = rowY
	page.drawLine({
		start: { x: M_LEFT, y: TABLE_TOP },
		end: { x: M_LEFT + CONTENT_W, y: TABLE_TOP },
		thickness: 1.2,
		color: C.black,
	})
	page.drawLine({
		start: { x: M_LEFT, y: TABLE_TOP },
		end: { x: M_LEFT, y: monthsBottom },
		thickness: 1.2,
		color: C.black,
	})
	page.drawLine({
		start: { x: M_LEFT + CONTENT_W, y: TABLE_TOP },
		end: { x: M_LEFT + CONTENT_W, y: monthsBottom },
		thickness: 1.2,
		color: C.black,
	})

	page.drawText('S-21-S  11/23', {
		x: M_LEFT,
		y: 28,
		size: 7,
		font: fReg,
		color: C.grayTxt,
	})

	return doc.save()
}

// ─── Servicio Express ─────────────────────────────────────────────────────────

export class TarjetaPublicadorService {
	async generarTarjetaS21(
		publicador: Publicador,
		registros: Registro[],
	): Promise<Uint8Array> {
		const filtrados = registrosDelAnoVigente(registros)
		const annoVigente = annoMasReciente(filtrados)

		const recordsS21 = filtrados.map((r) => {
			const row = registroParaS21(r)
			if (annoVigente != null && row.anno_servicio === '') {
				return { ...row, anno_servicio: String(annoVigente) }
			}
			return row
		})
		const pubS21 = publicadorParaS21(publicador)

		return generateS21PDF(pubS21, recordsS21)
	}
}
