import { Request, Response, NextFunction } from 'express';
import * as contactService from '../../services/client/contactService';
import { sendSuccess, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

// @desc    Sync contacts
// @route   POST /api/v1/contacts/sync
// @access  Private
export async function syncContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await contactService.syncContacts(req.user!.userId, req.body.contacts);
    sendSuccess(res, 'Contacts synced', result);
  } catch (error: any) { logger.error('Sync contacts error', { error: error.message }); sendNotFound(res, error.message); }
}

// @desc    Get user contacts
// @route   GET /api/v1/contacts
// @access  Private
export async function getContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const sortBy = req.query.sortBy as string || 'name';
    const result = await contactService.getUserContacts(req.user!.userId, page, limit, sortBy);
    sendSuccess(res, 'Contacts fetched', result);
  } catch (error: any) { logger.error('Get contacts error', { error: error.message }); sendNotFound(res, error.message); }
}

// @desc    Search contacts
// @route   GET /api/v1/contacts/search
// @access  Private
export async function searchContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const contacts = await contactService.searchContacts(req.user!.userId, req.query.q as string);
    sendSuccess(res, 'Search results', contacts);
  } catch (error: any) { logger.error('Search contacts error', { error: error.message }); sendNotFound(res, error.message); }
}

// @desc    Block contact
// @route   PATCH /api/v1/contacts/:contactId/block
// @access  Private
export async function blockContact(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await contactService.blockContact(req.user!.userId, req.params.contactId);
    sendSuccess(res, 'Contact blocked');
  } catch (error: any) { logger.error('Block contact error', { error: error.message }); sendNotFound(res, error.message); }
}

// @desc    Unblock contact
// @route   PATCH /api/v1/contacts/:contactId/unblock
// @access  Private
export async function unblockContact(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await contactService.unblockContact(req.user!.userId, req.params.contactId);
    sendSuccess(res, 'Contact unblocked');
  } catch (error: any) { logger.error('Unblock contact error', { error: error.message }); sendNotFound(res, error.message); }
}

// @desc    Add contact to favorites
// @route   PATCH /api/v1/contacts/:contactId/favorite
// @access  Private
export async function addFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await contactService.addFavorite(req.user!.userId, req.params.contactId);
    sendSuccess(res, 'Added to favorites');
  } catch (error: any) { logger.error('Add favorite error', { error: error.message }); sendNotFound(res, error.message); }
}

// @desc    Remove contact from favorites
// @route   PATCH /api/v1/contacts/:contactId/unfavorite
// @access  Private
export async function removeFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await contactService.removeFavorite(req.user!.userId, req.params.contactId);
    sendSuccess(res, 'Removed from favorites');
  } catch (error: any) { logger.error('Remove favorite error', { error: error.message }); sendNotFound(res, error.message); }
}

// @desc    Get blocked contacts
// @route   GET /api/v1/contacts/blocked
// @access  Private
export async function getBlockedContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const contacts = await contactService.getBlockedContacts(req.user!.userId);
    sendSuccess(res, 'Blocked contacts fetched', contacts);
  } catch (error: any) { logger.error('Get blocked contacts error', { error: error.message }); sendNotFound(res, error.message); }
}

// @desc    Get favorite contacts
// @route   GET /api/v1/contacts/favorites
// @access  Private
export async function getFavoriteContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const contacts = await contactService.getFavoriteContacts(req.user!.userId);
    sendSuccess(res, 'Favorite contacts fetched', contacts);
  } catch (error: any) { logger.error('Get favorites error', { error: error.message }); sendNotFound(res, error.message); }
}

// @desc    Get contact info
// @route   GET /api/v1/contacts/:contactId
// @access  Private
export async function getContactInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const contact = await contactService.getContactInfo(req.user!.userId, req.params.contactId);
    sendSuccess(res, 'Contact info fetched', contact);
  } catch (error: any) { logger.error('Get contact info error', { error: error.message }); sendNotFound(res, error.message); }
}