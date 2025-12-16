# ⚡ Início Rápido - Gerador de Relatório de Vídeo

## 🎯 Setup em 5 Minutos

### 1️⃣ Instalar FFmpeg

```bash
# macOS
brew install ffmpeg

# Verificar instalação
ffmpeg -version
```

### 2️⃣ Configurar Backend

O backend já está rodando no servidor principal do Monofloor.

**URL padrão:** `http://localhost:3000`

Se precisar rodar localmente:

```bash
# Vá para o projeto monofloor-admin
cd "/Users/rodrigoconte/Primeiro projeto/monofloor-admin"

# Instale dependências (se ainda não fez)
npm install

# Configure .env com sua API key da OpenAI
echo "OPENAI_API_KEY=sk-proj-..." >> .env

# Inicie o servidor
npm run dev
```

### 3️⃣ Abrir Interface

```bash
# Abra o arquivo no navegador
open "/Users/rodrigoconte/Primeiro projeto/projeto relatorio/index.html"
```

Ou arraste `index.html` para o navegador.

### 4️⃣ Usar

1. **Configure a URL** do backend (se necessário)
2. **Arraste um vídeo** ou clique para selecionar
3. **Preencha os dados** do projeto e técnico
4. **Clique em "Gerar Relatório"**
5. **Aguarde 2-5 minutos**
6. **Baixe o PDF**

---

## 🎥 Teste Rápido

Use este vídeo de exemplo para testar:

```bash
# Grave um vídeo curto (30-60 segundos) da sua obra
# Ou use qualquer vídeo MP4 que você tenha
```

**Dados de teste:**
- Projeto: "Teste Residência"
- Técnico: "Seu Nome"
- Data: Hoje
- Objetivo: "Vistoria Inicial"

---

## ✅ Checklist de Funcionamento

- [ ] FFmpeg instalado (`ffmpeg -version`)
- [ ] Backend rodando (`http://localhost:3000`)
- [ ] Status da API: 🟢 Online (no canto da tela)
- [ ] Vídeo carregado com sucesso
- [ ] PDF gerado e baixado

---

## 🆘 Problemas Comuns

### Status da API: 🔴 Offline

```bash
# Inicie o backend
cd monofloor-admin
npm run dev
```

### "FFmpeg not found"

```bash
brew install ffmpeg
```

### "OpenAI API key not found"

Adicione no `.env` do monofloor-admin:
```
OPENAI_API_KEY=sk-proj-...
```

---

## 📞 Precisa de Ajuda?

WhatsApp: (41) 98848-4477
