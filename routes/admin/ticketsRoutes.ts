import { Router } from 'express';
import * as ticketsController from '../../controllers/admin/ticketsController';
import { adminAuthMiddleware } from '../../middleware/admin/adminAuthMiddleware';
import { requireModeratorOrAbove } from '../../middleware/admin/adminRoleMiddleware';

const router = Router();

router.use(adminAuthMiddleware);
router.use(requireModeratorOrAbove);

router.get('/', ticketsController.getTickets);
router.get('/:ticketId', ticketsController.getTicketDetail);
router.patch('/:ticketId/assign', ticketsController.assignTicket);
router.post('/:ticketId/reply', ticketsController.replyToTicket);
router.patch('/:ticketId/status', ticketsController.updateTicketStatus);
router.patch('/:ticketId/priority', ticketsController.updateTicketPriority);

export default router;