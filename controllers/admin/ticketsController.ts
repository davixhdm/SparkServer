import { Request, Response, NextFunction } from 'express';
import * as ticketsService from '../../services/admin/ticketsService';
import { sendSuccess, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Get all tickets
// @route   GET /api/v1/admin/tickets
// @access  Private/Admin
export async function getTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      status: req.query.status as string,
      priority: req.query.priority as string,
      category: req.query.category as string,
    };
    const result = await ticketsService.getTickets(page, limit, filters);
    sendSuccess(res, 'Tickets fetched', result);
  } catch (error: any) {
    logger.error('Admin get tickets error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Get ticket detail
// @route   GET /api/v1/admin/tickets/:ticketId
// @access  Private/Admin
export async function getTicketDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticket = await ticketsService.getTicketDetail(req.params.ticketId);
    sendSuccess(res, 'Ticket detail fetched', ticket);
  } catch (error: any) {
    logger.error('Admin get ticket detail error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Assign ticket
// @route   PATCH /api/v1/admin/tickets/:ticketId/assign
// @access  Private/Admin
export async function assignTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticket = await ticketsService.assignTicket(req.params.ticketId, req.admin!.adminId);
    sendSuccess(res, 'Ticket assigned', ticket);
  } catch (error: any) {
    logger.error('Admin assign ticket error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Reply to ticket
// @route   POST /api/v1/admin/tickets/:ticketId/reply
// @access  Private/Admin
export async function replyToTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, attachments } = req.body;
    const ticket = await ticketsService.replyToTicket(req.params.ticketId, req.admin!.adminId, message, attachments);
    sendSuccess(res, 'Reply sent', ticket);
  } catch (error: any) {
    logger.error('Admin reply ticket error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Update ticket status
// @route   PATCH /api/v1/admin/tickets/:ticketId/status
// @access  Private/Admin
export async function updateTicketStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticket = await ticketsService.updateTicketStatus(req.params.ticketId, req.body.status);
    sendSuccess(res, 'Ticket status updated', ticket);
  } catch (error: any) {
    logger.error('Admin update ticket status error', { error: error.message });
    sendNotFound(res, error.message);
  }
}

// @desc    Update ticket priority
// @route   PATCH /api/v1/admin/tickets/:ticketId/priority
// @access  Private/Admin
export async function updateTicketPriority(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticket = await ticketsService.updateTicketPriority(req.params.ticketId, req.body.priority);
    sendSuccess(res, 'Ticket priority updated', ticket);
  } catch (error: any) {
    logger.error('Admin update ticket priority error', { error: error.message });
    sendNotFound(res, error.message);
  }
}