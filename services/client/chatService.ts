import mongoose from 'mongoose';
import Chat from '../../models/client/Chat';
import Message from '../../models/client/Message';
import User from '../../models/client/User';
import { NotFoundError, BadRequestError } from '../../utils/errors';

export async function getUserChats(userId: string): Promise<{ chats: any[]; pinnedChats: any[] }> {
  // Get blocked users
  const user = await User.findById(userId).select('blockedContacts');
  const blockedUserIds = user?.blockedContacts?.map(id => id.toString()) || [];

  let chats = await Chat.find({ participants: userId, isDeleted: false })
    .populate('participants', 'displayName avatar phone status lastSeen isHdmVerified privacy')
    .populate('lastMessage.senderId', 'displayName')
    .sort({ 'lastMessage.createdAt': -1 })
    .lean();

  // Filter out chats where participant is blocked
  chats = chats.filter(chat => {
    const otherParticipants = chat.participants.filter(
      (p: any) => p._id.toString() !== userId
    );
    return !otherParticipants.some((p: any) => 
      blockedUserIds.includes(p._id.toString())
    );
  });

  const chatIds = chats.map(chat => chat._id);
  
  // Convert userId to ObjectId for proper comparison
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  // Count unread messages using readBy field
  const unreadCounts = await Message.aggregate([
    {
      $match: {
        chatId: { $in: chatIds },
        senderId: { $ne: userObjectId },
        readBy: { $ne: userObjectId }
      }
    },
    {
      $group: {
        _id: '$chatId',
        count: { $sum: 1 }
      }
    }
  ]);

  const unreadMap = new Map();
  unreadCounts.forEach(item => {
    unreadMap.set(item._id.toString(), item.count);
  });

  const chatsWithUnread = chats.map(chat => ({
    ...chat,
    unreadCount: unreadMap.get(chat._id.toString()) || 0
  }));

  const pinnedChatIds = await User.findById(userId).select('pinnedChats').lean();
  const pinnedIds = pinnedChatIds?.pinnedChats?.map((id: any) => id.toString()) || [];
  const pinnedChats = chatsWithUnread.filter((chat) => pinnedIds.includes(chat._id.toString()));
  const unpinnedChats = chatsWithUnread.filter((chat) => !pinnedIds.includes(chat._id.toString()));

  return { chats: unpinnedChats, pinnedChats };
}

export async function getChatById(chatId: string, userId: string): Promise<any> {
  const chat = await Chat.findOne({ _id: chatId, participants: userId, isDeleted: false })
    .populate('participants', 'displayName avatar phone status lastSeen isHdmVerified privacy')
    .lean();
  if (!chat) throw new NotFoundError('Chat not found');
  
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const unreadCount = await Message.countDocuments({
    chatId,
    senderId: { $ne: userObjectId },
    readBy: { $ne: userObjectId }
  });
  
  return { ...chat, unreadCount };
}

export async function createDirectChat(userId: string, participantId: string): Promise<any> {
  if (userId === participantId) throw new BadRequestError('Cannot chat with yourself');

  let participant = null;
  
  if (participantId.match(/^[0-9a-fA-F]{24}$/)) {
    participant = await User.findById(participantId);
  }
  
  if (!participant) {
    participant = await User.findOne({ phone: participantId, isDeleted: false });
  }
  
  if (!participant || participant.isDeleted) throw new NotFoundError('User not found');

  // Check if blocked
  const user = await User.findById(userId).select('blockedContacts');
  const isBlocked = user?.blockedContacts?.some(id => id.toString() === participant._id.toString());
  if (isBlocked) {
    throw new BadRequestError('Cannot create chat: You have blocked this user');
  }

  const existingChat = await Chat.findOne({
    isGroup: false,
    participants: { $all: [userId, participant._id], $size: 2 },
    isDeleted: false,
  });

  if (existingChat) {
    const populated = await existingChat.populate('participants', 'displayName avatar phone status lastSeen isHdmVerified privacy');
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const unreadCount = await Message.countDocuments({
      chatId: existingChat._id,
      senderId: { $ne: userObjectId },
      readBy: { $ne: userObjectId }
    });
    return { ...populated.toObject(), unreadCount };
  }

  const chat = await Chat.create({
    participants: [userId, participant._id],
    isGroup: false,
    createdBy: userId,
  });

  const populated = await chat.populate('participants', 'displayName avatar phone status lastSeen isHdmVerified privacy');
  return { ...populated.toObject(), unreadCount: 0 };
}

