import User from '../../models/client/User';
import Message from '../../models/client/Message';
import Chat from '../../models/client/Chat';
import Contact from '../../models/client/Contact';
import Group from '../../models/client/Group';
import { searchSemantic, searchMessages as aiSearchMessages, searchContacts as aiSearchContacts } from '../external/hdmAiService';
import { logger } from '../../utils/logger';

export async function globalSearch(
  userId: string,
  query: string,
  type?: string,
): Promise<any> {
  const results: any = {};

  const searchPromises: Promise<void>[] = [];

  if (!type || type === 'contacts') {
    searchPromises.push(
      (async () => {
        try {
          const userChats = await Chat.find({ participants: userId, isDeleted: false })
            .populate('participants', 'displayName avatar phone isHdmVerified')
            .lean();

          const contactedUserIds = new Set<string>();
          for (const chat of userChats) {
            for (const p of chat.participants) {
              if (p._id.toString() !== userId) {
                contactedUserIds.add(p._id.toString());
              }
            }
          }

          const contacts = await Contact.find({
            userId,
            $or: [
              { contactName: { $regex: query, $options: 'i' } },
              { contactPhone: { $regex: query, $options: 'i' } },
            ],
          })
            .limit(10)
            .populate('contactUserId', 'displayName avatar phone isHdmVerified status')
            .lean();

          results.contacts = contacts;
        } catch (error: any) {
          logger.error('Contact search failed', { error: error.message });
          results.contacts = [];
        }
      })(),
    );
  }

  if (!type || type === 'messages') {
    searchPromises.push(
      (async () => {
        try {
          const userChats = await Chat.find({ participants: userId }).select('_id');
          const chatIds = userChats.map((c) => c._id);

          const messages = await Message.find({
            chatId: { $in: chatIds },
            $text: { $search: query },
            deletedForEveryone: false,
            deletedFor: { $ne: userId },
          })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('senderId', 'displayName avatar')
            .populate('chatId', 'groupName isGroup participants')
            .lean();

          results.messages = messages;
        } catch (error: any) {
          logger.error('Message search failed', { error: error.message });
          results.messages = [];
        }
      })(),
    );
  }

  if (!type || type === 'groups') {
    searchPromises.push(
      (async () => {
        try {
          const groups = await Group.find({
            members: userId,
            isDeleted: false,
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
            ],
          })
            .limit(10)
            .select('name icon description memberCount')
            .lean();

          results.groups = groups;
        } catch (error: any) {
          logger.error('Group search failed', { error: error.message });
          results.groups = [];
        }
      })(),
    );
  }

  await Promise.allSettled(searchPromises);

  return results;
}

export async function aiSearch(
  userId: string,
  query: string,
): Promise<any> {
  try {
    const userChats = await Chat.find({ participants: userId, isDeleted: false })
      .populate('participants', 'displayName phone')
      .lean();

    const recentMessages = await Message.find({
      chatId: { $in: userChats.map((c) => c._id) },
      deletedForEveryone: false,
      deletedFor: { $ne: userId },
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('senderId', 'displayName')
      .lean();

    const documents = recentMessages.map((msg: any) => ({
      id: msg._id,
      content: `${msg.senderId?.displayName || 'Unknown'}: ${msg.content}`,
    }));

    const aiResult = await searchSemantic(query, documents, 10);
    return aiResult;
  } catch (error: any) {
    logger.error('AI search failed', { error: error.message });
    return null;
  }
}