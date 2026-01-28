import { LocalRepository } from './local-repository'
import { Asistencia } from '../types'

export class AsistenciaRepository extends LocalRepository<Asistencia> {
	protected tableName = 'asistencia'
}

export const asistenciaRepository = new AsistenciaRepository()
