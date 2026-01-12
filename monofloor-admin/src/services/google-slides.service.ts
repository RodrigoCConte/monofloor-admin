// @ts-nocheck
import puppeteer from 'puppeteer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

// ============================================================
// CACHE DE ASSETS EM MEMÓRIA (carregados 1x na inicialização)
// ============================================================
interface AssetsCache {
  logoBase64: string | null;
  niteclubFontBase64: string | null;
  widescreenExBold: string | null;
  widescreenRegular: string | null;
  templatePdfBytes: Buffer | null;
  niteclubFontBytes: Buffer | null;
  widescreenExBoldBytes: Buffer | null;
  widescreenRegularBytes: Buffer | null;
  bgImageBytes: Buffer | null;
  initialized: boolean;
}

const assetsCache: AssetsCache = {
  logoBase64: null,
  niteclubFontBase64: null,
  widescreenExBold: null,
  widescreenRegular: null,
  templatePdfBytes: null,
  niteclubFontBytes: null,
  widescreenExBoldBytes: null,
  widescreenRegularBytes: null,
  bgImageBytes: null,
  initialized: false,
};

/**
 * Inicializa o cache de assets (chamado 1x no startup)
 */
export function initializeAssetsCache(): void {
  if (assetsCache.initialized) {
    console.log('📦 Cache de assets já inicializado');
    return;
  }

  console.log('📦 Inicializando cache de assets...');
  const startTime = Date.now();

  // Logo
  const logoPath = path.join(__dirname, '../../public/artboard 1.png');
  try {
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      assetsCache.logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      console.log('  ✓ Logo carregada');
    }
  } catch (error) {
    console.warn('  ⚠️ Erro ao carregar logo:', error);
  }

  // Fonte NITECLUB
  const niteclubPath = path.join(__dirname, '../../public/NITECLUB.TTF');
  try {
    if (fs.existsSync(niteclubPath)) {
      const fontBuffer = fs.readFileSync(niteclubPath);
      assetsCache.niteclubFontBase64 = `data:font/truetype;base64,${fontBuffer.toString('base64')}`;
      assetsCache.niteclubFontBytes = fontBuffer;
      console.log('  ✓ Fonte NITECLUB carregada');
    }
  } catch (error) {
    console.warn('  ⚠️ Erro ao carregar NITECLUB:', error);
  }

  // Fontes Widescreen
  const exBoldPath = path.join(__dirname, '../../public/fonts/Widescreen Ex Bold.otf');
  const regularPath = path.join(__dirname, '../../public/fonts/Widescreen Regular.otf');
  try {
    if (fs.existsSync(exBoldPath)) {
      const fontBuffer = fs.readFileSync(exBoldPath);
      assetsCache.widescreenExBold = `data:font/opentype;base64,${fontBuffer.toString('base64')}`;
      assetsCache.widescreenExBoldBytes = fontBuffer;
      console.log('  ✓ Fonte Widescreen Ex Bold carregada');
    }
    if (fs.existsSync(regularPath)) {
      const fontBuffer = fs.readFileSync(regularPath);
      assetsCache.widescreenRegular = `data:font/opentype;base64,${fontBuffer.toString('base64')}`;
      assetsCache.widescreenRegularBytes = fontBuffer;
      console.log('  ✓ Fonte Widescreen Regular carregada');
    }
  } catch (error) {
    console.warn('  ⚠️ Erro ao carregar fontes Widescreen:', error);
  }

  // Template PDF
  const templatePath = path.join(__dirname, '../../public/slides/template.pdf');
  try {
    if (fs.existsSync(templatePath)) {
      assetsCache.templatePdfBytes = fs.readFileSync(templatePath);
      console.log('  ✓ Template PDF carregado');
    }
  } catch (error) {
    console.warn('  ⚠️ Erro ao carregar template:', error);
  }

  // Background image slide 23
  const bgImagePath = path.join(__dirname, '../../public/slides/slide23-bg.jpg');
  try {
    if (fs.existsSync(bgImagePath)) {
      assetsCache.bgImageBytes = fs.readFileSync(bgImagePath);
      console.log('  ✓ Background slide 23 carregado');
    }
  } catch (error) {
    console.warn('  ⚠️ Erro ao carregar background:', error);
  }

  assetsCache.initialized = true;
  console.log(`📦 Cache inicializado em ${Date.now() - startTime}ms`);
}

// Inicializar cache automaticamente no import
initializeAssetsCache();

// ============================================================
// BROWSER POOL - Reutiliza browser Puppeteer (evita ~2-3s de startup)
// ============================================================
import type { Browser, Page } from 'puppeteer';

interface BrowserPool {
  browser: Browser | null;
  isLaunching: boolean;
  lastUsed: number;
  useCount: number;
}

const browserPool: BrowserPool = {
  browser: null,
  isLaunching: false,
  lastUsed: 0,
  useCount: 0,
};

// Tempo máximo de inatividade antes de fechar o browser (5 minutos)
const BROWSER_IDLE_TIMEOUT = 5 * 60 * 1000;
// Número máximo de usos antes de reiniciar o browser (evita memory leak)
const MAX_BROWSER_USES = 50;

/**
 * Obtém uma página do browser pool (cria browser se necessário)
 */
async function getPooledPage(): Promise<{ page: Page; release: () => Promise<void> }> {
  // Se o browser não existe ou foi fechado, criar um novo
  if (!browserPool.browser || !browserPool.browser.isConnected()) {
    // Evitar múltiplas tentativas de launch simultâneas
    if (browserPool.isLaunching) {
      // Esperar o browser que está sendo criado
      while (browserPool.isLaunching) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } else {
      browserPool.isLaunching = true;
      console.log('🚀 Browser Pool: Iniciando novo browser...');
      const startTime = Date.now();

      try {
        browserPool.browser = await puppeteer.launch({
          headless: true,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-default-apps',
            '--no-first-run',
            '--single-process' // Reduz uso de memória
          ]
        });
        browserPool.useCount = 0;
        console.log(`🚀 Browser Pool: Browser iniciado em ${Date.now() - startTime}ms`);
      } finally {
        browserPool.isLaunching = false;
      }
    }
  }

  // Verificar se precisa reiniciar por excesso de uso
  if (browserPool.useCount >= MAX_BROWSER_USES) {
    console.log('🔄 Browser Pool: Reiniciando browser (limite de uso atingido)');
    await closeBrowserPool();
    return getPooledPage(); // Recursivo para criar novo browser
  }

  browserPool.lastUsed = Date.now();
  browserPool.useCount++;

  // Criar nova página
  const page = await browserPool.browser!.newPage();
  await page.setViewport({
    width: 1080,
    height: 1920,
    deviceScaleFactor: 2
  });

  // Função para liberar a página (fecha a página, mantém o browser)
  const release = async () => {
    try {
      if (!page.isClosed()) {
        await page.close();
      }
    } catch (error) {
      // Ignorar erros ao fechar página
    }
  };

  return { page, release };
}

/**
 * Fecha o browser pool (chamado no shutdown)
 */
async function closeBrowserPool(): Promise<void> {
  if (browserPool.browser) {
    try {
      await browserPool.browser.close();
      console.log('🛑 Browser Pool: Browser fechado');
    } catch (error) {
      // Ignorar erros ao fechar
    }
    browserPool.browser = null;
  }
}

// Fechar browser no shutdown do processo
process.on('beforeExit', closeBrowserPool);
process.on('SIGINT', async () => {
  await closeBrowserPool();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await closeBrowserPool();
  process.exit(0);
});

// Timer para fechar browser inativo (verifica a cada minuto)
setInterval(async () => {
  if (browserPool.browser &&
      browserPool.lastUsed > 0 &&
      Date.now() - browserPool.lastUsed > BROWSER_IDLE_TIMEOUT) {
    console.log('💤 Browser Pool: Fechando browser inativo');
    await closeBrowserPool();
  }
}, 60 * 1000);

