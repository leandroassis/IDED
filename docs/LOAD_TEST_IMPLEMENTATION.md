# 📊 Sistema de Testes de Carga - Implementação Completa

## ✅ Implementado

### 1. Script de Teste Automatizado (`scripts/loadTest.ts`)

**Funcionalidades**:
- ✅ Execução automatizada de 1000 testes por raio
- ✅ 6 raios testados: 0.1, 0.3, 0.5, 0.7, 0.9, 1.2 km
- ✅ Cálculo automático de drones: `num_drones = e^(7.5 × raio)` (mínimo 3)
- ✅ Geração de posições aleatórias dentro do raio
- ✅ Distribuição 70% disparo / 30% ambiente
- ✅ Comunicação com API Next.js (sem renderização)
- ✅ Cálculo de métricas com média e desvio padrão
- ✅ Salvamento em CSV
- ✅ Indicador visual de progresso

**Métricas Coletadas**:
1. **Classificação**:
   - Taxa de acerto geral
   - Taxa de acerto para disparos
   - Taxa de acerto para sons ambiente
   
2. **Posicionamento**:
   - Erro médio de posição (metros)
   - Desvio padrão do erro
   
3. **Performance**:
   - Tempo médio de processamento (ms)
   - Desvio padrão do tempo

---

## 📁 Arquivos Criados

### Scripts e Executáveis

1. **`scripts/loadTest.ts`** (650 linhas)
   - Script principal de teste
   - Gerenciamento de casos de teste
   - Geração de inputs mockados
   - Comunicação com API
   - Cálculo de estatísticas
   - Salvamento de resultados

2. **`scripts/run-load-test.sh`**
   - Script bash para facilitar execução
   - Validação de parâmetros
   - Verificação de servidor rodando
   - Execução com tsx

### Documentação

3. **`scripts/LOAD_TEST_README.md`** (completo)
   - Visão geral do sistema
   - Configuração dos testes
   - Guia de execução
   - Formato dos resultados
   - Análise e interpretação
   - Troubleshooting
   - Configurações avançadas

4. **`QUICK_TEST_GUIDE.md`** (guia rápido)
   - Instalação rápida
   - Exemplos de uso
   - Coordenadas de teste
   - Checklist
   - Problemas comuns

5. **`tests/EXAMPLE_RESULTS.csv`**
   - Exemplo de como ficam os resultados
   - Referência para análise

### Estrutura de Diretórios

6. **`tests/`**
   - Diretório para armazenar resultados
   - `.gitkeep` para versionar estrutura

---

## 🎯 Fórmulas e Algoritmos

### Número de Drones
```typescript
num_drones = max(3, round(e^(7.5 × raio_em_km)))
```

**Exemplos**:
- 0.1 km → 3 drones
- 0.3 km → 10 drones
- 0.5 km → 42 drones
- 0.7 km → 178 drones
- 0.9 km → 752 drones
- 1.2 km → 8103 drones

### Posição Aleatória (Distribuição Uniforme no Círculo)
```typescript
angle = random() × 2π
r = √(random()) × radius
lat_offset = (r / 111.32) × cos(angle)
lon_offset = (r / (111.32 × cos(center_lat))) × sin(angle)
```

### Distância Haversine
```typescript
R = 6371000 // metros
Δφ = (lat2 - lat1) × π/180
Δλ = (lon2 - lon1) × π/180
a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
c = 2 × atan2(√a, √(1-a))
distance = R × c
```

### Desvio Padrão
```typescript
mean = Σ(values) / n
variance = Σ((value - mean)²) / n
stddev = √variance
```

---

## 🔄 Fluxo de Execução

### Para Cada Raio:

```
1. Calcula número de drones: e^(7.5 × raio)
2. Para cada teste (1 a 1000):
   a. Sorteia tipo de som (70% disparo, 30% ambiente)
   b. Configura posições dos drones (API)
   c. Gera posição aleatória do som
   d. Simula som (API)
   e. Envia áudio para análise (API)
   f. Coleta resultado
   g. Calcula métricas
   h. Atualiza progresso visual
3. Calcula estatísticas agregadas
4. Salva em CSV
5. Exibe resumo
```

