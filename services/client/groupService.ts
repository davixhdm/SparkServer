import Group from '../../models/client/Group';
import Chat from '../../models/client/Chat';
import User from '../../models/client/User';
import Message from '../../models/client/Message';
import { generateShortId } from '../../utils/helpers';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors';
import env from '../../config/env';

export async function createGroup(
  creatorId: string,
  name: string,
  participants: string[],
  description?: string,
  icon?: string,
): Promise<any> {
  if (!name || name.trim().length === 0) {
    throw new BadRequestError('Group name is required');
  }

  let allParticipants = [creatorId];
  if (participants && Array.isArray(participants)) {
    allParticipants = [...new Set([creatorId, ...participants])];
  }

  if (allParticipants.length < 2) {
    throw new BadRequestError('Group must have at least 2 members (including you)');
  }

  if (allParticipants.length > env.GROUP_MAX_MEMBERS) {
    throw new BadRequestError(`Maximum ${env.GROUP_MAX_MEMBERS} members allowed`);
  }

  const users = await User.find({ _id: { $in: allParticipants }, isDeleted: false });
  if (users.length !== allParticipants.length) {
    throw new NotFoundError('One or more users not found');
  }

  const inviteCode = generateShortId(16);
  const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/groups/join/${inviteCode}`;

  const chat = await Chat.create({
    participants: allParticipants,
    isGroup: true,
    groupName: name.trim(),
    groupIcon: icon || '',
    groupDescription: description || '',
    groupAdmins: [creatorId],
    createdBy: creatorId,
  });

  const group = await Group.create({
    chatId: chat._id,
    name: name.trim(),
    icon: icon || '',
    description: description || '',
    ownerId: creatorId,
    admins: [creatorId],
    members: allParticipants,
    memberCount: allParticipants.length,
    inviteLink,
    inviteCode,
    inviteLinkExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return { chat, group };
}

export async function getUserGroups(userId: string): Promise<any[]> {
  const groups = await Group.find({ members: userId, isDeleted: false })
    .populate('chatId', 'lastMessage')
    .lean();

  return groups.map(group => ({
    ...group,
    isAdmin: group.admins.some(a => a.toString() === userId),
    role: group.ownerId.toString() === userId ? 'owner' : 
          group.admins.some(a => a.toString() === userId) ? 'admin' : 'member'
  }));
}

export async function getGroupById(groupId: string, userId?: string): Promise<any> {
  const group = await Group.findById(groupId)
    .populate('members', 'displayName avatar phone status isHdmVerified')
    .populate('admins', 'displayName avatar')
    .populate('ownerId', 'displayName avatar');
  
  if (!group || group.isDeleted) throw new NotFoundError('Group not found');
  
  const result = group.toObject();
  if (userId) {
    result.isAdmin = group.admins.some(a => a._id.toString() === userId);
    result.isOwner = group.ownerId._id.toString() === userId;
    result.isMember = group.members.some(m => m._id.toString() === userId);
  }
  
  return result;
}

export async function updateGroup(
  groupId: string,
  userId: string,
  updates: { name?: string; description?: string; icon?: string },
): Promise<any> {
  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new NotFoundError('Group not found');
  
  const isAdmin = group.admins.some(a => a.toString() === userId);
  if (!isAdmin) {
    throw new ForbiddenError('Only admins can update group');
  }

  if (updates.name) group.name = updates.name;
  if (updates.description !== undefined) group.description = updates.description;
  if (updates.icon) group.icon = updates.icon;
  await group.save();

  await Chat.findByIdAndUpdate(group.chatId, {
    groupName: group.name,
    groupIcon: group.icon,
    groupDescription: group.description,
  });

  return group;
}

export async function addGroupMembers(
  groupId: string,
  adminId: string,
  newMembers: string[],
): Promise<any> {
  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new NotFoundError('Group not found');
  
  const isAdmin = group.admins.some(a => a.toString() === adminId);
  if (!isAdmin && group.restrictions.addMembers) {
    throw new ForbiddenError('Only admins can add members');
  }

  if (group.members.length + newMembers.length > group.maxMembers) {
    throw new BadRequestError(`Maximum ${group.maxMembers} members`);
  }

  const users = await User.find({ _id: { $in: newMembers }, isDeleted: false });
  if (users.length !== newMembers.length) throw new NotFoundError('One or more users not found');

  const actualNewMembers = newMembers.filter(
    m => !group.members.some(gm => gm.toString() === m),
  );

  group.members.push(...(actualNewMembers as any));
  group.memberCount = group.members.length;
  await group.save();

  await Chat.findByIdAndUpdate(group.chatId, {
    $addToSet: { participants: { $each: actualNewMembers } },
  });

  return group;
}

export async function removeGroupMember(
  groupId: string,
  adminId: string,
  memberId: string,
): Promise<any> {
  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new NotFoundError('Group not found');
  
  const isAdmin = group.admins.some(a => a.toString() === adminId);
  if (!isAdmin) {
    throw new ForbiddenError('Only admins can remove members');
  }
  
  if (memberId === group.ownerId.toString()) {
    throw new BadRequestError('Cannot remove group owner');
  }

  group.members = group.members.filter(m => m.toString() !== memberId);
  group.admins = group.admins.filter(a => a.toString() !== memberId);
  group.memberCount = group.members.length;
  await group.save();

  await Chat.findByIdAndUpdate(group.chatId, {
    $pull: { participants: memberId, groupAdmins: memberId },
  });

  return group;
}

export async function toggleAdmin(
  groupId: string,
  ownerId: string,
  memberId: string
): Promise<{ isAdmin: boolean; admins: string[] }> {
  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new NotFoundError('Group not found');
  
  if (group.ownerId.toString() !== ownerId) {
    throw new ForbiddenError('Only group owner can manage admins');
  }
  
  if (!group.members.some(m => m.toString() === memberId)) {
    throw new NotFoundError('User is not a member of this group');
  }
  
  const isCurrentlyAdmin = group.admins.some(a => a.toString() === memberId);
  
  if (isCurrentlyAdmin) {
    if (memberId === group.ownerId.toString()) {
      throw new BadRequestError('Cannot remove group owner as admin');
    }
    group.admins = group.admins.filter(a => a.toString() !== memberId);
  } else {
    if (group.admins.length >= env.GROUP_MAX_ADMINS) {
      throw new BadRequestError(`Maximum ${env.GROUP_MAX_ADMINS} admins allowed`);
    }
    group.admins.push(memberId as any);
  }
  
  await group.save();
  
  await Chat.findByIdAndUpdate(group.chatId, {
    groupAdmins: group.admins
  });
  
  return { 
    isAdmin: !isCurrentlyAdmin, 
    admins: group.admins.map(a => a.toString()) 
  };
}

export async function generateInviteLink(groupId: string, userId: string): Promise<{ inviteLink: string; inviteCode: string }> {
  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new NotFoundError('Group not found');
  
  if (!group.members.some(m => m.toString() === userId)) {
    throw new ForbiddenError('Only members can generate invite links');
  }
  
  const inviteCode = generateShortId(16);
  const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:3000'}/groups/join/${inviteCode}`;
  
  group.inviteLink = inviteLink;
  group.inviteCode = inviteCode;
  group.inviteLinkExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await group.save();
  
  return { inviteLink, inviteCode };
}

