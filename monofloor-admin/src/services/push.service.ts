/**
 * Push Notification Service
 * Handles Web Push notifications to mobile users
 */

import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// VAPID keys for Web Push
// Generate new keys with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@monofloor.com.br';

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log('[Push] VAPID configured successfully');
} else {
  console.warn('[Push] VAPID keys not configured - push notifications will not work');
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: { action: string; title: string }[];
  requireInteraction?: boolean;
}

/**
 * Save or update push subscription for a user
 */
export async function savePushSubscription(
  userId: string,
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  userAgent?: string
): Promise<boolean> {
  try {
    // Detect device type from user agent
    let deviceType = 'unknown';
    if (userAgent) {
      if (/android/i.test(userAgent)) deviceType = 'android';
      else if (/iphone|ipad|ipod/i.test(userAgent)) deviceType = 'ios';
      else if (/windows/i.test(userAgent)) deviceType = 'windows';
      else if (/mac/i.test(userAgent)) deviceType = 'mac';
      else if (/linux/i.test(userAgent)) deviceType = 'linux';
    }

    // Upsert subscription (update if endpoint exists, create if not)
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
        deviceType,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
        deviceType,
        isActive: true,
      },
    });

    console.log(`[Push] Subscription saved for user ${userId}`);
    return true;
  } catch (error) {
    console.error('[Push] Error saving subscription:', error);
    return false;
  }
}

/**
 * Remove push subscription
 */
export async function removePushSubscription(endpoint: string): Promise<boolean> {
  try {
    await prisma.pushSubscription.delete({
      where: { endpoint },
    });
    console.log('[Push] Subscription removed');
    return true;
  } catch (error) {
    console.error('[Push] Error removing subscription:', error);
    return false;
  }
}

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  try {
    // Get all active subscriptions for this user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (subscriptions.length === 0) {
      console.log(`[Push] No active subscriptions for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload),
          {
            TTL: 3600, // Time to live: 1 hour
            urgency: 'high',
          }
        );

        sent++;
        console.log(`[Push] Notification sent to ${sub.endpoint.substring(0, 50)}...`);
      } catch (error: any) {
        failed++;
        console.error(`[Push] Failed to send to ${sub.endpoint.substring(0, 50)}:`, error.message);

        // If subscription is expired or invalid, mark as inactive
        if (error.statusCode === 410 || error.statusCode === 404) {
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: { isActive: false },
          });
          console.log(`[Push] Marked subscription as inactive: ${sub.id}`);
        }
      }
    }

    return { sent, failed };
  } catch (error) {
    console.error('[Push] Error sending push to user:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Send role evolution push notification
 */
export async function sendRoleEvolutionPush(
  userId: string,
  oldRole: string,
  newRole: string
): Promise<void> {
  const roleNames: Record<string, string> = {
    AUXILIAR: 'Auxiliar',
    PREPARADOR: 'Preparador',
    LIDER_PREPARACAO: 'Lider da Preparacao',
    APLICADOR_I: 'Aplicador I',
    APLICADOR_II: 'Aplicador II',
    APLICADOR_III: 'Aplicador III',
    LIDER: 'Lider',
  };

  const payload: PushPayload = {
    title: 'Parabens! Voce evoluiu!',
    body: `Voce passou de ${roleNames[oldRole] || oldRole} para ${roleNames[newRole] || newRole}!`,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'role-evolution',
    data: {
      type: 'role:evolution',
      oldRole,
      newRole,
      url: '/#profile',
    },
    requireInteraction: true,
  };

  const result = await sendPushToUser(userId, payload);
  console.log(`[Push] Role evolution notification: sent=${result.sent}, failed=${result.failed}`);
}

/**
 * Send checkin/checkout reminder push notification
 */
export async function sendCheckinReminderPush(
  userId: string,
  type: 'checkin' | 'checkout',
  projectName: string
): Promise<void> {
  const payload: PushPayload = {
    title: type === 'checkin' ? 'Hora de fazer check-in!' : 'Nao esqueca do checkout!',
    body: type === 'checkin'
      ? `Voce esta proximo do projeto ${projectName}. Faca seu check-in!`
      : `Lembre-se de fazer checkout do projeto ${projectName}`,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: `${type}-reminder`,
    data: {
      type: `${type}:reminder`,
      projectName,
    },
  };

  await sendPushToUser(userId, payload);
}

/**
 * Send lunch reminder push notification
 */
export async function sendLunchReminderPush(
  userId: string,
  reminderNumber: number
): Promise<void> {
  const messages = [
    'Esta na hora de fazer uma pausa para o almoco.',
    'Lembrete: voce ainda nao fez pausa para o almoco!',
    'Ultimo lembrete: o horario de almoco esta acabando!',
  ];

  const payload: PushPayload = {
    title: 'Hora do Almoco!',
    body: messages[reminderNumber - 1] || messages[0],
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'lunch-reminder',
    data: {
      type: 'lunch:reminder',
      reminderNumber,
    },
  };

  await sendPushToUser(userId, payload);
}

/**
 * Send contribution approved/rejected push notification
 */
export async function sendContributionResultPush(
  userId: string,
  type: 'approved' | 'rejected',
  requestType: string
): Promise<void> {
  const payload: PushPayload = {
    title: type === 'approved' ? 'Solicitacao Aprovada!' : 'Solicitacao Rejeitada',
    body: type === 'approved'
      ? `Sua solicitacao de ${requestType} foi aprovada!`
      : `Sua solicitacao de ${requestType} foi rejeitada. Verifique os detalhes no app.`,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'contribution-result',
    data: {
      type: `contribution:${type}`,
      requestType,
    },
  };

  await sendPushToUser(userId, payload);
}

/**
 * Send report reminder push notification
 */
export async function sendReportReminderPush(
  userId: string,
  projectName: string,
  reminderNumber: number,
  reminderId: string
): Promise<{ sent: number; failed: number }> {
  const messages = [
    'Nao esqueca de enviar seu relatorio do dia!',
    'Lembrete: seu relatorio ainda nao foi enviado.',
    'ULTIMO AVISO: envie seu relatorio agora ou -7000 XP!',
  ];

  const payload: PushPayload = {
    title: `Relatorio Pendente (${reminderNumber} de 3)`,
    body: `${projectName}: ${messages[reminderNumber - 1] || messages[0]}`,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: `report-reminder-${reminderId}`,
    requireInteraction: reminderNumber === 3, // Last reminder requires interaction
    data: {
      type: 'report:reminder',
      reminderId,
      reminderNumber,
      url: '/#report',
    },
    actions: [
      { action: 'send', title: 'Enviar Agora' },
      { action: 'dismiss', title: reminderNumber < 3 ? 'Depois' : 'Ignorar (-7000 XP)' },
    ],
  };

  return await sendPushToUser(userId, payload);
}

/**
 * Send XP penalty push notification
 * Sent when a user loses XP due to not submitting a report
 */
export async function sendXPPenaltyPush(
  userId: string,
  xpAmount: number,
  projectName: string,
  reason: string
): Promise<{ sent: number; failed: number }> {
  const payload: PushPayload = {
    title: 'XP Perdido!',
    body: `${projectName}: -${xpAmount} XP - ${reason}`,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'xp-penalty',
    requireInteraction: true,
    data: {
      type: 'xp:penalty',
      amount: -xpAmount,
      projectName,
      reason,
      url: '/#profile',
    },
  };

  return await sendPushToUser(userId, payload);
}

/**
 * Get VAPID public key (for client-side subscription)
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}