interface ProposalData {
  // STELION
  metragemTotalStelion: number;
  materiaisStelion: number;
  maoObraStelion: number;
  impostosStelion: number;
  valorTotalStelion: number;

  // LILIT
  metragemTotalLilit: number;
  materiaisLilit: number;
  maoObraLilit: number;
  impostosLilit: number;
  valorTotalLilit: number;

  // TOTAIS
  metragemTotal: number;
  materiaisTotal: number;
  maoObraTotal: number;
  impostosTotal: number;
  valorTotal: number;

  precoBaseStelion: number;
  precoBaseLilit: number;

  // SUPERFÍCIES (opcional)
  pisoStelion?: number;
  paredeStelion?: number;
  pisoLilit?: number;
  paredeLilit?: number;

  // SUPERFÍCIES DETALHADAS
  teto?: number;
  bancadas?: number;
  escadas?: number;
  especiaisPequenos?: number;
  especiaisGrandes?: number;
  piscina?: number;

  // DADOS DO CLIENTE (para overlay na página de info)
  clienteNome?: string;
  clienteLocal?: string;
  clienteDetalhes?: string;
  areaTotalInterna?: number;

  // PAGAMENTO
  percentualRT?: number;
  percentualEntrada?: number;
  descontoVista?: number;
  taxaTransacaoCartao?: number;
  taxaPorParcelaCartao?: number;
  numeroParcelasCartao?: number;

