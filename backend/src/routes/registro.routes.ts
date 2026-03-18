import { Router } from 'express'
import { RegistroController } from '../controllers/registro.controller'
import { authenticate } from '../middlewares/auth'
import { validateUUID } from '../middlewares/validateUUID'

const router = Router()
const controller = new RegistroController()

router.get('/', authenticate, controller.findAll)
router.get('/publicador/:idpublicador', authenticate, controller.findByPublicador)
router.get('/:id', authenticate, controller.findById)
router.post('/', authenticate, controller.create)
router.put('/:id', authenticate, controller.update)
router.delete('/:id', authenticate, controller.delete)

export default router
