import axios, { AxiosInstance } from 'axios';
import { getSettings } from '../../config/settings';
import env from '../../config/env';
import { logger } from '../../utils/logger';

function createAiClient(): AxiosInstance | null {
  try {
    const settings = getSettings();
    const baseURL = settings.hdmAiUrl || env.HDM_AI_URL;
    const apiKey = settings.hdmAiKey || env.HDM_AI_KEY;

    if (!apiKey) {
      logger.warn('HDM AI API key not configured');
      return null;
    }

    return axios.create({
      baseURL,
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  } catch {
    return null;
  }
}

async function aiRequest<T>(endpoint: string, data: Record<string, any>): Promise<T | null> {
  if (!env.HDM_AI) {
    return null;
  }

  const client = createAiClient();
  if (!client) return null;

  try {
    const response = await client.post(endpoint, data);
    return response.data as T;
  } catch (error: any) {
    logger.error(`HDM AI request failed [${endpoint}]`, {
      error: error.response?.data || error.message,
      status: error.response?.status,
    });
    return null;
  }
}

// ====================================================================
// A1 — CHAT WITH HDM AI
// ====================================================================

export async function chatAsk(userId: string, message: string, language: string = 'en', recentMessages?: any[]): Promise<any> {
  return aiRequest('/spark/chat/ask', {
    user_id: userId,
    message,
    language,
    data: { recent_messages: recentMessages || [] },
  });
}

export async function chatTranslate(text: string, targetLanguage: string): Promise<any> {
  return aiRequest('/spark/chat/translate', { text, target_language: targetLanguage, data: {} });
}

export async function chatRewrite(text: string, style: string): Promise<any> {
  return aiRequest('/spark/chat/rewrite', { text, style, data: {} });
}

export async function chatDraft(prompt: string, tone: string): Promise<any> {
  return aiRequest('/spark/chat/draft', { prompt, tone, data: {} });
}

export async function chatExplain(text: string, level: string = 'simple'): Promise<any> {
  return aiRequest('/spark/chat/explain', { text, level, data: {} });
}

export async function chatSummarize(text: string, maxLength: number = 200): Promise<any> {
  return aiRequest('/spark/chat/summarize', { text, max_length: maxLength, data: {} });
}

export async function chatSummarizeUnread(messages: string[]): Promise<any> {
  return aiRequest('/spark/chat/summarize-unread', { messages, data: {} });
}

export async function chatVoice(audioBase64: string, language: string = 'en'): Promise<any> {
  return aiRequest('/spark/chat/voice', { audio_base64: audioBase64, language, data: {} });
}

export async function chatEmojiSuggest(message: string, count: number = 3): Promise<any> {
  return aiRequest('/spark/chat/emoji-suggest', { message, count, data: {} });
}

export async function chatAutocomplete(partialText: string, maxSuggestions: number = 3, recentMessages?: any[]): Promise<any> {
  return aiRequest('/spark/chat/autocomplete', {
    partial_text: partialText,
    max_suggestions: maxSuggestions,
    data: { recent_messages: recentMessages || [] },
  });
}

export async function chatToneDetect(text: string): Promise<any> {
  return aiRequest('/spark/chat/tone-detect', { text, data: {} });
}

export async function chatFormat(text: string, formatType: string = 'markdown'): Promise<any> {
  return aiRequest('/spark/chat/format', { text, format_type: formatType, data: {} });
}

export async function chatQuoteReply(originalMessage: string, reply: string): Promise<any> {
  return aiRequest('/spark/chat/quote-reply', { original_message: originalMessage, reply, data: {} });
}

export async function chatPollGenerate(topic: string, optionsCount: number = 4): Promise<any> {
  return aiRequest('/spark/chat/poll-generate', { topic, options_count: optionsCount, data: {} });
}

export async function chatContextReply(message: string, contextMessages: string[]): Promise<any> {
  return aiRequest('/spark/chat/context-reply', { message, context_messages: contextMessages, data: {} });
}

// ====================================================================
// A2 — SMART REPLY
// ====================================================================

export async function smartReply(message: string, count: number = 3, tone?: string, context?: any): Promise<any> {
  return aiRequest('/spark/smart/reply', { message, count, tone, data: context || {} });
}

export async function smartQuickReply(message: string, count: number = 4): Promise<any> {
  return aiRequest('/spark/smart/quick-reply', { message, count, data: {} });
}

export async function smartReplyContext(message: string, previousMessages: string[]): Promise<any> {
  return aiRequest('/spark/smart/reply-context', { message, previous_messages: previousMessages, data: {} });
}

export async function smartReplyTone(message: string, targetTone: string): Promise<any> {
  return aiRequest('/spark/smart/reply-tone', { message, target_tone: targetTone, data: {} });
}

export async function smartReplyLanguage(message: string, language: string): Promise<any> {
  return aiRequest('/spark/smart/reply-language', { message, language, data: {} });
}

// ====================================================================
// A3 — MESSAGE INTELLIGENCE
// ====================================================================

export async function intelSentiment(text: string, userId?: string, context?: string): Promise<any> {
  return aiRequest('/spark/intel/sentiment', { text, data: { user_id: userId, message_context: context } });
}

export async function intelKeywords(text: string, count: number = 10): Promise<any> {
  return aiRequest('/spark/intel/keywords', { text, count, data: {} });
}

export async function intelEntities(text: string): Promise<any> {
  return aiRequest('/spark/intel/entities', { text, data: {} });
}

export async function intelReadReceipt(message: string, senderHistory: any[]): Promise<any> {
  return aiRequest('/spark/intel/read-receipt', { message, sender_history: senderHistory, data: {} });
}

export async function intelUrgency(message: string): Promise<any> {
  return aiRequest('/spark/intel/urgency', { message, data: {} });
}

export async function intelLanguageDetect(text: string): Promise<any> {
  return aiRequest('/spark/intel/language-detect', { text, data: {} });
}

// ====================================================================
// A4 — SAFETY & MODERATION
// ====================================================================

export async function safetySpam(text: string, userId: string, userHistory?: any): Promise<any> {
  return aiRequest('/spark/safety/spam', { text, user_id: userId, data: { user_history: userHistory || {} } });
}

export async function safetyHateSpeech(text: string, reportingUserId?: string, context?: string): Promise<any> {
  return aiRequest('/spark/safety/hate-speech', { text, data: { reporting_user_id: reportingUserId, conversation_context: context } });
}

export async function safetyNsfw(content: string, contentType: string = 'text'): Promise<any> {
  return aiRequest('/spark/safety/nsfw', { content, content_type: contentType, data: {} });
}

export async function safetyChildSafety(content: string, userAge: number): Promise<any> {
  return aiRequest('/spark/safety/child-safety', { content, user_age: userAge, data: {} });
}

export async function safetyImpersonation(text: string, claimedIdentity: string, context: any): Promise<any> {
  return aiRequest('/spark/safety/impersonation', { text, claimed_identity: claimedIdentity, data: context });
}

export async function safetySelfHarm(text: string, userId: string, recentMessages?: string[], userLocation?: string): Promise<any> {
  return aiRequest('/spark/safety/self-harm', {
    text,
    user_id: userId,
    data: { recent_messages: recentMessages || [], user_location: userLocation || 'Kenya' },
  });
}

export async function safetyLinkCheck(url: string): Promise<any> {
  return aiRequest('/spark/safety/link-check', { url, data: {} });
}

// ====================================================================
// A5 — GROUP CHAT AI
// ====================================================================

export async function groupSummary(messages: any[], maxLength: number = 300, groupName?: string): Promise<any> {
  return aiRequest('/spark/group/summary', { messages, max_length: maxLength, data: { group_name: groupName } });
}

export async function groupHighlights(messages: any[], count: number = 5): Promise<any> {
  return aiRequest('/spark/group/highlights', { messages, count, data: {} });
}

export async function groupPollResults(pollData: any): Promise<any> {
  return aiRequest('/spark/group/poll-results', { poll_data: pollData, data: {} });
}

export async function groupMentionSuggest(partialName: string, groupMembers: string[]): Promise<any> {
  return aiRequest('/spark/group/mention-suggest', { partial_name: partialName, group_members: groupMembers, data: {} });
}

export async function groupActivityRecap(messages: any[], period: string, groupName?: string): Promise<any> {
  return aiRequest('/spark/group/activity-recap', { messages, period, data: { group_name: groupName } });
}

// ====================================================================
// A6 — PRIVACY & SECURITY
// ====================================================================

export async function privacyAdvisor(concern: string, context: string): Promise<any> {
  return aiRequest('/spark/privacy/advisor', { concern, context, data: {} });
}

export async function privacyDataLeak(message: string, scanType: string = 'full'): Promise<any> {
  return aiRequest('/spark/privacy/data-leak', { message, scan_type: scanType, data: {} });
}

export async function privacyEncryptSuggest(message: string): Promise<any> {
  return aiRequest('/spark/privacy/encrypt-suggest', { message, recipient_public_key: null, data: {} });
}

export async function privacyAuditLog(userId: string, period: string, data: any): Promise<any> {
  return aiRequest('/spark/privacy/audit-log', { user_id: userId, period, data });
}

// ====================================================================
// A7 — SMART SEARCH
// ====================================================================

export async function searchSemantic(query: string, documents: any[], limit: number = 10): Promise<any> {
  return aiRequest('/spark/search/semantic', { query, documents, limit, data: {} });
}

export async function searchMessages(query: string, userId: string, limit: number = 20): Promise<any> {
  return aiRequest('/spark/search/messages', { query, user_id: userId, limit, data: {} });
}

export async function searchContacts(query: string, userId: string, frequentContacts?: string[]): Promise<any> {
  return aiRequest('/spark/search/contacts', { query, user_id: userId, limit: 10, data: { frequent_contacts: frequentContacts || [] } });
}

// ====================================================================
// SYSTEM
// ====================================================================

export async function aiHealth(): Promise<any> {
  const client = createAiClient();
  if (!client) return null;
  try {
    const response = await client.get('/spark/health');
    return response.data;
  } catch {
    return null;
  }
}

export async function aiStats(): Promise<any> {
  const client = createAiClient();
  if (!client) return null;
  try {
    const response = await client.get('/spark/stats');
    return response.data;
  } catch {
    return null;
  }
}