---

## 📊 Estrutura dos Resultados

### CSV Resumido (`summary.csv`)

| Coluna | Descrição | Unidade |
|--------|-----------|---------|
| radius | Raio de operação | km |
| numDrones | Número de drones | - |
| totalTests | Total de testes | - |
| accuracyMean | Acurácia média | % |
| positionErrorMean | Erro médio de posição | m |
| positionErrorStdDev | Desvio padrão do erro | m |
| processingTimeMean | Tempo médio | ms |
| processingTimeStdDev | Desvio padrão tempo | ms |
| gunshotAccuracy | Acurácia disparos | % |
| ambientAccuracy | Acurácia ambiente | % |

### CSV Detalhado (`detailed_radius_X.csv`)

| Coluna | Descrição |
|--------|-----------|
| testId | ID do teste |
| radius | Raio de operação (km) |
| numDrones | Número de drones |
| soundType | gunshot ou ambient |
| realLat, realLon | Posição real |
| calcLat, calcLon | Posição calculada |
| detectedAsGunshot | boolean |
| confidence | 0.0 a 1.0 |
| positionError | Erro em metros |
| processingTime | Tempo em ms |
| success | boolean |

---

## 🚀 Como Usar

### Instalação

```bash
npm install -D tsx
```

### Execução

```bash
# Inicie servidor
npm run dev

# Execute teste (Brasília)
./scripts/run-load-test.sh -47.9292 -15.7801

# Ou use npm script
npm run test:load -- -47.9292 -15.7801

# Ou direto
npx tsx scripts/loadTest.ts -47.9292 -15.7801
```

### Análise

```bash
# Veja resultados
cd tests/load_test_2025-11-05T14-30-00
cat summary.csv

# Abra no Excel/LibreOffice
libreoffice summary.csv

# Análise em Python
python
>>> import pandas as pd
>>> df = pd.read_csv('summary.csv')
>>> print(df)
```

---

## ⏱️ Tempo de Execução Estimado

| Raio | Drones | Testes | Tempo Estimado |
|------|--------|--------|----------------|
| 0.1km | 3 | 1000 | ~3 min |
| 0.3km | 10 | 1000 | ~8 min |
| 0.5km | 42 | 1000 | ~25 min |
| 0.7km | 178 | 1000 | ~90 min |
| 0.9km | 752 | 1000 | ~6 horas |
| 1.2km | 8103 | 1000 | ~48 horas |
| **TOTAL** | - | **6000** | **~55 horas** |

**IMPORTANTE**: Para testes rápidos, reduza configuração:
```typescript
// scripts/loadTest.ts
const radiusTests = [0.1, 0.3, 0.5]; // Apenas 3 raios
const numTestsPerRadius = 100; // 100 testes
// Tempo total: ~10 minutos
```

---

## 🎯 Validações Implementadas

### Entrada
- ✅ Verifica 2 parâmetros (lon, lat)
- ✅ Valida formato numérico
- ✅ Verifica servidor rodando

### Execução
- ✅ Tratamento de erros em cada teste
- ✅ Continua mesmo se um teste falhar
- ✅ Timeout configurável
- ✅ Retry logic no polling

### Saída
- ✅ Cria diretório automaticamente
- ✅ Timestamp único para cada execução
- ✅ Validação de dados antes de salvar
- ✅ CSV formatado corretamente

---

## 📈 Exemplos de Análise

### Python (pandas + matplotlib)

