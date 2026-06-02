import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import User from '../../models/client/User';
import { logger } from '../../utils/logger';

export async function handlePresenceUpdate(
  socket: Socket,
  io: Server,
  data: { status?: 'online' | 'offline' | 'away'; ghostMode?: boolean },
): Promise<void> {
  try {
    const userId = socket.userId;
    if (!userId) return;

    const user = await User.findById(userId);
    if (!user) return;

    if (data.status) {
      user.status = data.status;
    }

    if (data.ghostMode !== undefined) {
      user.privacy.ghostMode = data.ghostMode;
      socket.isGhostMode = data.ghostMode;
    }

    user.lastSeen = new Date();
    await user.save();

    // Broadcast presence to contacts (unless ghost mode)
    if (!user.privacy.ghostMode) {
      socket.broadcast.emit('presence:changed', {
        userId,
        status: user.status,
        lastSeen: user.lastSeen,
        isGhostMode: false,
      });
    } else {
      // Only broadcast that user went offline (ghost mode)
      socket.broadcast.emit('presence:changed', {
        userId,
        status: 'offline',
        lastSeen: user.lastSeen,
        isGhostMode: true,
      });
    }
  } catch (error: any) {
    logger.error('Presence handler error', { error: error.message });
  }
}