import admin from 'firebase-admin';
import env from '../../config/env';
import { logger } from '../../utils/logger';

let firebaseApp: admin.app.App | null = null;

function initFirebase(): void {
  if (firebaseApp) return;
  if (!env.FIREBASE) {
    logger.warn('Firebase is disabled — push notifications will not work');
    return;
  }
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    logger.warn('Firebase credentials not fully configured');
    return;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        privateKeyId: env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: env.FIREBASE_PRIVATE_KEY,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        clientId: env.FIREBASE_CLIENT_ID,
      }),
    });

    logger.info('Firebase initialized successfully');
  } catch (error: any) {
    logger.error('Firebase initialization failed', { error: error.message });
  }
}

initFirebase();

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  channelId?: string;
  priority?: 'normal' | 'high';
}

export async function sendToDevice(
  fcmToken: string,
  payload: PushNotificationPayload,
): Promise<boolean> {
  if (!firebaseApp || !env.FIREBASE) {
    return false;
  }

  try {
    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data || {},
      android: {
        priority: payload.priority === 'high' ? 'high' : 'normal',
        notification: {
          channelId: payload.channelId || 'spark_messages',
          color: '#1A73E8',
          icon: 'ic_notification',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'mutable-content': 1,
          },
        },
        headers: {
          'apns-priority': payload.priority === 'high' ? '10' : '5',
        },
      },
    };

    const response = await admin.messaging().send(message);
    logger.debug('Push notification sent', { messageId: response, token: fcmToken.substring(0, 10) });
    return true;
  } catch (error: any) {
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      logger.warn('Invalid FCM token — should be removed', { token: fcmToken.substring(0, 10) });
    } else {
      logger.error('Push notification failed', { error: error.message });
    }
    return false;
  }
}

export async function sendToMultipleDevices(
  fcmTokens: string[],
  payload: PushNotificationPayload,
): Promise<{ successCount: number; failureCount: number }> {
  if (!firebaseApp || !env.FIREBASE || fcmTokens.length === 0) {
    return { successCount: 0, failureCount: fcmTokens.length };
  }

  let successCount = 0;
  let failureCount = 0;

  const chunks = chunkArray(fcmTokens, 500);

  for (const chunk of chunks) {
    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: chunk,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: payload.priority === 'high' ? 'high' : 'normal',
          notification: {
            channelId: payload.channelId || 'spark_messages',
            color: '#1A73E8',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      successCount += response.successCount;
      failureCount += response.failureCount;
    } catch (error: any) {
      failureCount += chunk.length;
      logger.error('Batch push notification failed', { error: error.message });
    }
  }

  return { successCount, failureCount };
}

export async function sendToTopic(
  topic: string,
  payload: PushNotificationPayload,
): Promise<boolean> {
  if (!firebaseApp || !env.FIREBASE) return false;

  try {
    const message: admin.messaging.Message = {
      topic,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data || {},
      android: {
        priority: 'normal',
        notification: {
          channelId: payload.channelId || 'spark_general',
          color: '#1A73E8',
        },
      },
    };

    await admin.messaging().send(message);
    return true;
  } catch (error: any) {
    logger.error('Topic push notification failed', { topic, error: error.message });
    return false;
  }
}

export function getMessaging(): admin.messaging.Messaging | null {
  if (!firebaseApp) return null;
  return admin.messaging();
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}