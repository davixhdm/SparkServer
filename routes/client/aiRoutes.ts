import { Router } from 'express';
import * as aiController from '../../controllers/client/aiController';
import { authMiddleware } from '../../middleware/client/authMiddleware';

const router = Router();

router.use(authMiddleware);

// ====================================================================
// SYSTEM
// ====================================================================
router.get('/health', aiController.aiHealth);
router.get('/stats', aiController.aiStats);

// ====================================================================
// A1 — CHAT WITH HDM AI
// ====================================================================
router.post('/chat/ask', aiController.chatAsk);
router.post('/chat/translate', aiController.chatTranslate);
router.post('/chat/rewrite', aiController.chatRewrite);
router.post('/chat/draft', aiController.chatDraft);
router.post('/chat/explain', aiController.chatExplain);
router.post('/chat/summarize', aiController.chatSummarize);
router.post('/chat/summarize-unread', aiController.chatSummarizeUnread);
router.post('/chat/voice', aiController.chatVoice);
router.post('/chat/emoji-suggest', aiController.chatEmojiSuggest);
router.post('/chat/autocomplete', aiController.chatAutocomplete);
router.post('/chat/tone-detect', aiController.chatToneDetect);
router.post('/chat/format', aiController.chatFormat);
router.post('/chat/quote-reply', aiController.chatQuoteReply);
router.post('/chat/poll-generate', aiController.chatPollGenerate);
router.post('/chat/context-reply', aiController.chatContextReply);

// ====================================================================
// A2 — SMART REPLY
// ====================================================================
router.post('/smart/reply', aiController.smartReply);
router.post('/smart/quick-reply', aiController.smartQuickReply);
router.post('/smart/reply-context', aiController.smartReplyContext);
router.post('/smart/reply-tone', aiController.smartReplyTone);
router.post('/smart/reply-language', aiController.smartReplyLanguage);

// ====================================================================
// A3 — MESSAGE INTELLIGENCE
// ====================================================================
router.post('/intel/sentiment', aiController.intelSentiment);
router.post('/intel/keywords', aiController.intelKeywords);
router.post('/intel/entities', aiController.intelEntities);
router.post('/intel/read-receipt', aiController.intelReadReceipt);
router.post('/intel/urgency', aiController.intelUrgency);
router.post('/intel/language-detect', aiController.intelLanguageDetect);

// ====================================================================
// A4 — SAFETY & MODERATION
// ====================================================================
router.post('/safety/spam', aiController.safetySpam);
router.post('/safety/hate-speech', aiController.safetyHateSpeech);
router.post('/safety/nsfw', aiController.safetyNsfw);
router.post('/safety/child-safety', aiController.safetyChildSafety);
router.post('/safety/impersonation', aiController.safetyImpersonation);
router.post('/safety/self-harm', aiController.safetySelfHarm);
router.post('/safety/link-check', aiController.safetyLinkCheck);

// ====================================================================
// A5 — GROUP CHAT AI
// ====================================================================
router.post('/group/summary', aiController.groupSummary);
router.post('/group/highlights', aiController.groupHighlights);
router.post('/group/poll-results', aiController.groupPollResults);
router.post('/group/mention-suggest', aiController.groupMentionSuggest);
router.post('/group/activity-recap', aiController.groupActivityRecap);

// ====================================================================
// A6 — PRIVACY & SECURITY
// ====================================================================
router.post('/privacy/advisor', aiController.privacyAdvisor);
router.post('/privacy/data-leak', aiController.privacyDataLeak);
router.post('/privacy/encrypt-suggest', aiController.privacyEncryptSuggest);
router.post('/privacy/audit-log', aiController.privacyAuditLog);

// ====================================================================
// A7 — SMART SEARCH
// ====================================================================
router.post('/search/semantic', aiController.searchSemantic);
router.post('/search/messages', aiController.searchMessages);
router.post('/search/contacts', aiController.searchContacts);

export default router;