import { Router } from 'express'
import { AsistenciaController } from '../controllers/asistencia.controller'
import { authenticate } from '../middlewares/auth'

const router = Router()
const controller = new AsistenciaController()

router.get('/', authenticate, controller.findAll)
router.get('/:id', authenticate, controller.findById)
router.post('/', authenticate, controller.create)
router.put('/:id', authenticate, controller.update)
router.delete('/:id', authenticate, controller.delete)

export default router