```python
import pandas as pd
import matplotlib.pyplot as plt

# Carrega dados
df = pd.read_csv('tests/load_test_2025-11-05T14-30-00/summary.csv')

# Gráfico 1: Acurácia vs Raio
plt.figure(figsize=(10, 6))
plt.plot(df['radius'], df['accuracyMean'], 'o-', label='Geral')
plt.plot(df['radius'], df['gunshotAccuracy'], 's-', label='Disparo')
plt.plot(df['radius'], df['ambientAccuracy'], '^-', label='Ambiente')
plt.xlabel('Raio (km)')
plt.ylabel('Acurácia (%)')
plt.title('Acurácia vs Raio de Operação')
plt.legend()
plt.grid(True)
plt.savefig('accuracy_vs_radius.png')
plt.show()

# Gráfico 2: Erro de Posição vs Raio
plt.figure(figsize=(10, 6))
plt.errorbar(df['radius'], df['positionErrorMean'], 
             yerr=df['positionErrorStdDev'], 
             fmt='o-', capsize=5)
plt.xlabel('Raio (km)')
plt.ylabel('Erro de Posição (m)')
plt.title('Erro de Posição vs Raio')
plt.grid(True)
plt.savefig('position_error_vs_radius.png')
plt.show()

# Gráfico 3: Tempo vs Número de Drones
plt.figure(figsize=(10, 6))
plt.loglog(df['numDrones'], df['processingTimeMean'], 'o-')
plt.xlabel('Número de Drones')
plt.ylabel('Tempo de Processamento (ms)')
plt.title('Escalabilidade: Tempo vs Número de Drones')
plt.grid(True)
plt.savefig('scaling_analysis.png')
plt.show()

# Estatísticas
print("\n=== ESTATÍSTICAS GERAIS ===")
print(f"Acurácia Média: {df['accuracyMean'].mean():.2f}%")
print(f"Erro de Posição Médio: {df['positionErrorMean'].mean():.2f}m")
print(f"Tempo Médio: {df['processingTimeMean'].mean():.0f}ms")
```

### R

```r
# Carrega dados
df <- read.csv('tests/load_test_2025-11-05T14-30-00/summary.csv')

# Gráfico de acurácia
plot(df$radius, df$accuracyMean, type='b', 
     xlab='Raio (km)', ylab='Acurácia (%)',
     main='Acurácia vs Raio', col='blue', pch=19)
lines(df$radius, df$gunshotAccuracy, type='b', col='red', pch=15)
lines(df$radius, df$ambientAccuracy, type='b', col='green', pch=17)
legend('bottomleft', 
       legend=c('Geral', 'Disparo', 'Ambiente'),
       col=c('blue', 'red', 'green'), 
       pch=c(19, 15, 17))

# Modelo de regressão
model <- lm(accuracyMean ~ radius, data=df)
summary(model)
```

---

## 🔧 Configurações Avançadas

### Modificar Distribuição de Sons

```typescript
// scripts/loadTest.ts, linha ~415
const soundType = Math.random() < 0.7 ? 'gunshot' : 'ambient';
// Altere 0.7 para:
// 0.5 = 50/50
// 0.8 = 80% disparo, 20% ambiente
// 1.0 = 100% disparo
```

### Modificar Fórmula de Drones

```typescript
// scripts/loadTest.ts, linha ~399
const numDrones = Math.max(3, Math.round(Math.exp(7.5 * radius)));
// Altere para:
// Math.exp(5 * radius) = Menos drones
// Math.exp(10 * radius) = Mais drones
// radius * 100 = Linear
```

### Adicionar Mais Raios

```typescript
// scripts/loadTest.ts, linha ~466
const radiusTests = [0.1, 0.3, 0.5, 0.7, 0.9, 1.2];
// Adicione valores como:
// [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2]
```

---

## ✅ Status Final

**Implementação**: ✅ **100% COMPLETA**

**Funcionalidades**:
- ✅ Geração automática de casos de teste
- ✅ Posições aleatórias uniformes
- ✅ Distribuição configurável de sons
- ✅ Cálculo de drones por fórmula exponencial
- ✅ Comunicação com API sem renderização
- ✅ Métricas completas (média + desvio)
- ✅ Indicador visual de progresso
- ✅ Salvamento em CSV estruturado
- ✅ Documentação completa
- ✅ Scripts de execução facilitados

**Pronto para**:
- ✅ Executar testes de carga
- ✅ Coletar métricas de performance
- ✅ Avaliar escalabilidade
- ✅ Identificar limitações
- ✅ Gerar relatórios científicos

---

**Data de Implementação**: 5 de novembro de 2025  
**Versão**: 1.0.0  
**Status**: ✅ **PRODUÇÃO**
