// ====================================================================
// AUTH
// ====================================================================
export interface SendOtpRequest {
  phone: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

export interface RegisterRequest {
  phone: string;
  displayName: string;
  password?: string;
  email?: string;
}

export interface LoginRequest {
  phone: string;
  password?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    userId: string;
    phone: string;
    displayName: string;
    email?: string;
    avatar?: string;
    username?: string;
    isHdmVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

// ====================================================================
// USER
// ====================================================================
export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  username?: string;
  email?: string;
}

export interface UpdatePrivacyRequest {
  lastSeen?: string;
  profilePhoto?: string;
  about?: string;
  readReceipts?: boolean;
  typingIndicator?: boolean;
  onlineStatus?: boolean;
}

// ====================================================================
// CHAT
// ====================================================================
export interface CreateChatRequest {
  participantId: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  participants: string[];
  icon?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  icon?: string;
}

export interface AddGroupMembersRequest {
  members: string[];
}

export interface ChatListResponse {
  chats: any[];
  pinnedChats: any[];
  unreadCount: number;
}

// ====================================================================
// MESSAGE
// ====================================================================
export interface SendMessageRequest {
  chatId: string;
  content: string;
  messageType: string;
  replyTo?: string;
  media?: string;
  mediaUrl?: string;
}

export interface EditMessageRequest {
  content: string;
}

export interface ForwardMessageRequest {
  messageId: string;
  targetChatIds: string[];
}

export interface MessageSearchRequest {
  query: string;
  chatId?: string;
}

// ====================================================================
// STATUS
// ====================================================================
export interface CreateStatusRequest {
  content?: string;
  media?: string;
  mediaUrl?: string;
  caption?: string;
  backgroundColor?: string;
  privacy?: string;
}

// ====================================================================
// PAYMENT
// ====================================================================
export interface InitiatePaymentRequest {
  plan: string;
  paymentMethod: string;
  phone?: string;
}

export interface MpesaStkPushRequest {
  plan: string;
  phone: string;
}

export interface ManualPaymentConfirmRequest {
  activationId: string;
  transactionReference?: string;
}

// ====================================================================
// REPORT
// ====================================================================
export interface CreateReportRequest {
  targetType: string;
  targetId: string;
  reason: string;
  description?: string;
  anonymous?: boolean;
}

// ====================================================================
// SEARCH
// ====================================================================
export interface SearchRequest {
  query: string;
  type?: string;
  limit?: number;
}

// ====================================================================
// ADMIN
// ====================================================================
export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminBanUserRequest {
  userId: string;
  type: string;
  reason: string;
  duration?: number;
}

export interface AdminVerifyUserRequest {
  userId: string;
  plan: string;
}

export interface AdminUpdateSettingsRequest {
  [key: string]: any;
}

export interface AdminReplyTicketRequest {
  message: string;
  status?: string;
}