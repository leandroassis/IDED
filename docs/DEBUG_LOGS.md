# Logs de Debug Adicionados

## ⚠️ Problema Identificado

**SINTOMA:** Apenas 4 de 5 drones enviam dados para a API, causando timeout após 20 tentativas.

```
[ANALYZE GET] Not ready - Received: 4/5
[AMBIENT] TIMEOUT após 20 tentativas
```

**POSSÍVEIS CAUSAS:**
1. A API de simulação pode não estar gerando áudio para todos os drones
2. Um drone pode estar tendo erro ao enviar o POST
3. O áudio de um drone pode estar corrompido/inválido
4. Race condition no envio sequencial dos drones

## Mudanças Realizadas

### 1. Logs no Servidor

#### `app/api/audio/simulate/route.ts` e `simulate-ambient/route.ts`
- `[SIMULATE]` / `[SIMULATE AMBIENT]` - Número de drones recebidos
- Distância de cada drone até a fonte sonora
- Número total de áudios gerados

#### `app/api/audio/analyze/route.ts`
**POST (recebe áudio de cada drone):**
- `[ANALYZE POST]` - Mostra sessionId e droneId recebido
- Erro detalhado se campos estiverem faltando
- Número de samples do áudio convertido
- Time of Arrival (TOA) calculado
- Total de drones na sessão após adicionar

**GET (processa análise):**
- `[ANALYZE GET]` - Mostra sessionId e número de drones esperados
- `[CLASSIFY]` - Para cada drone, mostra resultado da classificação (isGunshot, confidence, distâncias)
- `[ANALYZE]` - Mostra contagem de detecções de disparo e se vai triangular
- `[ANALYZE]` - Mostra a posição calculada final
- Log completo da resposta JSON antes de enviar ao cliente

### 2. Logs no Cliente (`app/page.tsx`)

Adicionados logs nas funções `setGunshot` e `setAmbient`:
- `[GUNSHOT]` / `[AMBIENT]` - Número de drones na simulação
- Lista de droneIds que serão enviados
- **Cada envio individual** com status de sucesso (✓) ou erro (✗)
- Total de drones enviados após loop completo
- Logs de cada tentativa de polling com a resposta recebida
- Log quando análise está completa
- **AVISO** se resposta vier sem `calculatedPosition`
- **ERRO** se houver timeout após 20 tentativas

### 3. Logs na Triangulação (`lib/geoUtils.ts`)

Adicionados logs detalhados na função `triangulateTDOA`:
- `[TDOA]` - Número de drones recebidos
- Lista de drones ordenados por tempo de chegada (TOA)
- Drone de referência escolhido
- Diferenças de tempo calculadas (Δt e distância em metros)
- Posições estimadas para cada drone com seus pesos
- Posição final calculada

## Como Testar

### 1. Iniciar o servidor
```bash
npm run dev
```

### 2. Abrir o navegador
- Acesse http://localhost:3000
- Abra o DevTools (F12) e vá para a aba Console

### 3. Realizar simulação
1. Clique em "Definir Área de Operação" e clique no mapa
2. Espere os drones serem posicionados
3. Clique em "Simular Disparo" e clique em outro ponto do mapa
4. **Observe os logs no console do navegador**

### 4. O que verificar nos logs

#### No Console do Navegador (Cliente):
```
[SIMULATE AMBIENT] Recebido - Drones: 5
[SIMULATE AMBIENT] Processando 5 drones...
[SIMULATE AMBIENT] drone-0 - Distância: 150.23m
[SIMULATE AMBIENT] drone-1 - Distância: 200.45m
...
[SIMULATE AMBIENT] Simulação completa. Áudios gerados: 5

[AMBIENT] Iniciando envio de 5 drones para sessionId: session-...
[AMBIENT] Drones na simulação: ['drone-0', 'drone-1', 'drone-2', 'drone-3', 'drone-4']
[AMBIENT] Enviando drone-0...
[AMBIENT] drone-0 ✓ Resposta: { success: true, dronesReceived: 1 }
[AMBIENT] Enviando drone-1...
[AMBIENT] drone-1 ✓ Resposta: { success: true, dronesReceived: 2 }
...
[AMBIENT] Envio completo. Total enviado: 5

[AMBIENT] Aguardando análise - sessionId: session-..., drones: 5
[AMBIENT] Tentativa 1: { ready: false, dronesReceived: 5, expectedDrones: 5 }
[AMBIENT] Tentativa 2: { ready: true, isGunshot: false, ... }
[AMBIENT] Análise completa! DetectionResult: { ... }
[AMBIENT] Posição calculada: null (ambiente não triangula)
```

