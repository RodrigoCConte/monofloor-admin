import express from 'express';
import { generateProposal, compressPDF } from '../services/google-slides.service';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';
import { UAParser } from 'ua-parser-js';
import {
  emitProposalOpened,
  emitProposalViewing,
  emitProposalClosed
} from '../services/socket.service';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

const router = express.Router();
const prisma = new PrismaClient();

// Cache para rastrear sessões ativas (para detectar quando fechar)
const activeSessions = new Map<string, {
  propostaId: string;
  leadId: string;
  clientName: string;
  ownerUserName: string;
  lastUpdate: number;
  timeOnPage: number;
  scrollDepth: number;
}>();

// Limpar sessões inativas a cada 2 minutos
setInterval(() => {
  const now = Date.now();
  const timeout = 60000; // 60 segundos sem update = fechou

  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastUpdate > timeout) {
      // Emitir evento de fechamento
      emitProposalClosed({
        propostaId: session.propostaId,
        leadId: session.leadId,
        clientName: session.clientName,
        ownerUserName: session.ownerUserName,
        sessionId,
        totalTimeOnPage: session.timeOnPage,
        maxScrollDepth: session.scrollDepth,
        timestamp: new Date()
      });
      activeSessions.delete(sessionId);
    }
  }
}, 120000); // A cada 2 minutos

// Gerar slug amigável para a proposta (ex: 2026/Proposta_Alicia)
function generateFriendlySlug(clienteName: string): string {
  const year = new Date().getFullYear();

  // Limpar nome do cliente para usar na URL
  const cleanName = clienteName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove caracteres especiais
    .trim()
    .split(/\s+/) // Divide por espaços
    .slice(0, 2) // Pega no máximo 2 palavras
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('_');

  // Adiciona um ID curto para garantir unicidade
  const shortId = crypto.randomBytes(3).toString('hex'); // 6 caracteres

  return `${year}/Proposta_${cleanName}_${shortId}`;
}

// Detectar tipo de dispositivo
function getDeviceType(userAgent: string): string {
  const parser = new UAParser(userAgent);
  const device = parser.getDevice();
  if (device.type === 'mobile') return 'mobile';
  if (device.type === 'tablet') return 'tablet';
  return 'desktop';
}

// Detectar se é bot
function isBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
    /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
    /whatsapp/i, /telegrambot/i
  ];
  return botPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * POST /api/proposals/generate
 * Gera proposta em PDF a partir dos dados do formulário
 */
