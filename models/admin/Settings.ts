import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  appName: string;
  appDescription: string;
  contactEmail: string;
  timezone: string;
  hdmAiUrl: string;
  hdmAiKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  mpesaConsumerKey: string;
  mpesaConsumerSecret: string;
  mpesaPasskey: string;
  mpesaShortcode: string;
  mpesaReceivePhone: string;
  mpesaPaybillNumber: string;
  mpesaTillNumber: string;
  planMonthlyPrice: number;
  planYearlyPrice: number;
  planPermanentPrice: number;
  planCurrency: string;
  exchangeRates: {
    USD: number;
    KES: number;
    EUR: number;
    GBP: number;
    lastUpdated: Date | null;
  };
  paymentMethods: {
    stripe: boolean;
    mpesaStkPush: boolean;
    mpesaSendMoney: boolean;
    mpesaPaybill: boolean;
    mpesaTill: boolean;
    paypal: boolean;
  };
  deeplinks: {
    sparkToVibe: Record<string, string>;
    vibeToSpark: Record<string, string>;
  };
  groupMaxMembers: number;
  groupMaxAdmins: number;
  messageEditWindowMinutes: number;
  messageDeleteWindowHours: number;
  statusExpireHours: number;
  sessionMaxDevices: number;
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  blockedWords: string[];
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    appName: { type: String, default: 'Spark' },
    appDescription: { type: String, default: 'Privacy-first messaging by HDM' },
    contactEmail: { type: String, default: 'support@spark.hdm.com' },
    timezone: { type: String, default: 'Africa/Nairobi' },
    hdmAiUrl: { type: String, default: 'https://hdmai-server.onrender.com/api/v1' },
    hdmAiKey: { type: String, default: '' },
    stripeSecretKey: { type: String, default: '' },
    stripeWebhookSecret: { type: String, default: '' },
    mpesaConsumerKey: { type: String, default: '' },
    mpesaConsumerSecret: { type: String, default: '' },
    mpesaPasskey: { type: String, default: '' },
    mpesaShortcode: { type: String, default: '174379' },
    mpesaReceivePhone: { type: String, default: '' },
    mpesaPaybillNumber: { type: String, default: '' },
    mpesaTillNumber: { type: String, default: '' },
    planMonthlyPrice: { type: Number, default: 4.99 },
    planYearlyPrice: { type: Number, default: 39.99 },
    planPermanentPrice: { type: Number, default: 99.99 },
    planCurrency: { type: String, default: 'USD' },
    exchangeRates: {
      type: new Schema(
        {
          USD: { type: Number, default: 1 },
          KES: { type: Number, default: 130 },
          EUR: { type: Number, default: 0.92 },
          GBP: { type: Number, default: 0.79 },
          lastUpdated: { type: Date, default: null },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    paymentMethods: {
      type: new Schema(
        {
          stripe: { type: Boolean, default: true },
          mpesaStkPush: { type: Boolean, default: true },
          mpesaSendMoney: { type: Boolean, default: true },
          mpesaPaybill: { type: Boolean, default: true },
          mpesaTill: { type: Boolean, default: true },
          paypal: { type: Boolean, default: false },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    deeplinks: {
      type: new Schema(
        {
          sparkToVibe: { type: Schema.Types.Mixed, default: {} },
          vibeToSpark: { type: Schema.Types.Mixed, default: {} },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    groupMaxMembers: { type: Number, default: 1024 },
    groupMaxAdmins: { type: Number, default: 10 },
    messageEditWindowMinutes: { type: Number, default: 15 },
    messageDeleteWindowHours: { type: Number, default: 1 },
    statusExpireHours: { type: Number, default: 24 },
    sessionMaxDevices: { type: Number, default: 5 },
    isMaintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: { type: String, default: 'Spark is under maintenance. We will be back shortly.' },
    blockedWords: [{ type: String }],
  },
  { timestamps: true },
);

const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
export default Settings;