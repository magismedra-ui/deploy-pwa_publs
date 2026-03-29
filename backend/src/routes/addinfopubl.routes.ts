import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import {
	validateAddInfoPublRouteId,
	validateUUIDParam,
} from '../middlewares/validateUUID'
import * as ctrl from '../controllers/addinfopubl.controller'

const router = Router()

router.use(authenticate)

router.get('/', ctrl.getAll)
router.get(
	'/publicador/:idpublicador',
	validateUUIDParam('idpublicador'),
	ctrl.getByPublicador,
)
router.get('/:id', validateAddInfoPublRouteId, ctrl.getById)
router.post('/', ctrl.create)
router.put('/:id', validateAddInfoPublRouteId, ctrl.update)
router.delete('/:id', validateAddInfoPublRouteId, ctrl.remove)

export default router
