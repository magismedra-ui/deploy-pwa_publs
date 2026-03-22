import { Router } from 'express'
import { UsuarioController } from '../controllers/usuario.controller'
import { authenticate } from '../middlewares/auth'
import { validateUsuarioId } from '../middlewares/validateUsuarioId'

const router = Router()
const controller = new UsuarioController()

router.get('/', authenticate, controller.findAll)
router.get('/:id', authenticate, validateUsuarioId, controller.findById)
router.post('/', authenticate, controller.create)
router.put('/:id', authenticate, validateUsuarioId, controller.update)
router.delete('/:id', authenticate, validateUsuarioId, controller.delete)
router.patch('/change-password', authenticate, controller.changePassword)

export default router
