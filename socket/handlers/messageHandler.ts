import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import Message from '../../models/client/Message';
import Chat from '../../models/client/Chat';
import User from '../../models/client/User';
import { getChatRoom } from '../rooms';
import { sendToDevice } from '../../services/external/firebaseService';
import { safetySpam, safetyHateSpeech, safetyLinkCheck } from '../../services/external/hdmAiService';
import { checkIfBlocked } from '../../services/client/contactService';
import { logger } from '../../utils/logger';

export async function handleMessage(
  socket: Socket,
  io: Server,
  data: {
    chatId: string;
    content: string;
    messageType: string;
    replyTo?: string;
    media?: string;
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    temporaryId?: string;
  },
): Promise<void> {
  try {
    const senderId = socket.userId;
    if (!senderId) return;

    const chat = await Chat.findOne({
      _id: data.chatId,
      participants: senderId,
      isDeleted: false,
    });

    if (!chat) {
      socket.emit('message:error', { error: 'Chat not found', temporaryId: data.temporaryId });
      return;
    }

    // Block checks
    const otherParticipants = chat.participants.filter(
      (p) => p.toString() !== senderId
    );

    for (const recipientId of otherParticipants) {
      const hasBlocked = await checkIfBlocked(senderId, recipientId.toString());
      if (hasBlocked) {
        socket.emit('message:error', { 
          error: 'Cannot send message: You have blocked this user', 
          temporaryId: data.temporaryId 
        });
        return;
      }
    }

    for (const recipientId of otherParticipants) {
      const isBlocked = await checkIfBlocked(recipientId.toString(), senderId);
      if (isBlocked) {
        socket.emit('message:error', { 
          error: 'Cannot send message: You are blocked by this user', 
          temporaryId: data.temporaryId 
        });
        return;
      }
    }

    // Safety checks for text messages
    if (data.messageType === 'text' && data.content) {
      try {
        const [spamResult] = await Promise.all([safetySpam(data.content, senderId)]);
        if (spamResult?.is_spam && spamResult?.confidence > 0.85) {
          socket.emit('message:error', { error: 'Message blocked by spam filter', temporaryId: data.temporaryId });
          return;
        }
      } catch {
        // Safety check failed — allow message through
      }
    }

    const message = await Message.create({
      chatId: data.chatId,
      senderId,
      content: data.content,
      messageType: data.messageType || 'text',
      replyTo: data.replyTo || null,
      media: data.media || '',
      mediaUrl: data.mediaUrl || '',
      fileName: data.fileName || '',
      fileSize: data.fileSize || 0,
      status: 'sent',
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'displayName avatar isHdmVerified')
      .lean();

    chat.lastMessage = {
      content: data.content?.substring(0, 100) || `${data.messageType}`,
      senderId: senderId as any,
      messageType: data.messageType,
      createdAt: new Date(),
    };
    await chat.save();

    const chatRoom = getChatRoom(data.chatId);
    socket.to(chatRoom).emit('message:new', {
      ...populatedMessage,
      temporaryId: data.temporaryId,
    });

    socket.emit('message:sent', {
      messageId: message._id,
      temporaryId: data.temporaryId,
      timestamp: message.createdAt,
    });

    const otherParticipantsList = chat.participants.filter(
      (p) => p.toString() !== senderId,
    );

    for (const participantId of otherParticipantsList) {
      const participant = await User.findById(participantId).select('displayName');
      if (participant) {
        const socketsInRoom = await io.in(`user:${participantId}`).fetchSockets();
        if (socketsInRoom.length === 0) {
          sendToDevice(participantId.toString(), {
            title: chat.isGroup ? chat.groupName || 'Group' : 'New Message',
            body: data.messageType === 'text'
              ? data.content?.substring(0, 200) || ''
              : `Sent a ${data.messageType}`,
            data: {
              type: 'message',
              chatId: data.chatId,
              messageId: message._id.toString(),
            },
            priority: 'high',
          }).catch(() => {});
        }
      }
    }
  } catch (error: any) {
    logger.error('Message handler error', { error: error.message });
    socket.emit('message:error', {
      error: 'Failed to send message',
      temporaryId: data.temporaryId,
    });
  }
}

export async function handleMessageRead(
  socket: Socket,
  io: Server,
  data: { chatId: string; messageIds: string[] },
): Promise<void> {
  try {
    const userId = socket.userId;
    if (!userId || !data.messageIds?.length) return;

    await Message.updateMany(
      { _id: { $in: data.messageIds }, senderId: { $ne: userId } },
      { $addToSet: { readBy: userId }, status: 'read' },
    );

    const chatRoom = getChatRoom(data.chatId);
    io.to(chatRoom).emit('message:read-receipt', {
      chatId: data.chatId,
      messageIds: data.messageIds,
      readBy: userId,
      timestamp: new Date(),
    });
  } catch (error: any) {
    logger.error('Message read handler error', { error: error.message });
  }
}

export async function handleMessageDelivered(
  socket: Socket,
  io: Server,
  data: { chatId: string; messageIds: string[] },
): Promise<void> {
  try {
    const userId = socket.userId;
    if (!userId || !data.messageIds?.length) return;

    await Message.updateMany(
      { _id: { $in: data.messageIds }, senderId: { $ne: userId }, status: 'sent' },
      { $addToSet: { deliveredTo: userId }, status: 'delivered' },
    );

    const chatRoom = getChatRoom(data.chatId);
    io.to(chatRoom).emit('message:delivered-receipt', {
      chatId: data.chatId,
      messageIds: data.messageIds,
      deliveredTo: userId,
      timestamp: new Date(),
    });
  } catch (error: any) {
    logger.error('Message delivered handler error', { error: error.message });
  }
}