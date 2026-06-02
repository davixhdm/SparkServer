import { Response } from 'express';
import { ApiResponse, PaginationResult } from '../types/models';

export function sendSuccess<T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200,
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, message: string, data?: T): Response {
  return sendSuccess(res, message, data, 201);
}

export function sendPaginated<T>(
  res: Response,
  message: string,
  paginationResult: PaginationResult<T>,
): Response {
  const response: ApiResponse<T[]> = {
    success: true,
    message,
    data: paginationResult.data,
    meta: {
      page: paginationResult.page,
      limit: paginationResult.limit,
      total: paginationResult.total,
      totalPages: paginationResult.totalPages,
    },
  };
  return res.status(200).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: Record<string, string[]>,
): Response {
  const response: ApiResponse = {
    success: false,
    message,
    error: message,
    errors,
  };
  return res.status(statusCode).json(response);
}

export function sendBadRequest(res: Response, message: string, errors?: Record<string, string[]>): Response {
  return sendError(res, message, 400, errors);
}

export function sendUnauthorized(res: Response, message: string = 'Unauthorized'): Response {
  return sendError(res, message, 401);
}

export function sendForbidden(res: Response, message: string = 'Forbidden'): Response {
  return sendError(res, message, 403);
}

export function sendNotFound(res: Response, message: string = 'Not found'): Response {
  return sendError(res, message, 404);
}

export function sendConflict(res: Response, message: string): Response {
  return sendError(res, message, 409);
}

export function sendTooMany(res: Response, message: string = 'Too many requests'): Response {
  return sendError(res, message, 429);
}

export function sendServerError(res: Response, message: string = 'Internal server error'): Response {
  return sendError(res, message, 500);
}