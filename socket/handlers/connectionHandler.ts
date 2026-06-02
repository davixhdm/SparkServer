import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import User from '../../models/client/User';
import { logger } from '../../utils/logger';

export async function handleConnection(socket: Socket, io: Server): Promise<void> {
  try {
    const userId = socket.userId;
    if (!userId) return;

    // Update user status to online
    const user = await User.findById(userId);
    if (user && !user.privacy.ghostMode) {
      user.status = 'online';
      await user.save();

      // Broadcast online status to contacts
      socket.broadcast.emit('presence:changed', {
        userId,
        status: 'online',
        lastSeen: user.lastSeen,
      });
    }

    // Send current online contacts to the user
    if (user) {
      const onlineContacts = await User.find({
        _id: { $in: user.contacts },
        status: 'online',
        'privacy.ghostMode': false,
      }).select('_id status lastSeen');

      socket.emit('presence:list', onlineContacts);
    }
  } catch (error: any) {
    logger.error('Connection handler error', { error: error.message });
  }
}

export async function handleDisconnection(socket: Socket, io: Server): Promise<void> {
  try {
    const userId = socket.userId;
    if (!userId) return;

    const user = await User.findById(userId);
    if (user) {
      user.status = 'offline';
      user.lastSeen = new Date();
      await user.save();

      // Broadcast offline status
      socket.broadcast.emit('presence:changed', {
        userId,
        status: 'offline',
        lastSeen: user.lastSeen,
      });
    }
  } catch (error: any) {
    logger.error('Disconnection handler error', { error: error.message });
  }
}