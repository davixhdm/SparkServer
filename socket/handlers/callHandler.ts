import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { getUserRoom } from '../rooms';
import User from '../../models/client/User';
import Call from '../../models/client/Call';
import { sendToDevice } from '../../services/external/firebaseService';
import { logger } from '../../utils/logger';

export async function handleCallSignal(
  socket: Socket,
  io: Server,
  data: {
    receiverId: string;
    chatId: string;
    callType: 'voice' | 'video';
    signal: any;
  },
): Promise<void> {
  try {
    const callerId = socket.userId;
    if (!callerId || !data.receiverId) return;

    console.log('[CALL SIGNAL] Caller:', callerId, 'Receiver:', data.receiverId, 'Chat:', data.chatId, 'Type:', data.callType);

    const caller = await User.findById(callerId).select('displayName avatar');
    if (!caller) {
      console.log('[CALL SIGNAL] Caller not found in DB');
      return;
    }

    const call = await Call.create({
      chatId: data.chatId,
      callerId,
      receiverId: data.receiverId,
      callType: data.callType,
      status: 'ringing',
    });

    console.log('[CALL SIGNAL] Call created:', call._id);

    const receiverRoom = getUserRoom(data.receiverId);
    const socketsInRoom = await io.in(receiverRoom).fetchSockets();
    console.log('[CALL SIGNAL] Receiver room:', receiverRoom, 'Sockets in room:', socketsInRoom.length);

    if (socketsInRoom.length === 0) {
      console.log('[CALL SIGNAL] Receiver offline — no active sockets');
    } else {
      socketsInRoom.forEach((s) => {
        console.log('[CALL SIGNAL] Socket in room:', s.id, 'userId:', s.userId);
      });
    }

    io.to(receiverRoom).emit('call:incoming', {
      callId: call._id,
      callerId,
      callerName: caller.displayName,
      callerAvatar: caller.avatar,
      chatId: data.chatId,
      callType: data.callType,
      signal: data.signal,
    });

    console.log('[CALL SIGNAL] Emitted call:incoming to room:', receiverRoom);

    if (socketsInRoom.length === 0) {
      sendToDevice(data.receiverId, {
        title: `Incoming ${data.callType} call`,
        body: `${caller.displayName} is calling...`,
        data: { type: 'call', callId: call._id.toString(), callerId, chatId: data.chatId, callType: data.callType },
        priority: 'high',
      }).catch(() => {});
    }
  } catch (error: any) {
    console.error('[CALL SIGNAL] Error:', error.message);
    logger.error('Call signal handler error', { error: error.message });
  }
}

export async function handleCallAnswer(
  socket: Socket,
  io: Server,
  data: { callId: string; signal: any },
): Promise<void> {
  try {
    console.log('[CALL ANSWER] callId:', data.callId, 'from socket userId:', socket.userId);

    const call = await Call.findById(data.callId);
    if (!call) {
      console.log('[CALL ANSWER] Call not found');
      return;
    }

    call.status = 'ongoing';
    call.startedAt = new Date();
    await call.save();

    const callerRoom = getUserRoom(call.callerId.toString());
    console.log('[CALL ANSWER] Emitting call:answered to caller room:', callerRoom);

    io.to(callerRoom).emit('call:answered', {
      callId: call._id,
      signal: data.signal,
    });
  } catch (error: any) {
    console.error('[CALL ANSWER] Error:', error.message);
    logger.error('Call answer handler error', { error: error.message });
  }
}

export async function handleCallEnd(
  socket: Socket,
  io: Server,
  data: { callId: string; duration?: number },
): Promise<void> {
  try {
    console.log('[CALL END] callId:', data.callId, 'duration:', data.duration, 'from:', socket.userId);

    const call = await Call.findById(data.callId);
    if (!call) {
      console.log('[CALL END] Call not found');
      return;
    }

    call.status = 'ended';
    call.endedAt = new Date();
    if (data.duration) call.duration = data.duration;
    await call.save();

    const otherParty =
      call.callerId.toString() === socket.userId
        ? call.receiverId.toString()
        : call.callerId.toString();

    const otherRoom = getUserRoom(otherParty);
    console.log('[CALL END] Emitting call:ended to:', otherRoom);

    io.to(otherRoom).emit('call:ended', { callId: call._id, duration: call.duration });
  } catch (error: any) {
    console.error('[CALL END] Error:', error.message);
    logger.error('Call end handler error', { error: error.message });
  }
}

export async function handleCallDecline(
  socket: Socket,
  io: Server,
  data: { callId: string },
): Promise<void> {
  try {
    console.log('[CALL DECLINE] callId:', data.callId, 'from:', socket.userId);

    const call = await Call.findById(data.callId);
    if (!call) {
      console.log('[CALL DECLINE] Call not found');
      return;
    }

    call.status = 'declined';
    call.endedAt = new Date();
    if (socket.userId && !call.declinedBy.some((id) => id.toString() === socket.userId)) {
      call.declinedBy.push(socket.userId as any);
    }
    await call.save();

    const otherParty =
      call.callerId.toString() === socket.userId
        ? call.receiverId.toString()
        : call.callerId.toString();

    const otherRoom = getUserRoom(otherParty);
    console.log('[CALL DECLINE] Emitting call:declined to:', otherRoom);

    io.to(otherRoom).emit('call:declined', { callId: call._id, declinedBy: socket.userId });
  } catch (error: any) {
    console.error('[CALL DECLINE] Error:', error.message);
    logger.error('Call decline handler error', { error: error.message });
  }
}

export async function handleWebRTCSignal(
  socket: Socket,
  io: Server,
  data: { targetId: string; callId: string; signal: any },
): Promise<void> {
  try {
    if (!data.targetId || !data.callId) return;

    const targetRoom = getUserRoom(data.targetId);
    const socketsInRoom = await io.in(targetRoom).fetchSockets();
    console.log('[WEBRTC SIGNAL] From:', socket.userId, 'To room:', targetRoom, 'Sockets:', socketsInRoom.length, 'Signal type:', data.signal?.type);

    io.to(targetRoom).emit('call:webrtc-signal', {
      callId: data.callId,
      signal: data.signal,
      fromId: socket.userId,
    });
  } catch (error: any) {
    console.error('[WEBRTC SIGNAL] Error:', error.message);
    logger.error('WebRTC signal handler error', { error: error.message });
  }
}