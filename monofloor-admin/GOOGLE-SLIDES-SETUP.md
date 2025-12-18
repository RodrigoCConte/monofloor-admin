# 🎯 Como Configurar Google Slides API

Para gerar propostas em PDF, você precisa configurar credenciais do Google Cloud.

## 📋 Passo a Passo

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o **Project ID**

### 2. Ativar APIs Necessárias

No Google Cloud Console, ative as seguintes APIs:

1. **Google Slides API**
   - https://console.cloud.google.com/apis/library/slides.googleapis.com

2. **Google Drive API**
   - https://console.cloud.google.com/apis/library/drive.googleapis.com

### 3. Criar Service Account

1. Vá em **IAM & Admin** → **Service Accounts**
2. Clique em **Create Service Account**
3. Preencha:
   - **Nome**: `monofloor-proposals`
   - **Descrição**: `Service account para gerar propostas`
4. Clique em **Create and Continue**
5. Selecione o papel: **Editor** (ou crie um papel customizado com permissões específicas)
6. Clique em **Done**

### 4. Gerar Chave JSON

1. Na lista de Service Accounts, clique no account que você criou
2. Vá na aba **Keys**
3. Clique em **Add Key** → **Create new key**
4. Escolha **JSON**
5. A chave será baixada automaticamente

### 5. Configurar Permissões na Apresentação

1. Abra a [apresentação template](https://docs.google.com/presentation/d/1G4Cgb-EQNq4MTf_cSPvHaYYCMxk6BSi8ZjFU1GLTUZ0/edit)
2. Clique em **Compartilhar**
3. Adicione o **email do Service Account** (exemplo: `monofloor-proposals@seu-projeto.iam.gserviceaccount.com`)
4. Dê permissão de **Editor**
5. Clique em **Compartilhar**

### 6. Adicionar Credenciais no .env

1. Abra o arquivo `.env` do backend
2. Adicione a variável `GOOGLE_SLIDES_CREDENTIALS`:

```env
# Google Slides API Credentials (JSON da service account)
GOOGLE_SLIDES_CREDENTIALS='{
  "type": "service_account",
  "project_id": "seu-projeto-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "monofloor-proposals@seu-projeto.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}'
```

**⚠️ IMPORTANTE:**
- Copie TODO o conteúdo do arquivo JSON baixado
- Remova quebras de linha (deixe em uma única linha)
- As quebras de linha da chave privada devem ser `\\n` (dupla barra)

### 7. Testar

Reinicie o servidor e teste gerando uma proposta!

```bash
cd monofloor-admin
npm run dev
```

## 🔒 Segurança

- ❌ **NUNCA** comite o arquivo `.env` ou a chave JSON no git
- ✅ O `.env` já está no `.gitignore`
- ✅ Mantenha as credenciais seguras

## ⚙️ Placeholders na Apresentação

Os seguintes placeholders serão substituídos no Slide 26:

### STELION:
- `{{areste}}` → Área STELION com 10% perda
- `{{Matste}}` → Materiais STELION sem impostos
- `{{Instate}}` → Instalação STELION sem impostos
- `{{impste}}` → Impostos STELION
- `{{totste}}` → Total por m² STELION
- `{{Totgeste}}` → Total geral STELION

### LILIT:
- `{{Areli}}` → Área LILIT com 10% perda
- `{{matli}}` → Materiais LILIT sem impostos
- `{{Instill}}` → Instalação LILIT sem impostos
- `{{Impli}}` → Impostos LILIT
- `{{Totli}}` → Total por m² LILIT (590 se área = 0)
- `{{totgeli}}` → Total geral LILIT

### TOTAIS:
- `{{Tottot}}` → Área total geral
- `{{Totmat}}` → Valor total materiais
- `{{Totinst}}` → Valor total instalação
- `{{Totimp}}` → Valor total impostos
- `{{Totare}}` → Total m² geral
- `{{totget}}` → Total geral (STELION + LILIT)

## 📝 Exemplo de Uso

```javascript
// O frontend envia para: POST /api/proposals/generate
{
  "metragemTotalStelion": 111.11,
  "materiaisStelion": 50000,
  "maoObraStelion": 13333.33,
  "impostosStelion": 17000,
  "valorTotalStelion": 101111.11,
  // ... outros campos
}

// Backend retorna PDF para download
```
