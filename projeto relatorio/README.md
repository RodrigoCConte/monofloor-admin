# 🎥 Monofloor - Gerador de Relatório de Vídeo

Sistema automatizado que processa vídeos de visita técnica e gera relatórios em PDF usando Inteligência Artificial.

---

## 🚀 Como Funciona

1. **Técnico faz upload do vídeo** da visita técnica
2. **FFmpeg extrai frames** (screenshots) automaticamente a cada X segundos
3. **GPT-4 Vision analisa** cada frame identificando:
   - Problemas na obra
   - Qualidade da aplicação
   - Medições visíveis
   - Próximos passos necessários
4. **Sistema gera PDF** estruturado com:
   - Imagens extraídas
   - Análises da IA
   - Informações do projeto

**Resultado:** Relatório técnico completo em 2-5 minutos, economizando 30-60 minutos de trabalho manual.

---

## 📦 Estrutura do Projeto

```
projeto relatorio/
├── index.html              # Interface web (frontend)
├── logo.png                # Logo Monofloor
├── README.md               # Este arquivo
├── backend/                # Código do servidor (copiar do monofloor-admin)
│   ├── video-report.service.ts
│   └── video-reports.routes.ts
└── exemplos/               # Exemplos de relatórios gerados
```

---

## 🛠️ Instalação

### Pré-requisitos

1. **Node.js** (v16 ou superior)
2. **FFmpeg** instalado no sistema
3. **Chave da API OpenAI**

### Instalando FFmpeg

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows (via chocolatey)
choco install ffmpeg
```

### Configuração

1. **Clone ou copie os arquivos do backend:**

```bash
# Os arquivos necessários estão em:
/monofloor-admin/src/services/video-report.service.ts
/monofloor-admin/src/routes/admin/video-reports.routes.ts
```

2. **Instale as dependências:**

```bash
cd backend
npm install fluent-ffmpeg pdfkit sharp openai multer
```

3. **Configure variáveis de ambiente:**

Crie um arquivo `.env`:

```env
OPENAI_API_KEY=sk-proj-...
PORT=3000
```

4. **Inicie o servidor:**

```bash
npm run dev
```

---

## 💻 Como Usar

### Opção 1: Interface Web (Recomendada)

1. Abra `index.html` no navegador
2. Configure a URL do backend (padrão: `http://localhost:3000`)
3. Arraste o vídeo ou clique para selecionar
4. Preencha os dados:
   - Nome do Projeto
   - Nome do Técnico
   - Data da Visita
   - Objetivo da Visita
5. (Opcional) Ajuste configurações avançadas:
   - Intervalo de captura (padrão: 10s)
   - Máximo de imagens (padrão: 30)
   - Instrução customizada para IA
6. Clique em "Gerar Relatório"
7. Aguarde o processamento (2-5 minutos)
8. Baixe o PDF gerado

### Opção 2: API Direta

```bash
curl -X POST http://localhost:3000/api/admin/reports/video-process \
  -F "video=@video.mp4" \
  -F "projectName=Residência Silva" \
  -F "technicianName=João Silva" \
  -F "visitDate=2024-12-15" \
  -F "visitPurpose=vistoria" \
  -F "observations=Cliente solicitou..." \
  -F "frameInterval=10" \
  -F "maxFrames=30" \
  --output relatorio.pdf
```

---

## 📊 Exemplo de Relatório Gerado

### Estrutura do PDF:

```
┌─────────────────────────────────────────┐
│  RELATÓRIO DE VISITA TÉCNICA            │
│  Monofloor Revestimentos                │
└─────────────────────────────────────────┘

Projeto: Residência Silva
Técnico: João Silva
Data da Visita: 15/12/2024
Objetivo: Vistoria Inicial
Observações: Cliente solicitou orçamento...

────────────────────────────────────────────

1. Análise aos 00:10
┌─────────────────────────┐
│    [IMAGEM DO FRAME]    │
└─────────────────────────┘

Análise GPT-4:
Contrapiso nivelado e preparado. Superfície lisa e
sem rachaduras visíveis. Identificada pequena mancha
de umidade na parede norte, recomenda-se
impermeabilização antes da aplicação do STELION.
Área estimada: 45m².

────────────────────────────────────────────

2. Análise aos 00:20
┌─────────────────────────┐
│    [IMAGEM DO FRAME]    │
└─────────────────────────┘

Análise GPT-4:
Parede preparada, pronta para aplicação. Cor
especificada: STELION Mirage. Medições visíveis
indicam aproximadamente 3,5m de altura por 12m
de comprimento. Total aproximado: 42m².

[... 28 análises adicionais ...]

────────────────────────────────────────────

Gerado automaticamente em 15/12/2024 14:35
Monofloor Revestimentos
```

---

## 💰 Custos

### Por Vídeo:

| Vídeo | Frames | Custo OpenAI | Total |
|-------|--------|--------------|-------|
| 5 min | 30 | $0.30 | ~R$ 1,50 |
| 10 min | 60 | $0.60 | ~R$ 3,00 |
| 15 min | 90 | $0.90 | ~R$ 4,50 |

