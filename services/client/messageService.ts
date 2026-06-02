import Message from '../../models/client/Message';
import Chat from '../../models/client/Chat';
import User from '../../models/client/User';
import Notification from '../../models/client/Notification';
import { sendToDevice } from '../external/firebaseService';
import { safetySpam, safetyLinkCheck, safetyHateSpeech, safetyNsfw } from '../external/hdmAiService';
import { checkIfBlocked } from './contactService';
import { logger } from '../../utils/logger';
import env from '../../config/env';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors';

export async function sendMessage(
  senderId: string,
  chatId: string,
  content: string,
  messageType: string = 'text',
  options: {
    replyTo?: string;
    media?: string;
    mediaUrl?: string;
    thumbnailUrl?: string;
    fileSize?: number;
    fileName?: string;
    mimeType?: string;
  } = {},
): Promise<any> {
  const chat = await Chat.findOne({ _id: chatId, participants: senderId, isDeleted: false });
  if (!chat) throw new NotFoundError('Chat not found');

  // Block checks
  const otherParticipants = chat.participants.filter(
    (p) => p.toString() !== senderId
  );

  for (const recipientId of otherParticipants) {
    const hasBlocked = await checkIfBlocked(senderId, recipientId.toString());
    if (hasBlocked) {
      throw new BadRequestError('Cannot send message: You have blocked this user');
    }
  }

  for (const recipientId of otherParticipants) {
    const isBlocked = await checkIfBlocked(recipientId.toString(), senderId);
    if (isBlocked) {
      throw new BadRequestError('Cannot send message: You are blocked by this user');
    }
  }

  const sender = await User.findById(senderId).select('displayName privacy');
  if (!sender) throw new NotFoundError('Sender not found');

  if (messageType === 'text' && content) {
    try {
      const [spamResult, hateResult] = await Promise.all([
        safetySpam(content, senderId),
        safetyHateSpeech(content),
      ]);

      if (spamResult?.is_spam && spamResult?.confidence > 0.8) {
        logger.warn('Spam message blocked', { senderId, chatId });
        throw new BadRequestError('Message blocked by spam filter');
      }
    } catch (error: any) {
      if (error instanceof BadRequestError) throw error;
    }

    const urls = content.match(/https?:\/\/[^\s]+/g);
    if (urls) {
      for (const url of urls) {
        try {
          const linkResult = await safetyLinkCheck(url);
          if (linkResult?.is_malicious) {
            logger.warn('Malicious link blocked', { senderId, url });
          }
        } catch {
          // Link check failed — allow through
        }
      }
    }
  }

  const message = await Message.create({
    chatId,
    senderId,
    content,
    messageType,
    replyTo: options.replyTo || null,
    media: options.media || '',
    mediaUrl: options.mediaUrl || '',
    thumbnailUrl: options.thumbnailUrl || '',
    fileSize: options.fileSize || 0,
    fileName: options.fileName || '',
    mimeType: options.mimeType || '',
    status: 'sent',
    readBy: [senderId],
    deliveredTo: [],
  });

  chat.lastMessage = {
    content: content.substring(0, 100),
    senderId,
    messageType,
    createdAt: new Date(),
  };
  await chat.save();

  const otherParticipantsList = chat.participants.filter(
    (p) => p.toString() !== senderId,
  );

  for (const participantId of otherParticipantsList) {
    try {
      await Notification.create({
        userId: participantId,
        type: 'message',
        title: chat.isGroup ? chat.groupName || 'Group' : sender.displayName,
        body: messageType === 'text' ? content.substring(0, 200) : `Sent a ${messageType}`,
        data: { chatId: chat._id.toString(), messageId: message._id.toString() },
        chatId: chat._id,
        messageId: message._id,
      });
    } catch {
      // Notification creation failed — non-critical
    }
  }

  return message;
}

