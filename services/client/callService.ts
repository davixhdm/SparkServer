import Call from '../../models/client/Call';
import Chat from '../../models/client/Chat';
import User from '../../models/client/User';
import Notification from '../../models/client/Notification';
import { sendToDevice } from '../external/firebaseService';
import { logger } from '../../utils/logger';
import { NotFoundError, BadRequestError } from '../../utils/errors';

export async function initiateCall(
  callerId: string,
  receiverId: string,
  callType: 'voice' | 'video',
): Promise<any> {
  const receiver = await User.findById(receiverId);
  if (!receiver || receiver.isDeleted) throw new NotFoundError('User not found');

  // Find or create chat
  let chat = await Chat.findOne({
    isGroup: false,
    participants: { $all: [callerId, receiverId], $size: 2 },
    isDeleted: false,
  });

  if (!chat) {
    chat = await Chat.create({
      participants: [callerId, receiverId],
      isGroup: false,
      createdBy: callerId,
    });
  }

  const call = await Call.create({
    chatId: chat._id,
    callerId,
    receiverId,
    callType,
    status: 'initiated',
  });

  return { call, chatId: chat._id };
}

export async function initiateGroupCall(
  callerId: string,
  chatId: string,
  callType: 'voice' | 'video',
): Promise<any> {
  const chat = await Chat.findOne({ _id: chatId, isGroup: true, participants: callerId });
  if (!chat) throw new NotFoundError('Group chat not found');

  const call = await Call.create({
    chatId,
    callerId,
    receiverId: callerId,
    callType,
    status: 'initiated',
    isGroup: true,
    participants: [callerId],
  });

  return { call, chatId: chat._id };
}

export async function updateCallStatus(
  callId: string,
  status: string,
  userId: string,
  duration?: number,
): Promise<any> {
  const call = await Call.findById(callId);
  if (!call) throw new NotFoundError('Call not found');

  call.status = status as any;

  if (status === 'ongoing') {
    call.startedAt = new Date();
  }

  if (status === 'ended' || status === 'missed') {
    call.endedAt = new Date();
    if (duration) call.duration = duration;
  }

  if (status === 'declined') {
    if (!call.declinedBy.some((id) => id.toString() === userId)) {
      call.declinedBy.push(userId as any);
    }
  }

  await call.save();
  return call;
}

export async function getCallHistory(userId: string, page: number = 1, limit: number = 20): Promise<any> {
  const skip = (page - 1) * limit;

  const calls = await Call.find({
    $or: [{ callerId: userId }, { receiverId: userId }],
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('callerId', 'displayName avatar phone isHdmVerified')
    .populate('receiverId', 'displayName avatar phone isHdmVerified')
    .lean();

  const total = await Call.countDocuments({
    $or: [{ callerId: userId }, { receiverId: userId }],
    isDeleted: false,
  });

  return { calls, total, page, limit, hasMore: skip + limit < total };
}

export async function deleteCallRecord(callId: string, userId: string): Promise<void> {
  const call = await Call.findOne({
    _id: callId,
    $or: [{ callerId: userId }, { receiverId: userId }],
  });
  if (!call) throw new NotFoundError('Call record not found');

  call.isDeleted = true;
  await call.save();
}