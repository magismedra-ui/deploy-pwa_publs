import { LocalRepository } from './local-repository'
import { Role } from '../types'

export class RoleRepository extends LocalRepository<Role> {
	protected tableName = 'role'
}

export const roleRepository = new RoleRepository()
