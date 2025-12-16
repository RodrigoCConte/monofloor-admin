# 📄 Geração de Relatórios em Formato DOCX

## ✅ Implementado

O sistema agora suporta geração de relatórios no formato **Word/DOCX**, seguindo o template oficial da Monofloor.

---

## 🎯 Como Usar

### Na Interface:

1. Selecione os vídeos normalmente
2. Preencha os dados do projeto
3. **Novo:** Escolha o formato do relatório:
   - **PDF (Design Monofloor)** - PDF com fundo cinza e paleta de cores
   - **Word/DOCX (Template Oficial)** - Documento Word editável

4. Se escolher DOCX, preencha também:
   - **Nome do Cliente** (opcional, usa nome do projeto se vazio)
   - **Endereço da Obra** (opcional)

5. Gere o relatório normalmente

---

## 📋 Template DOCX

O template segue o modelo oficial `/Users/rodrigoconte/Downloads/Cópia Modelo Relatório da Visita Monofloor.docx`:

### Estrutura do Documento:

```
Cliente: [nome do cliente]
Endereço: [endereço da obra]
Data da visita: [DD/MM/YYYY]

Prezado(s) senhor(es),

segue abaixo um detalhamento das observações feitas pelo nosso(a)
colaborador(a) durante a visita à sua obra...

[Texto padrão sobre o sistema]

1. [Tópico 1]
   [Imagem]
   [Análise técnica]

2. [Tópico 2]
   [Imagem]
   [Análise técnica]

...

Atenciosamente,
Equipe Monofloor Revestimentos
```

### Formatação:

- **Fonte:** Montserrat (padrão do template)
- **Tamanhos:**
  - Cabeçalho: Bold
  - Saudação: 12pt Bold
  - Tópicos: 11pt Bold
  - Texto corrido: 10pt
  - Análises: 10pt justificado

---

## 🛠️ Arquivos Criados/Modificados

### Novos Arquivos:

1. **`src/services/docx-report.service.ts`**
   - Service TypeScript que coordena geração DOCX
   - Chama script Python via spawn

2. **`scripts/generate-docx.py`**
   - Script Python que gera DOCX usando python-docx
   - Implementa template Monofloor
   - Adiciona imagens e formatação

### Arquivos Modificados:

3. **`src/services/video-report.service.ts`**
   - Adicionado suporte para `outputFormat: 'pdf' | 'docx'`
   - Adicionados campos `clientName` e `address`
   - Chama DOCX service quando formato = 'docx'

4. **`src/routes/admin/video-reports.routes.ts`**
   - Aceita novos parâmetros: `outputFormat`, `clientName`, `address`
   - Define Content-Type correto (DOCX ou PDF)
   - Define extensão correta no filename

5. **`projeto relatorio/index.html`**
   - Dropdown para escolher formato (PDF ou DOCX)
   - Campos condicionais para DOCX (cliente e endereço)
   - Atualizado progresso para refletir novas fases
   - Download dinâmico (.pdf ou .docx)

---

## 🐍 Dependências Python

O sistema usa **python-docx** para gerar os arquivos DOCX:

```bash
pip3 install python-docx
```

Já foi instalado automaticamente na primeira execução.

---

## 🔄 Fluxo de Geração DOCX

```
1. Frontend envia outputFormat='docx'
      ↓
2. Backend processa vídeo normalmente
   - Extração inteligente de frames
   - Análise técnica com GPT-4
   - Agrupamento semântico por tópicos
      ↓
3. video-report.service.ts detecta format='docx'
      ↓
4. Chama docx-report.service.ts
      ↓
5. docx-report.service.ts cria JSON temporário
      ↓
6. Executa scripts/generate-docx.py
      ↓
7. Python gera DOCX com python-docx
   - Segue template Monofloor
   - Fonte Montserrat
   - Adiciona imagens inline
   - Formatação profissional
      ↓
8. Retorna buffer DOCX
      ↓
9. Backend envia ao frontend
      ↓
10. Download automático do arquivo .docx
```

---

## ✨ Vantagens do DOCX

### ✅ Editável:
- Cliente pode editar texto depois
- Adicionar ou remover imagens
- Ajustar formatação

### ✅ Familiar:
- Todo mundo conhece Word
- Fácil de compartilhar
- Compatível com Google Docs

### ✅ Template Oficial:
- Segue exatamente o modelo Monofloor
- Texto padrão já incluído
- Profissional e padronizado