export async function joinViaInvite(code: string, userId: string): Promise<any> {
  const group = await Group.findOne({ inviteCode: code, isDeleted: false });
  if (!group) throw new NotFoundError('Invalid or expired invite link');
  
  if (group.inviteLinkExpiresAt && group.inviteLinkExpiresAt < new Date()) {
    throw new BadRequestError('Invite link has expired');
  }
  
  if (group.members.some(m => m.toString() === userId)) {
    throw new BadRequestError('Already a member of this group');
  }
  
  group.members.push(userId as any);
  group.memberCount = group.members.length;
  await group.save();
  
  await Chat.findByIdAndUpdate(group.chatId, {
    $addToSet: { participants: userId }
  });
  
  return group;
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new NotFoundError('Group not found');

  if (group.ownerId.toString() === userId) {
    const remainingAdmins = group.admins.filter(a => a.toString() !== userId);
    if (remainingAdmins.length > 0) {
      group.ownerId = remainingAdmins[0];
    } else if (group.members.length > 1) {
      const otherMember = group.members.find(m => m.toString() !== userId);
      group.ownerId = otherMember!;
      group.admins = [otherMember!];
    }
  }

  group.members = group.members.filter(m => m.toString() !== userId);
  group.admins = group.admins.filter(a => a.toString() !== userId);
  group.memberCount = group.members.length;

  if (group.members.length === 0) {
    group.isDeleted = true;
  }

  await group.save();

  await Chat.findByIdAndUpdate(group.chatId, {
    $pull: { participants: userId, groupAdmins: userId },
  });
}

