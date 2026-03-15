import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import { validateUUID } from '../middlewares/validateUUID'
import * as ctrl from '../controllers/addinfopubl.controller'

const router = Router()

router.use(authenticate)

router.get('/', ctrl.getAll)
router.get('/publicador/:idpublicador', validateUUID, ctrl.getByPublicador)
router.get('/:id', validateUUID, ctrl.getById)
router.post('/', ctrl.create)
router.put('/:id', validateUUID, ctrl.update)
router.delete('/:id', validateUUID, ctrl.remove)

export default router
