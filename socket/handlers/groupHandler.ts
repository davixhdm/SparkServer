import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { getGroupRoom } from '../rooms';
import Group from '../../models/client/Group';
import { logger } from '../../utils/logger';

export async function handleJoinGroup(
  socket: Socket,
  io: Server,
  data: { chatId: string },
): Promise<void> {
  try {
    const userId = socket.userId;
    if (!userId || !data.chatId) return;

    const group = await Group.findOne({ chatId: data.chatId, members: userId, isDeleted: false });
    if (!group) return;

    const groupRoom = getGroupRoom(data.chatId);
    socket.join(groupRoom);

    socket.to(groupRoom).emit('group:member-joined', {
      chatId: data.chatId,
      userId,
      displayName: socket.displayName,
    });
  } catch (error: any) {
    logger.error('Group join handler error', { error: error.message });
  }
}

export async function handleLeaveGroup(
  socket: Socket,
  io: Server,
  data: { chatId: string },
): Promise<void> {
  try {
    const userId = socket.userId;
    if (!userId || !data.chatId) return;

    const groupRoom = getGroupRoom(data.chatId);
    socket.leave(groupRoom);

    socket.to(groupRoom).emit('group:member-left', {
      chatId: data.chatId,
      userId,
      displayName: socket.displayName,
    });
  } catch (error: any) {
    logger.error('Group leave handler error', { error: error.message });
  }
}