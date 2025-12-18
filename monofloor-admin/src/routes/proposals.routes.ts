import express from 'express';
import { generateProposal, compressPDF } from '../services/google-slides.service';

const router = express.Router();

/**
 * POST /api/proposals/generate
 * Gera proposta em PDF a partir dos dados do formulário
 */
router.post('/generate', async (req, res) => {
  try {
    console.log('📊 Gerando proposta...', req.body);

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

export default router;