  // MODO APENAS MATERIAIS
  apenasMateriais?: boolean;
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatarMetragem(valor: number): string {
  return valor.toFixed(2);
}

// Helper para carregar logo como base64 (usa cache)
function loadLogoBase64(): string {
  if (assetsCache.logoBase64) {
    return assetsCache.logoBase64;
  }
  // Fallback: carregar do disco se cache não inicializado
  const logoPath = path.join(__dirname, '../../public/artboard 1.png');
  try {
    const logoBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.warn('⚠️ Não foi possível carregar a logo:', error);
    return '';
  }
}

// Helper para carregar fonte NITECLUB como base64 (usa cache)
function getNiteclubFontBase64(): string {
  if (assetsCache.niteclubFontBase64) {
    return assetsCache.niteclubFontBase64;
  }
  // Fallback: carregar do disco se cache não inicializado
  const fontPath = path.join(__dirname, '../../public/NITECLUB.TTF');
  try {
    const fontBuffer = fs.readFileSync(fontPath);
    return `data:font/truetype;base64,${fontBuffer.toString('base64')}`;
  } catch (error) {
    console.warn('⚠️ Não foi possível carregar a fonte NITECLUB:', error);
    return '';
  }
}

// Helper para carregar fontes Widescreen como base64 (usa cache)
function getWidescreenFontsBase64(): { exBold: string; regular: string } {
  if (assetsCache.widescreenExBold && assetsCache.widescreenRegular) {
    return { exBold: assetsCache.widescreenExBold, regular: assetsCache.widescreenRegular };
  }
  // Fallback: carregar do disco se cache não inicializado
  const exBoldPath = path.join(__dirname, '../../public/fonts/Widescreen Ex Bold.otf');
  const regularPath = path.join(__dirname, '../../public/fonts/Widescreen Regular.otf');

  let exBold = '';
  let regular = '';

  try {
    if (fs.existsSync(exBoldPath)) {
      const fontBuffer = fs.readFileSync(exBoldPath);
      exBold = `data:font/opentype;base64,${fontBuffer.toString('base64')}`;
    }
  } catch (error) {
    console.warn('⚠️ Não foi possível carregar Widescreen Ex Bold:', error);
  }

  try {
    if (fs.existsSync(regularPath)) {
      const fontBuffer = fs.readFileSync(regularPath);
      regular = `data:font/opentype;base64,${fontBuffer.toString('base64')}`;
    }
  } catch (error) {
    console.warn('⚠️ Não foi possível carregar Widescreen Regular:', error);
  }

  return { exBold, regular };
}

// CSS compartilhado para fontes (usando Google Fonts para produção)
const sharedFontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  @page {
    size: 1080px 1920px;
    margin: 0;
  }
`;

// HTML template - Slide 26 com design baseado no gerador de propostas
function createProposalHTML(data: ProposalData): string {
  const totalM2Stelion = data.metragemTotalStelion > 0
    ? formatarMoeda(data.valorTotalStelion / data.metragemTotalStelion)
    : '0,00';

  const totalM2Lilit = data.metragemTotalLilit === 0
    ? '590,00'
    : formatarMoeda(data.valorTotalLilit / data.metragemTotalLilit);

  const logoBase64 = loadLogoBase64();
  const niteclubFontBase64 = getNiteclubFontBase64();

  // Detectar qual produto foi selecionado para o piso (toggle)
  const isPisoLilit = (data.pisoLilit || 0) > 0 && (data.pisoStelion || 0) === 0;
  const produtoToggle: 'STELION' | 'LILIT' = isPisoLilit ? 'LILIT' : 'STELION';

  // Construir lista de superfícies para cada produto
  const superficiesStelion: { nome: string; area: number }[] = [];
  const superficiesLilit: { nome: string; area: number }[] = [];

  // Piso → Segue o toggle
  const areaPiso = (data.pisoStelion || 0) + (data.pisoLilit || 0);
  if (areaPiso > 0) {
    if (produtoToggle === 'STELION') {
      superficiesStelion.push({ nome: 'Piso', area: areaPiso });
    } else {
      superficiesLilit.push({ nome: 'Piso', area: areaPiso });
    }
  }

  // Parede → Sempre LILIT
  const areaParede = data.paredeStelion || data.paredeLilit || 0;
  if (areaParede > 0) {
    superficiesLilit.push({ nome: 'Parede', area: areaParede });
  }

  // Teto → Sempre LILIT
  if ((data.teto || 0) > 0) {
    superficiesLilit.push({ nome: 'Teto', area: data.teto || 0 });
  }

  // Bancadas → Segue toggle
  if ((data.bancadas || 0) > 0) {
    if (produtoToggle === 'STELION') {
      superficiesStelion.push({ nome: 'Bancadas', area: data.bancadas || 0 });
    } else {
      superficiesLilit.push({ nome: 'Bancadas', area: data.bancadas || 0 });
    }
  }

  // Escadas → Segue toggle
  if ((data.escadas || 0) > 0) {
    if (produtoToggle === 'STELION') {
      superficiesStelion.push({ nome: 'Escadas', area: data.escadas || 0 });
    } else {
      superficiesLilit.push({ nome: 'Escadas', area: data.escadas || 0 });
    }
  }

  // Especiais Pequenos → Segue toggle
  if ((data.especiaisPequenos || 0) > 0) {
    if (produtoToggle === 'STELION') {
      superficiesStelion.push({ nome: 'Especiais Pequenos', area: data.especiaisPequenos || 0 });
    } else {
      superficiesLilit.push({ nome: 'Especiais Pequenos', area: data.especiaisPequenos || 0 });
    }
  }

  // Especiais Grandes → Segue toggle
  if ((data.especiaisGrandes || 0) > 0) {
    if (produtoToggle === 'STELION') {
      superficiesStelion.push({ nome: 'Especiais Grandes', area: data.especiaisGrandes || 0 });
    } else {
      superficiesLilit.push({ nome: 'Especiais Grandes', area: data.especiaisGrandes || 0 });
    }
  }

  // Piscina → SEMPRE STELION (exceção)
  if ((data.piscina || 0) > 0) {
    superficiesStelion.push({ nome: 'Piscina', area: data.piscina || 0 });
  }

  // Gerar HTML das superfícies para cada card
  const renderSuperficies = (superficies: { nome: string; area: number }[]) => {
    if (superficies.length === 0) return '';
    return superficies.map(s => `
        <div class="value-row surface-row">
          <span class="value-label">${s.nome}</span>
          <span class="value-amount">${formatarMetragem(s.area)} m²</span>
        </div>`).join('');
  };

  const superficiesStelionHTML = renderSuperficies(superficiesStelion);
  const superficiesLilitHTML = renderSuperficies(superficiesLilit);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${sharedFontStyles}

    @font-face {
      font-family: 'NITECLUB';
      src: url('${niteclubFontBase64}') format('truetype');
      font-weight: normal;
      font-style: normal;
      font-display: block;
    }

    body {
      width: 1080px;
      height: 1920px;
      background: #000000;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow: hidden;
      color: #ffffff;
      padding: 80px 53px;
      display: flex;
      flex-direction: column;
    }

    .product-name {
      font-family: 'NiteClub', 'Inter', sans-serif;
      letter-spacing: 3px;
      font-size: 44px;
      font-weight: normal;
      text-transform: uppercase;
      color: #ffffff;
      display: inline-block;
    }

    .trademark {
      font-family: 'Inter', sans-serif;
      font-size: 27px;
      font-weight: 500;
      color: #ffffff;
      vertical-align: top;
      margin-left: 4px;
      position: relative;
      top: 0px;
    }

    .header {
      text-align: center;
      margin-bottom: 53px;
    }

    .logo-img {
      width: 562px;
      height: auto;
      margin-bottom: 10px;
    }

    .logo {
      font-size: 48px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 16px;
      letter-spacing: -0.5px;
    }

    .subtitle {
      font-family: 'Inter', sans-serif;
      font-size: 21px;
      color: #999999;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.3em;
    }

    .products-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 40px;
      margin-bottom: 40px;
    }

    .product-card {
      background: #0a0a0a;
      border: 1px solid #1a1a1a;
      border-radius: 11px;
      padding: 32px;
    }

    .product-header {
      margin-bottom: 27px;
      padding-bottom: 21px;
      border-bottom: 1px solid #222222;
    }

    .product-values {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .value-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .value-label {
      font-size: 26px;
      color: #999999;
      font-weight: 500;
    }

    .value-amount {
      font-family: 'Inter', sans-serif;
      font-size: 29px;
      color: #ffffff;
      font-weight: 300;
      font-variant-numeric: tabular-nums;
    }

    .value-row.highlight {
      padding-top: 16px;
      margin-top: 11px;
      border-top: 1px solid #222222;
    }

    .value-row.highlight .value-label {
      color: #ffffff;
      font-weight: 600;
    }

    .value-row.highlight .value-amount {
      font-size: 33px;
      font-weight: 700;
    }

    .value-row.surface-row {
      padding-left: 16px;
    }

    .value-row.surface-row .value-label {
      font-size: 16px;
      color: #777777;
    }

    .value-row.surface-row .value-amount {
      font-size: 18px;
      color: #aaaaaa;
    }

    .total-section {
      background: #ffffff;
      color: #000000;
      border-radius: 11px;
      padding: 37px;
      margin-top: auto;
    }

    .total-title {
      font-family: 'Inter', sans-serif;
      font-size: 27px;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 27px;
      text-align: center;
    }

    .total-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 21px;
      margin-bottom: 27px;
    }

    .total-item {
      text-align: center;
    }

    .total-item-label {
      font-size: 18px;
      color: #666666;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .total-item-value {
      font-family: 'Inter', sans-serif;
      font-size: 29px;
      color: #000000;
      font-weight: 300;
      font-variant-numeric: tabular-nums;
    }

    .grand-total {
      padding-top: 27px;
      border-top: 2px solid #000000;
      text-align: center;
    }

    .grand-total-label {
      font-size: 20px;
      color: #666666;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 11px;
    }

    .grand-total-value {
      font-family: 'Inter', sans-serif;
      font-size: 52px;
      color: #000000;
      font-weight: 300;
      font-variant-numeric: tabular-nums;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Monofloor" class="logo-img">` : '<div class="logo">MONOFLOOR</div>'}
    <div class="subtitle">INVESTIMENTO${data.apenasMateriais ? ' • APENAS MATERIAIS' : ''}</div>
  </div>

  <!-- Products -->
  <div class="products-section">
    <!-- STELION -->
    <div class="product-card">
      <div class="product-header">
        <div class="product-name">STELION<span class="trademark">™</span></div>
      </div>
      <div class="product-values">
        <div class="value-row">
          <span class="value-label">Área Total</span>
          <span class="value-amount">${formatarMetragem(data.metragemTotalStelion)} m²</span>
        </div>
        <div class="value-row">
          <span class="value-label">Valor por m²</span>
          <span class="value-amount">R$ ${totalM2Stelion}/m²</span>
        </div>
        <div class="value-row">
          <span class="value-label">Materiais</span>
          <span class="value-amount">R$ ${formatarMoeda(data.materiaisStelion)}</span>
        </div>
        ${!data.apenasMateriais ? `<div class="value-row">
          <span class="value-label">Instalação</span>
          <span class="value-amount">R$ ${formatarMoeda(data.maoObraStelion)}</span>
        </div>` : ''}
        <div class="value-row">
          <span class="value-label">Impostos</span>
          <span class="value-amount">R$ ${formatarMoeda(data.impostosStelion)}</span>
        </div>
        <div class="value-row highlight">
          <span class="value-label">Total</span>
          <span class="value-amount">R$ ${formatarMoeda(data.valorTotalStelion)}</span>
        </div>
      </div>
    </div>

    <!-- LILIT -->
    <div class="product-card">
      <div class="product-header">
        <div class="product-name">LILIT<span class="trademark">™</span></div>
      </div>
      <div class="product-values">
        <div class="value-row">
          <span class="value-label">Área Total</span>
          <span class="value-amount">${formatarMetragem(data.metragemTotalLilit)} m²</span>
        </div>
        <div class="value-row">
          <span class="value-label">Valor por m²</span>
          <span class="value-amount">R$ ${totalM2Lilit}/m²</span>
        </div>
        <div class="value-row">
          <span class="value-label">Materiais</span>
          <span class="value-amount">R$ ${formatarMoeda(data.materiaisLilit)}</span>
        </div>
        ${!data.apenasMateriais ? `<div class="value-row">
          <span class="value-label">Instalação</span>
          <span class="value-amount">R$ ${formatarMoeda(data.maoObraLilit)}</span>
        </div>` : ''}
        <div class="value-row">
          <span class="value-label">Impostos</span>
          <span class="value-amount">R$ ${formatarMoeda(data.impostosLilit)}</span>
        </div>
        <div class="value-row highlight">
          <span class="value-label">Total</span>
          <span class="value-amount">R$ ${formatarMoeda(data.valorTotalLilit)}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Total Geral -->
  <div class="total-section">
    <div class="total-title">Investimento Total${data.apenasMateriais ? ' (Apenas Materiais)' : ''}</div>
    <div class="total-grid">
      <div class="total-item">
        <div class="total-item-label">Área Total</div>
        <div class="total-item-value">${formatarMetragem(data.metragemTotal)} m²</div>
      </div>
      <div class="total-item">
        <div class="total-item-label">Materiais</div>
        <div class="total-item-value">R$ ${formatarMoeda(data.materiaisTotal)}</div>
      </div>
      ${!data.apenasMateriais ? `<div class="total-item">
        <div class="total-item-label">Instalação</div>
        <div class="total-item-value">R$ ${formatarMoeda(data.maoObraTotal)}</div>
      </div>` : ''}
      <div class="total-item">
        <div class="total-item-label">Impostos</div>
        <div class="total-item-value">R$ ${formatarMoeda(data.impostosTotal)}</div>
      </div>
    </div>
    <div class="grand-total">
      <div class="grand-total-label">Valor Total do Projeto</div>
      <div class="grand-total-value">R$ ${formatarMoeda(data.valorTotal)}</div>
    </div>
  </div>
