import { Request, Response, NextFunction } from 'express';
import * as hdmAiService from '../../services/external/hdmAiService';
import { sendSuccess, sendBadRequest } from '../../utils/response';
import { logger } from '../../utils/logger';

// ====================================================================
// A1 — CHAT WITH HDM AI
// ====================================================================

export async function chatAsk(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, language, recentMessages } = req.body;
    const result = await hdmAiService.chatAsk(req.user!.userId, message, language, recentMessages);
    sendSuccess(res, 'AI response', result);
  } catch (error: any) {
    logger.error('AI chat ask error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function chatTranslate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text, targetLanguage } = req.body;
    const result = await hdmAiService.chatTranslate(text, targetLanguage);
    sendSuccess(res, 'Translation', result);
  } catch (error: any) {
    logger.error('AI translate error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function chatRewrite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text, style } = req.body;
    const result = await hdmAiService.chatRewrite(text, style);
    sendSuccess(res, 'Rewritten text', result);
  } catch (error: any) {
    logger.error('AI rewrite error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function chatDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { prompt, tone } = req.body;
    const result = await hdmAiService.chatDraft(prompt, tone);
    sendSuccess(res, 'Draft generated', result);
  } catch (error: any) {
    logger.error('AI draft error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function chatExplain(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text, level } = req.body;
    const result = await hdmAiService.chatExplain(text, level);
    sendSuccess(res, 'Explanation', result);
  } catch (error: any) {
    logger.error('AI explain error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function chatSummarize(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text, maxLength } = req.body;
    const result = await hdmAiService.chatSummarize(text, maxLength);
    sendSuccess(res, 'Summary', result);
  } catch (error: any) {
    logger.error('AI summarize error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function chatSummarizeUnread(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { messages } = req.body;
    const result = await hdmAiService.chatSummarizeUnread(messages);
    sendSuccess(res, 'Unread summary', result);
  } catch (error: any) {
    logger.error('AI summarize unread error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function chatVoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { audioBase64, language } = req.body;
    const result = await hdmAiService.chatVoice(audioBase64, language);
    sendSuccess(res, 'Voice transcription', result);
  } catch (error: any) {
    logger.error('AI voice error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function chatEmojiSuggest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, count } = req.body;
    const result = await hdmAiService.chatEmojiSuggest(message, count);
    sendSuccess(res, 'Emoji suggestions', result);
  } catch (error: any) {
    logger.error('AI emoji suggest error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function chatAutocomplete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { partialText, maxSuggestions, recentMessages } = req.body;
    const result = await hdmAiService.chatAutocomplete(partialText, maxSuggestions, recentMessages);
    sendSuccess(res, 'Autocomplete suggestions', result);
  } catch (error: any) {
    logger.error('AI autocomplete error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function chatToneDetect(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text } = req.body;
    const result = await hdmAiService.chatToneDetect(text);
    sendSuccess(res, 'Tone detected', result);
  } catch (error: any) {
    logger.error('AI tone detect error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function chatFormat(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text, formatType } = req.body;
    const result = await hdmAiService.chatFormat(text, formatType);
    sendSuccess(res, 'Formatted text', result);
  } catch (error: any) {
    logger.error('AI format error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function chatQuoteReply(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { originalMessage, reply } = req.body;
    const result = await hdmAiService.chatQuoteReply(originalMessage, reply);
    sendSuccess(res, 'Quote reply', result);
  } catch (error: any) {
    logger.error('AI quote reply error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function chatPollGenerate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { topic, optionsCount } = req.body;
    const result = await hdmAiService.chatPollGenerate(topic, optionsCount);
    sendSuccess(res, 'Poll generated', result);
  } catch (error: any) {
    logger.error('AI poll generate error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function chatContextReply(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, contextMessages } = req.body;
    const result = await hdmAiService.chatContextReply(message, contextMessages);
    sendSuccess(res, 'Context reply', result);
  } catch (error: any) {
    logger.error('AI context reply error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

// ====================================================================
// A2 — SMART REPLY
// ====================================================================

export async function smartReply(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, count, tone, context } = req.body;
    const result = await hdmAiService.smartReply(message, count, tone, context);
    sendSuccess(res, 'Smart replies', result);
  } catch (error: any) {
    logger.error('AI smart reply error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function smartQuickReply(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, count } = req.body;
    const result = await hdmAiService.smartQuickReply(message, count);
    sendSuccess(res, 'Quick replies', result);
  } catch (error: any) {
    logger.error('AI quick reply error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function smartReplyContext(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, previousMessages } = req.body;
    const result = await hdmAiService.smartReplyContext(message, previousMessages);
    sendSuccess(res, 'Context reply', result);
  } catch (error: any) {
    logger.error('AI reply context error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function smartReplyTone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, targetTone } = req.body;
    const result = await hdmAiService.smartReplyTone(message, targetTone);
    sendSuccess(res, 'Toned reply', result);
  } catch (error: any) {
    logger.error('AI reply tone error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function smartReplyLanguage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, language } = req.body;
    const result = await hdmAiService.smartReplyLanguage(message, language);
    sendSuccess(res, 'Translated reply', result);
  } catch (error: any) {
    logger.error('AI reply language error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

// ====================================================================
// A3 — MESSAGE INTELLIGENCE
// ====================================================================

export async function intelSentiment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text, context } = req.body;
    const result = await hdmAiService.intelSentiment(text, req.user!.userId, context);
    sendSuccess(res, 'Sentiment analysis', result);
  } catch (error: any) {
    logger.error('AI sentiment error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function intelKeywords(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text, count } = req.body;
    const result = await hdmAiService.intelKeywords(text, count);
    sendSuccess(res, 'Keywords extracted', result);
  } catch (error: any) {
    logger.error('AI keywords error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function intelEntities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text } = req.body;
    const result = await hdmAiService.intelEntities(text);
    sendSuccess(res, 'Entities extracted', result);
  } catch (error: any) {
    logger.error('AI entities error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function intelReadReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, senderHistory } = req.body;
    const result = await hdmAiService.intelReadReceipt(message, senderHistory);
    sendSuccess(res, 'Read receipt prediction', result);
  } catch (error: any) {
    logger.error('AI read receipt error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function intelUrgency(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message } = req.body;
    const result = await hdmAiService.intelUrgency(message);
    sendSuccess(res, 'Urgency detected', result);
  } catch (error: any) {
    logger.error('AI urgency error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function intelLanguageDetect(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text } = req.body;
    const result = await hdmAiService.intelLanguageDetect(text);
    sendSuccess(res, 'Language detected', result);
  } catch (error: any) {
    logger.error('AI language detect error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

// ====================================================================
// A4 — SAFETY & MODERATION
// ====================================================================

export async function safetySpam(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text, userHistory } = req.body;
    const result = await hdmAiService.safetySpam(text, req.user!.userId, userHistory);
    sendSuccess(res, 'Spam check', result);
  } catch (error: any) {
    logger.error('AI spam check error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function safetyHateSpeech(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text, context } = req.body;
    const result = await hdmAiService.safetyHateSpeech(text, req.user!.userId, context);
    sendSuccess(res, 'Hate speech check', result);
  } catch (error: any) {
    logger.error('AI hate speech error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function safetyNsfw(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { content, contentType } = req.body;
    const result = await hdmAiService.safetyNsfw(content, contentType);
    sendSuccess(res, 'NSFW check', result);
  } catch (error: any) {
    logger.error('AI NSFW error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function safetyChildSafety(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { content, userAge } = req.body;
    const result = await hdmAiService.safetyChildSafety(content, userAge);
    sendSuccess(res, 'Child safety check', result);
  } catch (error: any) {
    logger.error('AI child safety error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function safetyImpersonation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text, claimedIdentity, context } = req.body;
    const result = await hdmAiService.safetyImpersonation(text, claimedIdentity, context);
    sendSuccess(res, 'Impersonation check', result);
  } catch (error: any) {
    logger.error('AI impersonation error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function safetySelfHarm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { text, recentMessages, userLocation } = req.body;
    const result = await hdmAiService.safetySelfHarm(text, req.user!.userId, recentMessages, userLocation);
    sendSuccess(res, 'Self harm check', result);
  } catch (error: any) {
    logger.error('AI self harm error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function safetyLinkCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { url } = req.body;
    const result = await hdmAiService.safetyLinkCheck(url);
    sendSuccess(res, 'Link safety check', result);
  } catch (error: any) {
    logger.error('AI link check error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

// ====================================================================
// A5 — GROUP CHAT AI
// ====================================================================

export async function groupSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { messages, maxLength, groupName } = req.body;
    const result = await hdmAiService.groupSummary(messages, maxLength, groupName);
    sendSuccess(res, 'Group summary', result);
  } catch (error: any) {
    logger.error('AI group summary error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function groupHighlights(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { messages, count } = req.body;
    const result = await hdmAiService.groupHighlights(messages, count);
    sendSuccess(res, 'Group highlights', result);
  } catch (error: any) {
    logger.error('AI group highlights error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function groupPollResults(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { pollData } = req.body;
    const result = await hdmAiService.groupPollResults(pollData);
    sendSuccess(res, 'Poll results', result);
  } catch (error: any) {
    logger.error('AI poll results error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function groupMentionSuggest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { partialName, groupMembers } = req.body;
    const result = await hdmAiService.groupMentionSuggest(partialName, groupMembers);
    sendSuccess(res, 'Mention suggestions', result);
  } catch (error: any) {
    logger.error('AI mention suggest error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function groupActivityRecap(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { messages, period, groupName } = req.body;
    const result = await hdmAiService.groupActivityRecap(messages, period, groupName);
    sendSuccess(res, 'Activity recap', result);
  } catch (error: any) {
    logger.error('AI activity recap error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

// ====================================================================
// A6 — PRIVACY & SECURITY
// ====================================================================

export async function privacyAdvisor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { concern, context } = req.body;
    const result = await hdmAiService.privacyAdvisor(concern, context);
    sendSuccess(res, 'Privacy advice', result);
  } catch (error: any) {
    logger.error('AI privacy advisor error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function privacyDataLeak(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message, scanType } = req.body;
    const result = await hdmAiService.privacyDataLeak(message, scanType);
    sendSuccess(res, 'Data leak scan', result);
  } catch (error: any) {
    logger.error('AI data leak error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function privacyEncryptSuggest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { message } = req.body;
    const result = await hdmAiService.privacyEncryptSuggest(message);
    sendSuccess(res, 'Encryption suggestion', result);
  } catch (error: any) {
    logger.error('AI encrypt suggest error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function privacyAuditLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { period, data } = req.body;
    const result = await hdmAiService.privacyAuditLog(req.user!.userId, period, data);
    sendSuccess(res, 'Audit log analysis', result);
  } catch (error: any) {
    logger.error('AI audit log error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

// ====================================================================
// A7 — SMART SEARCH
// ====================================================================

export async function searchSemantic(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { query, documents, limit } = req.body;
    const result = await hdmAiService.searchSemantic(query, documents, limit);
    sendSuccess(res, 'Semantic search results', result);
  } catch (error: any) {
    logger.error('AI semantic search error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function searchMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { query, limit } = req.body;
    const result = await hdmAiService.searchMessages(query, req.user!.userId, limit);
    sendSuccess(res, 'Message search results', result);
  } catch (error: any) {
    logger.error('AI search messages error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

export async function searchContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { query, frequentContacts } = req.body;
    const result = await hdmAiService.searchContacts(query, req.user!.userId, frequentContacts);
    sendSuccess(res, 'Contact search results', result);
  } catch (error: any) {
    logger.error('AI search contacts error', { error: error.message });
    sendBadRequest(res, error.message);
  }
}

// ====================================================================
// SYSTEM
// ====================================================================

export async function aiHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await hdmAiService.aiHealth();
    sendSuccess(res, 'AI health', result);
  } catch (error: any) {
    logger.error('AI health error', { error: error.message });
    sendSuccess(res, 'AI unavailable', { status: 'down' });
  }
}

export async function aiStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await hdmAiService.aiStats();
    sendSuccess(res, 'AI stats', result);
  } catch (error: any) {
    logger.error('AI stats error', { error: error.message });
    sendSuccess(res, 'Stats unavailable', null);
  }
}