# ⚙️ Guia de Configuração de Performance

## 🎛️ Ajustes Finos por Cenário

### Cenário 1: Poucos Drones (< 20)
**Objetivo**: Máxima responsividade

```typescript
// lib/performanceUtils.ts - uploadDroneAudioBatch
// Processa todos de uma vez (sem lotes)
export async function uploadDroneAudioBatch(..., maxConcurrent: number = 20)

// app/page.tsx - Chamada
await uploadDroneAudioBatch(sessionId, droneAudioList, 20);
```

```typescript
// lib/performanceUtils.ts - pollAnalysisResult
// Polling mais agressivo
let pollInterval = 100; // 100ms inicial
```

**Resultado**: Resposta em ~1-2 segundos

---

### Cenário 2: Médio Porte (20-100 drones)
**Objetivo**: Balancear velocidade e estabilidade

```typescript
// CONFIGURAÇÃO PADRÃO ATUAL (já otimizada)
await uploadDroneAudioBatch(sessionId, droneAudioList, 10);
```

```typescript
// Polling balanceado (padrão)
let pollInterval = 200; // 200ms inicial
```

**Resultado**: Resposta em ~4-8 segundos

---

### Cenário 3: Grande Escala (100-500 drones)
**Objetivo**: Evitar sobrecarga do servidor

```typescript
// Lotes menores para não sobrecarregar
await uploadDroneAudioBatch(sessionId, droneAudioList, 5);
```

```typescript
// Polling mais conservador
let pollInterval = 300; // 300ms inicial
pollInterval = Math.min(pollInterval * 1.3, 2000); // Max 2s
```

**Resultado**: Resposta em ~15-25 segundos

---

### Cenário 4: Rede Lenta (3G/4G)
**Objetivo**: Compensar latência

```typescript
// Menos requisições simultâneas
await uploadDroneAudioBatch(sessionId, droneAudioList, 3);
```

```typescript
// Polling mais espaçado
let pollInterval = 500; // 500ms inicial
const maxAttempts = 30; // Mais tentativas
```

---

### Cenário 5: Servidor Potente (Dedicado)
**Objetivo**: Máxima throughput

```typescript
// Lotes maiores
await uploadDroneAudioBatch(sessionId, droneAudioList, 50);
```

```typescript
// Polling muito agressivo
let pollInterval = 50; // 50ms inicial
pollInterval = Math.min(pollInterval * 1.1, 500); // Max 500ms
```

---

## 🔧 Parâmetros Ajustáveis

### 1. Tamanho do Lote (`maxConcurrent`)

**Localização**: `app/page.tsx` linhas ~337 e ~419

```typescript
// VALOR BAIXO (conservador)
await uploadDroneAudioBatch(sessionId, droneAudioList, 3);
// Prós: Menos carga no servidor
// Contras: Mais lento

// VALOR PADRÃO (balanceado)
await uploadDroneAudioBatch(sessionId, droneAudioList, 10);
// Prós: Bom equilíbrio
// Contras: Nenhum significativo

// VALOR ALTO (agressivo)
await uploadDroneAudioBatch(sessionId, droneAudioList, 20);
// Prós: Muito rápido
// Contras: Pode sobrecarregar servidor fraco
```

---

### 2. Intervalo de Polling Inicial

**Localização**: `lib/performanceUtils.ts` linha ~52

```typescript
// VALOR BAIXO (responsivo)
let pollInterval = 100; // 100ms
// Prós: Detecta resultado mais rápido
// Contras: Mais requisições ao servidor

// VALOR PADRÃO (balanceado)
let pollInterval = 200; // 200ms
// Prós: Bom equilíbrio
// Contras: Nenhum significativo

// VALOR ALTO (conservador)
let pollInterval = 500; // 500ms
// Prós: Menos carga no servidor
// Contras: Latência maior para obter resultado
```

---

### 3. Fator de Backoff

**Localização**: `lib/performanceUtils.ts` linha ~67

```typescript
// BACKOFF LENTO (mais tentativas rápidas)
pollInterval = Math.min(pollInterval * 1.1, 1000);
// 200ms -> 220ms -> 242ms -> 266ms ...

// BACKOFF PADRÃO (balanceado)
pollInterval = Math.min(pollInterval * 1.2, 1000);
// 200ms -> 240ms -> 288ms -> 345ms ...

// BACKOFF RÁPIDO (escalona mais rápido)
pollInterval = Math.min(pollInterval * 1.5, 1000);
// 200ms -> 300ms -> 450ms -> 675ms -> 1000ms
```

---

### 4. Máximo de Tentativas

**Localização**: `lib/performanceUtils.ts` linha ~49

```typescript
// POUCAS TENTATIVAS (timeout rápido)
maxAttempts: number = 10
// Timeout total: ~6-8 segundos

// PADRÃO (balanceado)
maxAttempts: number = 15
// Timeout total: ~12-15 segundos

// MUITAS TENTATIVAS (mais tolerante)
maxAttempts: number = 30
// Timeout total: ~25-30 segundos
```

