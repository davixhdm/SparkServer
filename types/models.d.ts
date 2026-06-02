import { Document, Types } from 'mongoose';

export interface IBaseModel extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface TokenPayload {
  userId: string;
  phone: string;
  email?: string;
  role: string;
}

export interface AdminTokenPayload {
  adminId: string;
  email: string;
  role: string;
}

export type MessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'location'
  | 'contact'
  | 'sticker'
  | 'gif';

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export type CallType = 'voice' | 'video';

export type CallStatus = 'initiated' | 'ringing' | 'ongoing' | 'ended' | 'missed' | 'declined';

export type GroupRole = 'member' | 'admin' | 'super_admin';

export type ReportStatus = 'submitted' | 'under_review' | 'resolved' | 'dismissed';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'nudity'
  | 'violence'
  | 'hate_speech'
  | 'other';

export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type BanType = 'temporary' | 'permanent';

export type BlueTickPlan = 'monthly' | 'yearly' | 'permanent';

export type PaymentMethod =
  | 'stripe'
  | 'mpesa_stk_push'
  | 'mpesa_send_money'
  | 'mpesa_paybill'
  | 'mpesa_till'
  | 'paypal';

export type Currency = 'KES' | 'USD' | 'EUR' | 'GBP';