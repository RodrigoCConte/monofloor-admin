// @ts-nocheck
import puppeteer from 'puppeteer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

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

  // DADOS DO CLIENTE (para overlay na página de info)
  clienteNome?: string;
  clienteLocal?: string;
  clienteDetalhes?: string;
  areaTotalInterna?: number;
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

// Helper para carregar logo como base64
function loadLogoBase64(): string {
  const logoPath = path.join(__dirname, '../../public/artboard 1.png');
  try {
    const logoBuffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.warn('⚠️ Não foi possível carregar a logo:', error);
    return '';
  }
}

// Helper para carregar fonte NITECLUB como base64
function getNiteclubFontBase64(): string {
  const fontPath = path.join(__dirname, '../../public/NITECLUB.TTF');
  try {
    const fontBuffer = fs.readFileSync(fontPath);
    return `data:font/truetype;base64,${fontBuffer.toString('base64')}`;
  } catch (error) {
    console.warn('⚠️ Não foi possível carregar a fonte NITECLUB:', error);
    return '';
  }
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
      font-size: 21px;
      font-weight: 500;
      color: #ffffff;
      vertical-align: baseline;
      margin-left: 4px;
      position: relative;
      top: 1px;
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
      font-size: 19px;
      color: #999999;
      font-weight: 500;
    }

    .value-amount {
      font-family: 'Inter', sans-serif;
      font-size: 21px;
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
      font-size: 24px;
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
      font-size: 15px;
      color: #666666;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .total-item-value {
      font-family: 'Inter', sans-serif;
      font-size: 24px;
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
      font-size: 17px;
      color: #666666;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 11px;
    }

    .grand-total-value {
      font-family: 'Inter', sans-serif;
      font-size: 43px;
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
    <div class="subtitle">INVESTIMENTO</div>
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
        ${data.pisoStelion ? `<div class="value-row surface-row">
          <span class="value-label">↳ Piso</span>
          <span class="value-amount">${formatarMetragem(data.pisoStelion)} m²</span>
        </div>` : ''}
        ${data.paredeStelion ? `<div class="value-row surface-row">
          <span class="value-label">↳ Parede</span>
          <span class="value-amount">${formatarMetragem(data.paredeStelion)} m²</span>
        </div>` : ''}
        <div class="value-row">
          <span class="value-label">Valor por m²</span>
          <span class="value-amount">R$ ${totalM2Stelion}/m²</span>
        </div>
        <div class="value-row">
          <span class="value-label">Materiais</span>
          <span class="value-amount">R$ ${formatarMoeda(data.materiaisStelion)}</span>
        </div>
        <div class="value-row">
          <span class="value-label">Instalação</span>
          <span class="value-amount">R$ ${formatarMoeda(data.maoObraStelion)}</span>
        </div>
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
        ${data.pisoLilit ? `<div class="value-row surface-row">
          <span class="value-label">↳ Piso</span>
          <span class="value-amount">${formatarMetragem(data.pisoLilit)} m²</span>
        </div>` : ''}
        ${data.paredeLilit ? `<div class="value-row surface-row">
          <span class="value-label">↳ Parede</span>
          <span class="value-amount">${formatarMetragem(data.paredeLilit)} m²</span>
        </div>` : ''}
        <div class="value-row">
          <span class="value-label">Valor por m²</span>
          <span class="value-amount">R$ ${totalM2Lilit}/m²</span>
        </div>
        <div class="value-row">
          <span class="value-label">Materiais</span>
          <span class="value-amount">R$ ${formatarMoeda(data.materiaisLilit)}</span>
        </div>
        <div class="value-row">
          <span class="value-label">Instalação</span>
          <span class="value-amount">R$ ${formatarMoeda(data.maoObraLilit)}</span>
        </div>
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
    <div class="total-title">Investimento Total</div>
    <div class="total-grid">
      <div class="total-item">
        <div class="total-item-label">Área Total</div>
        <div class="total-item-value">${formatarMetragem(data.metragemTotal)} m²</div>
      </div>
      <div class="total-item">
        <div class="total-item-label">Materiais</div>
        <div class="total-item-value">R$ ${formatarMoeda(data.materiaisTotal)}</div>
      </div>
      <div class="total-item">
        <div class="total-item-label">Instalação</div>
        <div class="total-item-value">R$ ${formatarMoeda(data.maoObraTotal)}</div>
      </div>
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

// HTML template - Slide 27 - Detalhamento por Produto
function createSurfacesTableHTML(data: ProposalData): string {
  const logoBase64 = loadLogoBase64();
  const niteclubFontBase64 = getNiteclubFontBase64();

  const valorM2Stelion = data.metragemTotalStelion > 0
    ? data.valorTotalStelion / data.metragemTotalStelion
    : data.precoBaseStelion || 910;

  const valorM2Lilit = data.metragemTotalLilit > 0
    ? data.valorTotalLilit / data.metragemTotalLilit
    : data.precoBaseLilit || 590;

  const temStelion = data.metragemTotalStelion > 0;
  const temLilit = data.metragemTotalLilit > 0;

  const descricaoStelion = data.pisoStelion && data.pisoStelion > 0
    ? 'Piso + Superfícies Especiais'
    : 'Superfícies Especiais';
  const descricaoLilit = data.pisoLilit && data.pisoLilit > 0
    ? 'Piso + Parede + Teto'
    : 'Parede + Teto';

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
      font-weight: 500;
      color: #ffffff;
      vertical-align: baseline;
    }

    .row-stelion {
      background: rgba(201, 169, 98, 0.08);
    }

    .row-lilit {
      background: rgba(100, 150, 200, 0.08);
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
      grid-template-columns: ${temStelion && temLilit ? '1fr 1fr' : '1fr'};
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
    <div class="subtitle">DETALHAMENTO POR PRODUTO</div>
  </div>

  <!-- Tabela de Produtos -->
  <div class="table-container">
    <div class="section-title">Investimento por Produto</div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Produto</th>
          <th>Área Total</th>
          <th>R$/m²</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${temStelion ? `
        <tr class="row-stelion">
          <td>
            <div class="product-cell">
              <span class="product-name">STELION<span class="trademark">™</span></span>
              <span class="surface-desc">${descricaoStelion}</span>
            </div>
          </td>
          <td>${formatarMetragem(data.metragemTotalStelion)} m²</td>
          <td>R$ ${formatarMoeda(valorM2Stelion)}</td>
          <td>R$ ${formatarMoeda(data.valorTotalStelion)}</td>
        </tr>
        ` : ''}
        ${temLilit ? `
        <tr class="row-lilit">
          <td>
            <div class="product-cell">
              <span class="product-name">LILIT<span class="trademark">™</span></span>
              <span class="surface-desc">${descricaoLilit}</span>
            </div>
          </td>
          <td>${formatarMetragem(data.metragemTotalLilit)} m²</td>
          <td>R$ ${formatarMoeda(valorM2Lilit)}</td>
          <td>R$ ${formatarMoeda(data.valorTotalLilit)}</td>
        </tr>
        ` : ''}
      </tbody>
    </table>

    <!-- Resumo por Produto -->
    <div class="totals-section">
      <div class="totals-title">Resumo por Produto</div>
      <div class="totals-grid">
        ${temStelion ? `
        <div class="total-card">
          <div class="total-card-label">STELION™</div>
          <div class="total-card-area">${formatarMetragem(data.metragemTotalStelion)} m²</div>
          <div class="total-card-value">R$ ${formatarMoeda(data.valorTotalStelion)}</div>
        </div>
        ` : ''}
        ${temLilit ? `
        <div class="total-card">
          <div class="total-card-label">LILIT™</div>
          <div class="total-card-area">${formatarMetragem(data.metragemTotalLilit)} m²</div>
          <div class="total-card-value">R$ ${formatarMoeda(data.valorTotalLilit)}</div>
        </div>
        ` : ''}
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

  // Carregar e aplicar imagem de fundo
  const bgImagePath = path.join(__dirname, '../../public/slides/slide23-bg.jpg');
  if (fs.existsSync(bgImagePath)) {
    console.log('🖼️ Carregando imagem de fundo do slide 23...');
    const bgImageBytes = fs.readFileSync(bgImagePath);
    const bgImage = await pdf.embedJpg(bgImageBytes);

    // Desenhar imagem cobrindo toda a página (sem bordas)
    page.drawImage(bgImage, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });
    console.log('✅ Imagem de fundo aplicada');
  } else {
    console.log('⚠️ Imagem de fundo não encontrada:', bgImagePath);
  }

  // Registrar fontkit para carregar fontes customizadas
  pdf.registerFontkit(fontkit);

  // Carregar fontes Widescreen
  const fontExBoldPath = path.join(__dirname, '../../public/fonts/Widescreen Ex Bold.otf');
  const fontRegularPath = path.join(__dirname, '../../public/fonts/Widescreen Regular.otf');

  console.log('🔍 Verificando fontes:');
  console.log('  - Ex Bold path:', fontExBoldPath);
  console.log('  - Ex Bold exists:', fs.existsSync(fontExBoldPath));
  console.log('  - Regular path:', fontRegularPath);
  console.log('  - Regular exists:', fs.existsSync(fontRegularPath));

  let fontBold: any;
  let fontRegular: any;

  if (fs.existsSync(fontExBoldPath) && fs.existsSync(fontRegularPath)) {
    try {
      console.log('🔤 Carregando fontes Widescreen...');
      const fontExBoldBytes = fs.readFileSync(fontExBoldPath);
      const fontRegularBytes = fs.readFileSync(fontRegularPath);
      console.log('📦 Bytes lidos - ExBold:', fontExBoldBytes.length, 'Regular:', fontRegularBytes.length);
      fontBold = await pdf.embedFont(fontExBoldBytes);
      fontRegular = await pdf.embedFont(fontRegularBytes);
      console.log('✅ Fontes Widescreen carregadas (Ex Bold + Regular)');
    } catch (fontError) {
      console.error('❌ Erro ao carregar fontes Widescreen:', fontError);
      fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
      fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    }
  } else {
    console.log('⚠️ Fontes Widescreen não encontradas, usando Helvetica');
    fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
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
  const labelFontSize = 22; // Aumentado 20% (era 18)
  const valueFontSize = 20;
  const paddingX = 30;
  const labelWidth = 180; // Largura reservada para os labels

  // Campos a exibir
  // Remover área do campo detalhes (já aparece em Área total)
  let detalhes = data.clienteDetalhes || '-';
  // Remove padrões como "123m²", "123 m²", "123,45m²", "área: 123m²", etc.
  detalhes = detalhes.replace(/\s*-?\s*(\d+[.,]?\d*)\s*m²/gi, '').replace(/área\s*:?\s*/gi, '').trim();
  if (!detalhes) detalhes = '-';

  const fields = [
    { label: 'Cliente', value: data.clienteNome || '-' },
    { label: 'Local', value: data.clienteLocal || '-' },
    { label: 'Detalhes', value: detalhes },
    { label: 'Área total', value: data.areaTotalInterna ? `${data.areaTotalInterna.toFixed(2)} m² (10% de perda)` : '-' },
  ];

  const rowHeight = blockHeight / fields.length;

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i];
    const rowY = blockY + blockHeight - ((i + 1) * rowHeight) + (rowHeight / 2) - (valueFontSize / 3);

    // Desenhar label (bold)
    page.drawText(field.label, {
      x: blockMarginX + paddingX,
      y: rowY,
      size: labelFontSize,
      font: fontBold,
      color: white,
    });

    // Desenhar valor ao lado
    page.drawText(field.value, {
      x: blockMarginX + paddingX + labelWidth,
      y: rowY,
      size: valueFontSize,
      font: fontRegular,
      color: white,
    });

    // Desenhar linha divisória branca (exceto após o último)
    if (i < fields.length - 1) {
      const lineY = blockY + blockHeight - ((i + 1) * rowHeight);
      page.drawLine({
        start: { x: blockMarginX + paddingX, y: lineY },
        end: { x: blockMarginX + blockWidth - paddingX, y: lineY },
        thickness: 1,
        color: white,
      });
    }

    console.log(`✅ Campo: ${field.label} = "${field.value}"`);
  }

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

  // Carregar fonte NITECLUB
  const niteclubPath = path.join(__dirname, '../../public/NITECLUB.TTF');
  if (!fs.existsSync(niteclubPath)) {
    console.log('⚠️ Fonte NITECLUB não encontrada, pulando');
    return;
  }

  console.log('🔤 Carregando fonte NITECLUB para nomes dos produtos...');
  const niteclubBytes = fs.readFileSync(niteclubPath);
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
  try {
    console.log('📄 Gerando slides 26 e 27 com Puppeteer...');

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: 1080,
      height: 1920,
      deviceScaleFactor: 2
    });

    // Gerar slide 26 (Investimento)
    const html26 = createProposalHTML(data);
    await page.setContent(html26, { waitUntil: 'networkidle0', timeout: 60000 });

    // Esperar fontes carregarem (incluindo NITECLUB)
    await page.evaluate(() => document.fonts.ready);
    // Pequeno delay adicional para garantir renderização da fonte
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('✅ Fontes carregadas para slide 26');

    const slide26Buffer = await page.pdf({
      width: '1080px',
      height: '1920px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true
    });

    console.log('✅ Slide 26 gerado:', slide26Buffer.length, 'bytes');

    // Gerar slide 27 (Detalhamento por Produto)
    let slide27Buffer: Uint8Array | null = null;

    console.log('🔍 Verificando dados por produto:', {
      metragemStelion: data.metragemTotalStelion,
      metragemLilit: data.metragemTotalLilit,
      pisoStelion: data.pisoStelion,
      pisoLilit: data.pisoLilit
    });

    const hasProductData = data.metragemTotalStelion > 0 || data.metragemTotalLilit > 0;

    console.log('🔍 hasProductData:', hasProductData);

    if (hasProductData) {
      console.log('📄 Gerando slide 27 (Detalhamento por Produto)...');
      const html27 = createSurfacesTableHTML(data);
      await page.setContent(html27, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Esperar fontes carregarem
      await page.evaluate(() => document.fonts.ready);
      // Pequeno delay adicional para garantir renderização
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ Fontes carregadas para slide 27');

      slide27Buffer = await page.pdf({
        width: '1080px',
        height: '1920px',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        preferCSSPageSize: true
      });

      console.log('✅ Slide 27 gerado:', slide27Buffer.length, 'bytes');
    } else {
      console.log('⚠️ Slide 27 ignorado (sem dados de superfície)');
    }

    await browser.close();

    // Carregar PDF template (slides 1-25)
    const templatePath = path.join(__dirname, '../../public/slides/template.pdf');

    if (!fs.existsSync(templatePath)) {
      console.log('⚠️ Template não encontrado, retornando apenas slides gerados');
      return slide26Buffer;
    }

    console.log('📚 Carregando template...');
    const templateBytes = fs.readFileSync(templatePath);
    const templatePdf = await PDFDocument.load(templateBytes);

    console.log(`📄 Template tem ${templatePdf.getPageCount()} páginas`);

    const firstPage = templatePdf.getPage(0);
    const { width: templateWidth, height: templateHeight } = firstPage.getSize();
    console.log(`📐 Dimensões do template: ${templateWidth}x${templateHeight} pontos`);

    const slide26Pdf = await PDFDocument.load(slide26Buffer);
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

    // Copiar slide 26
    const slide26Pages = await finalPdf.copyPages(slide26Pdf, [0]);
    slide26Pages.forEach(page => finalPdf.addPage(page));
    console.log('✅ Slide 26 adicionado');

    // Copiar slide 27 (se existir)
    if (slide27Buffer) {
      const slide27Pdf = await PDFDocument.load(slide27Buffer);
      const slide27Pages = await finalPdf.copyPages(slide27Pdf, [0]);
      slide27Pages.forEach(page => finalPdf.addPage(page));
      console.log('✅ Slide 27 adicionado');
    }

    const finalPdfBytes = await finalPdf.save();
    const finalBuffer = Buffer.from(finalPdfBytes);

    console.log('✅ PDF final gerado:', finalBuffer.length, 'bytes');

    return finalBuffer;

  } catch (error) {
    console.error('❌ Erro ao gerar proposta:', error);
    throw error;
  }
}

export async function compressPDF(pdfBuffer: Buffer): Promise<Buffer> {
  console.log('⚠️ Compressão de PDF não implementada - retornando original');
  return pdfBuffer;
}