</body>
</html>
  `;
}

// HTML template - Slide 27 - Detalhamento por Superfície
function createSurfacesTableHTML(data: ProposalData): string {
  const logoBase64 = loadLogoBase64();
  const niteclubFontBase64 = getNiteclubFontBase64();

  // Preços base por m²
  const precoStelion = data.precoBaseStelion || 910;
  const precoLilit = data.precoBaseLilit || 590;

  // Fator de perda (+11% = dividir por 0.9)
  const FATOR_PERDA = 0.9;

  // Detectar qual produto foi selecionado para o piso (toggle)
  const isPisoLilit = (data.pisoLilit || 0) > 0 && (data.pisoStelion || 0) === 0;
  const produtoToggle: 'STELION' | 'LILIT' = isPisoLilit ? 'LILIT' : 'STELION';

  // Multiplicadores por tipo de superfície
  // Regra: Parede/Teto sempre LILIT, Piscina sempre STELION, resto segue o toggle
  const MULTIPLICADORES: Record<string, { produto: 'STELION' | 'LILIT', mult: number }> = {
    piso: { produto: produtoToggle, mult: 1.0 },
    parede: { produto: 'LILIT', mult: 0.8 },           // Sempre LILIT
    teto: { produto: 'LILIT', mult: 0.8 },             // Sempre LILIT
    bancadas: { produto: produtoToggle, mult: 1.5 },   // Segue toggle
    escadas: { produto: produtoToggle, mult: 1.5 },    // Segue toggle
    especiaisPequenos: { produto: produtoToggle, mult: 0.5 },  // Segue toggle
    especiaisGrandes: { produto: produtoToggle, mult: 1.5 },   // Segue toggle
    piscina: { produto: 'STELION', mult: 1.5 },        // EXCEÇÃO: Sempre STELION
  };

  // DEBUG: Log do toggle e superfícies recebidas
  console.log('🔍 createSurfacesTableHTML - TOGGLE:', produtoToggle, '(isPisoLilit:', isPisoLilit, ')');
  console.log('🔍 createSurfacesTableHTML - SUPERFÍCIES NO DATA:', {
    teto: data.teto,
    bancadas: data.bancadas,
    escadas: data.escadas,
    especiaisPequenos: data.especiaisPequenos,
    especiaisGrandes: data.especiaisGrandes,
    piscina: data.piscina,
    pisoStelion: data.pisoStelion,
    pisoLilit: data.pisoLilit,
    paredeStelion: data.paredeStelion,
    paredeLilit: data.paredeLilit,
  });

  // Custo de mão de obra por m²
  const MAO_OBRA_M2 = 120;

  // Função para calcular valor total de uma superfície
  // NOTA: A área já vem COM perda aplicada do frontend (dividida por 0.9)
  // Fórmula: area * precoBase * multiplicador
  // Se apenasMateriais está ativo, subtrai a mão de obra
  const calcularValor = (area: number, tipo: string) => {
    const config = MULTIPLICADORES[tipo];
    const precoBase = config.produto === 'STELION' ? precoStelion : precoLilit;
    // NÃO dividir por FATOR_PERDA - os dados já vêm com perda aplicada do frontend
    const valorCompleto = area * precoBase * config.mult;

    // Se apenasMateriais, subtrair mão de obra (R$120/m²)
    if (data.apenasMateriais) {
      const maoObra = MAO_OBRA_M2 * area;
      return valorCompleto - maoObra;
    }

    return valorCompleto;
  };

  // Função para calcular R$/m² (preço base × multiplicador, SEM dividir por perda)
  // Se apenasMateriais, subtrai R$120/m² do preço base
  const calcularPrecoM2 = (tipo: string) => {
    const config = MULTIPLICADORES[tipo];
    const precoBase = config.produto === 'STELION' ? precoStelion : precoLilit;
    const precoCompleto = precoBase * config.mult;

    // Se apenasMateriais, subtrair mão de obra do preço por m²
    if (data.apenasMateriais) {
      return precoCompleto - MAO_OBRA_M2;
    }

    return precoCompleto;
  };

  // Lista de superfícies com seus dados (produto dinâmico baseado no toggle)
  const superficies = [
    { nome: 'Piso', area: (data.pisoStelion || 0) + (data.pisoLilit || 0), tipo: 'piso', produto: produtoToggle },
    { nome: 'Parede', area: data.paredeStelion || data.paredeLilit || 0, tipo: 'parede', produto: 'LILIT' },
    { nome: 'Teto', area: data.teto || 0, tipo: 'teto', produto: 'LILIT' },
    { nome: 'Bancadas', area: data.bancadas || 0, tipo: 'bancadas', produto: produtoToggle },
    { nome: 'Escadas', area: data.escadas || 0, tipo: 'escadas', produto: produtoToggle },
    { nome: 'Especiais Pequenos', area: data.especiaisPequenos || 0, tipo: 'especiaisPequenos', produto: produtoToggle },
    { nome: 'Especiais Grandes', area: data.especiaisGrandes || 0, tipo: 'especiaisGrandes', produto: produtoToggle },
    { nome: 'Piscina', area: data.piscina || 0, tipo: 'piscina', produto: 'STELION' },  // EXCEÇÃO: Sempre STELION
  ].filter(s => s.area > 0); // Só mostrar superfícies com área > 0

  // Calcular totais (agora com multiplicadores e fator de perda)
  const totalGeral = superficies.reduce((sum, s) => sum + calcularValor(s.area, s.tipo), 0);
  const areaTotal = superficies.reduce((sum, s) => sum + s.area, 0);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${sharedFontStyles}

    @font-face {
      font-family: 'NITECLUB';
      src: url('${niteclubFontBase64}') format('truetype');
      font-weight: normal;
      font-style: normal;
      font-display: block;
    }

    body {
      width: 1080px;
      height: 1920px;
      background: #000000;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      overflow: hidden;
      color: #ffffff;
      padding: 80px 53px;
      display: flex;
      flex-direction: column;
    }

    .header {
      text-align: center;
      margin-bottom: 53px;
    }

    .logo-img {
      width: 562px;
      height: auto;
      margin-bottom: 10px;
    }

    .subtitle {
      font-family: 'Inter', sans-serif;
      font-size: 21px;
      color: #999999;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.3em;
    }

    .table-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .section-title {
      font-family: 'Inter', sans-serif;
      font-size: 24px;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #ffffff;
      margin-bottom: 16px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      background: #0a0a0a;
      border-radius: 11px;
      overflow: hidden;
    }

    .data-table thead {
      background: #1a1a1a;
    }

    .data-table th {
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #999999;
      padding: 20px 16px;
      text-align: left;
      border-bottom: 1px solid #222222;
    }

    .data-table th:not(:first-child) {
      text-align: right;
    }

    .data-table td {
      font-family: 'Inter', sans-serif;
      font-size: 18px;
      font-weight: 300;
      color: #ffffff;
      padding: 24px 16px;
      border-bottom: 1px solid #1a1a1a;
    }

    .data-table td:not(:first-child) {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    .product-name {
      font-family: 'NiteClub', 'Inter', sans-serif;
      letter-spacing: 2px;
      font-size: 24px;
      font-weight: normal;
      text-transform: uppercase;
      color: #ffffff;
    }

    .surface-desc {
      font-family: 'Inter', sans-serif;
      color: #777777;
      font-size: 14px;
      margin-top: 6px;
      font-weight: 300;
    }

    .product-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .trademark {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 400;
      color: #ffffff;
      vertical-align: super;
      margin-left: 2px;
    }

    .row-stelion {
      background: rgba(201, 169, 98, 0.08);
    }

    .row-lilit {
      background: rgba(100, 150, 200, 0.08);
    }

    .row-total {
      background: #1a1a1a;
      border-top: 2px solid #333333;
    }

    .row-total td {
      color: #ffffff;
      font-weight: 500;
      padding: 28px 16px;
    }

    .row-total .product-name {
      color: #ffffff;
    }

    .row-total .total-value {
      font-weight: 600;
      font-size: 20px;
      color: #ffffff;
    }

    .totals-section {
      background: #ffffff;
      color: #000000;
      border-radius: 11px;
      padding: 32px;
      margin-top: auto;
    }

    .totals-title {
      font-family: 'Inter', sans-serif;
      font-size: 22px;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 24px;
      text-align: center;
    }

    .totals-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .total-card {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
    }

    .total-card-label {
      font-family: 'NITECLUB', 'Inter', sans-serif;
      font-size: 22px;
      font-weight: normal;
      color: #333333;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 12px;
    }

    .total-card-area {
      font-family: 'Inter', sans-serif;
      font-size: 32px;
      color: #000000;
      font-weight: 300;
      font-variant-numeric: tabular-nums;
      margin-bottom: 4px;
    }

    .total-card-value {
      font-family: 'Inter', sans-serif;
      font-size: 20px;
      color: #444444;
      font-weight: 300;
      font-variant-numeric: tabular-nums;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Monofloor" class="logo-img">` : '<div class="logo">MONOFLOOR</div>'}
    <div class="subtitle">DETALHAMENTO POR SUPERFÍCIE${data.apenasMateriais ? ' • APENAS MATERIAIS' : ''}</div>
  </div>

  <!-- Tabela por Superfície -->
  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Superfície</th>
          <th>Área Total</th>
          <th>R$/m²</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${superficies.map(s => `
        <tr class="${s.produto === 'STELION' ? 'row-stelion' : 'row-lilit'}">
          <td>
            <div class="product-cell">
              <span class="product-name">${s.produto}<span class="trademark">™</span></span>
              <span class="surface-desc">${s.nome}</span>
            </div>
          </td>
          <td>${formatarMetragem(s.area)} m²</td>
          <td>R$ ${formatarMoeda(calcularPrecoM2(s.tipo))}</td>
          <td>R$ ${formatarMoeda(calcularValor(s.area, s.tipo))}</td>
        </tr>
        `).join('')}
        <!-- Linha de Total -->
        <tr class="row-total">
          <td>
            <div class="product-cell">
              <span class="product-name total-label">TOTAL</span>
            </div>
          </td>
          <td class="total-value">${formatarMetragem(areaTotal)} m²</td>
          <td></td>
          <td class="total-value">R$ ${formatarMoeda(totalGeral)}</td>
        </tr>
      </tbody>
    </table>
  </div>
