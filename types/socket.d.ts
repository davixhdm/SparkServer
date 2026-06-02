import { Socket } from 'socket.io';

declare module 'socket.io' {
  interface Socket {
    userId?: string;
    phone?: string;
    displayName?: string;
    currentChatId?: string;
    isGhostMode?: boolean;
  }
}

export interface SocketAuthPayload {
  userId: string;
  phone: string;
  displayName: string;
}

export interface TypingPayload {
  chatId: string;
  isTyping: boolean;
}

export interface MessagePayload {
  chatId: string;
  messageId: string;
  content: string;
  messageType: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
}

export interface PresencePayload {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  isGhostMode?: boolean;
}

export interface CallSignalPayload {
  chatId: string;
  callerId: string;
  callerName: string;
  callType: 'voice' | 'video';
  signal?: any;
}