import { Router } from 'express'
import { RoleController } from '../controllers/role.controller'
import { authenticate } from '../middlewares/auth'
import { validateUUID } from '../middlewares/validateUUID'

const router = Router()
const controller = new RoleController()

router.get('/', authenticate, controller.findAll)
router.get('/:id', authenticate, validateUUID, controller.findById)
router.post('/', authenticate, controller.create)
router.put('/:id', authenticate, validateUUID, controller.update)
router.delete('/:id', authenticate, validateUUID, controller.delete)

export default router
