# 🚁 Simulador de Detecção de Disparos por Enxame de Drones

## 📖 Visão Geral

Protótipo de simulador web para demonstração de sistema de detecção acústica de disparos de armas de fogo usando enxame de drones equipados com microfones. O sistema utiliza técnicas de processamento de sinal (Dynamic Time Warping - DTW) para identificar e triangular a posição de disparos.

![Status](https://img.shields.io/badge/status-prototype-yellow)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![OpenLayers](https://img.shields.io/badge/OpenLayers-10-1f6b75)

## ✨ Características

- 🗺️ **Interface interativa** com mapa (OpenLayers)
- 🤖 **Dispersão aleatória** de drones sem sobreposição
- 🔊 **Simulação acústica** com atenuação e delay realistas
- 📊 **Análise DTW** para detecção de disparos
- 🎯 **Votação ponderada por distância** - Drones mais próximos têm maior influência (quando ≥5% detectam disparo)
- 📍 **Triangulação TDOA** para localização
- 🚀 **Performance otimizada** - Upload paralelo em lotes, polling com backoff exponencial
- 🧪 **Testes de carga automatizados** - 1000 testes por raio com execução paralela
- 🎯 **Visualização** de posições real vs calculada

## 🚀 Quick Start

### Instalação

```bash
cd simulador
npm install
```

### Executar

```bash
npm run dev
```

Acesse: **http://localhost:3000**

### Uso Rápido

1. Configure **raio** (0.3 km) e **quantidade de drones** (5)
2. Clique em **"Definir Área de Operação"** → clique no mapa
3. Clique em **"Simular Disparo"** → clique onde quer simular
4. Aguarde análise e veja resultado!

📚 **Guia completo**: [QUICKSTART.md](docs/QUICKSTART.md)

## 📁 Estrutura do Projeto

```
simulador/
├── app/
│   ├── api/
│   │   ├── audio/
│   │   │   ├── analyze/      # Detecção DTW + Triangulação
│   │   │   └── simulate/     # Simulação de disparo
│   │   └── drone/
│   │       └── position/     # Cálculo de posições
│   ├── page.tsx              # Interface principal
│   └── layout.tsx
├── components/
│   └── map.tsx               # Mapa OpenLayers
├── lib/
│   ├── audioUtils.ts         # Processamento de áudio
│   ├── dtwUtils.ts           # Dynamic Time Warping
│   ├── geoUtils.ts           # Cálculos geoespaciais
│   └── config.ts             # Configurações
├── database/
│   ├── gunshots/             # Samples de disparos (WAV)
│   ├── ambient/              # Samples ambiente (WAV)
│   └── validation/           # Subset para validação
├── public/
│   └── drone_icon.svg        # Ícone do drone
└── scripts/
    └── loadAudioDatabase.ts  # Exemplo de carregamento
```

## 🔧 Tecnologias

| Tecnologia | Uso |
|------------|-----|
| **Next.js 16** | Framework React + API Routes |
| **TypeScript** | Tipagem estática |
| **OpenLayers** | Renderização de mapas |
| **Dynamic Time Warping** | Análise de similaridade de áudio |
| **Tailwind CSS** | Estilização |

## 📊 Arquitetura

### Fluxo de Detecção

```
1. Usuário define área → Drones são dispersos
2. Usuário simula disparo → Áudio sintético gerado
3. Propagação simulada → Delay + Atenuação por distância
4. Cada drone "captura" → Features extraídas
5. Análise DTW → Compara com templates
6. Votação inteligente → Maioria simples (<5% detecções) ou ponderada por distância (≥5%)
7. Triangulação TDOA → Calcula posição (se disparo detectado)
8. Visualização → Mostra resultado no mapa
```

### APIs

- **POST /api/drone/position** - Calcula posições dos drones
- **POST /api/audio/simulate** - Simula disparo e captura
- **POST /api/audio/analyze** - Submete áudio para análise
- **GET /api/audio/analyze** - Obtém resultado da detecção

📚 **Documentação completa**: [API_DOCS.md](docs/API_DOCS.md)

## 🎯 Algoritmos Utilizados

### 1. Dispersão de Drones
- **Algoritmo**: Poisson Disk Sampling (simplificado)
- **Objetivo**: Posicionar drones sem sobreposição
- **Distância mínima**: 30 metros

### 2. Simulação Acústica
- **Velocidade do som**: 343 m/s (20°C)
- **Atenuação**: Lei do inverso do quadrado
- **Delay**: `t = distância / 343`
- **Ruído**: Gaussiano (σ = 0.05)

### 3. Dynamic Time Warping (DTW)
- **Propósito**: Medir similaridade entre sinais de áudio
- **Features**: Energia + Zero-crossing rate
- **Threshold**: 0.3 (configurável)
- **Votação Simples**: Maioria dos drones (quando <5% detectam)
- **Votação Ponderada**: Peso por distância com decaimento exponencial (quando ≥5% detectam)
  - Peso = e^(-0.1 × distância_metros)
  - Drones próximos têm influência exponencialmente maior

### 4. Triangulação (TDOA)
- **Método**: Time Difference of Arrival
- **Técnica**: Weighted centroid
- **Peso**: Inversamente proporcional ao delay
- **Mínimo**: 3 drones

## 📈 Performance

| Métrica | Valor |
|---------|-------|
| Cálculo de posições | < 50ms |
| Simulação de áudio | ~100ms (5 drones) |
| Upload paralelo | ~2s (100 drones, 10 lotes) |
| Análise DTW | ~200ms/drone |
| Triangulação | < 10ms |
| **Total (5 drones)** | **~1-2s** |
| **Total (100 drones)** | **~5-7s** |

### Otimizações Implementadas
- ✅ Upload em lotes paralelos (10x mais rápido)
- ✅ Polling com backoff exponencial (40% menos requisições)
- ✅ Memoização de estilos do mapa (React useMemo)
- ✅ Callbacks otimizados (React useCallback)
- ✅ Testes de carga com paralelização configurável (10-50x speedup)

## 🎮 Configurações Recomendadas

| Parâmetro | Valor Recomendado | Mínimo | Máximo |
|-----------|------------------|--------|--------|
| **Raio** | 0.3 - 0.5 km | 0.1 km | 2 km |
| **Drones** | 5 - 10 | 3 | 15 |
| **Distância entre drones** | 30m | - | - |

## 📚 Documentação Adicional

- 📖 [README_PROJETO.md](docs/README_PROJETO.md) - Documentação técnica completa
- 🚀 [QUICKSTART.md](docs/QUICKSTART.md) - Guia rápido de início
- 🔌 [API_DOCS.md](docs/API_DOCS.md) - Documentação das APIs
- ⚡ [PERFORMANCE_OPTIMIZATIONS.md](docs/PERFORMANCE_OPTIMIZATIONS.md) - Otimizações de performance
- 🧪 [PARALLEL_TESTING.md](docs/PARALLEL_TESTING.md) - Testes de carga paralelos
- 🎵 [database/README.md](database/README.md) - Como popular o database

## 🎨 Interface

### Painel de Controle
- ⚙️ **Configurações**: Raio e quantidade de drones
- 🎯 **Ações**: Definir área e simular disparo
- 📊 **Status**: Info em tempo real
- 📈 **Resultados**: Detecção e precisão

### Visualização no Mapa
- 🔵 **Círculo azul**: Área de operação
- 🚁 **Ícones**: Posição dos drones
- 🔴 **Ponto vermelho**: Posição REAL do disparo
- 🟢 **Ponto verde**: Posição CALCULADA

## 🧪 Testando

### Teste 1: Precisão no Centro
1. Defina área com raio 0.3 km
2. Use 5+ drones
3. Simule disparo no **centro** da área azul
4. **Resultado esperado**: Pontos verde e vermelho muito próximos

### Teste 2: Bordas
1. Simule disparo na **borda** da área
2. **Resultado esperado**: Precisão menor (normal)

### Teste 3: Escalabilidade
1. Teste com 3, 5, 10 drones
2. **Observação**: Mais drones = maior precisão
3. Com ≥5% detectando, votação ponderada é ativada automaticamente

### Teste 4: Testes de Carga Automatizados
Execute testes de performance com diferentes raios:
```bash
npm run test:load -- <latitude> <longitude> [maxConcurrent]
# Exemplo: npm run test:load -- -22.9035 -43.2096 10
```
- Executa 1000 testes por raio (0.1, 0.3, 0.5, 0.7, 0.9, 1.2 km)
- Distribuição: 70% disparos, 30% ambiente
- Métricas: acurácia, erro de posição, tempo (média + desvio padrão)
- Resultados salvos em `tests/load_test_<timestamp>/`
- Paralelização configurável (padrão: 10 simultâneos)

## ⚠️ Limitações

Este é um **protótipo educacional**:

- ❌ Áudio sintético (não usa WAV reais)
- ❌ Propagação simplificada (sem obstáculos)
- ❌ Templates simulados (não database real)
- ❌ Triangulação básica (não beamforming completo)
- ❌ Sem persistência de dados

## 🚀 Melhorias Futuras

- [ ] Integração com database real de áudio
- [ ] Múltiplas formações de drones
- [ ] Visualização 3D
- [ ] Histórico de detecções
- [ ] Exportação de relatórios
- [ ] Condições ambientais (vento, temperatura)
- [ ] Algoritmos avançados de triangulação (beamforming)
- [ ] WebSockets para real-time
- [ ] Modo multi-usuário
- [ ] Dashboard de métricas de teste em tempo real
- [ ] Fine-tuning de parâmetros de votação ponderada

## 📝 Notas Técnicas

### Sistema de Coordenadas
- **Entrada/Saída**: WGS84 (GPS padrão)
- **Mapa**: EPSG:3857 (Web Mercator)
- **Conversões**: Automáticas pelo OpenLayers

### Processamento de Áudio
- **Taxa**: 44100 Hz
- **Formato**: Float32Array (-1.0 a 1.0)
- **Transmissão**: Base64
- **Frame**: 2048 samples, hop 512

### Database de Áudio (Opcional)
Adicione arquivos WAV em:
- `database/gunshots/` - Disparos reais
- `database/ambient/` - Sons ambiente
- `database/validation/` - Testes

Veja `scripts/loadAudioDatabase.ts` para exemplo.

## 🐛 Troubleshooting

### Drones não aparecem
✅ Clique em "Definir Área de Operação" primeiro

### Botão de disparo desabilitado
✅ Defina a área de operação antes

### Posição calculada imprecisa
✅ Normal em simulação - use mais drones
✅ Simule mais próximo do centro

### Erro de compilação
```bash
npm install
npm run dev
```

## 🤝 Contribuindo

Este é um protótipo educacional. Sugestões são bem-vindas!

## 📄 Licença

Protótipo educacional - Para fins de demonstração

## 👨‍💻 Autor

Desenvolvido como demonstração de conceito de sistema acústico de detecção de disparos

---

**🎯 Comece agora**: `npm run dev` e abra http://localhost:3000

**❓ Dúvidas**: Veja [QUICKSTART.md](docs/QUICKSTART.md) e [API_DOCS.md](docs/API_DOCS.md)
