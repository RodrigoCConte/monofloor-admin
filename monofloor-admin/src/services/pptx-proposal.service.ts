// @ts-nocheck
import PptxGenJS from 'pptxgenjs';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const TEMPLATE_PATH = path.join(__dirname, '../../Proposta para automação..pptx');

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

function createReplacements(data: ProposalData) {
  const replacements: { [key: string]: string } = {};

  // STELION
  replacements['{{areste}}'] = formatarMetragem(data.metragemTotalStelion);
  replacements['{{Matste}}'] = formatarMoeda(data.materiaisStelion);
  replacements['{{Instate}}'] = formatarMoeda(data.maoObraStelion);
  replacements['{{impste}}'] = formatarMoeda(data.impostosStelion);
  replacements['{{totste}}'] = formatarMoeda(
    data.metragemTotalStelion > 0
      ? data.valorTotalStelion / data.metragemTotalStelion
      : 0
  );
  replacements['{{Totgeste}}'] = formatarMoeda(data.valorTotalStelion);

  // LILIT
  replacements['{{Areli}}'] = formatarMetragem(data.metragemTotalLilit);
  replacements['{{matli}}'] = formatarMoeda(data.materiaisLilit);
  replacements['{{Instill}}'] = formatarMoeda(data.maoObraLilit);
  replacements['{{Impli}}'] = formatarMoeda(data.impostosLilit);

  // Regra especial: se área LILIT = 0, Totli = 590
  if (data.metragemTotalLilit === 0) {
    replacements['{{Totli}}'] = '590,00';
  } else {
    replacements['{{Totli}}'] = formatarMoeda(data.valorTotalLilit / data.metragemTotalLilit);
  }

  replacements['{{totgeli}}'] = formatarMoeda(data.valorTotalLilit);

  // TOTAIS GERAIS
  replacements['{{Tottot}}'] = formatarMetragem(data.metragemTotal);
  replacements['{{Totmat}}'] = formatarMoeda(data.materiaisTotal);
  replacements['{{Totinst}}'] = formatarMoeda(data.maoObraTotal);
  replacements['{{Totimp}}'] = formatarMoeda(data.impostosTotal);
  replacements['{{Totare}}'] = formatarMetragem(data.metragemTotal);
  replacements['{{totget}}'] = formatarMoeda(data.valorTotal);

  return replacements;
}

// Função para substituir texto em todos os slides
function replaceTextInPresentation(pres: PptxGenJS, replacements: { [key: string]: string }) {
  pres.slides.forEach((slide: any) => {
    // Iterar por todos os objetos do slide
    slide._rels.forEach((obj: any) => {
      if (obj.type === 'text' || obj.type === 'placeholder') {
        // Verificar se o objeto tem texto
        if (obj.text) {
          // Se for string simples
          if (typeof obj.text === 'string') {
            Object.entries(replacements).forEach(([placeholder, value]) => {
              obj.text = obj.text.replace(new RegExp(placeholder, 'g'), value);
            });
          }
          // Se for array de objetos (texto formatado)
          else if (Array.isArray(obj.text)) {
            obj.text = obj.text.map((textObj: any) => {
              if (typeof textObj.text === 'string') {
                Object.entries(replacements).forEach(([placeholder, value]) => {
                  textObj.text = textObj.text.replace(new RegExp(placeholder, 'g'), value);
                });
              }
              return textObj;
            });
          }
        }
      }
    });
  });
}

