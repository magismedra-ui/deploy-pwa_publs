import { AsistenciaRepository } from '../repositories/asistencia.repository'
import { Asistencia } from '../types'

/**
 * Sin caché Redis en listados: evita que GET /asistencia devuelva filas
 * ya borradas (Redis KEYS/del a veces no invalida bien en producción).
 */
export class AsistenciaService {
	private repository: AsistenciaRepository

	constructor() {
		this.repository = new AsistenciaRepository()
	}

	async findAll(): Promise<Asistencia[]> {
		return this.repository.findAll()
	}

	async findById(id: string): Promise<Asistencia | null> {
		return this.repository.findById(id)
	}

	async create(data: Asistencia): Promise<Asistencia> {
		return this.repository.create(data)
	}

	async update(id: string, data: Partial<Asistencia>): Promise<Asistencia | null> {
		return this.repository.update(id, data)
	}

	async delete(id: string): Promise<boolean> {
		return this.repository.delete(id)
	}
}