**⚠️ VERIFICAR:**
- Se algum drone mostrar `✗ ERRO` ao enviar → Problema no POST individual
- Se a lista de drones na simulação tiver menos que 5 → API de simulação não gerou todos
- Se aparecer `[AMBIENT] Resposta SEM calculatedPosition!` → Normal para ambiente, mas deve ter para disparo
- Se aparecer `[AMBIENT] TIMEOUT após 20 tentativas` → Nem todos os drones chegaram na API

#### No Terminal do Servidor (API):
```
[SIMULATE] Recebido - Drones: 5
[SIMULATE] Processando 5 drones...
[SIMULATE] drone-0 - Distância: 120.45m
[SIMULATE] drone-1 - Distância: 180.23m
...
[SIMULATE] Simulação completa. Áudios gerados: 5

[ANALYZE POST] Recebido - SessionId: session-..., DroneId: drone-0
[ANALYZE POST] Áudio convertido - 176400 samples
[ANALYZE POST] drone-0 - TOA: 0.3512s, maxEnergy @ index 30
[ANALYZE POST] drone-0 armazenado. Total na sessão: 1
[ANALYZE POST] Recebido - SessionId: session-..., DroneId: drone-1
...
[ANALYZE POST] drone-4 armazenado. Total na sessão: 5

[ANALYZE GET] SessionId: session-..., Expected: 5
[ANALYZE GET] All drones received, processing...
[CLASSIFY] drone-0: isGunshot=true, confidence=0.xx, gunshot_dist=0.xx, ambient_dist=0.xx
...
[ANALYZE] Gunshot detections: 4/5, isGunshot: true
[ANALYZE] Triangulating position...
[TDOA] Iniciando triangulação com 5 drones
[TDOA] Drones ordenados por tempo de chegada:
  drone-0: TOA=0.0234s, pos=(-23.xxx, -46.xxx)
...
[TDOA] Posição final calculada: { lat: -23.xxx, lon: -46.xxx }
[ANALYZE] Calculated position: { lat: -23.xxx, lon: -46.xxx }
[ANALYZE] Response: { ready: true, isGunshot: true, calculatedPosition: {...}, ... }
```

**⚠️ VERIFICAR:**
- **Se [SIMULATE] mostrar menos que 5 áudios gerados** → Problema na simulação
- **Se [ANALYZE POST] aparecer menos que 5 vezes** → Algum drone não chegou
- **Se houver [ANALYZE POST] Campos faltando** → Dados corrompidos
- Se aparecer `[ANALYZE] No gunshot detected, skipping triangulation` → Classificação identificando como ambiente
- Se a triangulação não aparecer nos logs → Função não está sendo chamada
- Tempo entre requisições → Se muito longo, há problema de performance

## Problemas Possíveis e Soluções

### Problema 1: `calculatedPosition` é `null`
**Causa:** A maioria dos drones não está detectando disparo (isGunshot=false)

**Solução:** 
- Verificar threshold de classificação (atualmente 0.3)
- Verificar templates de gunshot vs ambient
- Ajustar parâmetros de DTW

### Problema 2: Timeout na análise
**Causa:** Processamento DTW muito lento ou drones não enviando dados

**Solução:**
- Verificar se todos os drones estão enviando áudio (POST para /api/audio/analyze)
- Otimizar algoritmo DTW
- Aumentar maxAttempts ou reduzir número de drones

### Problema 3: Posição calculada incorreta
**Causa:** Algoritmo TDOA pode estar usando método simplificado demais

**Solução:**
- Implementar método de triangulação mais robusto
- Verificar cálculo de timeOfArrival nos drones
- Ajustar pesos na triangulação

## Próximos Passos

1. **Executar teste com logs** - Ver exatamente onde está o problema
2. **Analisar resultados** - Verificar se é classificação ou triangulação
3. **Ajustar parâmetros** - Threshold, templates ou algoritmo conforme necessário
4. **Otimizar performance** - Se necessário, cachear templates ou otimizar DTW

## Reverter Mudanças

Para remover os logs de debug (em produção), procure e remova linhas que contenham:
- `console.log('[GUNSHOT]'`
- `console.log('[AMBIENT]'`
- `console.log('[ANALYZE'`
- `console.log('[TDOA]'`
- `console.log('[CLASSIFY]'`
