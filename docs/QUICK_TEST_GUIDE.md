# 🧪 Sistema de Testes de Carga - Guia Rápido

## 📦 Instalação

```bash
# Instalar tsx (executar TypeScript diretamente)
npm install -D tsx

# ou se preferir usar yarn
yarn add -D tsx
```

## 🚀 Execução Rápida

### Opção 1: Script Bash (Recomendado)

```bash
# 1. Inicie o servidor Next.js
npm run dev

# 2. Em outro terminal, execute o teste
./scripts/run-load-test.sh -47.9292 -15.7801

# 3. Com concorrência personalizada (20 testes paralelos)
./scripts/run-load-test.sh -47.9292 -15.7801 20
```

### Opção 2: NPM Script

```bash
# 1. Inicie o servidor Next.js
npm run dev

# 2. Em outro terminal, execute
npm run test:load -- -47.9292 -15.7801

# 3. Com concorrência
npm run test:load -- -47.9292 -15.7801 20
```

### Opção 3: Direto com tsx

```bash
# 1. Inicie o servidor Next.js
npm run dev

# 2. Em outro terminal, execute
npx tsx scripts/loadTest.ts -47.9292 -15.7801

# 3. Com concorrência
npx tsx scripts/loadTest.ts -47.9292 -15.7801 20
```

---

## 📍 Coordenadas de Exemplo

### Capitais Brasileiras

```bash
# Brasília
./scripts/run-load-test.sh -47.9292 -15.7801

# São Paulo
./scripts/run-load-test.sh -46.6333 -23.5505

# Rio de Janeiro
./scripts/run-load-test.sh -43.1729 -22.9068

# Belo Horizonte
./scripts/run-load-test.sh -43.9378 -19.9167

# Curitiba
./scripts/run-load-test.sh -49.2646 -25.4284
```

---

## 📊 O Que Será Testado

### Configuração Automática

| Raio (km) | Nº Drones | Testes | Tempo Estimado (10 paralelos) |
|-----------|-----------|--------|-------------------------------|
| 0.1 | 3 | 1000 | ~30 segundos |
| 0.3 | 10 | 1000 | ~1 min |
| 0.5 | 42 | 1000 | ~3 min |
| 0.7 | 178 | 1000 | ~10 min |
| 0.9 | 752 | 1000 | ~45 min |
| 1.2 | 8103 | 1000 | ~6 horas |

**TOTAL**: ~7 horas com 10 testes paralelos (vs. ~55 horas sequencial)

**⚡ OTIMIZAÇÃO**: Use mais concorrência para acelerar!
- 20 paralelos: ~3.5 horas
- 50 paralelos: ~1.5 hora (se servidor suportar)

### Para Testes Rápidos

Edite `scripts/loadTest.ts` e modifique:

```typescript
// Linha 466: Teste apenas raios pequenos
const radiusTests = [0.1, 0.3, 0.5]; // Apenas 3 raios

// Linha 467: Reduza número de testes
const numTestsPerRadius = 100; // 100 ao invés de 1000
```

Tempo total: **~10 minutos** ao invés de horas

---

## 📈 Resultados

### Arquivos Gerados

```
tests/load_test_2025-11-05T14-30-00/
├── summary.csv                   # ⭐ RESUMO GERAL
├── detailed_radius_0.1km.csv     # Detalhes de cada teste
├── detailed_radius_0.3km.csv
└── ...
```

### Abrir em Excel/LibreOffice

1. Abra o arquivo `summary.csv`
2. Os dados já estarão formatados
3. Crie gráficos de:
   - Acurácia vs Raio
   - Erro de Posição vs Raio
   - Tempo vs Número de Drones

### Análise em Python

```python
import pandas as pd
import matplotlib.pyplot as plt

# Lê resultados
df = pd.read_csv('tests/load_test_2025-11-05T14-30-00/summary.csv')

# Gráfico de acurácia
plt.plot(df['radius'], df['accuracyMean'])
plt.xlabel('Raio (km)')
plt.ylabel('Acurácia (%)')
plt.title('Performance vs Raio de Operação')
plt.show()
```

---

## 🎯 Métricas Coletadas

Para cada raio, você terá:

### 1. Classificação
- ✅ Acurácia geral (%)
- ✅ Acurácia para disparos (%)
- ✅ Acurácia para sons ambiente (%)

### 2. Posicionamento
- 📍 Erro médio (metros)
- 📍 Desvio padrão do erro

### 3. Performance
- ⏱️ Tempo médio de processamento (ms)
- ⏱️ Desvio padrão do tempo

---

## ⚠️ Checklist Antes de Executar

- [ ] Servidor Next.js rodando (`npm run dev`)
- [ ] Porta 3000 acessível
- [ ] Espaço em disco (mínimo 10MB)
- [ ] Tempo disponível (veja tabela acima)
- [ ] Coordenadas corretas (lon, lat)

---

## 🐛 Problemas Comuns

### "Servidor não está rodando"
```bash
# Solução: Inicie o servidor
npm run dev
```

### "tsx não encontrado"
```bash
# Solução: Instale a dependência
npm install -D tsx
```

### "Permission denied"
```bash
# Solução: Torne o script executável
chmod +x scripts/run-load-test.sh
```

### Testes muito lentos
```bash
# Solução: Reduza configuração
# Edite scripts/loadTest.ts:
# - Linha 466: radiusTests = [0.1, 0.3]
# - Linha 467: numTestsPerRadius = 100
```

---

## 📚 Documentação Completa

Leia `scripts/LOAD_TEST_README.md` para:
- Detalhes técnicos
- Configurações avançadas
- Interpretação de resultados
- Troubleshooting detalhado

---

## ✨ Exemplo Completo

```bash
# Terminal 1: Inicia servidor
npm run dev

# Terminal 2: Executa teste (Brasília)
./scripts/run-load-test.sh -47.9292 -15.7801

# Saída esperada:
# 🚀 Iniciando teste de carga...
# 📍 Centro de Operação: -47.9292, -15.7801
# 
# 🚁 Iniciando testes para raio 0.1km com 3 drones...
# [████████████░░░░░░░░░░░░░░] 35.0% | 350/1000 | ETA: 120s
# ...

# Quando terminar:
# ✨ TODOS OS TESTES CONCLUÍDOS!
# 📂 Resultados salvos em: tests/load_test_2025-11-05T14-30-00

# Analise os resultados:
cd tests/load_test_2025-11-05T14-30-00
cat summary.csv
```

---

**Status**: ✅ **PRONTO PARA USO**  
**Versão**: 1.0.0  
**Data**: 5 de novembro de 2025