router.post('/generate', async (req, res) => {
  try {
    console.log('📊 Gerando proposta...');
    console.log('📊 SUPERFÍCIES RECEBIDAS:', {
      teto: req.body.teto,
      bancadas: req.body.bancadas,
      escadas: req.body.escadas,
      especiaisPequenos: req.body.especiaisPequenos,
      especiaisGrandes: req.body.especiaisGrandes,
      piscina: req.body.piscina,
    });

    const {
      // STELION
      metragemTotalStelion,
      materiaisStelion,
      maoObraStelion,
      impostosStelion,
      valorTotalStelion,

      // LILIT
      metragemTotalLilit,
      materiaisLilit,
      maoObraLilit,
      impostosLilit,
      valorTotalLilit,

      // TOTAIS
      metragemTotal,
      materiaisTotal,
      maoObraTotal,
      impostosTotal,
      valorTotal,

      precoBaseStelion,
      precoBaseLilit,

      // SUPERFÍCIES
      pisoStelion,
      paredeStelion,
      pisoLilit,
      paredeLilit,

      // SUPERFÍCIES DETALHADAS
      teto,
      bancadas,
      escadas,
      especiaisPequenos,
      especiaisGrandes,
      piscina,

      // DADOS DO CLIENTE (para overlay na página de info)
      clienteNome,
      clienteLocal,
      clienteDetalhes,
      areaTotalInterna,
    } = req.body;

    // Validações básicas
    if (valorTotal === undefined || metragemTotal === undefined) {
      return res.status(400).json({
        error: 'Dados incompletos. Verifique os valores calculados.',
      });
    }

    // Gerar PDF
    const pdfBuffer = await generateProposal({
      metragemTotalStelion: parseFloat(metragemTotalStelion) || 0,
      materiaisStelion: parseFloat(materiaisStelion) || 0,
      maoObraStelion: parseFloat(maoObraStelion) || 0,
      impostosStelion: parseFloat(impostosStelion) || 0,
      valorTotalStelion: parseFloat(valorTotalStelion) || 0,

      metragemTotalLilit: parseFloat(metragemTotalLilit) || 0,
      materiaisLilit: parseFloat(materiaisLilit) || 0,
      maoObraLilit: parseFloat(maoObraLilit) || 0,
      impostosLilit: parseFloat(impostosLilit) || 0,
      valorTotalLilit: parseFloat(valorTotalLilit) || 0,

      metragemTotal: parseFloat(metragemTotal) || 0,
      materiaisTotal: parseFloat(materiaisTotal) || 0,
      maoObraTotal: parseFloat(maoObraTotal) || 0,
      impostosTotal: parseFloat(impostosTotal) || 0,
      valorTotal: parseFloat(valorTotal) || 0,

      precoBaseStelion: parseFloat(precoBaseStelion) || 910,
      precoBaseLilit: parseFloat(precoBaseLilit) || 590,

      // SUPERFÍCIES
      pisoStelion: parseFloat(pisoStelion) || 0,
      paredeStelion: parseFloat(paredeStelion) || 0,
      pisoLilit: parseFloat(pisoLilit) || 0,
      paredeLilit: parseFloat(paredeLilit) || 0,

      // SUPERFÍCIES DETALHADAS
      teto: parseFloat(teto) || 0,
      bancadas: parseFloat(bancadas) || 0,
      escadas: parseFloat(escadas) || 0,
      especiaisPequenos: parseFloat(especiaisPequenos) || 0,
      especiaisGrandes: parseFloat(especiaisGrandes) || 0,
      piscina: parseFloat(piscina) || 0,

      // DADOS DO CLIENTE (para overlay na página de info)
      clienteNome: clienteNome || '',
      clienteLocal: clienteLocal || '',
      clienteDetalhes: clienteDetalhes || '',
      areaTotalInterna: parseFloat(areaTotalInterna) || 0,
    });

    // Comprimir PDF
    const compressedPDF = await compressPDF(pdfBuffer);

    // Gerar nome do arquivo
    const filename = `Proposta-Monofloor-${Date.now()}.pdf`;

    // Enviar PDF como download (binário)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', compressedPDF.length);

    // IMPORTANTE: usar res.end() para dados binários, não res.send()
    res.end(compressedPDF, 'binary');

    console.log('✅ Proposta gerada com sucesso:', filename);

  } catch (error: any) {
    console.error('❌ Erro ao gerar proposta:', error);
    res.status(500).json({
      error: 'Erro ao gerar proposta',
      message: error.message,
    });
  }
});

/**
 * Converte PDF para imagens
 */
async function convertPdfToImages(pdfBuffer: Buffer): Promise<string[]> {
  const { pdf } = await import('pdf-to-img');
  const sharp = (await import('sharp')).default;
  const images: string[] = [];

  // Scale 1.0 = tamanho original, qualidade JPEG 75% para reduzir tamanho
  const document = await pdf(pdfBuffer, { scale: 1.0 });

  for await (const pngImage of document) {
    // Converter PNG para JPEG com qualidade 75% (muito menor que PNG)
    const jpegBuffer = await sharp(pngImage)
      .jpeg({ quality: 75, mozjpeg: true })
      .toBuffer();

    const base64 = jpegBuffer.toString('base64');
    images.push(`data:image/jpeg;base64,${base64}`);
  }
  return images;
}

/**
 * POST /api/proposals/generate-html
 * Gera link público para a proposta com imagens pré-convertidas
 * Converte PDF para imagens NO MOMENTO DA GERAÇÃO (admin espera, cliente carrega rápido)
 */