</body>
</html>
  `;
}

// HTML template - Slide de Pagamento (entre Investimento e Detalhamento)
function createPaymentHTML(data: ProposalData): string {
  const logoBase64 = loadLogoBase64();
  const widescreenFonts = getWidescreenFontsBase64();

  // Valores de pagamento
  const valorTotalBase = data.valorTotal || 0;
  const percentualRT = data.percentualRT || 10;
  const percentualEntrada = data.percentualEntrada || 50;
  const descontoVista = data.descontoVista || 5;
  const taxaTransacaoCartao = data.taxaTransacaoCartao || 2.36;
  const taxaPorParcelaCartao = data.taxaPorParcelaCartao || 1;
  const numeroParcelasCartao = data.numeroParcelasCartao || 6;

  // Aplicar RT ao valor total
  // RT 10% é o valor neutro (já embutido nos preços base)
  // Valores acima de 10% aumentam o preço, abaixo diminuem
  const valorTotal = valorTotalBase * (1 + (percentualRT - 10) / 100);

  // Cálculos
  const valorEntrada = valorTotal * (percentualEntrada / 100);
  const valorRestante = valorTotal - valorEntrada;
  const parcela1 = valorRestante / 2; // 25% do total
  const parcela2 = valorRestante / 2; // 25% do total

  // À vista com desconto
  const valorVista = valorTotal * (1 - descontoVista / 100);

  // Cartão de crédito com juros
  // Taxa Total = Taxa de Transação + (Taxa por Parcela × Número de Parcelas)
  const totalJurosCartao = taxaTransacaoCartao + (taxaPorParcelaCartao * numeroParcelasCartao);
  const valorComJuros = valorTotal * (1 + totalJurosCartao / 100);
  const parcelaCartao = valorComJuros / numeroParcelasCartao;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${sharedFontStyles}

    @font-face {
      font-family: 'Widescreen';
      src: url('${widescreenFonts.exBold}') format('opentype');
      font-weight: 700;
      font-style: normal;
      font-display: block;
    }

    @font-face {
      font-family: 'Widescreen';
      src: url('${widescreenFonts.regular}') format('opentype');
      font-weight: 400;
      font-style: normal;
      font-display: block;
    }

    :root {
      --accent: #ffffff;
      --accent-soft: #cccccc;
      --bg-primary: #000000;
      --bg-card: #080808;
      --border-subtle: #1a1a1a;
      --border-accent: rgba(255, 255, 255, 0.2);
      --text-primary: #ffffff;
      --text-secondary: #888888;
      --text-muted: #555555;
    }

    body {
      width: 1080px;
      height: 1920px;
      background: var(--bg-primary);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      overflow: hidden;
      color: var(--text-primary);
      padding: 70px 60px;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    /* Header */
    .header {
      text-align: center;
      margin-bottom: 50px;
    }

    .logo-img {
      width: 480px;
      height: auto;
      margin-bottom: 20px;
      opacity: 0.95;
    }

    .page-title {
      font-family: 'Widescreen', 'Inter', sans-serif;
      font-weight: 700;
      font-size: 32px;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.4em;
      margin: 0;
    }

    /* Section Container */
    .payment-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    /* Payment Card Base */
    .payment-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 36px 40px;
      position: relative;
      overflow: hidden;
    }

    /* Accent line on left */
    .payment-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 24px;
      bottom: 24px;
      width: 3px;
      background: linear-gradient(180deg, var(--accent) 0%, var(--accent-soft) 100%);
      border-radius: 0 2px 2px 0;
    }

    /* Featured Card - À Vista */
    .payment-card.featured {
      background: linear-gradient(135deg, #0f0f0f 0%, #080808 100%);
      border: 1px solid var(--border-accent);
      padding: 40px 44px;
    }

    .payment-card.featured::before {
      width: 4px;
      top: 20px;
      bottom: 20px;
      background: var(--accent);
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.15);
    }

    /* Card Header */
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-subtle);
    }

    .payment-card.featured .card-header {
      border-bottom-color: var(--border-accent);
    }

    .card-title {
      font-family: 'Widescreen', 'Inter', sans-serif;
      font-weight: 700;
      font-size: 26px;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin: 0;
    }

    .payment-card.featured .card-title {
      color: var(--accent);
      font-size: 28px;
    }

    /* Badges */
    .badge {
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-primary);
      border: 1px solid var(--border-accent);
    }

    /* Card Description */
    .card-description {
      font-size: 17px;
      color: var(--text-secondary);
      line-height: 1.7;
      margin-bottom: 24px;
    }

    .payment-card.featured .card-description {
      color: #999999;
      font-size: 18px;
    }

    /* Payment Details Grid */
    .payment-grid {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .payment-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .payment-row:last-child {
      border-bottom: none;
    }

    .payment-label {
      font-size: 18px;
      color: var(--text-secondary);
      font-weight: 400;
    }

    .payment-value {
      font-family: 'Inter', sans-serif;
      font-size: 22px;
      color: var(--text-primary);
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
    }

    /* Featured Total Box */
    .total-box {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-accent);
      border-radius: 12px;
      padding: 28px 32px;
      text-align: center;
    }

    .total-label {
      font-size: 14px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 12px;
      font-weight: 500;
    }

    .total-value {
      font-family: 'Widescreen', 'Inter', sans-serif;
      font-weight: 700;
      font-size: 42px;
      color: var(--accent);
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }

    .total-savings {
      font-size: 15px;
      color: var(--accent-soft);
      font-weight: 500;
    }

    /* Credit Card Section */
    .installment-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 24px 28px;
      text-align: center;
    }

    .installment-main {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .installment-count {
      font-family: 'Widescreen', 'Inter', sans-serif;
      font-weight: 700;
      font-size: 24px;
      color: var(--text-primary);
    }

    .installment-value {
      font-family: 'Inter', sans-serif;
      font-size: 36px;
      font-weight: 600;
      color: var(--text-primary);
      font-variant-numeric: tabular-nums;
    }

    .installment-total {
      font-size: 14px;
      color: var(--text-muted);
    }

    /* Decorative Elements */
    .decoration-line {
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--border-gold), transparent);
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Monofloor" class="logo-img">` : ''}
    <h1 class="page-title">Pagamento${data.apenasMateriais ? ' <span style="font-size: 0.6em; color: #666;">(Apenas Materiais)</span>' : ''}</h1>
  </div>

  <div class="payment-section">
    <!-- Parcelado -->
    <div class="payment-card">
      <div class="card-header">
        <h2 class="card-title">Parcelado</h2>
      </div>
      <p class="card-description">
        50% de entrada para produção de materiais<br>
        25% em 30 dias • 25% em 60 dias
      </p>
      <div class="payment-grid">
        <div class="payment-row">
          <span class="payment-label">Entrada (50%)</span>
          <span class="payment-value">R$ ${formatarMoeda(valorEntrada)}</span>
        </div>
        <div class="payment-row">
          <span class="payment-label">30 dias (25%)</span>
          <span class="payment-value">R$ ${formatarMoeda(parcela1)}</span>
        </div>
        <div class="payment-row">
          <span class="payment-label">60 dias (25%)</span>
          <span class="payment-value">R$ ${formatarMoeda(parcela2)}</span>
        </div>
      </div>
    </div>

    <!-- À Vista - Featured -->
    <div class="payment-card featured">
      <div class="card-header">
        <h2 class="card-title">À Vista</h2>
        <span class="badge">${descontoVista}% desconto</span>
      </div>
      <p class="card-description">
        Pagamento integral antes do início da execução
      </p>
      <div class="total-box">
        <div class="total-label">Valor com desconto</div>
        <div class="total-value">R$ ${formatarMoeda(valorVista)}</div>
        <div class="total-savings">Economia de R$ ${formatarMoeda(valorTotal - valorVista)}</div>
      </div>
    </div>

    <!-- Cartão de Crédito -->
    <div class="payment-card">
      <div class="card-header">
        <h2 class="card-title">Cartão de Crédito</h2>
        <span class="badge">Juros</span>
      </div>
      <p class="card-description">
        Parcelamento em até ${numeroParcelasCartao}x no cartão
      </p>
      <div class="installment-box">
        <div class="installment-main">
          <span class="installment-count">${numeroParcelasCartao}x</span>
          <span class="installment-value">R$ ${formatarMoeda(parcelaCartao)}</span>
        </div>
        <div class="installment-total">Valor total: R$ ${formatarMoeda(valorComJuros)}</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Aplica bloco de informações do cliente na página 24 (índice 23)
 * Design: imagem de fundo limpa + campos Cliente, Local, Detalhes, Área total
 * Separados por linhas brancas de 1px
 */
