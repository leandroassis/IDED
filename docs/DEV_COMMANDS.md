# 🛠️ Comandos Úteis para Desenvolvimento

## 🚀 Execução

### Desenvolvimento
```bash
npm run dev
# Inicia servidor em http://localhost:3000
# Hot reload habilitado
```

### Produção
```bash
npm run build    # Compila o projeto
npm run start    # Inicia servidor de produção
```

### Linting
```bash
npm run lint     # Verifica problemas no código
```

---

## 📝 Estrutura de Arquivos

### Principais Arquivos
```
app/page.tsx              # Interface principal
components/map.tsx        # Componente do mapa
lib/audioUtils.ts         # Processamento de áudio
lib/dtwUtils.ts          # Dynamic Time Warping
lib/geoUtils.ts          # Cálculos geoespaciais
lib/config.ts            # Configurações
```

### APIs
```
app/api/drone/position/route.ts    # Posicionamento de drones
app/api/audio/simulate/route.ts    # Simulação de disparo
app/api/audio/analyze/route.ts     # Detecção e triangulação
```

---

## 🔧 Configurações Principais

### Ajustar Threshold de Detecção
Arquivo: `app/api/audio/analyze/route.ts`
```typescript
// Linha ~95
return classifyGunshot(
  droneData.audioFeatures,
  gunshotTemplates,
  ambientTemplates,
  0.3  // ← AJUSTE AQUI (0-1, menor = mais sensível)
);
```

### Mudar Distância Mínima entre Drones
Arquivo: `lib/config.ts`
```typescript
export const DRONE_CONFIG = {
  MIN_DISTANCE: 30,  // ← AJUSTE AQUI (metros)
  // ...
};
```

### Alterar Raio Padrão
Arquivo: `app/page.tsx`
```typescript
const [radius, setRadius] = useState<number>(0.3);  // ← AQUI (km)
```

### Mudar Velocidade do Som
Arquivo: `lib/config.ts`
```typescript
export const PHYSICS_CONFIG = {
  SPEED_OF_SOUND: 343,  // ← AQUI (m/s)
  // Para outras temperaturas:
  // 0°C = 331 m/s
  // 20°C = 343 m/s
  // 30°C = 349 m/s
};
```

---

## 🧪 Testando Diferentes Cenários

### Teste 1: Máxima Precisão
```typescript
// Em app/page.tsx
const [radius, setRadius] = useState<number>(0.2);  // Raio pequeno
const [droneCount, setDroneCount] = useState<number>(10);  // Muitos drones
```

### Teste 2: Área Grande
```typescript
const [radius, setRadius] = useState<number>(1.0);  // 1 km
const [droneCount, setDroneCount] = useState<number>(15);
```

### Teste 3: Mínimo de Drones
```typescript
const [droneCount, setDroneCount] = useState<number>(3);  // Mínimo
```

---

## 🐛 Debug

### Habilitar Logs Detalhados
Arquivo: `lib/config.ts`
```typescript
export const DEBUG_CONFIG = {
  VERBOSE_LOGGING: true,  // ← true para logs
  SHOW_TIMING: true,      // ← true para tempos
  SAVE_AUDIO_DEBUG: true, // ← true para salvar áudio
};
```

### Ver Dados de Áudio no Console
Arquivo: `app/api/audio/simulate/route.ts`
```typescript
// Adicione após linha 40:
console.log('Audio gerado:', originalAudio);
console.log('Distâncias:', droneAudioData.map(d => d.distance));
```

### Ver Features Extraídas
Arquivo: `app/api/audio/analyze/route.ts`
```typescript
// Adicione após linha 50:
console.log('Features:', {
  energy: features.energy.slice(0, 10),
  zcr: features.zeroCrossingRate.slice(0, 10)
});
```

### Ver Resultados DTW
```typescript
// Adicione após classificação (linha ~90):
console.log('DTW Results:', classifications);
```

---

## 📊 Monitoramento

### Ver Todas as Requisições
No navegador, abra DevTools → Network → Filtro: Fetch/XHR

### Ver Estado do React
Instale React DevTools:
```bash
# Chrome/Edge
https://chrome.google.com/webstore → React Developer Tools

# Firefox
https://addons.mozilla.org → React DevTools
```

### Performance
```javascript
// Adicione em app/page.tsx no início da função
console.time('Total');
// ... seu código
console.timeEnd('Total');
```

---

## 🔄 Resetar Estado

### Limpar Cache do Next.js
```bash
rm -rf .next
npm run dev
```

