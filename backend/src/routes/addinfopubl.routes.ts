import { Router } from 'express'
import { AddInfoPublController } from '../controllers/addinfopubl.controller'
import { authenticate } from '../middlewares/auth'
import { validateUUID } from '../middlewares/validateUUID'

const router = Router()
const controller = new AddInfoPublController()

router.get('/', authenticate, controller.findAll)
router.get('/:id', authenticate, validateUUID, controller.findById)
router.get('/publicador/:idpublicador', authenticate, validateUUID, controller.findByPublicador)
router.post('/', authenticate, controller.create)
router.put('/:id', authenticate, validateUUID, controller.update)
router.delete('/:id', authenticate, validateUUID, controller.delete)

export default router