async function applyClientInfoOverlays(
  pdf: typeof PDFDocument.prototype,
  data: ProposalData
): Promise<void> {
  // Página 24 (índice 23) contém os dados do cliente
  const infoPageIndex = 23;

  if (pdf.getPageCount() <= infoPageIndex) {
    console.log('⚠️ Template não tem página 23, pulando overlays');
    return;
  }

  const page = pdf.getPage(infoPageIndex);
  const { width, height } = page.getSize();

  // Carregar e aplicar imagem de fundo (usa cache se disponível)
  let bgImageBytes = assetsCache.bgImageBytes;
  if (!bgImageBytes) {
    const bgImagePath = path.join(__dirname, '../../public/slides/slide23-bg.jpg');
    if (fs.existsSync(bgImagePath)) {
      console.log('🖼️ Carregando imagem de fundo do disco (cache miss)...');
      bgImageBytes = fs.readFileSync(bgImagePath);
    }
  } else {
    console.log('🖼️ Usando imagem de fundo do cache');
  }

  if (bgImageBytes) {
    const bgImage = await pdf.embedJpg(bgImageBytes);
    page.drawImage(bgImage, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });
    console.log('✅ Imagem de fundo aplicada');
  } else {
    console.log('⚠️ Imagem de fundo não encontrada');
  }

  // Registrar fontkit para carregar fontes customizadas
  pdf.registerFontkit(fontkit);

  // Carregar fontes Widescreen (usa cache se disponível)
  let fontBold: any;
  let fontRegular: any;

  const fontExBoldBytes = assetsCache.widescreenExBoldBytes;
  const fontRegularBytes = assetsCache.widescreenRegularBytes;

  if (fontExBoldBytes && fontRegularBytes) {
    try {
      console.log('🔤 Usando fontes Widescreen do cache');
      fontBold = await pdf.embedFont(fontExBoldBytes);
      fontRegular = await pdf.embedFont(fontRegularBytes);
      console.log('✅ Fontes Widescreen embebidas');
    } catch (fontError) {
      console.error('❌ Erro ao embeber fontes Widescreen:', fontError);
      fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
      fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    }
  } else {
    // Fallback: tentar carregar do disco
    const fontExBoldPath = path.join(__dirname, '../../public/fonts/Widescreen Ex Bold.otf');
    const fontRegularPath = path.join(__dirname, '../../public/fonts/Widescreen Regular.otf');

    if (fs.existsSync(fontExBoldPath) && fs.existsSync(fontRegularPath)) {
      try {
        console.log('🔤 Carregando fontes do disco (cache miss)...');
        fontBold = await pdf.embedFont(fs.readFileSync(fontExBoldPath));
        fontRegular = await pdf.embedFont(fs.readFileSync(fontRegularPath));
      } catch (fontError) {
        fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
        fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
      }
    } else {
      console.log('⚠️ Fontes Widescreen não encontradas, usando Helvetica');
      fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
      fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    }
  }

  // Cores
  const black = rgb(0, 0, 0);
  const white = rgb(1, 1, 1);

  console.log(`📐 Página 23: ${width}x${height} pontos`);

  // Dimensões do bloco preto central (35% da altura, no meio)
  const blockMarginX = 40;
  const blockWidth = width - (blockMarginX * 2);
  const blockHeight = height * 0.35;
  const blockY = (height - blockHeight) / 2; // Centralizado verticalmente

  // Desenhar retângulo preto de fundo para os textos
  page.drawRectangle({
    x: blockMarginX,
    y: blockY,
    width: blockWidth,
    height: blockHeight,
    color: black,
  });

  // Configurações de texto
  const labelFontSize = 30;
  const valueFontSize = 24; // Aumentado 20% (era 20)
  const paddingX = 30;
  const labelWidth = 250; // Largura reservada para os labels (espaço até os valores)

  // Campos a exibir
  // Remover área do campo detalhes (já aparece em Área total)
  let detalhes = data.clienteDetalhes || '-';
  // Remove padrões como "123m²", "123 m²", "123,45m²", "área: 123m²", etc.
  detalhes = detalhes.replace(/\s*-?\s*(\d+[.,]?\d*)\s*m²/gi, '').replace(/área\s*:?\s*/gi, '').trim();
  if (!detalhes) detalhes = '-';

  // Espaçamentos
  const paddingY = 25; // Espaço vertical entre elementos (mais respiro)
  const lineHeight = valueFontSize * 1.6; // Altura de cada linha de texto (evita sobreposição)

  // Largura máxima para valores (para quebra de linha)
  const maxValueWidth = blockWidth - paddingX * 2 - labelWidth - 20;

  // Função para quebrar texto em múltiplas linhas (respeita \n existentes)
  const wrapText = (text: string, maxWidth: number, font: any, fontSize: number): string[] => {
    const lines: string[] = [];

    // Primeiro, dividir por quebras de linha existentes
    const paragraphs = text.split(/\n/);

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) continue;

      // Depois, quebrar cada parágrafo por largura se necessário
      const words = trimmedParagraph.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
    }

    return lines.length > 0 ? lines : ['-'];
  };

  // Preparar dados dos campos
  const clienteValue = data.clienteNome || '-';
  const localValue = data.clienteLocal || '-';
  const detalhesLines = wrapText(detalhes, maxValueWidth, fontRegular, valueFontSize);
  const areaValue = data.areaTotalInterna ? `${data.areaTotalInterna.toFixed(2)} m² (10% de perda)` : '-';

  // Calcular alturas de cada seção
  const clienteHeight = Math.max(labelFontSize, valueFontSize) + paddingY * 2;
  const localHeight = Math.max(labelFontSize, valueFontSize) + paddingY * 2;
  const detalhesHeight = Math.max(labelFontSize, detalhesLines.length * lineHeight) + paddingY * 2;
  const areaHeight = Math.max(labelFontSize, valueFontSize) + paddingY * 2;

  // Posição Y inicial (topo do bloco, descendo)
  let currentY = blockY + blockHeight - paddingY;

  // === CLIENTE ===
  currentY -= Math.max(labelFontSize, valueFontSize);
  page.drawText('Cliente', {
    x: blockMarginX + paddingX,
    y: currentY,
    size: labelFontSize,
    font: fontBold,
    color: white,
  });
  page.drawText(clienteValue, {
    x: blockMarginX + paddingX + labelWidth,
    y: currentY + (labelFontSize - valueFontSize) / 2,
    size: valueFontSize,
    font: fontRegular,
    color: white,
  });
  console.log(`✅ Campo: Cliente = "${clienteValue}"`);

  // Linha divisória após Cliente
  currentY -= paddingY;
  page.drawLine({
    start: { x: blockMarginX + paddingX, y: currentY },
    end: { x: blockMarginX + blockWidth - paddingX, y: currentY },
    thickness: 1,
    color: white,
  });

  // === LOCAL ===
  currentY -= paddingY + Math.max(labelFontSize, valueFontSize);
  page.drawText('Local', {
    x: blockMarginX + paddingX,
    y: currentY,
    size: labelFontSize,
    font: fontBold,
    color: white,
  });
  page.drawText(localValue, {
    x: blockMarginX + paddingX + labelWidth,
    y: currentY + (labelFontSize - valueFontSize) / 2,
    size: valueFontSize,
    font: fontRegular,
    color: white,
  });
  console.log(`✅ Campo: Local = "${localValue}"`);

  // Linha divisória após Local
  currentY -= paddingY;
  page.drawLine({
    start: { x: blockMarginX + paddingX, y: currentY },
    end: { x: blockMarginX + blockWidth - paddingX, y: currentY },
    thickness: 1,
    color: white,
  });

  // === DETALHES (múltiplas linhas) ===
  currentY -= paddingY + labelFontSize;
  const detalhesLabelY = currentY;
  page.drawText('Detalhes', {
    x: blockMarginX + paddingX,
    y: detalhesLabelY,
    size: labelFontSize,
    font: fontBold,
    color: white,
  });

  // Desenhar cada linha do valor de Detalhes
  let detalhesTextY = detalhesLabelY + (labelFontSize - valueFontSize) / 2;
  for (let i = 0; i < detalhesLines.length; i++) {
    page.drawText(detalhesLines[i], {
      x: blockMarginX + paddingX + labelWidth,
      y: detalhesTextY - (i * lineHeight),
      size: valueFontSize,
      font: fontRegular,
      color: white,
    });
  }
  console.log(`✅ Campo: Detalhes = "${detalhes}" (${detalhesLines.length} linhas)`);

  // Atualizar currentY para a última linha do Detalhes
  const detalhesBottomY = detalhesTextY - ((detalhesLines.length - 1) * lineHeight) - valueFontSize;
  currentY = Math.min(currentY - labelFontSize, detalhesBottomY);

  // Linha divisória após Detalhes (considerando a última linha do texto)
  currentY -= paddingY;
  page.drawLine({
    start: { x: blockMarginX + paddingX, y: currentY },
    end: { x: blockMarginX + blockWidth - paddingX, y: currentY },
    thickness: 1,
    color: white,
  });

  // === ÁREA TOTAL ===
  currentY -= paddingY + Math.max(labelFontSize, valueFontSize);
  page.drawText('Área total', {
    x: blockMarginX + paddingX,
    y: currentY,
    size: labelFontSize,
    font: fontBold,
    color: white,
  });
  page.drawText(areaValue, {
    x: blockMarginX + paddingX + labelWidth,
    y: currentY + (labelFontSize - valueFontSize) / 2,
    size: valueFontSize,
    font: fontRegular,
    color: white,
  });
  console.log(`✅ Campo: Área total = "${areaValue}"`)

  console.log('✅ Bloco de informações aplicado na página 23');
}