### Reinstalar Dependências
```bash
rm -rf node_modules package-lock.json
npm install
```

### Reset Completo
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

---

## 📦 Adicionar Arquivos WAV Reais

### 1. Preparar Arquivos
Converta para:
- Formato: WAV
- Taxa: 44100 Hz
- Canais: Mono
- Bit depth: 16-bit

### 2. Adicionar ao Database
```bash
cp seu_disparo.wav database/gunshots/
cp seu_ambiente.wav database/ambient/
cp seu_teste.wav database/validation/
```

### 3. Processar (exemplo)
```bash
# Instale biblioteca WAV
npm install wav

# Use o script (após implementar)
node scripts/loadAudioDatabase.ts
```

---

## 🎨 Personalizar Visual

### Cores
Arquivo: `lib/config.ts`
```typescript
export const UI_CONFIG = {
  COLORS: {
    OPERATION_AREA: 'rgba(0, 123, 255, 0.1)',     // Azul
    OPERATION_BORDER: 'rgba(0, 123, 255, 0.8)',   // Borda
    REAL_GUNSHOT: 'rgba(255, 0, 0, 0.8)',         // Vermelho
    CALCULATED_GUNSHOT: 'rgba(0, 255, 0, 0.8)',   // Verde
  },
};
```

### Tamanhos
```typescript
export const UI_CONFIG = {
  SIZES: {
    MARKER_RADIUS: 8,          // Tamanho dos marcadores
    DRONE_ICON_SCALE: 0.3,     // Escala do ícone do drone
    BORDER_WIDTH: 2,           // Largura das bordas
  },
};
```

### Ícone do Drone
Edite: `public/drone_icon.svg`

---

## 📈 Melhorias de Performance

### 1. Otimizar Renderização
```typescript
// Use React.memo para componentes pesados
const Map1 = React.memo(({ setMap1Object }) => {
  // ...
});
```

### 2. Debounce em Inputs
```typescript
import { debounce } from 'lodash';

const handleRadiusChange = debounce((value) => {
  setRadius(value);
}, 300);
```

### 3. Lazy Load
```typescript
import dynamic from 'next/dynamic';

const Map1 = dynamic(() => import('@/components/map'), {
  ssr: false
});
```

---

## 🔍 Troubleshooting Comum

### Drones não aparecem
```bash
# Verifique console do navegador (F12)
# Verifique terminal do servidor
# Verifique resposta da API em Network tab
```

### Erro de CORS
```typescript
// Em next.config.ts, adicione:
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
      ],
    },
  ];
},
```

### Mapa não carrega
```bash
# Verifique conexão com internet (usa tiles do OSM)
# Limpe cache: Ctrl+Shift+R
# Verifique console do navegador
```

### Build falha
```bash
# Verifique erros TypeScript
npm run lint

# Limpe e reconstrua
rm -rf .next
npm run build
```

---

## 📚 Recursos Úteis

### OpenLayers
- Docs: https://openlayers.org/en/latest/apidoc/
- Examples: https://openlayers.org/en/latest/examples/

### Dynamic Time Warping
- Wikipedia: https://en.wikipedia.org/wiki/Dynamic_time_warping
- Tutorial: https://rtavenar.github.io/blog/dtw.html

### TDOA
- Wikipedia: https://en.wikipedia.org/wiki/Time_of_arrival
- Paper: [Acoustic Source Localization]

### TypeScript
- Docs: https://www.typescriptlang.org/docs/
- Cheatsheet: https://www.typescriptlang.org/cheatsheets

### Next.js
- Docs: https://nextjs.org/docs
- API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

## 🎯 Comandos Rápidos

```bash
# Iniciar desenvolvimento
npm run dev

# Verificar erros
npm run lint

# Compilar
npm run build

# Limpar e reiniciar
rm -rf .next && npm run dev

# Ver estrutura
tree -L 3 -I node_modules

# Buscar no código
grep -r "SPEED_OF_SOUND" --include="*.ts" --include="*.tsx"

# Contar linhas
find . -name "*.ts" -o -name "*.tsx" | xargs wc -l
```

---

## 💡 Dicas

1. **Sempre teste após mudanças**: `npm run build`
2. **Use TypeScript**: Evita bugs em runtime
3. **Leia os logs**: Console do navegador E terminal
4. **Documente mudanças**: Comentários inline
5. **Teste cenários extremos**: 3 drones, 15 drones, raio grande, etc.

---

**Happy Coding! 🚀**