### ✅ Flexível:
- Pode converter para PDF depois
- Pode inserir em outros documentos
- Pode extrair imagens facilmente

---

## 📊 Comparação PDF vs DOCX

| Aspecto | PDF | DOCX |
|---------|-----|------|
| **Editável** | ❌ Não | ✅ Sim |
| **Design** | ✅ Fundo cinza, paleta | ⚪ Fundo branco, simples |
| **Template** | Custom Monofloor | Modelo oficial |
| **Tamanho** | Menor (~2-5MB) | Maior (~5-10MB) |
| **Compatibilidade** | Universal | Requer Word/LibreOffice |
| **Uso** | Apresentação final | Rascunho editável |

---

## 🎯 Quando Usar Cada Formato

### Use **PDF** quando:
- Relatório final para cliente
- Não precisa editar depois
- Quer design profissional com cores
- Precisa garantir que não vai ser alterado

### Use **DOCX** quando:
- Cliente quer editar depois
- Ainda está em revisão
- Precisa combinar com outros documentos
- Quer seguir template oficial exato

---

## 🧪 Testar

1. Inicie o backend:
```bash
cd monofloor-admin && npm run dev
```

2. Abra a interface: `http://localhost:8080/index.html`

3. Faça upload de vídeo(s)

4. Escolha **"Word/DOCX (Template Oficial)"**

5. Preencha cliente e endereço (opcional)

6. Gere o relatório

7. Abra o arquivo `.docx` no Word ou LibreOffice

---

## ⚙️ Configuração

### Fonte Montserrat:

O template usa a fonte **Montserrat**. Se não estiver instalada:

**Mac:**
```bash
# A fonte será usada se disponível, caso contrário usa fonte padrão
```

**Windows:**
- Baixe Montserrat do Google Fonts
- Instale no sistema

**Alternativa:**
- O DOCX especifica Montserrat
- Se não tiver, Word usa fonte similar automaticamente

---

## 🐛 Solução de Problemas

### Erro: "No module named 'docx'"
```bash
pip3 install python-docx
```

### Erro: "Python script failed"
- Verifique se Python 3 está instalado: `python3 --version`
- Instale python-docx: `pip3 install python-docx`

### Imagens não aparecem:
- As imagens são embutidas no DOCX
- Verifique se os frames foram extraídos corretamente
- Abra o DOCX e vá em Inserir → Imagens para ver

### Formatação estranha:
- Certifique-se de que está usando Word ou LibreOffice atualizado
- Google Docs pode ter problemas com formatação avançada

---

## 📝 Notas Técnicas

### Python Script:
- Localizado em `scripts/generate-docx.py`
- Usa biblioteca `python-docx`
- Recebe JSON com dados via arquivo temporário
- Gera DOCX e retorna path

### TypeScript Service:
- Usa `child_process.spawn` para executar Python
- Não bloqueia event loop do Node.js
- Captura stdout/stderr do Python
- Retorna Buffer do DOCX gerado

### Formato JSON:
```json
{
  "clientName": "João Silva",
  "address": "Rua ABC, 123",
  "visitDate": "2024-12-15",
  "topicGroups": [
    {
      "topic": "Banheiros",
      "description": "Condições dos banheiros",
      "frames": [
        {
          "imagePath": "/path/to/frame.jpg",
          "analysis": "Análise técnica..."
        }
      ]
    }
  ]
}
```

---

## 🚀 Próximas Melhorias

- [ ] Logo Monofloor no cabeçalho do DOCX
- [ ] Estilos customizados do Word (Heading 1, Heading 2)
- [ ] Numeração automática de figuras
- [ ] Sumário automático
- [ ] Marca d'água "Monofloor"
- [ ] Metadados do documento (autor, empresa, etc.)

---

## 💡 Sugestões de Uso

### Workflow Recomendado:

1. **Primeira versão:** Gerar em DOCX
   - Cliente pode revisar e solicitar alterações
   - Fácil editar texto e análises

2. **Versão final:** Converter para PDF
   - Quando tudo estiver aprovado
   - Versão "selada" para apresentação

### Combinação com PDF:

Você pode gerar ambos os formatos e enviar ao cliente:
- **DOCX** para revisão interna
- **PDF** para apresentação formal

---

## 📞 Suporte

**WhatsApp:** (41) 98848-4477
**Email:** contato@monofloor.com.br
