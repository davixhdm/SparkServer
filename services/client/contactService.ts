import Contact from '../../models/client/Contact';
import User from '../../models/client/User';
import Chat from '../../models/client/Chat';
import Message from '../../models/client/Message';
import { formatPhone } from '../../utils/helpers';
import { logger } from '../../utils/logger';
import { NotFoundError, BadRequestError } from '../../utils/errors';

export async function syncContacts(
  userId: string,
  contacts: Array<{ phone: string; name: string }>,
): Promise<{ added: number; updated: number; onSpark: number }> {
  let added = 0;
  let updated = 0;
  let onSpark = 0;

  for (const contactData of contacts) {
    try {
      const formattedPhone = formatPhone(contactData.phone);
      const sparkUser = await User.findOne({ phone: formattedPhone, isDeleted: false }).select('_id displayName avatar');
      const existingContact = await Contact.findOne({ userId, contactPhone: formattedPhone });

      if (existingContact) {
        if (existingContact.contactName !== contactData.name || !existingContact.isOnSpark) {
          existingContact.contactName = contactData.name;
          existingContact.isOnSpark = !!sparkUser;
          existingContact.contactUserId = sparkUser?._id || null;
          existingContact.isSynced = true;
          await existingContact.save();
          updated++;
        }
      } else {
        await Contact.create({
          userId, contactPhone: formattedPhone, contactName: contactData.name,
          contactUserId: sparkUser?._id || null, isOnSpark: !!sparkUser, isSynced: true,
        });
        added++;
      }
      if (sparkUser) onSpark++;
    } catch (error: any) {
      logger.warn('Contact sync error', { phone: contactData.phone, error: error.message });
    }
  }

  return { added, updated, onSpark };
}

export async function getUserContacts(
  userId: string, page: number = 1, limit: number = 50, sortBy: string = 'name',
): Promise<any> {
  const skip = (page - 1) * limit;
  const sort: any = {};
  sort[sortBy === 'name' ? 'contactName' : 'createdAt'] = 1;

  const contacts = await Contact.find({ userId })
    .sort(sort).skip(skip).limit(limit)
    .populate('contactUserId', 'displayName avatar phone status lastSeen isHdmVerified bio')
    .lean();

  const total = await Contact.countDocuments({ userId });

  return { contacts, total, page, limit, totalPages: Math.ceil(total / limit), hasMore: skip + limit < total };
}

export async function searchContacts(userId: string, query: string): Promise<any[]> {
  return Contact.find({
    userId,
    $or: [{ contactName: { $regex: query, $options: 'i' } }, { contactPhone: { $regex: query, $options: 'i' } }],
  }).limit(20).populate('contactUserId', 'displayName avatar phone status isHdmVerified').lean();
}

export async function checkIfBlocked(userId: string, targetUserId: string): Promise<boolean> {
  const user = await User.findById(userId).select('blockedContacts');
  if (!user) return false;
  
  return user.blockedContacts?.some(
    (blockedId) => blockedId.toString() === targetUserId
  ) || false;
}

export async function blockContact(userId: string, contactUserId: string): Promise<void> {
  if (userId === contactUserId) throw new BadRequestError('Cannot block yourself');
  
  await User.findByIdAndUpdate(userId, { 
    $addToSet: { blockedContacts: contactUserId } 
  });
  
  await Contact.findOneAndUpdate(
    { userId, contactUserId }, 
    { isBlocked: true },
    { upsert: true }
  );
  
  const chat = await Chat.findOne({
    participants: { $all: [userId, contactUserId], $size: 2 },
    isGroup: false
  });
  
  if (chat) {
    await Message.updateMany(
      { chatId: chat._id },
      { $addToSet: { deletedFor: [userId, contactUserId] } }
    );
  }
}

export async function unblockContact(userId: string, contactUserId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { 
    $pull: { blockedContacts: contactUserId } 
  });
  
  await Contact.findOneAndUpdate(
    { userId, contactUserId }, 
    { isBlocked: false }
  );
}

export async function addFavorite(userId: string, contactId: string): Promise<void> {
  const contact = await Contact.findOne({ userId, _id: contactId });
  if (!contact) throw new NotFoundError('Contact not found');
  contact.isFavorite = true;
  await contact.save();
}

export async function removeFavorite(userId: string, contactId: string): Promise<void> {
  const contact = await Contact.findOne({ userId, _id: contactId });
  if (!contact) throw new NotFoundError('Contact not found');
  contact.isFavorite = false;
  await contact.save();
}

export async function getBlockedContacts(userId: string): Promise<any[]> {
  return Contact.find({ userId, isBlocked: true }).populate('contactUserId', 'displayName avatar phone').lean();
}

export async function getFavoriteContacts(userId: string): Promise<any[]> {
  return Contact.find({ userId, isFavorite: true }).populate('contactUserId', 'displayName avatar phone status isHdmVerified').lean();
}

export async function getContactInfo(userId: string, contactId: string): Promise<any> {
  const contact = await Contact.findOne({ userId, _id: contactId })
    .populate('contactUserId', 'displayName avatar phone status lastSeen isHdmVerified bio username').lean();
  if (!contact) throw new NotFoundError('Contact not found');
  return contact;
}