/**
 * Aplica os nomes dos produtos (STELION, LILIT) com a fonte NITECLUB
 * nos slides 26 e 27 usando pdf-lib (porque Puppeteer não carrega fontes customizadas bem)
 */
async function applyProductNamesWithNiteclub(
  pdf: typeof PDFDocument.prototype,
  data: ProposalData,
  slide26PageIndex: number,
  slide27PageIndex: number | null
): Promise<void> {
  // Registrar fontkit
  pdf.registerFontkit(fontkit);

  // Carregar fonte NITECLUB (usa cache se disponível)
  let niteclubBytes = assetsCache.niteclubFontBytes;
  if (!niteclubBytes) {
    const niteclubPath = path.join(__dirname, '../../public/NITECLUB.TTF');
    if (!fs.existsSync(niteclubPath)) {
      console.log('⚠️ Fonte NITECLUB não encontrada, pulando');
      return;
    }
    console.log('🔤 Carregando fonte NITECLUB do disco (cache miss)...');
    niteclubBytes = fs.readFileSync(niteclubPath);
  } else {
    console.log('🔤 Usando fonte NITECLUB do cache');
  }

  const niteclubFont = await pdf.embedFont(niteclubBytes);

  const white = rgb(1, 1, 1);

  // Slide 26 - STELION e LILIT (cards de produto)
  if (pdf.getPageCount() > slide26PageIndex) {
    const page26 = pdf.getPage(slide26PageIndex);
    const { height } = page26.getSize();

    // Posições calculadas baseadas no HTML (escala 1:1 com o PDF)
    // body padding: 80px top, 53px left
    // header: ~200px (logo + subtitle + margin)
    // product-card: padding 32px, product-header margin-bottom 27px

    // STELION - primeiro card
    const stelionY = height - 80 - 200 - 32 - 27; // ~1581 de baixo para cima
    page26.drawText('STELION', {
      x: 53 + 32, // padding body + padding card
      y: stelionY,
      size: 44,
      font: niteclubFont,
      color: white,
    });

    // LILIT - segundo card (após o primeiro que tem ~400px de altura)
    const lilitY = stelionY - 400 - 40 - 32 - 27; // gap 40px entre cards
    page26.drawText('LILIT', {
      x: 53 + 32,
      y: lilitY,
      size: 44,
      font: niteclubFont,
      color: white,
    });

    console.log('✅ STELION e LILIT adicionados no slide 26');
  }

  // Slide 27 - STELION e LILIT na tabela (se existir)
  if (slide27PageIndex !== null && pdf.getPageCount() > slide27PageIndex) {
    const page27 = pdf.getPage(slide27PageIndex);
    const { height } = page27.getSize();

    // Tabela começa após header (~253px) + section-title (~56px)
    // thead: ~60px, primeira row começa depois
    const tableStartY = height - 80 - 253 - 56 - 60;

    // STELION na primeira linha da tabela
    if (data.metragemTotalStelion > 0) {
      page27.drawText('STELION', {
        x: 53 + 16, // padding body + padding td
        y: tableStartY - 24, // ajuste para centro da célula
        size: 24,
        font: niteclubFont,
        color: white,
      });
    }

    // LILIT na segunda linha (se houver STELION, senão na primeira)
    if (data.metragemTotalLilit > 0) {
      const lilitRowY = data.metragemTotalStelion > 0
        ? tableStartY - 24 - 73 // altura da row ~73px
        : tableStartY - 24;
      page27.drawText('LILIT', {
        x: 53 + 16,
        y: lilitRowY,
        size: 24,
        font: niteclubFont,
        color: white,
      });
    }

    console.log('✅ Nomes dos produtos adicionados no slide 27');
  }
}

