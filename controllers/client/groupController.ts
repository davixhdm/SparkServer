import { Request, Response, NextFunction } from 'express';
import * as groupService from '../../services/client/groupService';
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest } from '../../utils/response';
import { logger } from '../../utils/logger';

export async function createGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, participants, description, icon } = req.body;
    const result = await groupService.createGroup(req.user!.userId, name, participants || [], description, icon);
    sendCreated(res, 'Group created', result);
  } catch (error: any) { 
    logger.error('Create group error', { error: error.message }); 
    sendBadRequest(res, error.message); 
  }
}

export async function getUserGroups(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const groups = await groupService.getUserGroups(req.user!.userId);
    sendSuccess(res, 'Groups fetched', groups);
  } catch (error: any) { 
    logger.error('Get user groups error', { error: error.message }); 
    sendNotFound(res, error.message); 
  }
}

export async function getGroupById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const group = await groupService.getGroupById(req.params.groupId, req.user!.userId);
    sendSuccess(res, 'Group fetched', group);
  } catch (error: any) { 
    logger.error('Get group error', { error: error.message }); 
    sendNotFound(res, error.message); 
  }
}

export async function updateGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const group = await groupService.updateGroup(req.params.groupId, req.user!.userId, req.body);
    sendSuccess(res, 'Group updated', group);
  } catch (error: any) { 
    logger.error('Update group error', { error: error.message }); 
    sendBadRequest(res, error.message); 
  }
}

export async function addMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const group = await groupService.addGroupMembers(req.params.groupId, req.user!.userId, req.body.members);
    sendSuccess(res, 'Members added', group);
  } catch (error: any) { 
    logger.error('Add members error', { error: error.message }); 
    sendBadRequest(res, error.message); 
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const group = await groupService.removeGroupMember(req.params.groupId, req.user!.userId, req.params.memberId);
    sendSuccess(res, 'Member removed', group);
  } catch (error: any) { 
    logger.error('Remove member error', { error: error.message }); 
    sendBadRequest(res, error.message); 
  }
}

export async function toggleAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { groupId, memberId } = req.params;
    const result = await groupService.toggleAdmin(groupId, req.user!.userId, memberId);
    sendSuccess(res, result.isAdmin ? 'User promoted to admin' : 'Admin privileges removed', result);
  } catch (error: any) { 
    logger.error('Toggle admin error', { error: error.message }); 
    sendBadRequest(res, error.message); 
  }
}

export async function generateInviteLink(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { groupId } = req.params;
    const result = await groupService.generateInviteLink(groupId, req.user!.userId);
    sendSuccess(res, 'Invite link generated', result);
  } catch (error: any) { 
    logger.error('Generate invite link error', { error: error.message }); 
    sendBadRequest(res, error.message); 
  }
}

export async function joinViaInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = req.params;
    const group = await groupService.joinViaInvite(code, req.user!.userId);
    sendSuccess(res, 'Joined group successfully', group);
  } catch (error: any) { 
    logger.error('Join via invite error', { error: error.message }); 
    sendBadRequest(res, error.message); 
  }
}

export async function updatePrivacySettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { groupId } = req.params;
    const group = await groupService.updatePrivacySettings(groupId, req.user!.userId, req.body);
    sendSuccess(res, 'Privacy settings updated', group);
  } catch (error: any) { 
    logger.error('Update privacy error', { error: error.message }); 
    sendBadRequest(res, error.message); 
  }
}

export async function updatePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { groupId } = req.params;
    const permissions = await groupService.updatePermissions(groupId, req.user!.userId, req.body);
    sendSuccess(res, 'Permissions updated', permissions);
  } catch (error: any) { 
    logger.error('Update permissions error', { error: error.message }); 
    sendBadRequest(res, error.message); 
  }
}

export async function updateSecuritySettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { groupId } = req.params;
    const security = await groupService.updateSecuritySettings(groupId, req.user!.userId, req.body);
    sendSuccess(res, 'Security settings updated', security);
  } catch (error: any) { 
    logger.error('Update security error', { error: error.message }); 
    sendBadRequest(res, error.message); 
  }
}

export async function getGroupSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { groupId } = req.params;
    const settings = await groupService.getGroupSettings(groupId, req.user!.userId);
    sendSuccess(res, 'Group settings fetched', settings);
  } catch (error: any) { 
    logger.error('Get group settings error', { error: error.message }); 
    sendNotFound(res, error.message); 
  }
}

export async function toggleMute(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { groupId } = req.params;
    const { mute } = req.body;
    await groupService.toggleMute(groupId, req.user!.userId, mute);
    sendSuccess(res, mute ? 'Group muted' : 'Group unmuted');
  } catch (error: any) { 
    logger.error('Toggle mute error', { error: error.message }); 
    sendBadRequest(res, error.message); 
  }
}

export async function leaveGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await groupService.leaveGroup(req.params.groupId, req.user!.userId);
    sendSuccess(res, 'Left group');
  } catch (error: any) { 
    logger.error('Leave group error', { error: error.message }); 
    sendNotFound(res, error.message); 
  }
}

export async function getGroupMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const media = await groupService.getGroupMedia(req.params.chatId, page, limit);
    sendSuccess(res, 'Group media fetched', media);
  } catch (error: any) { 
    logger.error('Get group media error', { error: error.message }); 
    sendNotFound(res, error.message); 
  }
}

export async function uploadGroupIcon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      sendBadRequest(res, 'No file uploaded');
      return;
    }
    const iconUrl = await groupService.uploadGroupIcon(
      req.params.groupId, 
      req.user!.userId, 
      req.file.buffer, 
      req.file.originalname
    );
    sendSuccess(res, 'Group icon updated', { iconUrl });
  } catch (error: any) { 
    logger.error('Upload group icon error', { error: error.message }); 
    sendBadRequest(res, error.message); 
  }
}