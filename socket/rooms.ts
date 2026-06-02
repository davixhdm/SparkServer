import { Socket } from 'socket.io';
import Chat from '../models/client/Chat';
import Group from '../models/client/Group';
import { logger } from '../utils/logger';

export async function joinUserRooms(socket: Socket): Promise<void> {
  try {
    const userId = socket.userId;
    if (!userId) return;

    // Personal room for direct events
    socket.join(`user:${userId}`);

    // Join all chat rooms
    const chats = await Chat.find({
      participants: userId,
      isDeleted: false,
    }).select('_id');

    for (const chat of chats) {
      socket.join(`chat:${chat._id}`);
    }

    // Join all group rooms
    const groups = await Group.find({
      members: userId,
      isDeleted: false,
    }).select('chatId');

    for (const group of groups) {
      socket.join(`group:${group.chatId}`);
    }

    logger.debug(`User ${userId} joined ${chats.length + groups.length + 1} rooms`);
  } catch (error: any) {
    logger.error('Join rooms error', { error: error.message });
  }
}

export async function leaveUserRooms(socket: Socket): Promise<void> {
  try {
    const userId = socket.userId;
    if (!userId) return;

    const rooms = Array.from(socket.rooms);
    for (const room of rooms) {
      if (room !== socket.id) {
        socket.leave(room);
      }
    }
  } catch (error: any) {
    logger.error('Leave rooms error', { error: error.message });
  }
}

export function getChatRoom(chatId: string): string {
  return `chat:${chatId}`;
}

export function getUserRoom(userId: string): string {
  return `user:${userId}`;
}

export function getGroupRoom(chatId: string): string {
  return `group:${chatId}`;
}