export async function archiveChat(chatId: string, userId: string): Promise<void> {
  const chat = await Chat.findOne({ _id: chatId, participants: userId });
  if (!chat) throw new NotFoundError('Chat not found');
  if (!chat.isArchived.some((id) => id.toString() === userId)) {
    chat.isArchived.push(userId as any);
    await chat.save();
  }
}

export async function unarchiveChat(chatId: string, userId: string): Promise<void> {
  await Chat.findByIdAndUpdate(chatId, { $pull: { isArchived: userId } });
}

export async function clearChat(chatId: string, userId: string): Promise<void> {
  const chat = await Chat.findOne({ _id: chatId, participants: userId });
  if (!chat) throw new NotFoundError('Chat not found');
  await Message.updateMany({ chatId }, { $addToSet: { deletedFor: userId } });
}

export async function deleteChat(chatId: string, userId: string): Promise<void> {
  const chat = await Chat.findOne({ _id: chatId, participants: userId });
  if (!chat) throw new NotFoundError('Chat not found');

  if (chat.isGroup) {
    chat.participants = chat.participants.filter((p) => p.toString() !== userId);
    await chat.save();
  } else {
    chat.isDeleted = true;
    await chat.save();
  }
}

export async function updateChatWallpaper(chatId: string, userId: string, wallpaper: string): Promise<void> {
  const chat = await Chat.findOne({ _id: chatId, participants: userId });
  if (!chat) throw new NotFoundError('Chat not found');
  chat.wallpaper = wallpaper;
  await chat.save();
}

export async function markAllAsRead(userId: string): Promise<void> {
  const userChats = await Chat.find({ participants: userId, isDeleted: false }).select('_id');
  const chatIds = userChats.map((c) => c._id);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  await Message.updateMany(
    {
      chatId: { $in: chatIds },
      senderId: { $ne: userObjectId },
      readBy: { $ne: userObjectId }
    },
    {
      $addToSet: { readBy: userObjectId },
      $set: { status: 'read' }
    }
  );
}

export async function getTotalUnreadCount(userId: string): Promise<number> {
  const userChats = await Chat.find({ participants: userId, isDeleted: false }).select('_id');
  const chatIds = userChats.map((c) => c._id);
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const total = await Message.countDocuments({
    chatId: { $in: chatIds },
    senderId: { $ne: userObjectId },
    readBy: { $ne: userObjectId }
  });

  return total;
}

export async function markChatAsRead(chatId: string, userId: string): Promise<{ unreadCount: number }> {
  const chat = await Chat.findOne({ _id: chatId, participants: userId });
  if (!chat) throw new NotFoundError('Chat not found');

  const userObjectId = new mongoose.Types.ObjectId(userId);

  await Message.updateMany(
    {
      chatId: chatId,
      senderId: { $ne: userObjectId },
      readBy: { $ne: userObjectId }
    },
    {
      $addToSet: { readBy: userObjectId },
      $set: { status: 'read' }
    }
  );

  const unreadCount = await Message.countDocuments({
    chatId: chatId,
    senderId: { $ne: userObjectId },
    readBy: { $ne: userObjectId }
  });

  return { unreadCount };
}

export async function bulkAction(
  userId: string,
  chatIds: string[],
  action: 'archive' | 'delete' | 'mark_read',
): Promise<{ affected: number }> {
  if (!chatIds || chatIds.length === 0) throw new BadRequestError('No chats selected');

  const userObjectId = new mongoose.Types.ObjectId(userId);

  if (action === 'archive') {
    await Chat.updateMany(
      { _id: { $in: chatIds }, participants: userId },
      { $addToSet: { isArchived: userId } },
    );
  } else if (action === 'delete') {
    await Chat.updateMany(
      { _id: { $in: chatIds }, participants: userId },
      { isDeleted: true },
    );
  } else if (action === 'mark_read') {
    await Message.updateMany(
      {
        chatId: { $in: chatIds },
        senderId: { $ne: userObjectId },
        readBy: { $ne: userObjectId }
      },
      {
        $addToSet: { readBy: userObjectId },
        $set: { status: 'read' }
      }
    );
  }

  return { affected: chatIds.length };
}