import { Router } from 'express'
import { PublicadorController } from '../controllers/publicador.controller'
import { authenticate } from '../middlewares/auth'

const router = Router()
const controller = new PublicadorController()

router.get('/', authenticate, controller.findAll)
router.get('/grupo/:grupo', authenticate, controller.findByGrupo)
router.get('/:id', authenticate, controller.findById)
router.post('/', authenticate, controller.create)
router.put('/:id', authenticate, controller.update)
router.delete('/:id', authenticate, controller.delete)
router.get('/:id/tarjeta-s21', authenticate, controller.downloadTarjetaS21)

export default router
