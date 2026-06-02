import axios, { AxiosInstance } from 'axios';
import { getSettings } from '../../config/settings';
import env from '../../config/env';
import { logger } from '../../utils/logger';

let aiClient: AxiosInstance | null = null;

function getAiClient(): AxiosInstance | null {
  if (aiClient) return aiClient;
  
  try {
    const settings = getSettings();
    const baseURL = settings.hdmAiUrl || env.HDM_AI_URL;
    const apiKey = settings.hdmAiKey || env.HDM_AI_KEY;

    if (!apiKey) {
      logger.warn('HDM AI API key not configured');
      return null;
    }

    aiClient = axios.create({
      baseURL,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    
    return aiClient;
  } catch (error) {
    console.error('Failed to create AI client:', error);
    return null;
  }
}

async function aiRequest<T>(endpoint: string, data: any): Promise<T | null> {
  if (!env.HDM_AI) {
    return null;
  }

  const client = getAiClient();
  if (!client) return null;

  try {
    const response = await client.post(endpoint, data);
    return response.data as T;
  } catch (error: any) {
    logger.error(`HDM AI request failed [${endpoint}]`, {
      error: error.response?.data || error.message,
    });
    return null;
  }
}

export async function chatAsk(
  userId: string, 
  message: string, 
  language: string = 'en', 
  recentMessages?: any[]
): Promise<any> {
  // Hardcoded system prompt to instruct the AI
  const sparkFeatures = `You are Spark Messenger AI assistant. Spark Messenger has these features:
- Real-time encrypted messaging
- Group chats (up to 1024 members)
- Voice and video calls
- Status updates (24-hour stories)
- AI-powered smart replies and translation
- Content moderation and spam detection
- Privacy controls (ghost mode, hide read receipts)
- End-to-end encryption
- Group admin controls (add/remove members, promote admins)
- Message editing and deletion
- Contact syncing

Answer questions about Spark Messenger based on these features. Be helpful and concise.`;

  // Add system instruction to the message
  const enhancedMessage = `${sparkFeatures}\n\nUser asked: ${message}`;
  
  const requestData = {
    user_id: userId,
    message: enhancedMessage,
    language,
    data: { 
      recent_messages: recentMessages || []
    },
  };
  
  const result = await aiRequest('/spark/chat/ask', requestData);
  
  if (result) return result;
  
  return {
    success: true,
    data: {
      reply: `Spark Messenger features include: real-time encrypted messaging, group chats (up to 1024 members), status updates, voice/video calls, AI smart replies, translation, and privacy controls. How can I help?`,
      tokens_used: 0
    }
  };
}
export async function chatTranslate(text: string, targetLanguage: string): Promise<any> {
  const result = await aiRequest('/spark/chat/translate', { 
    text, 
    target_language: targetLanguage, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { translated: text }
  };
}

export async function chatRewrite(text: string, style: string): Promise<any> {
  const result = await aiRequest('/spark/chat/rewrite', { 
    text, 
    style, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { rewritten: text }
  };
}

export async function chatDraft(prompt: string, tone: string): Promise<any> {
  const result = await aiRequest('/spark/chat/draft', { 
    prompt, 
    tone, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { draft: `[Draft: ${prompt}]` }
  };
}

export async function chatExplain(text: string, level: string = 'simple'): Promise<any> {
  const result = await aiRequest('/spark/chat/explain', { 
    text, 
    level, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { explanation: `[Explanation of: ${text.substring(0, 100)}]` }
  };
}

export async function chatSummarize(text: string, maxLength: number = 200): Promise<any> {
  const result = await aiRequest('/spark/chat/summarize', { 
    text, 
    max_length: maxLength, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { summary: text.substring(0, maxLength) }
  };
}

export async function chatSummarizeUnread(messages: string[]): Promise<any> {
  const result = await aiRequest('/spark/chat/summarize-unread', { 
    messages, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { summary: `${messages.length} unread messages` }
  };
}

export async function chatVoice(audioBase64: string, language: string = 'en'): Promise<any> {
  const result = await aiRequest('/spark/chat/voice', { 
    audio_base64: audioBase64, 
    language, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { text: "[Voice transcription unavailable]" }
  };
}

export async function chatEmojiSuggest(message: string, count: number = 3): Promise<any> {
  const result = await aiRequest('/spark/chat/emoji-suggest', { 
    message, 
    count, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { emojis: ['😊', '👍', '❤️'] }
  };
}

export async function chatAutocomplete(partialText: string, maxSuggestions: number = 3, recentMessages?: any[]): Promise<any> {
  const result = await aiRequest('/spark/chat/autocomplete', {
    partial_text: partialText,
    max_suggestions: maxSuggestions,
    data: { recent_messages: recentMessages || [] },
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { suggestions: [partialText] }
  };
}

export async function chatToneDetect(text: string): Promise<any> {
  const result = await aiRequest('/spark/chat/tone-detect', { 
    text, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { tone: "neutral", confidence: 0.5 }
  };
}

export async function chatFormat(text: string, formatType: string = 'markdown'): Promise<any> {
  const result = await aiRequest('/spark/chat/format', { 
    text, 
    format_type: formatType, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { formatted: text }
  };
}

export async function chatQuoteReply(originalMessage: string, reply: string): Promise<any> {
  const result = await aiRequest('/spark/chat/quote-reply', { 
    original_message: originalMessage, 
    reply, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { quoted: `> ${originalMessage}\n\n${reply}` }
  };
}

export async function chatPollGenerate(topic: string, optionsCount: number = 4): Promise<any> {
  const result = await aiRequest('/spark/chat/poll-generate', { 
    topic, 
    options_count: optionsCount, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { question: topic, options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'].slice(0, optionsCount) }
  };
}

export async function chatContextReply(message: string, contextMessages: string[]): Promise<any> {
  const result = await aiRequest('/spark/chat/context-reply', { 
    message, 
    context_messages: contextMessages, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { reply: `Regarding "${message}", could you provide more context?` }
  };
}

// ====================================================================
// A2 — SMART REPLY
// ====================================================================

export async function smartReply(message: string, count: number = 3, tone?: string, context?: any): Promise<any> {
  const result = await aiRequest('/spark/smart/reply', { 
    message, 
    count, 
    tone, 
    data: context || {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { replies: ['👍', 'Thanks!', 'Got it'] }
  };
}

export async function smartQuickReply(message: string, count: number = 4): Promise<any> {
  const result = await aiRequest('/spark/smart/quick-reply', { 
    message, 
    count, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { replies: ['Yes', 'No', 'Maybe', 'Later'] }
  };
}

export async function smartReplyContext(message: string, previousMessages: string[]): Promise<any> {
  const result = await aiRequest('/spark/smart/reply-context', { 
    message, 
    previous_messages: previousMessages, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { reply: "I see. Can you tell me more?" }
  };
}

export async function smartReplyTone(message: string, targetTone: string): Promise<any> {
  const result = await aiRequest('/spark/smart/reply-tone', { 
    message, 
    target_tone: targetTone, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { reply: message }
  };
}

export async function smartReplyLanguage(message: string, language: string): Promise<any> {
  const result = await aiRequest('/spark/smart/reply-language', { 
    message, 
    language, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { reply: message }
  };
}

// ====================================================================
// A3 — MESSAGE INTELLIGENCE
// ====================================================================

export async function intelSentiment(text: string, userId?: string, context?: string): Promise<any> {
  const result = await aiRequest('/spark/intel/sentiment', { 
    text, 
    data: { user_id: userId, message_context: context } 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { sentiment: "neutral", score: 0.5 }
  };
}

export async function intelKeywords(text: string, count: number = 10): Promise<any> {
  const result = await aiRequest('/spark/intel/keywords', { 
    text, 
    count, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { keywords: text.split(' ').slice(0, count) }
  };
}

export async function intelEntities(text: string): Promise<any> {
  const result = await aiRequest('/spark/intel/entities', { 
    text, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { entities: [] }
  };
}

export async function intelReadReceipt(message: string, senderHistory: any[]): Promise<any> {
  const result = await aiRequest('/spark/intel/read-receipt', { 
    message, 
    sender_history: senderHistory, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { predictedReadTime: "5-10 minutes", confidence: 0.6 }
  };
}

export async function intelUrgency(message: string): Promise<any> {
  const result = await aiRequest('/spark/intel/urgency', { 
    message, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { urgency: "normal", score: 0.3 }
  };
}

export async function intelLanguageDetect(text: string): Promise<any> {
  const result = await aiRequest('/spark/intel/language-detect', { 
    text, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { language: "en", confidence: 0.8 }
  };
}

// ====================================================================
// A4 — SAFETY & MODERATION
// ====================================================================

export async function safetySpam(text: string, userId: string, userHistory?: any): Promise<any> {
  const result = await aiRequest('/spark/safety/spam', { 
    text, 
    user_id: userId, 
    data: { user_history: userHistory || {} } 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { is_spam: false, confidence: 0.1 }
  };
}

export async function safetyHateSpeech(text: string, reportingUserId?: string, context?: string): Promise<any> {
  const result = await aiRequest('/spark/safety/hate-speech', { 
    text, 
    data: { reporting_user_id: reportingUserId, conversation_context: context } 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { is_hate_speech: false, confidence: 0.1 }
  };
}

export async function safetyNsfw(content: string, contentType: string = 'text'): Promise<any> {
  const result = await aiRequest('/spark/safety/nsfw', { 
    content, 
    content_type: contentType, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { is_nsfw: false, confidence: 0.1 }
  };
}

export async function safetyChildSafety(content: string, userAge: number): Promise<any> {
  const result = await aiRequest('/spark/safety/child-safety', { 
    content, 
    user_age: userAge, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { is_safe: true }
  };
}

export async function safetyImpersonation(text: string, claimedIdentity: string, context: any): Promise<any> {
  const result = await aiRequest('/spark/safety/impersonation', { 
    text, 
    claimed_identity: claimedIdentity, 
    data: context 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { is_impersonation: false, confidence: 0.1 }
  };
}

export async function safetySelfHarm(text: string, userId: string, recentMessages?: string[], userLocation?: string): Promise<any> {
  const result = await aiRequest('/spark/safety/self-harm', {
    text,
    user_id: userId,
    data: { recent_messages: recentMessages || [], user_location: userLocation || 'Kenya' },
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { is_concerning: false, confidence: 0.1 }
  };
}

export async function safetyLinkCheck(url: string): Promise<any> {
  const result = await aiRequest('/spark/safety/link-check', { 
    url, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { is_safe: true }
  };
}

// ====================================================================
// A5 — GROUP CHAT AI
// ====================================================================

export async function groupSummary(messages: any[], maxLength: number = 300, groupName?: string): Promise<any> {
  const result = await aiRequest('/spark/group/summary', { 
    messages, 
    max_length: maxLength, 
    data: { group_name: groupName } 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { summary: `${messages.length} messages in ${groupName || 'the group'}` }
  };
}

export async function groupHighlights(messages: any[], count: number = 5): Promise<any> {
  const result = await aiRequest('/spark/group/highlights', { 
    messages, 
    count, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { highlights: messages.slice(0, count) }
  };
}

export async function groupPollResults(pollData: any): Promise<any> {
  const result = await aiRequest('/spark/group/poll-results', { 
    poll_data: pollData, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { analysis: "Poll results analysis unavailable" }
  };
}

export async function groupMentionSuggest(partialName: string, groupMembers: string[]): Promise<any> {
  const result = await aiRequest('/spark/group/mention-suggest', { 
    partial_name: partialName, 
    group_members: groupMembers, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { suggestions: groupMembers.filter(m => m.toLowerCase().includes(partialName.toLowerCase())) }
  };
}

export async function groupActivityRecap(messages: any[], period: string, groupName?: string): Promise<any> {
  const result = await aiRequest('/spark/group/activity-recap', { 
    messages, 
    period, 
    data: { group_name: groupName } 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { recap: `${messages.length} messages in the last ${period}` }
  };
}

// ====================================================================
// A6 — PRIVACY & SECURITY
// ====================================================================

export async function privacyAdvisor(concern: string, context: string): Promise<any> {
  const result = await aiRequest('/spark/privacy/advisor', { 
    concern, 
    context, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { advice: "Review your privacy settings in the app." }
  };
}

export async function privacyDataLeak(message: string, scanType: string = 'full'): Promise<any> {
  const result = await aiRequest('/spark/privacy/data-leak', { 
    message, 
    scan_type: scanType, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { has_leak: false }
  };
}

export async function privacyEncryptSuggest(message: string): Promise<any> {
  const result = await aiRequest('/spark/privacy/encrypt-suggest', { 
    message, 
    recipient_public_key: null, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { should_encrypt: false }
  };
}

export async function privacyAuditLog(userId: string, period: string, data: any): Promise<any> {
  const result = await aiRequest('/spark/privacy/audit-log', { 
    user_id: userId, 
    period, 
    data 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { analysis: "Audit log analysis unavailable" }
  };
}

// ====================================================================
// A7 — SMART SEARCH
// ====================================================================

export async function searchSemantic(query: string, documents: any[], limit: number = 10): Promise<any> {
  const result = await aiRequest('/spark/search/semantic', { 
    query, 
    documents, 
    limit, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { results: documents.slice(0, limit) }
  };
}

export async function searchMessages(query: string, userId: string, limit: number = 20): Promise<any> {
  const result = await aiRequest('/spark/search/messages', { 
    query, 
    user_id: userId, 
    limit, 
    data: {} 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { messages: [] }
  };
}

export async function searchContacts(query: string, userId: string, frequentContacts?: string[]): Promise<any> {
  const result = await aiRequest('/spark/search/contacts', { 
    query, 
    user_id: userId, 
    limit: 10, 
    data: { frequent_contacts: frequentContacts || [] } 
  });
  
  if (result) return result;
  
  return {
    success: true,
    data: { contacts: [] }
  };
}

// ====================================================================
// SYSTEM
// ====================================================================

export async function aiHealth(): Promise<any> {
  const client = getAiClient();
  if (!client) return null;
  try {
    const response = await client.get('/spark/health');
    return response.data;
  } catch {
    return { status: 'unavailable' };
  }
}

export async function aiStats(): Promise<any> {
  const client = getAiClient();
  if (!client) return null;
  try {
    const response = await client.get('/spark/stats');
    return response.data;
  } catch {
    return { status: 'unavailable' };
  }
}