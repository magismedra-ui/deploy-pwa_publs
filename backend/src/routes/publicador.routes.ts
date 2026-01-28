import { Router } from 'express'
import { PublicadorController } from '../controllers/publicador.controller'
import { authenticate } from '../middlewares/auth'
import { validateUUID } from '../middlewares/validateUUID'

const router = Router()
const controller = new PublicadorController()

router.get('/', authenticate, controller.findAll)
router.get('/:id', authenticate, validateUUID, controller.findById)
router.get('/grupo/:grupo', authenticate, validateUUID, controller.findByGrupo)
router.post('/', authenticate, controller.create)
router.put('/:id', authenticate, validateUUID, controller.update)
router.delete('/:id', authenticate, validateUUID, controller.delete)

export default router
