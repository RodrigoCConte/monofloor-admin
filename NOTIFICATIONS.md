# Diretrizes de Notificações - Monofloor Equipes

Este documento define o padrão visual e técnico para todas as notificações do app.

---

## Arquitetura de Notificações

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Admin Panel    │────▶│  Backend API    │────▶│  Push Service   │
│  (Vue.js)       │     │  (Express)      │     │  (web-push)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                              ┌─────────────────────────┘
                              ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  App Mobile     │◀────│  Service Worker │◀────│  Push Payload   │
│  (app.js)       │     │  (sw.js)        │     │  (JSON)         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Fluxo Real-time (App Aberto)
1. Backend emite evento via **Socket.io**
2. App recebe e exibe animação imediatamente

### Fluxo Push (App Fechado/Background)
1. Backend envia push via **web-push**
2. Service Worker recebe e mostra notificação nativa
3. Ao clicar, SW envia mensagem para o app
4. App exibe animação

---

## Tipos de Notificações

### 1. XP Gain (Elogio/Recompensa)

**Quando usar:** Elogios do admin, check-in, conclusão de tarefas, bônus

**Elementos visuais:**
- Ícone principal: 🏆 (troféu)
- Ícone secundário: ⭐ (estrela no canto)
- Cor tema: Dourado (#fbbf24, #f59e0b)
- Background: Gradiente escuro com glow dourado
- Confetti colorido caindo
- Estrelas flutuando para cima
- Anéis expandindo do centro
- Raios girando

**Animações:**
- Bounce do container
- Pop do ícone com rotação
- Pulse do glow
- Confetti fall (30 partículas)
- Star float up (6 estrelas)
- Star burst (12 raios)

**Feedback:**
- Vibração celebratória: `[100, 100, 200, 100, 300]`
- Som de celebração (opcional)

**Botão:** "Continuar" (dourado)

**Código exemplo:**
```javascript
showXPGain(100, 'Elogio do supervisor');
```

---

### 2. XP Loss (Penalidade)

**Quando usar:** Penalidades do admin, atrasos, faltas, não envio de relatório

**Elementos visuais:**
- Ícone principal: 😢 (emoji triste)
- Ícone secundário: ⭐ (estrela caindo, dessaturada)
- Cor tema: Vermelho (#ef4444, #dc2626)
- Background: Gradiente escuro avermelhado
- Vinheta escura nas bordas
- Flash vermelho inicial
- Rachaduras saindo do centro
- Números caindo

**Animações:**
- Screen shake
- Flash vermelho (0.3s)
- Shake do ícone
- Crack appear (6 linhas)
- Falling stars (8 estrelas)
- Falling numbers (6 números)

**Feedback:**
- Vibração intensa: `[100, 50, 100, 50, 200, 50, 300]`
- Som grave (opcional)

**Botão:** "Continuar" (vermelho)

**Código exemplo:**
```javascript
showXPLoss(50, 'Atraso no check-in');
```

---

### 3. Notificação de Sucesso (Genérica)

**Quando usar:** Ações completadas, confirmações

**Elementos visuais:**
- Ícone: ✓ (check) ou emoji contextual
- Cor tema: Verde (#22c55e)
- Modal com glow verde

**Código exemplo:**
```javascript
showGameAlert({
    type: 'success',
    icon: '✓',
    title: 'SUCESSO',
    message: 'Ação realizada com sucesso'
});
```

---

### 4. Notificação de Alerta/Warning

**Quando usar:** Avisos, lembretes, atenção necessária

**Elementos visuais:**
- Ícone: ⚠️ ou emoji contextual
- Cor tema: Laranja (#f97316)
- Modal com glow laranja

---

### 5. Notificação de Erro

**Quando usar:** Falhas, erros de sistema

**Elementos visuais:**
- Ícone: ✕ ou 🚫
- Cor tema: Vermelho (#ef4444)
- Modal com glow vermelho

---

## Estrutura do Push Payload

```typescript
interface PushPayload {
  title: string;           // Título da notificação nativa
  body: string;            // Corpo da notificação nativa
  icon?: string;           // Ícone (default: /icons/icon-192.png)
  badge?: string;          // Badge (default: /icons/badge-72.png)
  tag?: string;            // Tag para agrupar notificações
  requireInteraction?: boolean;  // Requer clique para fechar
  data: {
    type: string;          // Tipo da notificação (xp:bonus, xp:penalty, etc)
    amount?: number;       // Quantidade (para XP)
    reason?: string;       // Motivo
    url?: string;          // URL de destino ao clicar
    [key: string]: any;    // Dados extras
  };
}
```

### Tipos de data.type:
- `xp:bonus` - Ganho de XP (elogio)
- `xp:penalty` - Perda de XP (penalidade)
- `report:reminder` - Lembrete de relatório
- `checkin:nearby` - Projeto próximo
- `campaign:new` - Nova campanha
- `role:evolution` - Evolução de cargo

---

## Padrões de Vibração

```javascript
// Celebração (XP gain, sucesso)
navigator.vibrate([100, 100, 200, 100, 300]);

// Alerta intenso (XP loss, erro)
navigator.vibrate([100, 50, 100, 50, 200, 50, 300]);

// Notificação simples
navigator.vibrate([200, 100, 200]);

// Lembrete suave
navigator.vibrate([100, 50, 100]);
```

---

## Paleta de Cores

| Tipo | Cor Principal | Cor Secundária | Glow |
|------|---------------|----------------|------|
| XP Gain | #fbbf24 | #f59e0b | rgba(251, 191, 36, 0.8) |
| XP Loss | #ef4444 | #dc2626 | rgba(239, 68, 68, 0.8) |
| Sucesso | #22c55e | #16a34a | rgba(34, 197, 94, 0.5) |
| Alerta | #f97316 | #ea580c | rgba(249, 115, 22, 0.5) |
| Info | #3b82f6 | #2563eb | rgba(59, 130, 246, 0.5) |

---

## Arquivos Relevantes

### App Mobile
- `monofloor-app/app.js` - Funções de animação
  - `showXPGain(amount, reason)` - Animação de ganho
  - `showXPLoss(amount, reason)` - Animação de perda
  - `showGameAlert(options)` - Alerta genérico
- `monofloor-app/styles.css` - Estilos das animações
- `monofloor-app/sw.js` - Service Worker (recebe push)

### Backend
- `monofloor-admin/src/services/push.service.ts` - Envio de push
  - `sendXPBonusPush()` - Push de ganho de XP
  - `sendXPPenaltyPush()` - Push de perda de XP
  - `sendXPAdjustmentPush()` - Push genérico de XP
- `monofloor-admin/src/services/socket.service.ts` - Eventos Socket.io
  - `emitXPGained()` - Evento de ganho
  - `emitXPLost()` - Evento de perda

---

## Checklist para Nova Notificação

1. [ ] Definir tipo e contexto de uso
2. [ ] Escolher emojis/ícones (principal + secundário)
3. [ ] Definir cor tema (usar paleta existente)
4. [ ] Criar animação no `app.js`
5. [ ] Adicionar estilos no `styles.css`
6. [ ] Criar função de push no `push.service.ts`
7. [ ] Adicionar handler no `sw.js` (se necessário)
8. [ ] Definir padrão de vibração
9. [ ] Testar em dispositivo móvel
10. [ ] Documentar neste arquivo

---

## Notas de Design

- **Mobile-first:** Otimizar para telas 375x812px
- **Performance:** Limitar partículas (max 30-50)
- **Acessibilidade:** Botão "Continuar" sempre visível
- **Consistência:** Usar emojis nativos, não imagens
- **Feedback:** Sempre incluir vibração em mobile
