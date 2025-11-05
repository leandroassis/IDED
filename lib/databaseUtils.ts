/**
 * Utilitários para acessar arquivos de áudio do database
 */
import fs from 'fs';
import path from 'path';

const DATABASE_PATH = path.join(process.cwd(), 'database');
const VALIDATION_PATH = path.join(DATABASE_PATH, 'validation');

/**
 * Lista todos os arquivos de validação de um tipo específico
 */
export function listValidationFiles(type: 'gunshot' | 'ambient'): string[] {
  try {
    const files = fs.readdirSync(VALIDATION_PATH);
    const prefix = type === 'gunshot' ? 'gunshot_val_' : 'ambient_val_';
    
    return files
      .filter(file => file.startsWith(prefix) && file.endsWith('.wav'))
      .sort();
  } catch (error) {
    console.error(`Erro ao listar arquivos de validação (${type}):`, error);
    return [];
  }
}

/**
 * Seleciona um arquivo aleatório de validação
 */
export function getRandomValidationFile(type: 'gunshot' | 'ambient'): string | null {
  const files = listValidationFiles(type);
  
  if (files.length === 0) {
    console.error(`Nenhum arquivo de validação encontrado para tipo: ${type}`);
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * files.length);
  return files[randomIndex];
}

/**
 * Lê um arquivo de áudio como Buffer
 */
export function readAudioFile(filename: string): Buffer | null {
  try {
    const filePath = path.join(VALIDATION_PATH, filename);
    return fs.readFileSync(filePath);
  } catch (error) {
    console.error(`Erro ao ler arquivo de áudio ${filename}:`, error);
    return null;
  }
}

/**
 * Obtém o caminho completo de um arquivo de validação
 */
export function getValidationFilePath(filename: string): string {
  return path.join(VALIDATION_PATH, filename);
}
