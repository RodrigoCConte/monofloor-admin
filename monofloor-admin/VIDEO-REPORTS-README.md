# Sistema de Relatórios Automáticos de Vídeo

## Visão Geral

Sistema que processa vídeos de visita técnica e gera relatórios em PDF automaticamente usando IA.

### Como funciona:
1. Técnico faz upload do vídeo
2. FFmpeg extrai frames (screenshots) automaticamente
3. GPT-4 Vision analisa cada frame
4. Sistema gera PDF estruturado com imagens + análises

---

## Configuração

### 1. Variáveis de Ambiente

Adicione no arquivo `.env`:

```env
OPENAI_API_KEY=sk-proj-...
```

### 2. Dependências

Certifique-se de ter FFmpeg instalado no sistema:

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows (via chocolatey)
choco install ffmpeg
```

### 3. Instalar Pacotes Node.js

```bash
npm install fluent-ffmpeg pdfkit sharp
```

---

## Como Usar

### Opção 1: Interface HTML (Recomendado)

1. Abra o arquivo:
   ```
   monofloor-admin/public/relatorio-video.html
   ```

2. Preencha os dados:
   - Nome do Projeto
   - Nome do Técnico
   - Data da Visita
   - Objetivo da Visita
   - Observações (opcional)

3. Arraste o vídeo ou clique para selecionar

4. Clique em "Gerar Relatório"

5. Aguarde o processamento (pode levar alguns minutos dependendo do tamanho do vídeo)

6. Baixe o PDF gerado

### Opção 2: API Direta

```bash
POST http://localhost:3000/api/admin/reports/video-process

Content-Type: multipart/form-data

Fields:
- video: [arquivo de vídeo]
- projectName: "Residência Silva"
- technicianName: "João Silva"
- visitDate: "2024-12-15"
- visitPurpose: "vistoria"
- observations: "Cliente solicitou..."
- frameInterval: 10 (opcional, padrão: 10 segundos)
- maxFrames: 30 (opcional, padrão: 30 frames)
- analysisPrompt: "..." (opcional)
```

---

## Configurações Avançadas

### Intervalo de Captura
- **Padrão**: 10 segundos
- **Mínimo**: 5 segundos
- **Máximo**: 60 segundos
- **Descrição**: Quanto menor, mais imagens serão extraídas (e mais custoso)

### Máximo de Imagens
- **Padrão**: 30 imagens
- **Mínimo**: 10 imagens
- **Máximo**: 100 imagens
- **Descrição**: Limite total de frames extraídos do vídeo

### Instrução para IA
Você pode personalizar o prompt que a IA usa para analisar cada frame. Por padrão:

```
Analise esta imagem de obra. Descreva o que vê, identifique problemas,
medições visíveis, qualidade da aplicação e próximos passos necessários.
```

---

## Estrutura do Relatório Gerado

O PDF contém:

1. **Cabeçalho**
   - Logo Monofloor
   - Título "Relatório de Visita Técnica"

2. **Informações do Projeto**
   - Nome do projeto
   - Técnico responsável
   - Data da visita
   - Objetivo da visita
   - Observações gerais

3. **Análises com Imagens**
   - Para cada frame extraído:
     - Timestamp (ex: "00:15")
     - Imagem do vídeo
     - Análise da IA descrevendo:
       - O que está sendo mostrado
       - Problemas identificados
       - Qualidade da aplicação
       - Medições visíveis
       - Próximos passos

4. **Rodapé**
   - Data/hora de geração
   - Assinatura "Monofloor Revestimentos"

---

## Custos

### Por Vídeo de 5 Minutos:

| Item | Quantidade | Custo Unitário | Total |
|------|------------|----------------|-------|
| Frames extraídos | 30 | Grátis (FFmpeg) | R$ 0,00 |
| Análise GPT-4 Vision | 30 imagens | $0.01 | $0.30 |
| Geração PDF | 1 | Grátis (PDFKit) | R$ 0,00 |
| **TOTAL** | - | - | **~$0.30 (~R$ 1,50)** |

### Estimativa Mensal:
- 50 vídeos/mês = **$15/mês** (~R$ 75)
- 100 vídeos/mês = **$30/mês** (~R$ 150)

### ROI:
Se cada vídeo economiza 30 minutos de trabalho manual:
- 50 vídeos × 30min × R$ 20/h = **R$ 500/mês economizados**
- Custo: R$ 75/mês
- **Economia líquida: R$ 425/mês**

---

## Limitações

1. **Tamanho máximo**: 500MB por vídeo
2. **Formatos suportados**: MP4, MOV, AVI
3. **Processamento**: ~2-5 minutos dependendo do tamanho
4. **Rate Limits**: OpenAI tem limite de requisições/minuto (processa em lotes)

---

## Troubleshooting

### Erro: "FFmpeg not found"
```bash
# Instale o FFmpeg no sistema
brew install ffmpeg  # macOS
```

### Erro: "OpenAI API key not found"
```bash
# Configure no .env
OPENAI_API_KEY=sk-proj-...
```

### Erro: "File too large"
- Reduza o vídeo para menos de 500MB
- Use compressão (HandBrake, FFmpeg)

### Processamento muito lento
- Reduza `maxFrames` (ex: 20 ao invés de 30)
- Aumente `frameInterval` (ex: 15s ao invés de 10s)

---

## Exemplos de Uso

### Vistoria Inicial
```
Projeto: Residência Silva
Técnico: João Silva
Data: 15/12/2024
Objetivo: Vistoria Inicial
Observações: Cliente solicitou orçamento para 120m² de STELION Mirage

Resultado:
- 25 frames analisados
- Identificadas 3 áreas com problema de umidade
- Recomendação: impermeabilização antes da aplicação
```

### Acompanhamento de Obra
```
Projeto: Apartamento Jardins
Técnico: Maria Costa
Data: 16/12/2024
Objetivo: Acompanhamento de Obra
Observações: Verificação da aplicação do STELION Ash

Resultado:
- 30 frames analisados
- Qualidade da aplicação: excelente
- Progresso: 60% concluído
- Próximos passos: lixamento e selador
```

---

## Roadmap

- [ ] Suporte a múltiplos vídeos por relatório
- [ ] Detecção automática de momentos importantes (scene detection)
- [ ] Reconhecimento de medições em trenas/paquímetros
- [ ] Comparação antes/depois
- [ ] Integração com Pipefy (anexar relatório ao card)
- [ ] Envio automático por email/WhatsApp

---

## Suporte

Em caso de dúvidas ou problemas:
- Email: suporte@monofloor.com.br
- WhatsApp: (41) 98848-4477
