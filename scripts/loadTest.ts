/**
 * Script de Teste de Carga - Sistema de Detecção de Disparos
 * 
 * Executa testes automatizados para avaliar:
 * - Taxa de acerto na classificação
 * - Erro de posição (distância entre real e calculada)
 * - Tempo de processamento
 * 
 * Métricas: média e desvio padrão
 */

import fs from 'fs';
import path from 'path';

interface TestConfig {
  radius: number; // km
  numDrones: number;
  numTests: number;
  operationCenter: { lon: number; lat: number };
}

interface TestResult {
  testId: number;
  radius: number;
  numDrones: number;
  soundType: 'gunshot' | 'ambient';
  realPosition: { lon: number; lat: number };
  calculatedPosition: { lon: number; lat: number } | null;
  detectedAsGunshot: boolean;
  confidence: number;
  positionError: number | null; // metros
  processingTime: number; // ms
  success: boolean;
}

interface TestSummary {
  radius: number;
  numDrones: number;
  totalTests: number;
  
  // Métricas de Classificação
  correctClassifications: number;
  accuracyMean: number; // %
  
  // Métricas de Posição (apenas para disparos)
  positionErrorMean: number; // metros
  positionErrorStdDev: number; // metros
  
  // Métricas de Tempo
  processingTimeMean: number; // ms
  processingTimeStdDev: number; // ms
  
  // Detalhamento por Tipo
  gunshotTests: number;
  gunshotCorrect: number;
  gunshotAccuracy: number;
  
  ambientTests: number;
  ambientCorrect: number;
  ambientAccuracy: number;
}

/**
 * Calcula distância entre dois pontos geográficos (Haversine)
 */
function calculateDistance(
  pos1: { lon: number; lat: number },
  pos2: { lon: number; lat: number }
): number {
  const R = 6371000; // Raio da Terra em metros
  const φ1 = (pos1.lat * Math.PI) / 180;
  const φ2 = (pos2.lat * Math.PI) / 180;
  const Δφ = ((pos2.lat - pos1.lat) * Math.PI) / 180;
  const Δλ = ((pos2.lon - pos1.lon) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Gera posição aleatória dentro do raio de operação
 */
function generateRandomPosition(
  center: { lon: number; lat: number },
  radiusKm: number
): { lon: number; lat: number } {
  // Gera ângulo aleatório
  const angle = Math.random() * 2 * Math.PI;
  
  // Gera distância aleatória (distribuição uniforme no círculo)
  const r = Math.sqrt(Math.random()) * radiusKm;
  
  // Converte para offset em graus (aproximado)
  const latOffset = (r / 111.32) * Math.cos(angle);
  const lonOffset = (r / (111.32 * Math.cos((center.lat * Math.PI) / 180))) * Math.sin(angle);
  
  return {
    lat: center.lat + latOffset,
    lon: center.lon + lonOffset,
  };
}

/**
 * Calcula desvio padrão
 */
function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Simula chamada à API de posicionamento de drones
 */
async function setupDronePositions(
  center: { lon: number; lat: number },
  droneCount: number,
  radius: number
): Promise<Array<{ droneId: string; position: { lon: number; lat: number } }>> {
  const response = await fetch('http://localhost:3000/api/drone/position', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      position: [center.lon, center.lat],
      drone_count: droneCount,
      radius: radius,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to setup drones: ${response.status}`);
  }

  const result = await response.json();
  
  return result.x.map((lon: number, index: number) => ({
    droneId: `drone-${index}`,
    position: { lon, lat: result.y[index] },
  }));
}

/**
 * Simula disparo ou som ambiente
 */
async function simulateSound(
  soundType: 'gunshot' | 'ambient',
  soundPosition: { lon: number; lat: number },
  dronePositions: Array<{ droneId: string; position: { lon: number; lat: number } }>,
  noiseLevel: number = 0.01,
  droneGain: number = 3.0
): Promise<any> {
  const endpoint = soundType === 'gunshot' 
    ? 'http://localhost:3000/api/audio/simulate'
    : 'http://localhost:3000/api/audio/simulate-ambient';
    
  const bodyKey = soundType === 'gunshot' ? 'gunshotPosition' : 'ambientPosition';
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      [bodyKey]: soundPosition,
      dronePositions,
      noiseLevel,
      droneGain,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to simulate sound: ${response.status}`);
  }

  return await response.json();
}

/**
 * Envia áudio de drones para análise
 */
async function analyzeAudio(
  sessionId: string,
  droneAudioData: Array<{ droneId: string; audioData: string; position: { lon: number; lat: number } }>,
  expectedDrones: number
): Promise<any> {
  // Envia áudio de cada drone (simulando upload paralelo)
  const uploadPromises = droneAudioData.map(drone =>
    fetch('http://localhost:3000/api/audio/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        droneId: drone.droneId,
        audioData: drone.audioData,
        position: drone.position,
        timestamp: Date.now(),
      }),
    }).catch(() => ({ ok: false }))
  );

  await Promise.all(uploadPromises);

  // Polling para resultado
  let attempts = 0;
  const maxAttempts = 30;
  let pollInterval = 200;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    const response = await fetch(
      `http://localhost:3000/api/audio/analyze?sessionId=${sessionId}&expectedDrones=${expectedDrones}`
    );

    const data = await response.json();

    if (data.ready) {
      return data;
    }

    attempts++;
    pollInterval = Math.min(pollInterval * 1.2, 1000);
  }

  throw new Error('Analysis timeout');
}