router.post('/generate-html', async (req, res) => {
  try {
    const { propostaId } = req.body;

    if (!propostaId) {
      return res.status(400).json({ error: 'propostaId é obrigatório' });
    }

    // Verificar se proposta existe e tem PDF
    const proposta = await prisma.proposta.findUnique({
      where: { id: propostaId },
      select: {
        id: true,
        htmlSlug: true,
        pdfBase64: true,
        comercial: {
          select: { personName: true }
        }
      }
    });

    if (!proposta) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }

    if (!proposta.pdfBase64) {
      return res.status(400).json({ error: 'Proposta não possui PDF. Gere o PDF primeiro.' });
    }

    // Sempre gerar novo slug amigável com nome do cliente
    const clienteName = proposta.comercial?.personName || 'Cliente';
    const slug = generateFriendlySlug(clienteName);

    console.log(`📸 Convertendo PDF para imagens (proposta ${propostaId})...`);

    // Converter PDF para imagens AGORA (admin espera, cliente carrega rápido)
    const pdfBuffer = Buffer.from(proposta.pdfBase64, 'base64');
    const images = await convertPdfToImages(pdfBuffer);

    console.log(`✅ PDF convertido para ${images.length} imagem(s)`);

    // Salvar slug e imagens no banco (em campo JSON)
    await prisma.proposta.update({
      where: { id: propostaId },
      data: {
        htmlSlug: slug,
        htmlGeradoEm: new Date(),
        htmlImages: JSON.stringify(images) // Salva array de imagens base64
      }
    });

    // URL do serviço de propostas
    const baseUrl = 'https://propostas.monofloor.cloud';
    const publicUrl = `${baseUrl}/p/${slug}`;

    console.log(`✅ Link gerado para proposta ${propostaId}: ${publicUrl}`);

    res.json({
      success: true,
      slug,
      url: publicUrl,
      pageCount: images.length
    });

  } catch (error: any) {
    console.error('❌ Erro ao gerar link:', error);
    res.status(500).json({ error: 'Erro ao gerar link', message: error.message });
  }
});

/**
 * POST /api/proposals/track
 * Registra evento de visualização e emite notificações em tempo real
 */
router.post('/track', async (req, res) => {
  try {
    const { slug, sessionId, timeOnPage, scrollDepth, pageTimes, pagesViewed, currentPage } = req.body;

    // Debug: Log para verificar dados recebidos
    if (pageTimes) {
      console.log('📊 [TRACK] Dados recebidos:', {
        slug,
        sessionId,
        timeOnPage,
        scrollDepth,
        currentPage,
        pageTimes: JSON.stringify(pageTimes),
        pagesViewed
      });
    }

    if (!slug) {
      return res.status(400).json({ error: 'slug é obrigatório' });
    }

    // Buscar proposta com dados do lead
    const proposta = await prisma.proposta.findUnique({
      where: { htmlSlug: slug },
      include: {
        comercial: {
          select: {
            id: true,
            personName: true,
            ownerUserName: true
          }
        }
      }
    });

    if (!proposta) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }

    const userAgent = req.headers['user-agent'] || '';
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
               req.socket.remoteAddress ||
               'unknown';
    const deviceType = getDeviceType(userAgent);
    const clientName = proposta.comercial?.personName || 'Cliente';
    const ownerUserName = proposta.comercial?.ownerUserName || '';
    const leadId = proposta.comercial?.id || '';

    // Se temos sessionId e timeOnPage, é atualização (viewing)
    if (sessionId && (timeOnPage !== undefined || scrollDepth !== undefined)) {
      const time = timeOnPage !== undefined ? parseInt(timeOnPage) : 0;
      const scroll = scrollDepth !== undefined ? parseInt(scrollDepth) : 0;

      // Atualizar registro existente
      const existingView = await prisma.propostaView.findFirst({
        where: { sessionId },
        orderBy: { viewedAt: 'desc' }
      });

      if (existingView) {
        const updateData = {
          timeOnPage: time,
          scrollDepth: scroll,
          pageTimes: pageTimes || undefined,
          pagesViewed: pagesViewed || undefined,
          currentPage: currentPage ? parseInt(currentPage) : undefined
        };

        console.log('📊 [TRACK] Atualizando view:', existingView.id, 'com pageTimes:', pageTimes ? 'SIM' : 'NAO');

        await prisma.propostaView.update({
          where: { id: existingView.id },
          data: updateData
        });

        // Atualizar sessão ativa e emitir evento de viewing
        if (activeSessions.has(sessionId)) {
          const session = activeSessions.get(sessionId)!;
          session.lastUpdate = Date.now();
          session.timeOnPage = time;
          session.scrollDepth = scroll;

          // Emitir evento de viewing a cada 10 segundos
          if (time % 10 === 0) {
            emitProposalViewing({
              propostaId: proposta.id,
              leadId,
              clientName,
              ownerUserName,
              sessionId,
              timeOnPage: time,
              scrollDepth: scroll,
              timestamp: new Date()
            });
          }
        }

        return res.json({ success: true, updated: true });
      }
    }

    // Criar novo registro de visualização (proposta foi aberta)
    const newSessionId = sessionId || crypto.randomBytes(16).toString('hex');

    // Ignorar bots para notificações
    if (!isBot(userAgent)) {
      // Adicionar à lista de sessões ativas
      activeSessions.set(newSessionId, {
        propostaId: proposta.id,
        leadId,
        clientName,
        ownerUserName,
        lastUpdate: Date.now(),
        timeOnPage: 0,
        scrollDepth: 0
      });

      // Emitir evento de proposta aberta
      emitProposalOpened({
        propostaId: proposta.id,
        leadId,
        clientName,
        ownerUserName,
        sessionId: newSessionId,
        deviceType,
        timestamp: new Date()
      });
    }

    await prisma.propostaView.create({
      data: {
        propostaId: proposta.id,
        ip,
        userAgent,
        deviceType,
        isBot: isBot(userAgent),
        sessionId: newSessionId,
        timeOnPage: timeOnPage !== undefined ? parseInt(timeOnPage) : 0,
        scrollDepth: scrollDepth !== undefined ? parseInt(scrollDepth) : 0
      }
    });

    res.json({ success: true, sessionId: newSessionId });

  } catch (error: any) {
    console.error('❌ Erro ao registrar tracking:', error);
    res.status(500).json({ error: 'Erro ao registrar tracking' });
  }
});

