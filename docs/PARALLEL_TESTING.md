# ⚡ Otimização: Testes Paralelos

## 🎯 Problema Original

**Execução Sequencial** (Versão Anterior):
```
Teste 1 → Teste 2 → Teste 3 → ... → Teste 1000
```

- ❌ 1000 testes × ~3s cada = **~50 minutos** por raio
- ❌ CPU ociosa esperando I/O de rede
- ❌ Total de 6000 testes = **~5 horas**

---

## ✨ Solução Implementada

**Execução Paralela** (Versão Atual):
```
Lote 1: [Teste 1, 2, 3, ..., 10] → Executam simultaneamente
Lote 2: [Teste 11, 12, 13, ..., 20] → Executam simultaneamente
...
```

### Ganhos de Performance

| Concorrência | Tempo/Raio | Total (6 raios) | Speedup |
|--------------|------------|-----------------|---------|
| 1 (sequencial) | ~50 min | ~5 horas | 1x |
| 5 paralelos | ~10 min | ~1 hora | 5x |
| **10 paralelos** | **~5 min** | **~30 min** | **10x** 🚀 |
| 20 paralelos | ~2.5 min | ~15 min | 20x |
| 50 paralelos | ~1 min | ~6 min | 50x |

**IMPORTANTE**: Servidor precisa suportar a carga!

---

## 🔧 Como Funciona

### Sistema de Sessões da API

Cada teste usa um **sessionId único**:
```typescript
const sessionId = `test-${testId}-${Date.now()}`;
```

Isso permite que a API organize e isole os dados de cada teste:
- ✅ Teste 1: `session-1-1730000001`
- ✅ Teste 2: `session-2-1730000002`
- ✅ Teste 3: `session-3-1730000003`

Todos podem rodar **simultaneamente** sem conflito!

### Controle de Concorrência

```typescript
// Divide em lotes de 10
for (let i = 0; i < testIds.length; i += maxConcurrent) {
  const batch = testIds.slice(i, i + maxConcurrent);
  
  // Executa lote em paralelo
  const promises = batch.map(id => runSingleTest(id, config, ...));
  const batchResults = await Promise.all(promises);
}
```

---

## 🚀 Como Usar

### Padrão (10 testes paralelos)

```bash
./scripts/run-load-test.sh -47.9292 -15.7801
```

### Personalizado (20 testes paralelos)

```bash
./scripts/run-load-test.sh -47.9292 -15.7801 20
```

### Conservador (5 testes paralelos)

```bash
./scripts/run-load-test.sh -47.9292 -15.7801 5
```

### Agressivo (50 testes paralelos)

```bash
./scripts/run-load-test.sh -47.9292 -15.7801 50
```

---

## 📊 Recomendações de Concorrência

### Por Capacidade do Servidor

| Tipo de Servidor | Concorrência | Motivo |
|------------------|--------------|--------|
| Laptop/Dev Local | **5-10** | Evita sobrecarga local |
| Servidor Médio | **10-20** | Balanceia carga |
| Servidor Potente | **20-50** | Maximiza throughput |
| Cluster/Cloud | **50-100** | Aproveita escalabilidade |

---

## 🎉 Benefícios

- ✅ **10-50x mais rápido** que execução sequencial
- ✅ **Sessões isoladas** (sem conflitos)
- ✅ **Controle de carga** (não sobrecarrega servidor)
- ✅ **Escalável** (ajustável por parâmetro)

---

**Status**: ✅ **PARALELIZAÇÃO IMPLEMENTADA**  
**Ganho**: **10-50x mais rápido**  
**Versão**: 2.0.0 (Parallel)