export async function updatePrivacySettings(
  groupId: string,
  userId: string,
  updates: { privacy?: string; joinApproval?: string; memberVisibility?: string }
): Promise<any> {
  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new NotFoundError('Group not found');
  
  const isAdmin = group.admins.some(a => a.toString() === userId);
  if (!isAdmin) throw new ForbiddenError('Only admins can change privacy settings');
  
  if (updates.privacy) group.privacy = updates.privacy as any;
  if (updates.joinApproval) group.joinApproval = updates.joinApproval as any;
  if (updates.memberVisibility) group.memberVisibility = updates.memberVisibility as any;
  
  await group.save();
  return group;
}

export async function updatePermissions(
  groupId: string,
  userId: string,
  permissions: any
): Promise<any> {
  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new NotFoundError('Group not found');
  
  const isAdmin = group.admins.some(a => a.toString() === userId);
  if (!isAdmin) throw new ForbiddenError('Only admins can change permissions');
  
  Object.assign(group.restrictions, permissions);
  await group.save();
  return group.restrictions;
}

export async function updateSecuritySettings(
  groupId: string,
  userId: string,
  security: any
): Promise<any> {
  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new NotFoundError('Group not found');
  
  const isAdmin = group.admins.some(a => a.toString() === userId);
  if (!isAdmin) throw new ForbiddenError('Only admins can change security settings');
  
  Object.assign(group.security, security);
  await group.save();
  return group.security;
}

export async function getGroupSettings(groupId: string, userId: string): Promise<any> {
  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new NotFoundError('Group not found');
  
  const isMember = group.members.some(m => m.toString() === userId);
  if (!isMember) throw new ForbiddenError('Only members can view settings');
  
  return {
    privacy: group.privacy,
    joinApproval: group.joinApproval,
    memberVisibility: group.memberVisibility,
    restrictions: group.restrictions,
    permissions: group.permissions,
    security: group.security,
    inviteLink: group.inviteLink,
    inviteCode: group.inviteCode,
  };
}

export async function toggleMute(groupId: string, userId: string, mute: boolean): Promise<void> {
  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new NotFoundError('Group not found');
  
  if (!group.members.some(m => m.toString() === userId)) {
    throw new ForbiddenError('Only members can mute groups');
  }
  
  group.isMuted = mute;
  await group.save();
}

export async function getGroupMedia(chatId: string, page: number = 1, limit: number = 30): Promise<any> {
  const skip = (page - 1) * limit;
  const media = await Message.find({
    chatId,
    messageType: { $in: ['image', 'video', 'document'] },
    deletedForEveryone: false,
    mediaUrl: { $ne: '' },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('mediaUrl thumbnailUrl messageType fileName fileSize createdAt senderId')
    .populate('senderId', 'displayName')
    .lean();

  return media;
}

export async function uploadGroupIcon(groupId: string, userId: string, fileBuffer: Buffer, originalName: string): Promise<string> {
  const group = await Group.findById(groupId);
  if (!group || group.isDeleted) throw new NotFoundError('Group not found');
  
  const isAdmin = group.admins.some(a => a.toString() === userId);
  if (!isAdmin) throw new ForbiddenError('Only admins can change group icon');
  
  // Upload to Cloudinary
  const cloudinary = require('cloudinary').v2;
  const base64 = fileBuffer.toString('base64');
  const dataURI = `data:image/jpeg;base64,${base64}`;
  
  const result = await cloudinary.uploader.upload(dataURI, {
    folder: 'group_icons',
    transformation: [{ width: 200, height: 200, crop: 'fill' }]
  });
  
  group.icon = result.secure_url;
  await group.save();
  
  await Chat.findByIdAndUpdate(group.chatId, { groupIcon: result.secure_url });
  
  return result.secure_url;
}