# 📑 Índice de Documentação

Bem-vindo ao Simulador de Detecção de Disparos por Enxame de Drones!

Este índice ajuda você a encontrar rapidamente a documentação que precisa.

---

## 🚀 Começando

### Para Usuários Novos
1. **[README.md](../README.md)** - Comece aqui! Visão geral do projeto
2. **[QUICKSTART.md](QUICKSTART.md)** - Guia passo-a-passo para primeiro uso
3. **[CHECKLIST.md](CHECKLIST.md)** - Verifique o que foi implementado

### Para Desenvolvedores
1. **[README_PROJETO.md](README_PROJETO.md)** - Documentação técnica completa
2. **[DEV_COMMANDS.md](DEV_COMMANDS.md)** - Comandos úteis para desenvolvimento
3. **[API_DOCS.md](API_DOCS.md)** - Documentação detalhada das APIs

### Para Otimização e Testes
1. **[PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md)** - Otimizações implementadas
2. **[PARALLEL_TESTING.md](PARALLEL_TESTING.md)** - Testes de carga paralelos
3. **[LOAD_TEST_README.md](LOAD_TEST_README.md)** - Guia de testes automatizados

### Para Entender o Sistema
1. **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Resumo da implementação
2. **[database/README.md](../database/README.md)** - Como usar o database de áudio

---

## 📚 Documentação por Tópico

