/**
 * WhatsApp Service using Z-API
 * Documentation: https://developer.z-api.io/en/
 */

import fs from 'fs';
import path from 'path';

interface SendMessageResponse {
  success: boolean;
  zaapId?: string;
  messageId?: string;
  error?: string;
}

interface ZApiSendTextResponse {
  zaapId?: string;
  messageId?: string;
  error?: string;
  message?: string;
}

interface ZApiStatusResponse {
  connected?: boolean;
  phone?: string;
  error?: string;
}

interface RequestNotification {
  type: 'MATERIAL' | 'HELP' | 'PROJECT_TRANSFER';
  userName: string;
  userPhone?: string;
  projectName?: string;
  materialName?: string;
  quantity?: string;
  description?: string;
  // Fields for media and transcription
  audioTranscription?: string;
  audioFilePath?: string;  // Local file path for Base64 conversion (deprecated)
  videoFilePath?: string;  // Local file path for Base64 conversion (deprecated)
  // Buffer-based media (for multer memory storage)
  videoBuffer?: Buffer;
  videoMimetype?: string;
}

interface EntryRequestParams {
  projectName: string;
  projectAddress: string;
  responsiblePhones: string[];
  applicators: {
    name: string;
    cpf: string;
    phone?: string;
    role: string;
  }[];
}

