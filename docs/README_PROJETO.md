# Simulador de Detecção de Disparos por Enxame de Drones

## Visão Geral

Este é um protótipo de simulador web para demonstrar um sistema de detecção de disparos de armas de fogo usando um enxame de drones equipados com microfones. O sistema utiliza técnicas de processamento de sinal (sem IA) para identificar e localizar disparos.

## Arquitetura do Sistema

### Frontend (Next.js + OpenLayers)
- Interface web interativa com mapa
- Visualização em tempo real dos drones
- Controles para configuração de parâmetros
- Renderização de resultados de detecção

### Backend (Next.js API Routes)
- Processamento de áudio dos drones
- Análise usando Dynamic Time Warping (DTW)
- Triangulação de posição usando TDOA (Time Difference of Arrival)
- Simulação de propagação sonora

## Funcionalidades

### 1. Configuração da Área de Operação
- Clique no mapa para definir o centro de operação
- Configure o raio de dispersão (em km)
- Defina a quantidade de drones
- Drones são dispersos aleatoriamente sem sobreposição

### 2. Simulação de Disparo
- Clique no mapa para simular um disparo
- O sistema:
  - Gera um sinal de áudio sintético de disparo
  - Simula a propagação do som para cada drone
  - Aplica atenuação baseada na distância
  - Adiciona delay baseado no tempo de viagem do som
  - Adiciona ruído simulando condições reais

### 3. Detecção e Análise
- Cada drone "captura" o áudio com características únicas
- Features são extraídas (energia, zero-crossing rate)
- DTW compara com templates de disparos e sons ambiente
- Votação por maioria para confirmar detecção

### 4. Triangulação
- Usa Time Difference of Arrival (TDOA)
- Calcula posição baseada nos delays entre drones
- Visualiza posição real (vermelho) vs calculada (verde)

## Estrutura de Pastas

```
simulador/
├── app/
│   ├── api/
│   │   ├── audio/
│   │   │   ├── analyze/    # Análise DTW e detecção
│   │   │   └── simulate/   # Simulação de disparo
│   │   └── drone/
│   │       └── position/   # Cálculo de posições dos drones
│   ├── page.tsx            # Página principal
│   └── layout.tsx
├── components/
│   └── map.tsx             # Componente do mapa OpenLayers
├── lib/
│   ├── audioUtils.ts       # Processamento de áudio
│   ├── dtwUtils.ts         # Dynamic Time Warping
│   └── geoUtils.ts         # Cálculos geoespaciais
├── database/
│   ├── gunshots/          # Samples de disparos (WAV)
│   ├── ambient/           # Samples ambiente (WAV)
│   └── validation/        # Subset para validação
└── public/
    └── drone_icon.svg     # Ícone do drone
```

## Tecnologias Utilizadas

- **Next.js 16**: Framework React com API routes
- **TypeScript**: Tipagem estática
- **OpenLayers**: Renderização de mapas
- **Dynamic Time Warping**: Análise de similaridade de séries temporais
- **Tailwind CSS**: Estilização

## Como Usar

### 1. Instalação

```bash
cd simulador
npm install
```

### 2. Executar em Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

### 3. Fluxo de Uso

1. **Configure os parâmetros** no painel direito:
   - Raio de operação (recomendado: 0.3 km)
   - Quantidade de drones (mínimo 3 para triangulação)

2. **Defina a área de operação**:
   - Clique em "Definir Área de Operação"
   - Clique no mapa onde deseja o centro

3. **Simule um disparo**:
   - Clique em "Simular Disparo"
   - Clique no mapa onde deseja simular o disparo
   - Aguarde a análise

4. **Visualize os resultados**:
   - Detecção: Disparo detectado ou não
   - Confiança: % de certeza
   - Posições: Real (vermelho) vs Calculada (verde)

## Detalhes Técnicos

### Propagação do Som
- Velocidade do som: 343 m/s (20°C)
- Atenuação: Lei do inverso do quadrado
- Delay: Calculado pela distância / velocidade

### Análise de Áudio
- **Features extraídas**:
  - Energia por frame
  - Zero-crossing rate
  
- **DTW (Dynamic Time Warping)**:
  - Compara features com templates
  - Normaliza por comprimento da série
  - Threshold configurável

### Triangulação (TDOA)
- Usa diferença de tempo de chegada entre drones
- Weighted centroid baseado em energia
- Necessita mínimo 3 drones

### Sistema de Coordenadas
- **WGS84**: Sistema de coordenadas geográficas (GPS)
- **Conversões**: Backend converte para metros quando necessário
- **Projeção**: OpenLayers usa EPSG:3857 (Web Mercator)

## Limitações e Simplificações

Este é um **protótipo educacional** com simplificações:

1. **Áudio sintético**: Não usa arquivos WAV reais
2. **Propagação simplificada**: Não considera obstáculos, temperatura, vento
3. **Templates simulados**: Em produção, usaria database real de disparos
4. **Triangulação básica**: Algoritmo simplificado (não é beamforming completo)
5. **Sem persistência**: Dados não são salvos

## Melhorias Futuras

- [ ] Integração com database real de áudio
- [ ] Suporte a múltiplas formações de drones
- [ ] Visualização 3D do enxame
- [ ] Histórico de detecções
- [ ] Exportação de relatórios
- [ ] Simulação de condições ambientais (vento, temperatura)
- [ ] Algoritmos de triangulação mais sofisticados
- [ ] Websockets para atualizações em tempo real
- [ ] Modo multi-usuário

## Database de Áudio

Para usar arquivos de áudio reais, adicione:

1. Arquivos WAV de disparos em `database/gunshots/`
2. Arquivos WAV de sons ambiente em `database/ambient/`
3. Cópias para validação em `database/validation/`

**Formato recomendado**:
- Taxa de amostragem: 44100 Hz
- Canais: Mono
- Bit depth: 16-bit
- Formato: WAV

## Configurações Recomendadas

- **Raio**: 0.3 - 0.5 km (para visualização clara)
- **Drones**: 5 - 10 (mínimo 3)
- **Distância mínima entre drones**: 30m (configurável no código)

## Créditos

Desenvolvido como protótipo para demonstração de conceito de sistema de detecção acústica de disparos usando enxames de drones.

## Licença

Protótipo educacional - Para fins de demonstração.