### 🎯 Instalação e Setup
- **Instalação**: [README.md](../README.md#-quick-start)
- **Primeira execução**: [QUICKSTART.md](QUICKSTART.md#instalação)
- **Troubleshooting**: [DEV_COMMANDS.md](DEV_COMMANDS.md#-troubleshooting-comum)

### 🎮 Como Usar
- **Guia rápido**: [QUICKSTART.md](QUICKSTART.md#primeiros-passos)
- **Configurações**: [QUICKSTART.md](QUICKSTART.md#dicas)
- **Interface**: [README_PROJETO.md](README_PROJETO.md#interface)

### 🔧 Desenvolvimento
- **Arquitetura**: [README_PROJETO.md](README_PROJETO.md#arquitetura-do-sistema)
- **Estrutura de pastas**: [README.md](../README.md#-estrutura-do-projeto)
- **Comandos úteis**: [DEV_COMMANDS.md](DEV_COMMANDS.md)
- **Configurações**: [DEV_COMMANDS.md](DEV_COMMANDS.md#-configurações-principais)

### ⚡ Performance e Otimização
- **Visão geral**: [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md)
- **Upload paralelo**: [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md#upload-paralelo-em-lotes)
- **Polling otimizado**: [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md#polling-com-backoff-exponencial)
- **React optimizations**: [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md#otimizações-react)

### 🧪 Testes de Carga
- **Testes paralelos**: [PARALLEL_TESTING.md](PARALLEL_TESTING.md)
- **Guia de uso**: [LOAD_TEST_README.md](LOAD_TEST_README.md)
- **Métricas**: [PARALLEL_TESTING.md](PARALLEL_TESTING.md#métricas-coletadas)
- **Execução**: [LOAD_TEST_README.md](LOAD_TEST_README.md#execução)

### 🔌 APIs
- **Visão geral**: [API_DOCS.md](API_DOCS.md#visão-geral)
- **Drone Position**: [API_DOCS.md](API_DOCS.md#1-drone-position-api)
- **Audio Simulate**: [API_DOCS.md](API_DOCS.md#2-audio-simulate-api)
- **Audio Analyze**: [API_DOCS.md](API_DOCS.md#3-audio-analyze-api)
- **Exemplos**: [API_DOCS.md](API_DOCS.md#exemplos-de-uso-completo)

### 📊 Algoritmos
- **Dispersão de drones**: [README_PROJETO.md](README_PROJETO.md#1-dispersão-de-drones)
- **Simulação acústica**: [README_PROJETO.md](README_PROJETO.md#2-simulação-acústica)
- **Dynamic Time Warping**: [README_PROJETO.md](README_PROJETO.md#3-dynamic-time-warping-dtw)
- **Votação ponderada por distância**: [README.md](../README.md#3-dynamic-time-warping-dtw)
- **Triangulação**: [README_PROJETO.md](README_PROJETO.md#4-triangulação-tdoa)

### 🎨 Customização
- **Cores e visual**: [DEV_COMMANDS.md](DEV_COMMANDS.md#-personalizar-visual)
- **Parâmetros**: [DEV_COMMANDS.md](DEV_COMMANDS.md#-configurações-principais)
- **Ícones**: [DEV_COMMANDS.md](DEV_COMMANDS.md#personalizar-visual)

### 🎵 Database de Áudio
- **Estrutura**: [database/README.md](../database/README.md)
- **Como adicionar WAV**: [DEV_COMMANDS.md](DEV_COMMANDS.md#-adicionar-arquivos-wav-reais)
- **Processamento**: `../scripts/loadAudioDatabase.ts`

### 🧪 Testes
- **Cenários de teste**: [QUICKSTART.md](QUICKSTART.md#testando-a-precisão)
- **Testes de carga**: [LOAD_TEST_README.md](LOAD_TEST_README.md)
- **Testes paralelos**: [PARALLEL_TESTING.md](PARALLEL_TESTING.md)
- **Debug**: [DEV_COMMANDS.md](DEV_COMMANDS.md#-debug)
- **Performance**: [API_DOCS.md](API_DOCS.md#performance)

---

## 📖 Guias por Objetivo

### "Quero executar o projeto"
1. [README.md](../README.md#-quick-start) - Instalação
2. [QUICKSTART.md](QUICKSTART.md) - Primeiro uso
3. [QUICKSTART.md](QUICKSTART.md#troubleshooting) - Se tiver problemas

### "Quero entender como funciona"
1. [README.md](../README.md#-visão-geral) - Overview
2. [README_PROJETO.md](README_PROJETO.md#detalhes-técnicos) - Detalhes
3. [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Implementação

### "Quero desenvolver/modificar"
1. [DEV_COMMANDS.md](DEV_COMMANDS.md) - Comandos e configs
2. [API_DOCS.md](API_DOCS.md) - APIs
3. [README_PROJETO.md](README_PROJETO.md#melhorias-futuras) - Ideias

### "Quero otimizar performance"
1. [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md) - Otimizações
2. [PARALLEL_TESTING.md](PARALLEL_TESTING.md) - Testes paralelos
3. [LOAD_TEST_README.md](LOAD_TEST_README.md) - Testes de carga

### "Quero usar as APIs"
1. [API_DOCS.md](API_DOCS.md#visão-geral) - Visão geral
2. [API_DOCS.md](API_DOCS.md#tipos-de-dados) - Tipos de dados
3. [API_DOCS.md](API_DOCS.md#exemplos-de-uso-completo) - Exemplos

### "Quero adicionar áudio real"
1. [database/README.md](../database/README.md) - Estrutura
2. [DEV_COMMANDS.md](DEV_COMMANDS.md#-adicionar-arquivos-wav-reais) - Como fazer
3. `../scripts/loadAudioDatabase.ts` - Código de exemplo

---

## 🔍 Referência Rápida

### Arquivos de Código Principais
```
app/page.tsx                      → Interface principal
components/map.tsx                → Componente do mapa
lib/audioUtils.ts                 → Processamento de áudio
lib/dtwUtils.ts                   → Dynamic Time Warping
lib/geoUtils.ts                   → Cálculos geoespaciais
lib/config.ts                     → Configurações
app/api/drone/position/route.ts   → API de posicionamento
app/api/audio/simulate/route.ts   → API de simulação
app/api/audio/analyze/route.ts    → API de análise
```

### Documentação
```
../README.md                     → Visão geral e quick start
QUICKSTART.md                    → Guia para iniciantes
README_PROJETO.md                → Documentação técnica completa
API_DOCS.md                      → Documentação das APIs
IMPLEMENTATION_SUMMARY.md        → Resumo da implementação
PERFORMANCE_OPTIMIZATIONS.md     → Otimizações de performance
PARALLEL_TESTING.md              → Testes de carga paralelos
LOAD_TEST_README.md              → Guia de testes automatizados
DEV_COMMANDS.md                  → Comandos úteis
CHECKLIST.md                     → Status do projeto
INDEX.md                         → Este arquivo
../database/README.md            → Database de áudio
```

---

## 🎓 Conceitos Importantes

### Tecnologias
- **Next.js**: [README.md](../README.md#-tecnologias)
- **OpenLayers**: [README_PROJETO.md](README_PROJETO.md#frontend-nextjs--openlayers)
- **TypeScript**: [README.md](../README.md#-tecnologias)

### Algoritmos
- **DTW**: [README_PROJETO.md](README_PROJETO.md#3-dynamic-time-warping-dtw)
- **Votação Ponderada**: [README.md](../README.md#3-dynamic-time-warping-dtw)
- **TDOA**: [README_PROJETO.md](README_PROJETO.md#4-triangulação-tdoa)
- **Poisson Disk**: [README_PROJETO.md](README_PROJETO.md#1-dispersão-de-drones)

### Física
- **Propagação sonora**: [API_DOCS.md](API_DOCS.md#características-do-áudio-simulado)
- **Coordenadas GPS**: [README_PROJETO.md](README_PROJETO.md#sistema-de-coordenadas)

### Performance
- **Paralelização**: [PERFORMANCE_OPTIMIZATIONS.md](PERFORMANCE_OPTIMIZATIONS.md)
- **Testes de Carga**: [PARALLEL_TESTING.md](PARALLEL_TESTING.md)
- **Métricas**: [LOAD_TEST_README.md](LOAD_TEST_README.md)

---

## 🆘 Ajuda Rápida

### Erros Comuns
**Drones não aparecem**
→ [QUICKSTART.md](QUICKSTART.md#nenhum-drone-aparece)

**Botão desabilitado**
→ [QUICKSTART.md](QUICKSTART.md#botão-simular-disparo-desabilitado)

**Posição imprecisa**
→ [QUICKSTART.md](QUICKSTART.md#posição-calculada-muito-longe-da-real)

**Erros de compilação**
→ [DEV_COMMANDS.md](DEV_COMMANDS.md#build-falha)

### Comandos Essenciais
```bash
npm run dev      # Iniciar desenvolvimento
npm run build    # Compilar
npm run lint     # Verificar código
```
→ [DEV_COMMANDS.md](DEV_COMMANDS.md#-comandos-rápidos)

---

## 📞 Suporte

### Documentação
- **Completa**: [README_PROJETO.md](README_PROJETO.md)
- **APIs**: [API_DOCS.md](API_DOCS.md)
- **Desenvolvimento**: [DEV_COMMANDS.md](DEV_COMMANDS.md)

### Recursos Externos
- Next.js: https://nextjs.org/docs
- OpenLayers: https://openlayers.org/
- TypeScript: https://www.typescriptlang.org/docs/
- DTW: https://en.wikipedia.org/wiki/Dynamic_time_warping

---

## 🗺️ Mapa de Navegação

```
INDEX.md (você está aqui)
    │
    ├─── Começando
    │    ├─ ../README.md
    │    ├─ QUICKSTART.md
    │    └─ CHECKLIST.md
    │
    ├─── Desenvolvimento
    │    ├─ README_PROJETO.md
    │    ├─ DEV_COMMANDS.md
    │    └─ API_DOCS.md
    │
    ├─── Performance & Testes
    │    ├─ PERFORMANCE_OPTIMIZATIONS.md
    │    ├─ PARALLEL_TESTING.md
    │    └─ LOAD_TEST_README.md
    │
    ├─── Implementação
    │    ├─ IMPLEMENTATION_SUMMARY.md
    │    └─ ../database/README.md
    │
    └─── Código
         ├─ ../app/
         ├─ ../components/
         ├─ ../lib/
         └─ ../scripts/
```

---

## ✅ Status

- **Protótipo**: ✅ Completo
- **Documentação**: ✅ Completa
- **Testes**: ✅ Build OK
- **Ready**: ✅ Pronto para usar

---

**🚀 Comece agora**: `npm run dev` → http://localhost:3000

**❓ Primeira vez?** Leia [QUICKSTART.md](QUICKSTART.md)

**🔧 Desenvolvedor?** Veja [DEV_COMMANDS.md](DEV_COMMANDS.md)

**📚 Quer detalhes?** Leia [README_PROJETO.md](README_PROJETO.md)
