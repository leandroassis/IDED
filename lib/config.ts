/**
 * Configurações globais do simulador
 */

export const AUDIO_CONFIG = {
  // Taxa de amostragem padrão
  SAMPLE_RATE: 44100, // Hz
  
  // Parâmetros de análise de áudio
  FRAME_SIZE: 2048,    // samples
  HOP_SIZE: 512,       // samples
  
  // Duração do áudio sintético de disparo
  GUNSHOT_DURATION: 0.5, // segundos
} as const;

export const PHYSICS_CONFIG = {
  // Velocidade do som no ar a 20°C
  SPEED_OF_SOUND: 343, // m/s
  
  // Raio da Terra (WGS84)
  EARTH_RADIUS: 6378137, // metros
  
  // Metros por grau de latitude (aproximado)
  METERS_PER_DEGREE_LAT: 111320,
} as const;

export const DRONE_CONFIG = {
  // Distância mínima entre drones na dispersão
  MIN_DISTANCE: 30, // metros
  
  // Raio padrão de operação
  DEFAULT_RADIUS: 0.3, // km
  
  // Quantidade padrão de drones
  DEFAULT_COUNT: 5,
  
  // Quantidade mínima para triangulação
  MIN_COUNT: 3,
  
  // Quantidade máxima recomendada
  MAX_RECOMMENDED: 15,
  
  // Máximo de tentativas para posicionar sem sobreposição
  MAX_PLACEMENT_ATTEMPTS: 1000,
} as const;

export const DETECTION_CONFIG = {
  // Threshold de similaridade DTW para detecção de disparo
  DTW_THRESHOLD: 0.3,
  
  // Nível de ruído na simulação
  NOISE_LEVEL: 0.05,
  
  // Timeout para sincronização de dados dos drones
  SYNC_TIMEOUT_MS: 5000,
  
  // Quantidade de templates sintéticos de disparo
  GUNSHOT_TEMPLATES_COUNT: 5,
  
  // Quantidade de templates sintéticos de ambiente
  AMBIENT_TEMPLATES_COUNT: 5,
  
  // Tamanho dos templates de features
  TEMPLATE_FEATURE_SIZE: 50,
} as const;

export const MAP_CONFIG = {
  // Centro padrão do mapa (São Paulo, Brasil)
  DEFAULT_CENTER: {
    lon: -46.6333,
    lat: -23.5505,
  },
  
  // Zoom padrão
  DEFAULT_ZOOM: 15,
  
  // Projeção usada (Web Mercator)
  PROJECTION: 'EPSG:3857',
  
  // Sistema de coordenadas das posições (WGS84)
  COORDINATE_SYSTEM: 'WGS84',
} as const;

export const UI_CONFIG = {
  // Cores dos marcadores
  COLORS: {
    OPERATION_AREA: 'rgba(0, 123, 255, 0.1)',
    OPERATION_BORDER: 'rgba(0, 123, 255, 0.8)',
    REAL_GUNSHOT: 'rgba(255, 0, 0, 0.8)',
    CALCULATED_GUNSHOT: 'rgba(0, 255, 0, 0.8)',
    DRONE_ICON: '#4A90E2',
  },
  
  // Tamanhos
  SIZES: {
    MARKER_RADIUS: 8,
    DRONE_ICON_SCALE: 0.3,
    BORDER_WIDTH: 2,
  },
  
  // Intervalo de polling para análise (ms)
  ANALYSIS_POLL_INTERVAL: 500,
  
  // Máximo de tentativas de polling
  MAX_POLL_ATTEMPTS: 20,
} as const;

/**
 * Configurações de desenvolvimento/debug
 */
export const DEBUG_CONFIG = {
  // Habilita logs detalhados
  VERBOSE_LOGGING: process.env.NODE_ENV === 'development',
  
  // Mostra tempos de processamento
  SHOW_TIMING: process.env.NODE_ENV === 'development',
  
  // Salva dados de áudio para debug
  SAVE_AUDIO_DEBUG: false,
} as const;

/**
 * Validação de configurações
 */
export function validateConfig() {
  const errors: string[] = [];
  
  if (DRONE_CONFIG.MIN_COUNT < 3) {
    errors.push('MIN_COUNT deve ser pelo menos 3 para triangulação');
  }
  
  if (DRONE_CONFIG.DEFAULT_COUNT < DRONE_CONFIG.MIN_COUNT) {
    errors.push('DEFAULT_COUNT deve ser >= MIN_COUNT');
  }
  
  if (DETECTION_CONFIG.DTW_THRESHOLD <= 0 || DETECTION_CONFIG.DTW_THRESHOLD >= 1) {
    errors.push('DTW_THRESHOLD deve estar entre 0 e 1');
  }
  
  if (AUDIO_CONFIG.SAMPLE_RATE <= 0) {
    errors.push('SAMPLE_RATE deve ser positivo');
  }
  
  if (errors.length > 0) {
    console.error('Erros de configuração:', errors);
    throw new Error('Configuração inválida');
  }
  
  return true;
}

// Valida automaticamente ao importar
if (typeof window === 'undefined') { // Apenas no servidor
  validateConfig();
}
