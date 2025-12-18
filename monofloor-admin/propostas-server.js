/**
 * Servidor Standalone para Gerador de Propostas
 * Porta: 1111
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 1111;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração especial para servir arquivos de fonte com headers corretos
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.ttf') || path.endsWith('.TTF')) {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Content-Type', 'font/ttf');
    }
    if (path.endsWith('.woff') || path.endsWith('.WOFF')) {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Content-Type', 'font/woff');
    }
    if (path.endsWith('.woff2') || path.endsWith('.WOFF2')) {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Content-Type', 'font/woff2');
    }
  }
}));

// Rota principal - serve o arquivo propostas.html
app.get('/', (req, res) => {
  // Disable cache for development
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'propostas.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Monofloor Propostas',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log('   Monofloor - Gerador de Propostas');
  console.log('   ========================================');
  console.log(`   ✅ Servidor rodando em: http://localhost:${PORT}`);
  console.log(`   📄 Acesse: http://localhost:${PORT}`);
  console.log(`   💚 Health: http://localhost:${PORT}/health`);
  console.log('   ========================================\n');
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Rejeição não tratada:', reason);
});