---

## 📊 Matriz de Decisão

| Fator | Valor Baixo | Valor Padrão | Valor Alto |
|-------|-------------|--------------|------------|
| **maxConcurrent** | 3-5 | 10 | 20-50 |
| **pollInterval** | 100ms | 200ms | 500ms |
| **backoff** | 1.1x | 1.2x | 1.5x |
| **maxAttempts** | 10 | 15 | 30 |

### Quando usar cada configuração:

#### Configuração CONSERVADORA (servidor fraco)
```typescript
maxConcurrent = 3
pollInterval = 500
backoff = 1.3
maxAttempts = 20
```

#### Configuração BALANCEADA (recomendada)
```typescript
maxConcurrent = 10   // ← PADRÃO ATUAL
pollInterval = 200   // ← PADRÃO ATUAL
backoff = 1.2        // ← PADRÃO ATUAL
maxAttempts = 15     // ← PADRÃO ATUAL
```

#### Configuração AGRESSIVA (servidor potente)
```typescript
maxConcurrent = 20
pollInterval = 100
backoff = 1.1
maxAttempts = 10
```

---

## 🎯 Troubleshooting

### Problema: Timeout frequente
**Sintoma**: Muitos drones não retornam resultado

**Solução**:
```typescript
// Aumente maxAttempts
maxAttempts: number = 30

// Ou reduza maxConcurrent
await uploadDroneAudioBatch(sessionId, droneAudioList, 5);
```

---

### Problema: Servidor sobrecarregado
**Sintoma**: CPU alta, requests lentas

**Solução**:
```typescript
// Reduza concorrência
await uploadDroneAudioBatch(sessionId, droneAudioList, 3);

// Aumente intervalo de polling
let pollInterval = 500;
```

---

### Problema: Muito lento (rede boa)
**Sintoma**: Resultado demora mesmo com poucos drones

**Solução**:
```typescript
// Aumente concorrência
await uploadDroneAudioBatch(sessionId, droneAudioList, 20);

// Reduza intervalo de polling
let pollInterval = 100;
```

---

### Problema: Erros intermitentes
**Sintoma**: Alguns drones falham aleatoriamente

**Solução**:
```typescript
// Use backoff mais conservador
pollInterval = Math.min(pollInterval * 1.3, 2000);

// Mais tentativas
maxAttempts: number = 20
```

---

## 🧪 Como Testar Configurações

### 1. Teste de Baseline
```bash
# Com configuração padrão
1. Configure 100 drones
2. Simule disparo
3. Meça tempo total (deve ser ~8s)
4. Verifique console para erros
```

### 2. Teste de Modificação
```bash
# Após mudar configuração
1. Configure 100 drones
2. Simule 5 disparos consecutivos
3. Calcule média de tempo
4. Compare com baseline
```

### 3. Teste de Estresse
```bash
# Teste limites
1. Configure 500 drones
2. Simule disparo
3. Monitore:
   - Uso de CPU
   - Uso de memória
   - Taxa de erro
   - Tempo total
```

---

## 📈 Monitoramento (Opcional)

### Adicionar Logs de Performance

```typescript
// Em app/page.tsx, após upload
const uploadStart = performance.now();
await uploadDroneAudioBatch(sessionId, droneAudioList, 10);
const uploadEnd = performance.now();
console.log(`Upload time: ${(uploadEnd - uploadStart).toFixed(0)}ms`);

// Após polling
const pollStart = performance.now();
const analysisData = await pollAnalysisResult(sessionId, dronePositions.length);
const pollEnd = performance.now();
console.log(`Polling time: ${(pollEnd - pollStart).toFixed(0)}ms`);
console.log(`Total time: ${(pollEnd - uploadStart).toFixed(0)}ms`);
```

---

## 💡 Dicas Avançadas

### 1. Adaptação Dinâmica
```typescript
// Ajusta concorrência baseado em número de drones
const maxConcurrent = Math.min(droneAudioList.length, 20);
await uploadDroneAudioBatch(sessionId, droneAudioList, maxConcurrent);
```

### 2. Detecção de Rede
```typescript
// Ajusta baseado em tipo de conexão (se disponível)
const connection = (navigator as any).connection;
const maxConcurrent = connection?.effectiveType === '4g' ? 20 : 5;
```

### 3. Circuit Breaker Pattern
```typescript
// Detecta falhas e reduz carga automaticamente
let failureCount = 0;
if (failureCount > 3) {
  maxConcurrent = Math.max(1, maxConcurrent / 2);
}
```

---

## ✅ Recomendações Finais

1. **Use configuração padrão** para 95% dos casos
2. **Monitore primeiro**, ajuste depois
3. **Teste localmente** antes de deploy
4. **Documente mudanças** de configuração
5. **Use variáveis de ambiente** para configs por ambiente

---

**Última Atualização**: 5 de novembro de 2025  
**Configuração Recomendada**: BALANCEADA (padrão)
