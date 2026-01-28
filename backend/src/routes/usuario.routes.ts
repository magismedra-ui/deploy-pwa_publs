import { Router } from 'express'
import { UsuarioController } from '../controllers/usuario.controller'
import { authenticate } from '../middlewares/auth'
import { validateUUID } from '../middlewares/validateUUID'

const router = Router()
const controller = new UsuarioController()

router.get('/', authenticate, controller.findAll)
router.get('/:id', authenticate, validateUUID, controller.findById)
router.post('/', authenticate, controller.create)
router.put('/:id', authenticate, validateUUID, controller.update)
router.delete('/:id', authenticate, validateUUID, controller.delete)
router.patch('/change-password', authenticate, controller.changePassword)

export default router