export async function generateProposal(data: ProposalData): Promise<Buffer> {
  try {
    console.log('📄 Gerando proposta a partir do template PPTX...');

    // Criar nova apresentação
    const pres = new PptxGenJS();

    // Tentar carregar o template (pptxgenjs não suporta carregar arquivos existentes diretamente)
    // Vamos usar uma abordagem diferente: ler o XML do .pptx e modificar

    console.log('⚠️ AVISO: pptxgenjs não suporta modificar apresentações existentes.');
    console.log('📝 Vou criar a apresentação do zero com os dados fornecidos.');

    // Por enquanto, vamos criar um slide simples com os dados
    // Isso é temporário até implementarmos uma solução melhor
    const slide = pres.addSlide();

    // Adicionar título
    slide.addText('Proposta Monofloor', {
      x: 1,
      y: 0.5,
      w: 8,
      h: 1,
      fontSize: 32,
      bold: true,
      color: 'c9a962',
      align: 'center'
    });

    // Adicionar dados STELION
    slide.addText('STELION', {
      x: 1,
      y: 2,
      w: 3,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: '333333'
    });

    const replacements = createReplacements(data);
    let yPos = 2.6;

    // Criar tabela com dados STELION
    const stelionData = [
      ['Metragem Total', replacements['{{areste}}'] + ' m²'],
      ['Materiais', 'R$ ' + replacements['{{Matste}}']],
      ['Instalação', 'R$ ' + replacements['{{Instate}}']],
      ['Impostos', 'R$ ' + replacements['{{impste}}']],
      ['Total por m²', 'R$ ' + replacements['{{totste}}']],
      ['Total Geral', 'R$ ' + replacements['{{Totgeste}}']],
    ];

    slide.addTable(stelionData, {
      x: 1,
      y: yPos,
      w: 4,
      fontSize: 12,
      border: { pt: 1, color: 'CFCFCF' },
      fill: { color: 'F7F7F7' }
    });

    // Adicionar dados LILIT
    slide.addText('LILIT', {
      x: 5.5,
      y: 2,
      w: 3,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: '333333'
    });

    const lilitData = [
      ['Metragem Total', replacements['{{Areli}}'] + ' m²'],
      ['Materiais', 'R$ ' + replacements['{{matli}}']],
      ['Instalação', 'R$ ' + replacements['{{Instill}}']],
      ['Impostos', 'R$ ' + replacements['{{Impli}}']],
      ['Total por m²', 'R$ ' + replacements['{{Totli}}']],
      ['Total Geral', 'R$ ' + replacements['{{totgeli}}']],
    ];

    slide.addTable(lilitData, {
      x: 5.5,
      y: yPos,
      w: 4,
      fontSize: 12,
      border: { pt: 1, color: 'CFCFCF' },
      fill: { color: 'F7F7F7' }
    });

    // Adicionar totais gerais
    slide.addText('TOTAIS GERAIS', {
      x: 1,
      y: 5,
      w: 8.5,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: 'c9a962',
      align: 'center'
    });

    const totaisData: any[][] = [
      ['Área Total', replacements['{{Tottot}}'] + ' m²'],
      ['Total Materiais', 'R$ ' + replacements['{{Totmat}}']],
      ['Total Instalação', 'R$ ' + replacements['{{Totinst}}']],
      ['Total Impostos', 'R$ ' + replacements['{{Totimp}}']],
      ['VALOR TOTAL', 'R$ ' + replacements['{{totget}}']],
    ];

    slide.addTable(totaisData as any, {
      x: 2,
      y: 5.6,
      w: 6,
      fontSize: 14,
      border: { pt: 2, color: 'c9a962' },
      fill: { color: 'FFFFFF' },
      fontFace: 'Arial'
    });

    // Gerar PPTX em buffer
    const pptxBuffer = await pres.write({ outputType: 'nodebuffer' }) as Buffer;

    console.log('✅ Apresentação PPTX gerada:', pptxBuffer.length, 'bytes');

    // Por enquanto, retornar o PPTX
    // TODO: Converter para PDF usando LibreOffice ou outra ferramenta
    return pptxBuffer as Buffer;

  } catch (error) {
    console.error('❌ Erro ao gerar proposta:', error);
    throw error;
  }
}

export async function compressPDF(pdfBuffer: Buffer): Promise<Buffer> {
  // TODO: Implementar compressão real se necessário
  console.log('⚠️ Compressão de PDF não implementada - retornando original');
  return pdfBuffer;
}
