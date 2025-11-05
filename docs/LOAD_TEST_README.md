# 🧪 Sistema de Testes de Carga

## 📋 Visão Geral

Script automatizado para avaliar a performance do sistema de detecção de disparos em diferentes condições operacionais.

---

## 🎯 Objetivos dos Testes

O sistema executa **1000 testes** para cada raio de operação, medindo:

### Métricas Coletadas

1. **Taxa de Acerto (Acurácia)**
   - Acurácia geral
   - Acurácia para disparos
   - Acurácia para sons ambiente

2. **Erro de Posição**
   - Distância (em metros) entre posição real e calculada
   - Média e desvio padrão

3. **Tempo de Processamento**
   - Tempo total do teste (ms)
   - Média e desvio padrão

---

## ⚙️ Configuração dos Testes

### Raios Testados
- 0.1 km
- 0.3 km
- 0.5 km
- 0.7 km
- 0.9 km
- 1.2 km

### Número de Drones
Calculado automaticamente pela fórmula:

```
num_drones = e^(7.5 × raio_em_km)
```

Mínimo: **3 drones**

| Raio (km) | Nº Drones |
|-----------|-----------|
| 0.1 | 3 |
| 0.3 | 10 |
| 0.5 | 42 |
| 0.7 | 178 |
| 0.9 | 752 |
| 1.2 | 8103 |

### Distribuição de Sons
- **70%** disparos
- **30%** sons ambiente

---

## 🚀 Como Executar

### Pré-requisitos

1. **Servidor Next.js rodando**
   ```bash
   npm run dev
   ```

2. **Dependências instaladas**
   ```bash
   npm install
   ```

### Execução

```bash
./scripts/run-load-test.sh <longitude> <latitude>
```

**Exemplo** (Brasília):
```bash
./scripts/run-load-test.sh -47.9292 -15.7801
```

**Exemplo** (São Paulo):
```bash
./scripts/run-load-test.sh -46.6333 -23.5505
```

---

## 📊 Resultados

### Estrutura de Arquivos

Os resultados são salvos em `tests/load_test_YYYY-MM-DDTHH-MM-SS/`:

```
tests/
└── load_test_2025-11-05T14-30-00/
    ├── summary.csv                    # Resumo geral
    ├── detailed_radius_0.1km.csv      # Detalhes raio 0.1km
    ├── detailed_radius_0.3km.csv      # Detalhes raio 0.3km
    ├── detailed_radius_0.5km.csv      # ...
    ├── detailed_radius_0.7km.csv
    ├── detailed_radius_0.9km.csv
    └── detailed_radius_1.2km.csv
```

### Formato do CSV Resumido (`summary.csv`)

```csv
radius,numDrones,totalTests,accuracyMean,positionErrorMean,positionErrorStdDev,processingTimeMean,processingTimeStdDev,gunshotAccuracy,ambientAccuracy
0.1,3,1000,98.50,2.45,1.23,1234.56,345.67,99.00,97.00
0.3,10,1000,96.20,5.67,2.34,2345.67,456.78,97.50,93.00
...
```

**Colunas**:
- `radius`: Raio de operação (km)
- `numDrones`: Número de drones
- `totalTests`: Total de testes executados
- `accuracyMean`: Acurácia média (%)
- `positionErrorMean`: Erro médio de posição (m)
- `positionErrorStdDev`: Desvio padrão do erro (m)
- `processingTimeMean`: Tempo médio de processamento (ms)
- `processingTimeStdDev`: Desvio padrão do tempo (ms)
- `gunshotAccuracy`: Acurácia para disparos (%)
- `ambientAccuracy`: Acurácia para ambiente (%)

### Formato do CSV Detalhado

```csv
testId,radius,numDrones,soundType,realLat,realLon,calcLat,calcLon,detectedAsGunshot,confidence,positionError,processingTime,success
1,0.1,3,gunshot,-15.7801,-47.9292,-15.7802,-47.9293,true,0.95,2.34,1234,true
2,0.1,3,ambient,-15.7805,-47.9295,-15.7806,-47.9296,false,0.88,,1456,true
...
```

---

## 📈 Exemplo de Execução

```bash
$ ./scripts/run-load-test.sh -47.9292 -15.7801

🚀 Iniciando teste de carga...
📍 Centro de Operação: -47.9292, -15.7801

📍 Centro de Operação: -15.7801, -47.9292
📁 Resultados serão salvos em: /path/to/tests/load_test_2025-11-05T14-30-00

🧪 Configuração:
   Raios: 0.1, 0.3, 0.5, 0.7, 0.9, 1.2 km
   Testes por raio: 1000
   Total de testes: 6000
   Distribuição: 70% disparo, 30% ambiente

🚁 Iniciando testes para raio 0.1km com 3 drones...
[████████████████████████████████████████] 100.0% | 1000/1000 | Raio: 0.1km | ETA: 0s 
✅ Testes concluídos! Calculando estatísticas...

📊 RESUMO - Raio 0.1km (3 drones):
   Testes: 1000
   Acurácia Geral: 98.50%
   Acurácia Disparo: 99.00%
   Acurácia Ambiente: 97.00%
   Erro de Posição: 2.45 ± 1.23 m
   Tempo de Processamento: 1234 ± 345 ms

🚁 Iniciando testes para raio 0.3km com 10 drones...
[████████████████████████████████████████] 100.0% | 1000/1000 | Raio: 0.3km | ETA: 0s
...

✨ TODOS OS TESTES CONCLUÍDOS!
⏱️  Tempo total: 45.23 minutos
📂 Resultados salvos em: /path/to/tests/load_test_2025-11-05T14-30-00
```