// Z-API Configuration
const ZAPI_INSTANCE = process.env.ZAPI_INSTANCE_ID || '';
const ZAPI_TOKEN = process.env.ZAPI_TOKEN || '';
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN || '';
const ZAPI_BASE_URL = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}`;

// Notification phones (comma-separated in env, or defaults)
const NOTIFICATION_PHONES = (process.env.WHATSAPP_NOTIFICATION_PHONES || '5541988484477,5541997980099')
  .split(',')
  .map(phone => phone.trim())
  .filter(phone => phone.length > 0);

/**
 * Get MIME type from file extension
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.webm': 'audio/webm',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Convert file to Base64 data URL
 */
function fileToBase64(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`[WhatsApp] File not found: ${filePath}`);
      return null;
    }
    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = getMimeType(filePath);
    const base64 = fileBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`[WhatsApp] Error converting file to Base64:`, error);
    return null;
  }
}

/**
 * Send a text message via Z-API
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<SendMessageResponse> {
  if (!ZAPI_INSTANCE || !ZAPI_TOKEN) {
    console.warn('[WhatsApp] Z-API not configured. Skipping message.');
    return { success: false, error: 'Z-API not configured' };
  }

  const formattedPhone = phone.replace(/\D/g, '');

  try {
    const response = await fetch(`${ZAPI_BASE_URL}/send-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ZAPI_CLIENT_TOKEN ? { 'Client-Token': ZAPI_CLIENT_TOKEN } : {}),
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message,
      }),
    });

    const data: ZApiSendTextResponse = await response.json();

    if (response.ok) {
      console.log(`[WhatsApp] Message sent successfully to ${formattedPhone}`);
      return {
        success: true,
        zaapId: data.zaapId,
        messageId: data.messageId,
      };
    } else {
      console.error('[WhatsApp] Failed to send message:', data);
      return {
        success: false,
        error: data.error || data.message || 'Unknown error',
      };
    }
  } catch (error) {
    console.error('[WhatsApp] Error sending message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Send an audio message via Z-API (supports URL or Base64)
 */
export async function sendWhatsAppAudio(
  phone: string,
  audioData: string  // Can be URL or Base64 data URL
): Promise<SendMessageResponse> {
  if (!ZAPI_INSTANCE || !ZAPI_TOKEN) {
    console.warn('[WhatsApp] Z-API not configured. Skipping audio.');
    return { success: false, error: 'Z-API not configured' };
  }

  const formattedPhone = phone.replace(/\D/g, '');

  try {
    const response = await fetch(`${ZAPI_BASE_URL}/send-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ZAPI_CLIENT_TOKEN ? { 'Client-Token': ZAPI_CLIENT_TOKEN } : {}),
      },
      body: JSON.stringify({
        phone: formattedPhone,
        audio: audioData,
        waveform: true,
      }),
    });

    const data: ZApiSendTextResponse = await response.json();

    if (response.ok) {
      console.log(`[WhatsApp] Audio sent successfully to ${formattedPhone}`);
      return {
        success: true,
        zaapId: data.zaapId,
        messageId: data.messageId,
      };
    } else {
      console.error('[WhatsApp] Failed to send audio:', data);
      return {
        success: false,
        error: data.error || data.message || 'Unknown error',
      };
    }
  } catch (error) {
    console.error('[WhatsApp] Error sending audio:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Send a video message via Z-API (supports URL or Base64)
 */
export async function sendWhatsAppVideo(
  phone: string,
  videoData: string,  // Can be URL or Base64 data URL
  caption?: string
): Promise<SendMessageResponse> {
  if (!ZAPI_INSTANCE || !ZAPI_TOKEN) {
    console.warn('[WhatsApp] Z-API not configured. Skipping video.');
    return { success: false, error: 'Z-API not configured' };
  }

  const formattedPhone = phone.replace(/\D/g, '');

  try {
    const response = await fetch(`${ZAPI_BASE_URL}/send-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ZAPI_CLIENT_TOKEN ? { 'Client-Token': ZAPI_CLIENT_TOKEN } : {}),
      },
      body: JSON.stringify({
        phone: formattedPhone,
        video: videoData,
        caption: caption || '',
      }),
    });

    const data: ZApiSendTextResponse = await response.json();

    if (response.ok) {
      console.log(`[WhatsApp] Video sent successfully to ${formattedPhone}`);
      return {
        success: true,
        zaapId: data.zaapId,
        messageId: data.messageId,
      };
    } else {
      console.error('[WhatsApp] Failed to send video:', data);
      return {
        success: false,
        error: data.error || data.message || 'Unknown error',
      };
    }
  } catch (error) {
    console.error('[WhatsApp] Error sending video:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Format and send a request notification (Material, Help, or Project Transfer)
 * Includes transcription in message and sends media files as Base64
 */
export async function sendRequestNotification(
  notification: RequestNotification
): Promise<SendMessageResponse> {
  let message = '';
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  switch (notification.type) {
    case 'MATERIAL':
      message = `📦 *SOLICITAÇÃO DE MATERIAL*\n\n`;
      message += `👤 *Solicitante:* ${notification.userName}\n`;
      if (notification.userPhone) {
        message += `📱 *Telefone:* ${notification.userPhone}\n`;
      }
      if (notification.projectName) {
        message += `🏗️ *Projeto:* ${notification.projectName}\n`;
      }
      message += `\n📋 *Material:* ${notification.materialName || 'Não especificado'}\n`;
      if (notification.quantity) {
        message += `📊 *Quantidade:* ${notification.quantity}\n`;
      }
      if (notification.description) {
        message += `\n💬 *Observação:* ${notification.description}\n`;
      }
      if (notification.audioTranscription) {
        message += `\n🎙️ *Transcrição do áudio:*\n_"${notification.audioTranscription}"_\n`;
      }
      message += `\n⏰ ${timestamp}`;
      break;

    case 'HELP':
      message = `🆘 *SOLICITAÇÃO DE AJUDA*\n\n`;
      message += `👤 *Solicitante:* ${notification.userName}\n`;
      if (notification.userPhone) {
        message += `📱 *Telefone:* ${notification.userPhone}\n`;
      }
      if (notification.projectName) {
        message += `🏗️ *Projeto:* ${notification.projectName}\n`;
      }
      message += `\n💬 *Descrição:* ${notification.description || 'Não especificado'}\n`;
      if (notification.audioTranscription) {
        message += `\n🎙️ *Transcrição do áudio:*\n_"${notification.audioTranscription}"_\n`;
      }
      message += `\n⏰ ${timestamp}`;
      break;

    case 'PROJECT_TRANSFER':
      message = `🔄 *SOLICITAÇÃO DE TROCA DE PROJETO*\n\n`;
      message += `👤 *Solicitante:* ${notification.userName}\n`;
      if (notification.userPhone) {
        message += `📱 *Telefone:* ${notification.userPhone}\n`;
      }
      message += `🏗️ *Projeto desejado:* ${notification.projectName || 'Não especificado'}\n`;
      if (notification.description) {
        message += `\n💬 *Motivo:* ${notification.description}\n`;
      }
      message += `\n⏰ ${timestamp}`;
      break;
  }

  // Send to all notification phones
  console.log(`[WhatsApp] Sending notification to ${NOTIFICATION_PHONES.length} phone(s): ${NOTIFICATION_PHONES.join(', ')}`);

  const results: SendMessageResponse[] = [];

  for (const phone of NOTIFICATION_PHONES) {
    // Send main text message (includes audio transcription)
    const textResult = await sendWhatsAppMessage(phone, message);
    results.push(textResult);

    // Audio is NOT sent as file - only transcription is included in the text message above
    // This is intentional: audio content is transcribed and sent as text

    // Send video as Base64 if available (buffer or file path)
    let videoBase64: string | null = null;

    // Prefer buffer (from multer memory storage) over file path
    if (notification.videoBuffer && notification.videoMimetype) {
      const base64Data = notification.videoBuffer.toString('base64');
      videoBase64 = `data:${notification.videoMimetype};base64,${base64Data}`;
      console.log(`[WhatsApp] Converted video buffer to Base64 (${notification.videoMimetype})`);
    } else if (notification.videoFilePath) {
      // Fallback to file path (deprecated)
      videoBase64 = fileToBase64(notification.videoFilePath);
    }

    if (videoBase64) {
      console.log(`[WhatsApp] Sending video as Base64 to ${phone}`);
      sendWhatsAppVideo(phone, videoBase64, `📹 Vídeo de ${notification.userName}`).catch((err) => {
        console.error(`[WhatsApp] Failed to send video to ${phone}:`, err);
      });
    }
  }

  // Return first result (for backwards compatibility)
  return results[0] || { success: false, error: 'No phones configured' };
}

/**
 * Send entry request to responsible phones (for building access)
 */
export async function sendEntryRequest(
  params: EntryRequestParams
): Promise<{ success: boolean; sentTo: string[]; failed: string[] }> {
  const { projectName, projectAddress, responsiblePhones, applicators } = params;
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  // Build message
  let message = `🏗️ *SOLICITAÇÃO DE LIBERAÇÃO NA PORTARIA*\n\n`;
  message += `📍 *Projeto:* ${projectName}\n`;
  message += `📌 *Endereço:* ${projectAddress}\n\n`;
  message += `👷 *Equipe para liberar acesso:*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;

  for (const applicator of applicators) {
    message += `\n👤 *Nome:* ${applicator.name}\n`;
    message += `📄 *CPF:* ${applicator.cpf}\n`;
    if (applicator.phone) {
      message += `📱 *Telefone:* ${applicator.phone}\n`;
    }
    message += `───────────────────────\n`;
  }

  message += `\n⏰ *Solicitado em:* ${timestamp}`;
  message += `\n\n_Mensagem enviada pelo sistema Monofloor Equipes_`;

  console.log(`[WhatsApp] Sending entry request to ${responsiblePhones.length} phone(s)`);

  const sentTo: string[] = [];
  const failed: string[] = [];

  for (const phone of responsiblePhones) {
    const result = await sendWhatsAppMessage(phone, message);
    if (result.success) {
      sentTo.push(phone);
    } else {
      failed.push(phone);
    }
  }

  return {
    success: sentTo.length > 0,
    sentTo,
    failed,
  };
}

/**
 * Send a document (PDF) via Z-API
 */
export async function sendWhatsAppDocument(
  phone: string,
  documentBase64: string,  // Base64 encoded document (without data: prefix) or data URL
  fileName: string,
  caption?: string
): Promise<SendMessageResponse> {
  if (!ZAPI_INSTANCE || !ZAPI_TOKEN) {
    console.warn('[WhatsApp] Z-API not configured. Skipping document.');
    return { success: false, error: 'Z-API not configured' };
  }

  const formattedPhone = phone.replace(/\D/g, '');

  // Ensure we have a proper data URL for PDF
  let documentData = documentBase64;
  if (!documentBase64.startsWith('data:')) {
    documentData = `data:application/pdf;base64,${documentBase64}`;
  }

  try {
    console.log(`[WhatsApp] Sending document "${fileName}" to ${formattedPhone}`);

    const response = await fetch(`${ZAPI_BASE_URL}/send-document/pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ZAPI_CLIENT_TOKEN ? { 'Client-Token': ZAPI_CLIENT_TOKEN } : {}),
      },
      body: JSON.stringify({
        phone: formattedPhone,
        document: documentData,
        fileName: fileName,
        caption: caption || '',
      }),
    });

    const data: ZApiSendTextResponse = await response.json();

    if (response.ok) {
      console.log(`[WhatsApp] Document sent successfully to ${formattedPhone}`);
      return {
        success: true,
        zaapId: data.zaapId,
        messageId: data.messageId,
      };
    } else {
      console.error('[WhatsApp] Failed to send document:', data);
      return {
        success: false,
        error: data.error || data.message || 'Unknown error',
      };
    }
  } catch (error) {
    console.error('[WhatsApp] Error sending document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Check if Z-API is properly configured
 */
export function isWhatsAppConfigured(): boolean {
  return !!(ZAPI_INSTANCE && ZAPI_TOKEN);
}

/**
 * Get Z-API connection status
 */
export async function getWhatsAppStatus(): Promise<{ connected: boolean; phone?: string; error?: string }> {
  if (!isWhatsAppConfigured()) {
    return { connected: false, error: 'Z-API not configured' };
  }

  try {
    const response = await fetch(`${ZAPI_BASE_URL}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(ZAPI_CLIENT_TOKEN ? { 'Client-Token': ZAPI_CLIENT_TOKEN } : {}),
      },
    });

    const data: ZApiStatusResponse = await response.json();

    if (response.ok && data.connected) {
      return { connected: true, phone: data.phone };
    } else {
      return { connected: false, error: data.error || 'Not connected' };
    }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