/**
 * GET /api/proposals/:id/analytics
 * Retorna analytics de visualização da proposta
 */
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;

    const proposta = await prisma.proposta.findUnique({
      where: { id },
      select: {
        id: true,
        htmlSlug: true,
        htmlGeradoEm: true,
        comercial: {
          select: {
            personName: true
          }
        }
      }
    });

    if (!proposta) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }

    if (!proposta.htmlSlug) {
      return res.json({
        proposta,
        views: [],
        stats: null,
        message: 'Proposta não possui versão HTML'
      });
    }

    // Buscar todas as visualizações
    const views = await prisma.propostaView.findMany({
      where: { propostaId: id },
      orderBy: { viewedAt: 'desc' }
    });

    // Debug: Verificar se pageTimes está presente nas views
    if (views.length > 0) {
      const viewWithPageTimes = views.find(v => v.pageTimes);
      console.log('📊 [ANALYTICS] Views encontradas:', views.length, 'Com pageTimes:', viewWithPageTimes ? 'SIM' : 'NAO');
      if (viewWithPageTimes) {
        console.log('📊 [ANALYTICS] Exemplo pageTimes:', JSON.stringify(viewWithPageTimes.pageTimes));
      }
    }

    // Calcular estatísticas
    const humanViews = views.filter(v => !v.isBot);
    const uniqueIps = new Set(humanViews.map(v => v.ip)).size;
    const avgTimeOnPage = humanViews.length > 0
      ? Math.round(humanViews.reduce((acc, v) => acc + (v.timeOnPage || 0), 0) / humanViews.length)
      : 0;
    const maxScrollDepth = humanViews.length > 0
      ? Math.max(...humanViews.map(v => v.scrollDepth || 0))
      : 0;

    const stats = {
      totalViews: views.length,
      humanViews: humanViews.length,
      botViews: views.length - humanViews.length,
      uniqueVisitors: uniqueIps,
      avgTimeOnPage,
      maxScrollDepth,
      deviceBreakdown: {
        desktop: humanViews.filter(v => v.deviceType === 'desktop').length,
        mobile: humanViews.filter(v => v.deviceType === 'mobile').length,
        tablet: humanViews.filter(v => v.deviceType === 'tablet').length
      },
      firstView: views[views.length - 1]?.viewedAt || null,
      lastView: views[0]?.viewedAt || null
    };

    const baseUrl = process.env.BASE_URL || 'https://devoted-wholeness-production.up.railway.app';

    res.json({
      proposta: {
        ...proposta,
        publicUrl: `${baseUrl}/p/${proposta.htmlSlug}`
      },
      views: views.slice(0, 50), // Últimas 50 visualizações
      stats
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar analytics:', error);
    res.status(500).json({ error: 'Erro ao buscar analytics' });
  }
});

