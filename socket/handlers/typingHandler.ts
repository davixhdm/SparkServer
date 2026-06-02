import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { getChatRoom } from '../rooms';
import User from '../../models/client/User';
import { logger } from '../../utils/logger';

export async function handleTyping(
  socket: Socket,
  io: Server,
  data: { chatId: string },
  isTyping: boolean,
): Promise<void> {
  try {
    const userId = socket.userId;
    if (!userId || !data.chatId) return;

    const user = await User.findById(userId).select('displayName privacy');
    if (!user) return;

    // Don't emit typing if user has hidden typing indicator
    if (user.privacy.hideTyping || user.privacy.ghostMode) return;

    const chatRoom = getChatRoom(data.chatId);

    socket.to(chatRoom).emit(isTyping ? 'typing:start' : 'typing:stop', {
      chatId: data.chatId,
      userId,
      displayName: user.displayName,
    });
  } catch (error: any) {
    logger.error('Typing handler error', { error: error.message });
  }
}