**Cálculo:** 30 frames × $0.01/frame = $0.30

### ROI (Retorno sobre Investimento):

**Sem automação:**
- Tempo manual: 30-60 minutos
- Custo: R$ 10-20 (hora técnica)

**Com automação:**
- Tempo: 2-5 minutos
- Custo: R$ 1,50
- **Economia: R$ 8,50-18,50 por vídeo**

**Mensal (50 vídeos):**
- Custo: R$ 75
- Economia: R$ 425-925
- **ROI: 567% - 1.233%**

---

## ⚙️ Configurações Avançadas

### Intervalo de Captura
- **Padrão:** 10 segundos
- **Mínimo:** 5 segundos (mais imagens, maior custo)
- **Máximo:** 60 segundos (menos imagens, menor custo)

**Recomendação:**
- Vistoria detalhada: 5-7 segundos
- Acompanhamento: 10-15 segundos
- Visão geral: 20-30 segundos

### Máximo de Imagens
- **Padrão:** 30 imagens
- **Mínimo:** 10 imagens
- **Máximo:** 100 imagens

**Recomendação:**
- Vídeo curto (< 3min): 15-20 imagens
- Vídeo médio (3-10min): 25-40 imagens
- Vídeo longo (> 10min): 50-80 imagens

### Instrução Customizada para IA

Você pode personalizar o que a IA deve buscar em cada frame:

**Padrão:**
```
Analise esta imagem de obra. Descreva o que vê,
identifique problemas, medições visíveis, qualidade
da aplicação e próximos passos necessários.
```

**Exemplos customizados:**

Para **identificação de problemas:**
```
Analise esta imagem buscando especificamente:
rachaduras, infiltrações, desníveis, manchas de
umidade, áreas danificadas. Liste todos os problemas
encontrados com localização aproximada.
```

Para **medições:**
```
Identifique todas as medições visíveis nesta imagem
(trenas, réguas, medidores). Extraia os valores em
metros e calcule áreas quando possível.
```

Para **qualidade:**
```
Avalie a qualidade da aplicação nesta imagem.
Verifique uniformidade, acabamento, espessura
aparente, defeitos visíveis e conformidade com
especificações técnicas do STELION.
```

---

## 🔧 Troubleshooting

### Erro: "FFmpeg not found"

```bash
# Verifique se FFmpeg está instalado
ffmpeg -version

# Se não estiver, instale:
brew install ffmpeg  # macOS
```

### Erro: "OpenAI API key not found"

```bash
# Adicione no .env
echo "OPENAI_API_KEY=sk-proj-..." >> .env
```

### Erro: "File too large"

- **Solução 1:** Reduza o vídeo para menos de 500MB
- **Solução 2:** Comprima o vídeo usando HandBrake ou FFmpeg:

```bash
ffmpeg -i video-original.mp4 -vcodec h264 -crf 28 video-comprimido.mp4
```

### Processamento muito lento

- **Reduza `maxFrames`:** 20 ao invés de 30
- **Aumente `frameInterval`:** 15s ao invés de 10s
- **Verifique conexão com internet:** OpenAI API requer boa conexão

### PDF não gera ou está vazio

- **Verifique logs do servidor**
- **Teste a API OpenAI separadamente**
- **Confirme que FFmpeg extraiu os frames** (pasta temp/)

---

## 📱 Compartilhando com a Equipe

### Método 1: Enviar HTML

1. Copie `index.html` e `logo.png`
2. Envie por email/WhatsApp
3. Pessoa abre `index.html` no navegador
4. Configura URL do backend
5. Usa normalmente

### Método 2: Hospedar Online

```bash
# Opção A: GitHub Pages (grátis)
# 1. Crie repositório no GitHub
# 2. Faça upload de index.html e logo.png
# 3. Ative GitHub Pages nas configurações
# 4. Acesse: https://seuuser.github.io/projeto-relatorio

# Opção B: Netlify/Vercel (grátis)
# 1. Faça deploy do index.html
# 2. Configure variável de ambiente BACKEND_URL
```

### Método 3: Servidor Interno

```bash
# Use nginx ou Apache para servir o index.html
# Configure reverse proxy para o backend
```

---

## 🚀 Próximas Melhorias

- [ ] Suporte a múltiplos vídeos por relatório
- [ ] Detecção automática de cenas importantes
- [ ] Reconhecimento de medições (OCR em trenas)
- [ ] Comparação antes/depois automática
- [ ] Integração com Pipefy (anexar PDF ao card)
- [ ] Envio automático por email/WhatsApp
- [ ] Versão mobile (PWA)
- [ ] Dashboard de relatórios gerados
- [ ] Templates customizáveis de PDF
- [ ] Suporte a múltiplos idiomas

---

## 📞 Suporte

**Monofloor Revestimentos**
- Email: contato@monofloor.com.br
- WhatsApp: (41) 98848-4477
- Site: www.monofloor.com.br

---

## 📄 Licença

Projeto proprietário - Monofloor Revestimentos © 2024