export async function generateProposal(data: ProposalData): Promise<Buffer> {
  const startTime = Date.now();
  let release: (() => Promise<void>) | null = null;

  try {
    console.log('📄 Gerando slides com Puppeteer (Browser Pool)...');

    // Usar browser pool ao invés de criar novo browser
    const pooled = await getPooledPage();
    const page = pooled.page;
    release = pooled.release;

    console.log(`⚡ Página obtida do pool em ${Date.now() - startTime}ms`);

    // Gerar slide de Investimento
    const htmlInvestimento = createProposalHTML(data);
    await page.setContent(htmlInvestimento, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Esperar fontes carregarem (incluindo NITECLUB)
    await page.evaluate(() => document.fonts.ready);
    // Delay reduzido (fontes já estão em base64 inline)
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('✅ Fontes carregadas para slide Investimento');

    const slideInvestimentoBuffer = await page.pdf({
      width: '1080px',
      height: '1920px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true
    });

    console.log('✅ Slide Investimento gerado:', slideInvestimentoBuffer.length, 'bytes');

    // Gerar slide de Pagamento
    console.log('📄 Gerando slide de Pagamento...');
    const htmlPagamento = createPaymentHTML(data);
    await page.setContent(htmlPagamento, { waitUntil: 'domcontentloaded', timeout: 30000 });

    await page.evaluate(() => document.fonts.ready);
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('✅ Fontes carregadas para slide Pagamento');

    const slidePagamentoBuffer = await page.pdf({
      width: '1080px',
      height: '1920px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true
    });

    console.log('✅ Slide Pagamento gerado:', slidePagamentoBuffer.length, 'bytes');

    // Gerar slide de Detalhamento por Superfície
    let slideSuperficiesBuffer: Uint8Array | null = null;

    console.log('🔍 Verificando dados por produto:', {
      metragemStelion: data.metragemTotalStelion,
      metragemLilit: data.metragemTotalLilit,
      pisoStelion: data.pisoStelion,
      pisoLilit: data.pisoLilit
    });

    const hasProductData = data.metragemTotalStelion > 0 || data.metragemTotalLilit > 0;

    console.log('🔍 hasProductData:', hasProductData);

    if (hasProductData) {
      console.log('📄 Gerando slide Detalhamento por Superfície...');
      const htmlSuperficies = createSurfacesTableHTML(data);
      await page.setContent(htmlSuperficies, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Esperar fontes carregarem
      await page.evaluate(() => document.fonts.ready);
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('✅ Fontes carregadas para slide Detalhamento');

      slideSuperficiesBuffer = await page.pdf({
        width: '1080px',
        height: '1920px',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        preferCSSPageSize: true
      });

      console.log('✅ Slide Detalhamento gerado:', slideSuperficiesBuffer.length, 'bytes');
    } else {
      console.log('⚠️ Slide Detalhamento ignorado (sem dados de superfície)');
    }

    // Liberar página de volta ao pool (não fecha o browser)
    if (release) {
      await release();
      console.log(`⚡ Página liberada para o pool (total: ${Date.now() - startTime}ms para slides)`);
    }

    // Carregar PDF template (slides 1-25) - usa cache se disponível
    let templateBytes: Buffer | null = assetsCache.templatePdfBytes;

    if (!templateBytes) {
      const templatePath = path.join(__dirname, '../../public/slides/template.pdf');
      if (!fs.existsSync(templatePath)) {
        console.log('⚠️ Template não encontrado, retornando apenas slides gerados');
        return slideInvestimentoBuffer;
      }
      console.log('📚 Carregando template do disco (cache miss)...');
      templateBytes = fs.readFileSync(templatePath);
    } else {
      console.log('📚 Usando template do cache');
    }

    const templatePdf = await PDFDocument.load(templateBytes);

    console.log(`📄 Template tem ${templatePdf.getPageCount()} páginas`);

    const firstPage = templatePdf.getPage(0);
    const { width: templateWidth, height: templateHeight } = firstPage.getSize();
    console.log(`📐 Dimensões do template: ${templateWidth}x${templateHeight} pontos`);

    const finalPdf = await PDFDocument.create();

    // Copiar as primeiras 24 páginas do template, trocando ordem de 23 e 24
    // Ordem original: 0-21, 22, 23 → Nova ordem: 0-21, 23, 22
    const totalPages = templatePdf.getPageCount();
    const pagesToCopy = Math.min(24, totalPages);

    // Criar array de índices com páginas 22 e 23 trocadas
    const pageIndices = Array.from({ length: pagesToCopy }, (_, i) => {
      if (i === 22) return 23; // Página 23 vai para posição 23 (índice 22)
      if (i === 23) return 22; // Página 24 (antiga 23 com placeholders) vai para posição 24 (índice 23)
      return i;
    });

    const templatePages = await finalPdf.copyPages(templatePdf, pageIndices);
    templatePages.forEach(page => finalPdf.addPage(page));

    console.log(`✅ Copiadas ${templatePages.length} páginas do template (de ${totalPages} totais)`);

    // Aplicar overlays de informações do cliente na página 24
    if (data.clienteNome || data.clienteLocal || data.clienteDetalhes || data.areaTotalInterna) {
      console.log('📝 Aplicando overlays de informações do cliente...');
      await applyClientInfoOverlays(finalPdf, data);
    }

    // Copiar slide de Investimento
    const slideInvestimentoPdf = await PDFDocument.load(slideInvestimentoBuffer);
    const slideInvestimentoPages = await finalPdf.copyPages(slideInvestimentoPdf, [0]);
    slideInvestimentoPages.forEach(page => finalPdf.addPage(page));
    console.log('✅ Slide Investimento adicionado');

    // Copiar slide de Pagamento
    const slidePagamentoPdf = await PDFDocument.load(slidePagamentoBuffer);
    const slidePagamentoPages = await finalPdf.copyPages(slidePagamentoPdf, [0]);
    slidePagamentoPages.forEach(page => finalPdf.addPage(page));
    console.log('✅ Slide Pagamento adicionado');

    // Copiar slide de Detalhamento por Superfície (se existir)
    if (slideSuperficiesBuffer) {
      const slideSuperficiesPdf = await PDFDocument.load(slideSuperficiesBuffer);
      const slideSuperficiesPages = await finalPdf.copyPages(slideSuperficiesPdf, [0]);
      slideSuperficiesPages.forEach(page => finalPdf.addPage(page));
      console.log('✅ Slide Detalhamento adicionado');
    }

    const finalPdfBytes = await finalPdf.save();
    const finalBuffer = Buffer.from(finalPdfBytes);

    console.log('✅ PDF final gerado:', finalBuffer.length, 'bytes');

    return finalBuffer;

  } catch (error) {
    console.error('❌ Erro ao gerar proposta:', error);
    if (release) {
      try {
        await release();
        console.log('⚡ Página liberada após erro');
      } catch (releaseError) {
        console.error('❌ Erro ao liberar página:', releaseError);
      }
    }
    throw error;
  }
}

export async function compressPDF(pdfBuffer: Buffer): Promise<Buffer> {
  console.log('⚠️ Compressão de PDF não implementada - retornando original');
  return pdfBuffer;
}