/**
 * POST /api/proposals/recording
 * Salva gravação de sessão (rrweb events) - comprimido
 */
router.post('/recording', async (req, res) => {
  try {
    const {
      slug,
      sessionId,
      events, // Array de eventos rrweb
      deviceType,
      screenWidth,
      screenHeight,
      duration
    } = req.body;

    // Log para debug
    const eventTypes = events?.map((e: any) => e.type) || [];
    const hasFullSnapshot = eventTypes.includes(2);
    console.log(`[Recording] Session: ${sessionId?.substring(0, 8)}... | Events: ${events?.length || 0} | Types: ${eventTypes.slice(0, 10).join(',')} | HasFullSnapshot: ${hasFullSnapshot}`);

    if (!slug || !sessionId || !events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Buscar proposta pelo slug
    const proposta = await prisma.proposta.findUnique({
      where: { htmlSlug: slug }
    });

    if (!proposta) {
      return res.status(404).json({ error: 'Proposta não encontrada' });
    }

    // Comprimir eventos com gzip
    const eventsJson = JSON.stringify(events);
    const compressedBuffer = await gzip(eventsJson);
    const compressedBase64 = compressedBuffer.toString('base64');

    // Data de expiração: 1 semana
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Verificar se já existe recording para esta sessão
    const existingRecording = await prisma.sessionRecording.findFirst({
      where: { sessionId }
    });

    console.log(`[Recording] Session ${sessionId?.substring(0, 8)}... | Existing: ${!!existingRecording} | New events: ${events?.length}`);

    if (existingRecording) {
      // Atualizar recording existente (append events)
      console.log(`[Recording] UPDATING existing recording with ${existingRecording.eventsCount} events`);
      // Descomprimir eventos existentes
      const existingBuffer = Buffer.from(existingRecording.eventsData, 'base64');
      const existingJson = (await gunzip(existingBuffer)).toString('utf-8');
      const existingEvents = JSON.parse(existingJson);

      // Combinar todos os eventos e ordenar por timestamp
      // O rrweb precisa dos eventos em ordem cronológica
      // Meta e FullSnapshot também têm timestamps e devem estar na ordem correta
      const allEvents = [...existingEvents, ...events].sort((a: any, b: any) =>
        (a.timestamp || 0) - (b.timestamp || 0)
      );

      // Remover duplicatas baseado em timestamp (pode acontecer se o mesmo batch for enviado 2x)
      const seen = new Set<number>();
      const uniqueEvents = allEvents.filter((e: any) => {
        const key = e.timestamp;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Recomprimir
      const newCompressedBuffer = await gzip(JSON.stringify(uniqueEvents));
      const newCompressedBase64 = newCompressedBuffer.toString('base64');

      await prisma.sessionRecording.update({
        where: { id: existingRecording.id },
        data: {
          eventsData: newCompressedBase64,
          eventsCount: uniqueEvents.length,
          endedAt: new Date(),
          duration: duration || Math.round((Date.now() - existingRecording.startedAt.getTime()) / 1000)
        }
      });

      console.log(`[Recording] UPDATED successfully! Total events now: ${uniqueEvents.length}`);
      res.json({ success: true, updated: true, eventsCount: uniqueEvents.length });
    } else {
      // Criar novo recording
      console.log(`[Recording] CREATING new recording with ${events.length} events`);
      await prisma.sessionRecording.create({
        data: {
          propostaId: proposta.id,
          sessionId,
          eventsData: compressedBase64,
          eventsCount: events.length,
          deviceType,
          screenWidth: screenWidth ? parseInt(screenWidth) : null,
          screenHeight: screenHeight ? parseInt(screenHeight) : null,
          duration: duration || 0,
          expiresAt
        }
      });

      res.json({ success: true, created: true, eventsCount: events.length });
    }

  } catch (error: any) {
    console.error('❌ Erro ao salvar recording:', error);
    res.status(500).json({ error: 'Erro ao salvar recording' });
  }
});

/**
 * GET /api/proposals/:id/recordings
 * Retorna lista de gravações de sessão da proposta
 */
router.get('/:id/recordings', async (req, res) => {
  try {
    const { id } = req.params;

    const recordings = await prisma.sessionRecording.findMany({
      where: {
        propostaId: id,
        expiresAt: { gt: new Date() } // Apenas não expirados
      },
      select: {
        id: true,
        sessionId: true,
        startedAt: true,
        endedAt: true,
        duration: true,
        eventsCount: true,
        deviceType: true,
        screenWidth: true,
        screenHeight: true
      },
      orderBy: { startedAt: 'desc' }
    });

    res.json({ recordings });

  } catch (error: any) {
    console.error('❌ Erro ao buscar recordings:', error);
    res.status(500).json({ error: 'Erro ao buscar recordings' });
  }
});

/**
 * GET /api/proposals/recording/:recordingId
 * Retorna uma gravação específica com eventos descomprimidos
 */
router.get('/recording/:recordingId', async (req, res) => {
  try {
    const { recordingId } = req.params;

    const recording = await prisma.sessionRecording.findUnique({
      where: { id: recordingId }
    });

    if (!recording) {
      return res.status(404).json({ error: 'Gravação não encontrada' });
    }

    // Verificar se expirou
    if (recording.expiresAt < new Date()) {
      return res.status(410).json({ error: 'Gravação expirada' });
    }

    // Descomprimir eventos
    const compressedBuffer = Buffer.from(recording.eventsData, 'base64');
    const eventsJson = (await gunzip(compressedBuffer)).toString('utf-8');
    const events = JSON.parse(eventsJson);

    res.json({
      id: recording.id,
      sessionId: recording.sessionId,
      startedAt: recording.startedAt,
      endedAt: recording.endedAt,
      duration: recording.duration,
      eventsCount: recording.eventsCount,
      deviceType: recording.deviceType,
      screenWidth: recording.screenWidth,
      screenHeight: recording.screenHeight,
      events
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar recording:', error);
    res.status(500).json({ error: 'Erro ao buscar recording' });
  }
});

/**
 * DELETE /api/proposals/recordings/cleanup
 * Remove gravações expiradas (chamado por cron job)
 */
router.delete('/recordings/cleanup', async (req, res) => {
  try {
    const result = await prisma.sessionRecording.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    console.log(`🧹 Limpeza: ${result.count} gravações expiradas removidas`);
    res.json({ success: true, deleted: result.count });

  } catch (error: any) {
    console.error('❌ Erro ao limpar recordings:', error);
    res.status(500).json({ error: 'Erro ao limpar recordings' });
  }
});

// Função para gerar HTML da proposta
function generateProposalHTML(data: any): string {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const hasStelion = data.metragemTotalStelion > 0;
  const hasLilit = data.metragemTotalLilit > 0;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta Monofloor - ${data.clienteNome}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #fff;
      padding: 20px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
      padding: 40px 20px;
      background: linear-gradient(135deg, rgba(201, 169, 98, 0.2) 0%, rgba(201, 169, 98, 0.05) 100%);
      border-radius: 20px;
      border: 1px solid rgba(201, 169, 98, 0.3);
    }

    .logo {
      width: 200px;
      margin-bottom: 20px;
    }

    .header h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: #c9a962;
      margin-bottom: 10px;
    }

    .header .cliente {
      font-size: 1.3rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .section {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 24px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .section h2 {
      color: #c9a962;
      font-size: 1.4rem;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }

    .stat-card .label {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 8px;
    }

    .stat-card .value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #fff;
    }

    .stat-card.highlight {
      background: linear-gradient(135deg, rgba(201, 169, 98, 0.3) 0%, rgba(201, 169, 98, 0.1) 100%);
      border: 1px solid rgba(201, 169, 98, 0.4);
    }

    .stat-card.highlight .value {
      color: #c9a962;
    }

    .total-section {
      background: linear-gradient(135deg, #c9a962 0%, #a88b4a 100%);
      color: #1a1a2e;
      text-align: center;
      padding: 40px;
    }

    .total-section h2 {
      color: #1a1a2e;
      margin-bottom: 16px;
    }

    .total-section .total-value {
      font-size: 3rem;
      font-weight: 700;
    }

    .product-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 16px;
    }

    .product-badge.stelion {
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    .product-badge.lilit {
      background: rgba(236, 72, 153, 0.2);
      color: #f472b6;
      border: 1px solid rgba(236, 72, 153, 0.3);
    }

    .footer {
      text-align: center;
      padding: 30px;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9rem;
    }

    .footer a {
      color: #c9a962;
      text-decoration: none;
    }

    @media (max-width: 600px) {
      .header h1 {
        font-size: 1.8rem;
      }
      .total-section .total-value {
        font-size: 2rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://monofloor.cloud/logo-monofloor.png" alt="Monofloor" class="logo" onerror="this.style.display='none'">
      <h1>Proposta Comercial</h1>
      <p class="cliente">${data.clienteNome}</p>
    </div>

    ${hasStelion ? `
    <div class="section">
      <span class="product-badge stelion">STELION</span>
      <h2>Detalhamento STELION</h2>
      <div class="grid">
        <div class="stat-card">
          <div class="label">Metragem</div>
          <div class="value">${formatNumber(data.metragemTotalStelion)} m²</div>
        </div>
        ${data.pisoStelion > 0 ? `
        <div class="stat-card">
          <div class="label">Piso</div>
          <div class="value">${formatNumber(data.pisoStelion)} m²</div>
        </div>
        ` : ''}
        ${data.paredeStelion > 0 ? `
        <div class="stat-card">
          <div class="label">Parede</div>
          <div class="value">${formatNumber(data.paredeStelion)} m²</div>
        </div>
        ` : ''}
        <div class="stat-card">
          <div class="label">Materiais</div>
          <div class="value">${formatCurrency(data.materiaisStelion)}</div>
        </div>
        <div class="stat-card">
          <div class="label">Mão de Obra</div>
          <div class="value">${formatCurrency(data.maoObraStelion)}</div>
        </div>
        <div class="stat-card">
          <div class="label">Impostos</div>
          <div class="value">${formatCurrency(data.impostosStelion)}</div>
        </div>
        <div class="stat-card highlight">
          <div class="label">Subtotal STELION</div>
          <div class="value">${formatCurrency(data.valorTotalStelion)}</div>
        </div>
      </div>
    </div>
    ` : ''}

    ${hasLilit ? `
    <div class="section">
      <span class="product-badge lilit">LILIT</span>
      <h2>Detalhamento LILIT</h2>
      <div class="grid">
        <div class="stat-card">
          <div class="label">Metragem</div>
          <div class="value">${formatNumber(data.metragemTotalLilit)} m²</div>
        </div>
        ${data.pisoLilit > 0 ? `
        <div class="stat-card">
          <div class="label">Piso</div>
          <div class="value">${formatNumber(data.pisoLilit)} m²</div>
        </div>
        ` : ''}
        ${data.paredeLilit > 0 ? `
        <div class="stat-card">
          <div class="label">Parede</div>
          <div class="value">${formatNumber(data.paredeLilit)} m²</div>
        </div>
        ` : ''}
        <div class="stat-card">
          <div class="label">Materiais</div>
          <div class="value">${formatCurrency(data.materiaisLilit)}</div>
        </div>
        <div class="stat-card">
          <div class="label">Mão de Obra</div>
          <div class="value">${formatCurrency(data.maoObraLilit)}</div>
        </div>
        <div class="stat-card">
          <div class="label">Impostos</div>
          <div class="value">${formatCurrency(data.impostosLilit)}</div>
        </div>
        <div class="stat-card highlight">
          <div class="label">Subtotal LILIT</div>
          <div class="value">${formatCurrency(data.valorTotalLilit)}</div>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="section total-section">
      <h2>Valor Total do Investimento</h2>
      <div class="total-value">${formatCurrency(data.valorTotal)}</div>
      <p style="margin-top: 16px; opacity: 0.8;">
        ${formatNumber(data.metragemTotal)} m² | ${formatCurrency(data.valorTotal / data.metragemTotal)}/m²
      </p>
    </div>

    <div class="footer">
      <p>Proposta gerada em ${new Date().toLocaleDateString('pt-BR')}</p>
      <p style="margin-top: 8px;">
        <a href="https://monofloor.com.br" target="_blank">monofloor.com.br</a>
      </p>
    </div>
  </div>

  <!-- Script de Tracking -->
  <script>
    (function() {
      const slug = '${data.slug}';
      // Detectar API base automaticamente pela URL atual
      const apiBase = window.location.origin;
      let sessionId = null;
      let startTime = Date.now();
      let maxScroll = 0;

      // Registrar visualização inicial
      fetch(apiBase + '/api/proposals/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug })
      })
      .then(r => r.json())
      .then(data => {
        sessionId = data.sessionId;
      })
      .catch(console.error);

      // Tracking de scroll
      window.addEventListener('scroll', function() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.round((scrollTop / docHeight) * 100);
        if (scrollPercent > maxScroll) {
          maxScroll = scrollPercent;
        }
      });

      // Enviar dados ao sair da página
      function sendFinalData() {
        if (!sessionId) return;
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        navigator.sendBeacon(apiBase + '/api/proposals/track', JSON.stringify({
          slug,
          sessionId,
          timeOnPage,
          scrollDepth: maxScroll
        }));
      }

      window.addEventListener('beforeunload', sendFinalData);
      window.addEventListener('pagehide', sendFinalData);

      // Enviar dados a cada 30 segundos
      setInterval(function() {
        if (!sessionId) return;
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        fetch(apiBase + '/api/proposals/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, sessionId, timeOnPage, scrollDepth: maxScroll })
        }).catch(console.error);
      }, 30000);

      // ===== GRAVAÇÃO DE SESSÃO (rrweb) =====
      // Carregar rrweb dinamicamente
      var rrwebScript = document.createElement('script');
      rrwebScript.src = 'https://cdn.jsdelivr.net/npm/rrweb@2.0.0-alpha.11/dist/rrweb.min.js';
      rrwebScript.onload = function() {
        if (typeof rrweb === 'undefined') return;

        var recordedEvents = [];
        var lastSentIndex = 0;
        var deviceType = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

        // Iniciar gravação
        rrweb.record({
          emit: function(event) {
            recordedEvents.push(event);
          },
          // Configurações de otimização para reduzir tamanho
          sampling: {
            mousemove: 50, // Amostragem de mouse a cada 50ms
            mouseInteraction: true,
            scroll: 150, // Amostragem de scroll a cada 150ms
            input: 'last' // Apenas último valor de input
          },
          // Mascarar inputs sensíveis
          maskAllInputs: true,
          // Não gravar iframes externos
          recordCrossOriginIframes: false
        });

        // Enviar eventos a cada 10 segundos (batch)
        setInterval(function() {
          if (!sessionId || recordedEvents.length <= lastSentIndex) return;

          var newEvents = recordedEvents.slice(lastSentIndex);
          if (newEvents.length === 0) return;

          var timeOnPage = Math.round((Date.now() - startTime) / 1000);

          fetch(apiBase + '/api/proposals/recording', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              slug: slug,
              sessionId: sessionId,
              events: newEvents,
              deviceType: deviceType,
              screenWidth: window.innerWidth,
              screenHeight: window.innerHeight,
              duration: timeOnPage
            })
          })
          .then(function() {
            lastSentIndex = recordedEvents.length;
          })
          .catch(console.error);
        }, 10000);

        // Enviar eventos restantes ao sair
        function sendRemainingEvents() {
          if (!sessionId || recordedEvents.length <= lastSentIndex) return;
          var newEvents = recordedEvents.slice(lastSentIndex);
          if (newEvents.length === 0) return;

          var timeOnPage = Math.round((Date.now() - startTime) / 1000);
          navigator.sendBeacon(apiBase + '/api/proposals/recording', JSON.stringify({
            slug: slug,
            sessionId: sessionId,
            events: newEvents,
            deviceType: deviceType,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            duration: timeOnPage
          }));
        }

        window.addEventListener('beforeunload', sendRemainingEvents);
        window.addEventListener('pagehide', sendRemainingEvents);
      };
      document.head.appendChild(rrwebScript);
    })();
  </script>
</body>
</html>`;
}

export default router;
