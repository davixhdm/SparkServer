import Ticket from '../../models/admin/Ticket';
import { logger } from '../../utils/logger';
import { NotFoundError } from '../../utils/errors';

export async function getTickets(
  page: number = 1,
  limit: number = 20,
  filters?: {
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
  },
): Promise<any> {
  const skip = (page - 1) * limit;
  const query: any = {};

  if (filters?.status) query.status = filters.status;
  if (filters?.priority) query.priority = filters.priority;
  if (filters?.category) query.category = filters.category;
  if (filters?.assignedTo) query.assignedTo = filters.assignedTo;

  const tickets = await Ticket.find(query)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'displayName phone email')
    .populate('assignedTo', 'displayName email')
    .lean();

  const total = await Ticket.countDocuments(query);

  return { tickets, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getTicketDetail(ticketId: string): Promise<any> {
  const ticket = await Ticket.findById(ticketId)
    .populate('userId', 'displayName phone email avatar')
    .populate('assignedTo', 'displayName email')
    .populate('messages.senderId', 'displayName')
    .lean();

  if (!ticket) throw new NotFoundError('Ticket not found');
  return ticket;
}

export async function assignTicket(ticketId: string, adminId: string): Promise<any> {
  const ticket = await Ticket.findByIdAndUpdate(
    ticketId,
    { assignedTo: adminId, status: 'in_progress' },
    { new: true },
  );
  if (!ticket) throw new NotFoundError('Ticket not found');
  return ticket;
}

export async function replyToTicket(
  ticketId: string,
  adminId: string,
  message: string,
  attachments?: string[],
): Promise<any> {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new NotFoundError('Ticket not found');

  ticket.messages.push({
    senderId: adminId as any,
    senderType: 'admin',
    message,
    attachments: attachments || [],
    createdAt: new Date(),
  });

  if (ticket.status === 'open') {
    ticket.status = 'in_progress';
  }

  await ticket.save();
  return ticket;
}

export async function updateTicketStatus(
  ticketId: string,
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed',
): Promise<any> {
  const update: any = { status };

  if (status === 'resolved') update.resolvedAt = new Date();
  if (status === 'closed') update.closedAt = new Date();

  const ticket = await Ticket.findByIdAndUpdate(ticketId, update, { new: true });
  if (!ticket) throw new NotFoundError('Ticket not found');
  return ticket;
}

export async function updateTicketPriority(
  ticketId: string,
  priority: 'low' | 'medium' | 'high' | 'urgent',
): Promise<any> {
  const ticket = await Ticket.findByIdAndUpdate(
    ticketId,
    { priority },
    { new: true },
  );
  if (!ticket) throw new NotFoundError('Ticket not found');
  return ticket;
}