---

## 🔍 Análise dos Resultados

### Importar em Python (pandas)

```python
import pandas as pd

# Lê resumo
df_summary = pd.read_csv('tests/load_test_2025-11-05T14-30-00/summary.csv')

# Lê detalhes de um raio específico
df_details = pd.read_csv('tests/load_test_2025-11-05T14-30-00/detailed_radius_0.3km.csv')

# Análise
print(df_summary[['radius', 'accuracyMean', 'positionErrorMean']])
```

### Importar em R

```r
# Lê resumo
summary <- read.csv('tests/load_test_2025-11-05T14-30-00/summary.csv')

# Gráfico
plot(summary$radius, summary$accuracyMean, 
     xlab='Raio (km)', ylab='Acurácia (%)',
     main='Acurácia vs Raio de Operação')
```

### Importar em Excel

1. Abra o Excel
2. Dados → Importar de Texto/CSV
3. Selecione o arquivo `summary.csv`
4. Configure delimitador como vírgula
5. Crie gráficos e tabelas dinâmicas

---

## 🎛️ Configurações Avançadas

### Modificar Número de Testes

Edite `scripts/loadTest.ts` linha ~467:

```typescript
const numTestsPerRadius = 1000; // Altere aqui
```

### Modificar Raios Testados

Edite `scripts/loadTest.ts` linha ~466:

```typescript
const radiusTests = [0.1, 0.3, 0.5, 0.7, 0.9, 1.2]; // Altere aqui
```

### Modificar Fórmula de Drones

Edite `scripts/loadTest.ts` linha ~399:

```typescript
const numDrones = Math.max(3, Math.round(Math.exp(7.5 * radius))); // Altere aqui
```

### Modificar Distribuição de Sons

Edite `scripts/loadTest.ts` linha ~415:

```typescript
const soundType = Math.random() < 0.7 ? 'gunshot' : 'ambient'; // 0.7 = 70% disparo
```

---

## ⚠️ Notas Importantes

### Performance

- **1000 testes** podem levar **vários minutos** dependendo do raio
- Raios maiores (0.9km+) com muitos drones podem levar **horas**
- Monitore o uso de CPU/RAM durante a execução

### Servidor

- O servidor Next.js **deve estar rodando** em `http://localhost:3000`
- Não feche o servidor durante os testes
- Evite usar o sistema manualmente durante os testes

### Armazenamento

- Cada teste gera ~1KB de dados
- 6000 testes ≈ 6MB de CSVs
- Certifique-se de ter espaço em disco

---

## 🐛 Troubleshooting

### Erro: "Servidor Next.js não está rodando"

**Solução**: Inicie o servidor
```bash
npm run dev
```

### Erro: "tsx não encontrado"

**Solução**: Instale dependências
```bash
npm install -D tsx
```

### Erro: "Analysis timeout"

**Possíveis causas**:
- Servidor sobrecarregado
- Muitos drones (raio grande)
- Rede lenta

**Soluções**:
- Reduza número de drones
- Aumente timeout em `loadTest.ts` linha ~283
- Reduza número de testes simultâneos

### Testes muito lentos

**Soluções**:
- Reduza `numTestsPerRadius` para 100 ou 500
- Teste apenas raios menores (0.1, 0.3, 0.5)
- Use servidor mais potente

---

## 📚 Interpretação dos Resultados

### Acurácia

- **> 95%**: Excelente
- **90-95%**: Bom
- **85-90%**: Aceitável
- **< 85%**: Necessita melhorias

### Erro de Posição

- **< 5m**: Excelente
- **5-15m**: Bom
- **15-30m**: Aceitável
- **> 30m**: Necessita melhorias

### Tempo de Processamento

- **< 2s**: Muito rápido
- **2-5s**: Rápido
- **5-10s**: Aceitável
- **> 10s**: Lento (considerar otimizações)

---

## 🎯 Próximos Passos

1. Execute os testes
2. Analise os CSVs gerados
3. Identifique padrões e gargalos
4. Otimize configurações se necessário
5. Re-execute testes para validar melhorias

---

**Última Atualização**: 5 de novembro de 2025  
**Versão**: 1.0.0
