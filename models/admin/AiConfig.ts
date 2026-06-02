import mongoose, { Schema, Document } from 'mongoose';

export interface IAiConfig extends Document {
  // General AI Settings
  isEnabled: boolean;
  baseUrl: string;
  apiKey: string;
  modelVersion: string;
  maxTokens: number;
  temperature: number;
  requestTimeout: number;

  // Feature Toggles
  features: {
    chatWithAi: boolean;
    smartReply: boolean;
    autoComplete: boolean;
    emojiSuggest: boolean;
    stickerSuggest: boolean;
    messageIntelligence: boolean;
    toneDetection: boolean;
    messageSummary: boolean;
    voiceTranscription: boolean;
    sentimentAnalysis: boolean;
    spamDetection: boolean;
    hateSpeechFilter: boolean;
    nsfwBlocker: boolean;
    childSafety: boolean;
    impersonationDetection: boolean;
    selfHarmDetection: boolean;
    linkSafetyCheck: boolean;
    groupSummary: boolean;
    groupAutoModeration: boolean;
    semanticSearch: boolean;
    privacyAdvisor: boolean;
    dataLeakDetection: boolean;
    broadcastAssist: boolean;
  };

  // Moderation Thresholds
  thresholds: {
    spamScore: number;
    hateSpeechScore: number;
    nsfwScore: number;
    toxicityScore: number;
    impersonationConfidence: number;
  };

  // Rate Limits (AI-specific)
  rateLimits: {
    chatWithAiPerMinute: number;
    smartReplyPerMinute: number;
    searchPerMinute: number;
    moderationPerMinute: number;
  };

  // Auto-Moderation Rules
  autoModeration: {
    autoDeleteSpam: boolean;
    autoDeleteHateSpeech: boolean;
    autoBlockNsfw: boolean;
    autoFlagImpersonation: boolean;
    autoFlagSelfHarm: boolean;
    quarantineThreshold: number;
  };

  // Language Settings
  languages: {
    default: string;
    autoDetect: boolean;
    supported: string[];
    translationEnabled: boolean;
  };

  // Logging & Monitoring
  logging: {
    logAllAiRequests: boolean;
    logModerationActions: boolean;
    logFailedRequests: boolean;
    retentionDays: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const aiConfigSchema = new Schema<IAiConfig>(
  {
    isEnabled: { type: Boolean, default: true },
    baseUrl: { type: String, default: 'https://hdmai-server.onrender.com/api/v1' },
    apiKey: { type: String, default: '' },
    modelVersion: { type: String, default: 'v1' },
    maxTokens: { type: Number, default: 2000 },
    temperature: { type: Number, default: 0.7, min: 0, max: 2 },
    requestTimeout: { type: Number, default: 10000 },

    features: {
      type: new Schema(
        {
          chatWithAi: { type: Boolean, default: true },
          smartReply: { type: Boolean, default: true },
          autoComplete: { type: Boolean, default: true },
          emojiSuggest: { type: Boolean, default: true },
          stickerSuggest: { type: Boolean, default: true },
          messageIntelligence: { type: Boolean, default: true },
          toneDetection: { type: Boolean, default: true },
          messageSummary: { type: Boolean, default: true },
          voiceTranscription: { type: Boolean, default: true },
          sentimentAnalysis: { type: Boolean, default: true },
          spamDetection: { type: Boolean, default: true },
          hateSpeechFilter: { type: Boolean, default: true },
          nsfwBlocker: { type: Boolean, default: true },
          childSafety: { type: Boolean, default: true },
          impersonationDetection: { type: Boolean, default: true },
          selfHarmDetection: { type: Boolean, default: true },
          linkSafetyCheck: { type: Boolean, default: true },
          groupSummary: { type: Boolean, default: true },
          groupAutoModeration: { type: Boolean, default: true },
          semanticSearch: { type: Boolean, default: true },
          privacyAdvisor: { type: Boolean, default: true },
          dataLeakDetection: { type: Boolean, default: true },
          broadcastAssist: { type: Boolean, default: true },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    thresholds: {
      type: new Schema(
        {
          spamScore: { type: Number, default: 0.7, min: 0, max: 1 },
          hateSpeechScore: { type: Number, default: 0.6, min: 0, max: 1 },
          nsfwScore: { type: Number, default: 0.7, min: 0, max: 1 },
          toxicityScore: { type: Number, default: 0.6, min: 0, max: 1 },
          impersonationConfidence: { type: Number, default: 0.8, min: 0, max: 1 },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    rateLimits: {
      type: new Schema(
        {
          chatWithAiPerMinute: { type: Number, default: 10 },
          smartReplyPerMinute: { type: Number, default: 30 },
          searchPerMinute: { type: Number, default: 20 },
          moderationPerMinute: { type: Number, default: 60 },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    autoModeration: {
      type: new Schema(
        {
          autoDeleteSpam: { type: Boolean, default: false },
          autoDeleteHateSpeech: { type: Boolean, default: false },
          autoBlockNsfw: { type: Boolean, default: true },
          autoFlagImpersonation: { type: Boolean, default: true },
          autoFlagSelfHarm: { type: Boolean, default: true },
          quarantineThreshold: { type: Number, default: 5 },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    languages: {
      type: new Schema(
        {
          default: { type: String, default: 'en' },
          autoDetect: { type: Boolean, default: true },
          supported: {
            type: [String],
            default: ['en', 'sw', 'fr', 'ar', 'es', 'de', 'zh', 'hi'],
          },
          translationEnabled: { type: Boolean, default: true },
        },
        { _id: false },
      ),
      default: () => ({}),
    },

    logging: {
      type: new Schema(
        {
          logAllAiRequests: { type: Boolean, default: true },
          logModerationActions: { type: Boolean, default: true },
          logFailedRequests: { type: Boolean, default: true },
          retentionDays: { type: Number, default: 90 },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

const AiConfig = mongoose.model<IAiConfig>('AiConfig', aiConfigSchema);
export default AiConfig;