/**
 * Executa um único teste
 */
async function runSingleTest(
  testId: number,
  config: TestConfig,
  soundType: 'gunshot' | 'ambient'
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    // 1. Configura posições dos drones
    const dronePositions = await setupDronePositions(
      config.operationCenter,
      config.numDrones,
      config.radius
    );

    // 2. Gera posição aleatória para o som
    const soundPosition = generateRandomPosition(config.operationCenter, config.radius);

    // 3. Simula som
    const simulateData = await simulateSound(
      soundType,
      soundPosition,
      dronePositions
    );

    // 4. Analisa áudio
    const sessionId = `test-${testId}-${Date.now()}`;
    const analysisData = await analyzeAudio(
      sessionId,
      simulateData.droneAudioData,
      dronePositions.length
    );

    const processingTime = Date.now() - startTime;

    // 5. Calcula erro de posição (se aplicável)
    let positionError: number | null = null;
    if (analysisData.calculatedPosition) {
      positionError = calculateDistance(soundPosition, analysisData.calculatedPosition);
    }

    // 6. Verifica acerto na classificação
    const correctClassification = analysisData.isGunshot === (soundType === 'gunshot');

    return {
      testId,
      radius: config.radius,
      numDrones: config.numDrones,
      soundType,
      realPosition: soundPosition,
      calculatedPosition: analysisData.calculatedPosition || null,
      detectedAsGunshot: analysisData.isGunshot,
      confidence: analysisData.confidence,
      positionError,
      processingTime,
      success: true,
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Test ${testId} failed:`, error);

    return {
      testId,
      radius: config.radius,
      numDrones: config.numDrones,
      soundType,
      realPosition: { lon: 0, lat: 0 },
      calculatedPosition: null,
      detectedAsGunshot: false,
      confidence: 0,
      positionError: null,
      processingTime,
      success: false,
    };
  }
}

/**
 * Calcula estatísticas do teste
 */
function calculateStatistics(results: TestResult[]): TestSummary {
  const successfulResults = results.filter(r => r.success);
  
  // Classificação
  const correctClassifications = successfulResults.filter(r => {
    return r.detectedAsGunshot === (r.soundType === 'gunshot');
  }).length;
  
  const accuracyMean = (correctClassifications / successfulResults.length) * 100;
  
  // Por tipo
  const gunshotResults = successfulResults.filter(r => r.soundType === 'gunshot');
  const ambientResults = successfulResults.filter(r => r.soundType === 'ambient');
  
  const gunshotCorrect = gunshotResults.filter(r => r.detectedAsGunshot).length;
  const ambientCorrect = ambientResults.filter(r => !r.detectedAsGunshot).length;
  
  // Erro de posição (apenas disparos com posição calculada)
  const positionErrors = gunshotResults
    .filter(r => r.positionError !== null)
    .map(r => r.positionError!);
  
  const positionErrorMean = positionErrors.length > 0
    ? positionErrors.reduce((a, b) => a + b, 0) / positionErrors.length
    : 0;
  
  const positionErrorStdDev = calculateStdDev(positionErrors, positionErrorMean);
  
  // Tempo de processamento
  const processingTimes = successfulResults.map(r => r.processingTime);
  const processingTimeMean = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
  const processingTimeStdDev = calculateStdDev(processingTimes, processingTimeMean);
  
  return {
    radius: results[0].radius,
    numDrones: results[0].numDrones,
    totalTests: results.length,
    
    correctClassifications,
    accuracyMean,
    
    positionErrorMean,
    positionErrorStdDev,
    
    processingTimeMean,
    processingTimeStdDev,
    
    gunshotTests: gunshotResults.length,
    gunshotCorrect,
    gunshotAccuracy: (gunshotCorrect / gunshotResults.length) * 100,
    
    ambientTests: ambientResults.length,
    ambientCorrect,
    ambientAccuracy: (ambientCorrect / ambientResults.length) * 100,
  };
}

/**
 * Salva resultados em CSV
 */
function saveResultsToCSV(results: TestResult[], summary: TestSummary, testDir: string) {
  // CSV detalhado
  const detailedCSV = [
    'testId,radius,numDrones,soundType,realLat,realLon,calcLat,calcLon,detectedAsGunshot,confidence,positionError,processingTime,success',
    ...results.map(r => [
      r.testId,
      r.radius,
      r.numDrones,
      r.soundType,
      r.realPosition.lat,
      r.realPosition.lon,
      r.calculatedPosition?.lat || '',
      r.calculatedPosition?.lon || '',
      r.detectedAsGunshot,
      r.confidence,
      r.positionError || '',
      r.processingTime,
      r.success,
    ].join(','))
  ].join('\n');
  
  const detailedPath = path.join(testDir, `detailed_radius_${summary.radius}km.csv`);
  fs.writeFileSync(detailedPath, detailedCSV);
  
  // CSV resumido (append)
  const summaryCSV = [
    summary.radius,
    summary.numDrones,
    summary.totalTests,
    summary.accuracyMean.toFixed(2),
    summary.positionErrorMean.toFixed(2),
    summary.positionErrorStdDev.toFixed(2),
    summary.processingTimeMean.toFixed(2),
    summary.processingTimeStdDev.toFixed(2),
    summary.gunshotAccuracy.toFixed(2),
    summary.ambientAccuracy.toFixed(2),
  ].join(',');
  
  const summaryPath = path.join(testDir, 'summary.csv');
  const summaryHeader = 'radius,numDrones,totalTests,accuracyMean,positionErrorMean,positionErrorStdDev,processingTimeMean,processingTimeStdDev,gunshotAccuracy,ambientAccuracy\n';
  
  if (!fs.existsSync(summaryPath)) {
    fs.writeFileSync(summaryPath, summaryHeader);
  }
  
  fs.appendFileSync(summaryPath, summaryCSV + '\n');
}

/**
 * Exibe progresso visual
 */
function displayProgress(current: number, total: number, radius: number, elapsedTime: number) {
  const percentage = ((current / total) * 100).toFixed(1);
  const bar = '█'.repeat(Math.floor(current / total * 40)) + '░'.repeat(40 - Math.floor(current / total * 40));
  const eta = ((elapsedTime / current) * (total - current) / 1000).toFixed(0);
  
  process.stdout.write(`\r[${bar}] ${percentage}% | ${current}/${total} | Raio: ${radius}km | ETA: ${eta}s `);
}

/**
 * Executa testes em paralelo com controle de concorrência
 */
async function runTestsInParallel(
  config: TestConfig,
  testIds: number[],
  soundTypes: ('gunshot' | 'ambient')[],
  maxConcurrent: number,
  startTime: number
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  let completed = 0;
  
  // Divide em lotes
  for (let i = 0; i < testIds.length; i += maxConcurrent) {
    const batchIds = testIds.slice(i, i + maxConcurrent);
    const batchTypes = soundTypes.slice(i, i + maxConcurrent);
    
    // Executa lote em paralelo
    const batchPromises = batchIds.map((testId, idx) =>
      runSingleTest(testId, config, batchTypes[idx])
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    completed += batchResults.length;
    displayProgress(completed, testIds.length, config.radius, Date.now() - startTime);
  }
  
  return results;
}

/**
 * Executa bateria de testes para um raio específico
 */
async function runTestBatch(
  radius: number,
  operationCenter: { lon: number; lat: number },
  numTests: number,
  testDir: string,
  maxConcurrent: number = 10 // Testes paralelos simultâneos
): Promise<void> {
  // Calcula número de drones: e^(7.5*radius), mínimo 3
  const numDrones = Math.max(3, Math.round(Math.exp(7.5 * radius)));
  
  console.log(`\n🚁 Iniciando testes para raio ${radius}km com ${numDrones} drones...`);
  console.log(`   ⚡ Paralelização: ${maxConcurrent} testes simultâneos`);
  
  const config: TestConfig = {
    radius,
    numDrones,
    numTests,
    operationCenter,
  };
  
  // Pré-gera IDs e tipos de som
  const testIds = Array.from({ length: numTests }, (_, i) => i + 1);
  const soundTypes = testIds.map(() => 
    Math.random() < 0.7 ? 'gunshot' as const : 'ambient' as const
  );
  
  const startTime = Date.now();
  
  // Executa testes em paralelo
  const results = await runTestsInParallel(
    config,
    testIds,
    soundTypes,
    maxConcurrent,
    startTime
  );
  
  console.log('\n✅ Testes concluídos! Calculando estatísticas...\n');
  
  // Calcula estatísticas
  const summary = calculateStatistics(results);
  
  // Salva resultados
  saveResultsToCSV(results, summary, testDir);
  
  // Exibe resumo
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`📊 RESUMO - Raio ${radius}km (${numDrones} drones):`);
  console.log(`   Testes: ${summary.totalTests}`);
  console.log(`   Tempo Total: ${totalTime}s`);
  console.log(`   Acurácia Geral: ${summary.accuracyMean.toFixed(2)}%`);
  console.log(`   Acurácia Disparo: ${summary.gunshotAccuracy.toFixed(2)}%`);
  console.log(`   Acurácia Ambiente: ${summary.ambientAccuracy.toFixed(2)}%`);
  console.log(`   Erro de Posição: ${summary.positionErrorMean.toFixed(2)} ± ${summary.positionErrorStdDev.toFixed(2)} m`);
  console.log(`   Tempo de Processamento: ${summary.processingTimeMean.toFixed(0)} ± ${summary.processingTimeStdDev.toFixed(0)} ms`);
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ Uso: ts-node scripts/loadTest.ts <longitude> <latitude> [maxConcurrent]');
    console.error('   Exemplo: ts-node scripts/loadTest.ts -47.9292 -15.7801');
    console.error('   Exemplo: ts-node scripts/loadTest.ts -47.9292 -15.7801 20');
    console.error('');
    console.error('   maxConcurrent: Número de testes paralelos (padrão: 10)');
    process.exit(1);
  }
  
  const operationCenter = {
    lon: parseFloat(args[0]),
    lat: parseFloat(args[1]),
  };
  
  const maxConcurrent = args[2] ? parseInt(args[2]) : 10;
  
  console.log(`📍 Centro de Operação: ${operationCenter.lat}, ${operationCenter.lon}`);
  console.log(`⚡ Paralelização: ${maxConcurrent} testes simultâneos`);
  
  // Cria diretório de testes
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const testDir = path.join(process.cwd(), 'tests', `load_test_${timestamp}`);
  fs.mkdirSync(testDir, { recursive: true });
  
  console.log(`📁 Resultados serão salvos em: ${testDir}\n`);
  
  // Configuração dos testes
  const radiusTests = [0.1, 0.3, 0.5, 0.7, 0.9, 1.2]; // km
  const numTestsPerRadius = 1000;
  
  console.log(`🧪 Configuração:`);
  console.log(`   Raios: ${radiusTests.join(', ')} km`);
  console.log(`   Testes por raio: ${numTestsPerRadius}`);
  console.log(`   Total de testes: ${radiusTests.length * numTestsPerRadius}`);
  console.log(`   Distribuição: 70% disparo, 30% ambiente`);
  console.log(`   Paralelização: ${maxConcurrent} testes simultâneos\n`);
  
  const overallStartTime = Date.now();
  
  // Executa testes para cada raio
  for (const radius of radiusTests) {
    await runTestBatch(radius, operationCenter, numTestsPerRadius, testDir, maxConcurrent);
  }
  
  const totalTime = ((Date.now() - overallStartTime) / 1000 / 60).toFixed(2);
  
  console.log(`\n✨ TODOS OS TESTES CONCLUÍDOS!`);
  console.log(`⏱️  Tempo total: ${totalTime} minutos`);
  console.log(`📂 Resultados salvos em: ${testDir}`);
}

// Executa
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