export async function getMessages(
  chatId: string,
  userId: string,
  page: number = 1,
  limit: number = 50,
): Promise<{ messages: any[]; total: number; hasMore: boolean }> {
  const chat = await Chat.findOne({ _id: chatId, participants: userId });
  if (!chat) throw new NotFoundError('Chat not found');

  const skip = (page - 1) * limit;

  const messages = await Message.find({
    chatId,
    deletedFor: { $ne: userId },
    deletedForEveryone: false,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('senderId', 'displayName avatar isHdmVerified')
    .populate('replyTo')
    .populate('reactions.userId', 'displayName')
    .lean();

  const total = await Message.countDocuments({
    chatId,
    deletedFor: { $ne: userId },
    deletedForEveryone: false,
  });

  return {
    messages: messages.reverse(),
    total,
    hasMore: skip + limit < total,
  };
}

export async function editMessage(
  messageId: string,
  userId: string,
  newContent: string,
): Promise<any> {
  const message = await Message.findById(messageId);
  if (!message) throw new NotFoundError('Message not found');
  if (message.senderId.toString() !== userId) throw new ForbiddenError('Cannot edit message');
  if (message.isDeleted || message.deletedForEveryone) throw new BadRequestError('Message is deleted');

  const editWindowMs = env.MESSAGE_EDIT_WINDOW_MINUTES * 60 * 1000;
  if (Date.now() - message.createdAt.getTime() > editWindowMs) {
    throw new BadRequestError(`Edit window of ${env.MESSAGE_EDIT_WINDOW_MINUTES} minutes has passed`);
  }

  message.content = newContent;
  message.isEdited = true;
  message.editedAt = new Date();
  await message.save();

  return message;
}

export async function deleteMessage(
  messageId: string,
  userId: string,
  deleteForEveryone: boolean = false,
): Promise<void> {
  const message = await Message.findById(messageId);
  if (!message) throw new NotFoundError('Message not found');
  if (message.senderId.toString() !== userId) throw new ForbiddenError('Cannot delete message');

  if (deleteForEveryone) {
    const deleteWindowHours = env.MESSAGE_DELETE_FOR_EVERYONE_WINDOW_HOURS * 60 * 60 * 1000;
    if (Date.now() - message.createdAt.getTime() > deleteWindowHours) {
      throw new BadRequestError('Delete for everyone window has passed');
    }
    message.deletedForEveryone = true;
  } else {
    message.deletedFor.push(userId as any);
  }

  await message.save();
}

export async function forwardMessage(
  messageId: string,
  userId: string,
  targetChatIds: string[],
): Promise<any[]> {
  if (targetChatIds.length > env.MESSAGE_MAX_FORWARD_COUNT) {
    throw new BadRequestError(`Cannot forward to more than ${env.MESSAGE_MAX_FORWARD_COUNT} chats`);
  }

  const originalMessage = await Message.findById(messageId);
  if (!originalMessage) throw new NotFoundError('Message not found');

  const forwardedMessages = [];

  for (const targetChatId of targetChatIds) {
    const chat = await Chat.findOne({ _id: targetChatId, participants: userId });
    if (!chat) continue;

    const forwarded = await Message.create({
      chatId: targetChatId,
      senderId: userId,
      content: originalMessage.content,
      messageType: originalMessage.messageType,
      media: originalMessage.media,
      mediaUrl: originalMessage.mediaUrl,
      forwardedFrom: originalMessage._id,
      forwardedFromType: 'user',
      status: 'sent',
      readBy: [userId],
      deliveredTo: [],
    });

    chat.lastMessage = {
      content: 'Forwarded message',
      senderId: userId,
      messageType: forwarded.messageType,
      createdAt: new Date(),
    };
    await chat.save();

    forwardedMessages.push(forwarded);
  }

  return forwardedMessages;
}

export async function reactToMessage(
  messageId: string,
  userId: string,
  emoji: string,
): Promise<any> {
  const message = await Message.findById(messageId);
  if (!message) throw new NotFoundError('Message not found');

  const existingReaction = message.reactions.find(
    (r) => r.userId.toString() === userId,
  );

  if (existingReaction) {
    if (existingReaction.emoji === emoji) {
      message.reactions = message.reactions.filter(
        (r) => r.userId.toString() !== userId,
      );
    } else {
      existingReaction.emoji = emoji;
      existingReaction.createdAt = new Date();
    }
  } else {
    message.reactions.push({ userId: userId as any, emoji, createdAt: new Date() });
  }

  await message.save();
  return message;
}

export async function starMessage(messageId: string, userId: string, star: boolean): Promise<void> {
  const message = await Message.findById(messageId);
  if (!message) throw new NotFoundError('Message not found');

  message.isStarred = star;
  await message.save();
}

export async function getStarredMessages(userId: string): Promise<any[]> {
  return Message.find({
    senderId: userId,
    isStarred: true,
    deletedForEveryone: false,
  })
    .sort({ createdAt: -1 })
    .lean();
}

export async function searchMessages(
  userId: string,
  query: string,
  chatId?: string,
): Promise<any[]> {
  const filter: any = {
    $text: { $search: query },
    deletedForEveryone: false,
  };

  if (chatId) {
    filter.chatId = chatId;
    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) throw new NotFoundError('Chat not found');
  } else {
    const userChats = await Chat.find({ participants: userId }).select('_id');
    filter.chatId = { $in: userChats.map((c) => c._id) };
  }

  return Message.find(filter, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(50)
    .populate('senderId', 'displayName avatar')
    .lean();
}

export async function markAsDelivered(
  messageIds: string[],
  userId: string,
): Promise<void> {
  await Message.updateMany(
    {
      _id: { $in: messageIds },
      deliveredTo: { $ne: userId },
    },
    {
      $addToSet: { deliveredTo: userId },
      $set: { status: 'delivered' },
    },
  );
}

export async function markAsRead(
  messageIds: string[],
  userId: string,
): Promise<void> {
  await Message.updateMany(
    {
      _id: { $in: messageIds },
      readBy: { $ne: userId },
    },
    {
      $addToSet: { readBy: userId },
      $set: { status: 'read' },
    },
  );
}