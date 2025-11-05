# 📊 Visualização de Resultados dos Testes de Carga

Este diretório contém scripts para visualizar os resultados dos testes de carga do simulador de detecção de disparos.

## 🎯 Scripts Disponíveis

### `plot_results.py`
Script Python principal que gera gráficos com **rigor acadêmico** a partir do arquivo `summary.csv`.

**Características do Design:**
- ✅ Estilo acadêmico profissional (seaborn-whitegrid)
- ✅ Grid pontilhado discreto para melhor leitura
- ✅ Fontes serif (DejaVu Serif, Times New Roman)
- ✅ Bordas de barras em preto para destaque
- ✅ Barras de erro com capthick apropriado
- ✅ Legendas com sombras e bordas arredondadas
- ✅ Anotações contextuais e interpretativas
- ✅ Linhas de tendência polinomial (grau 2)
- ✅ Remoção de spines superior e direito
- ✅ Alta resolução (300 DPI) para publicações

**Gráficos gerados:**
1. **Acurácia por Raio** - Compara acurácia geral, disparo e ambiente
2. **Erro de Posição** - Mostra erro médio de triangulação com barras de erro
3. **Tempo de Processamento** - Tempo médio com barras de erro
4. **Dashboard Combinado** - Todos os 3 gráficos em layout vertical otimizado

### `plot-test-results.sh`
Script Bash wrapper para facilitar a execução.

## 📦 Dependências

Os seguintes pacotes Python são necessários:
- `pandas` - Manipulação de dados
- `matplotlib` - Geração de gráficos
- `numpy` - Operações numéricas

**Instalação:**
```bash
pip3 install pandas matplotlib numpy
```

> O script `plot-test-results.sh` verifica e instala automaticamente as dependências se necessário.

## 🚀 Como Usar

### Opção 1: Script Bash (Recomendado)

```bash
# Passar diretório de teste
./scripts/plot-test-results.sh tests/load_test_2025-11-05T04-51-38

# Ou passar arquivo summary.csv diretamente
./scripts/plot-test-results.sh tests/load_test_2025-11-05T04-51-38/summary.csv
```

### Opção 2: Script Python Direto

```bash
python3 scripts/plot_results.py tests/load_test_2025-11-05T04-51-38/summary.csv
```

### Opção 3: Comando NPM

```bash
npm run plot:results tests/load_test_2025-11-05T04-51-38/summary.csv
```

## 📁 Formato do Arquivo summary.csv

O arquivo `summary.csv` deve conter as seguintes colunas:

| Coluna | Descrição |
|--------|-----------|
| `radius` | Raio de operação (km) |
| `numDrones` | Quantidade de drones |
| `totalTests` | Total de testes realizados |
| `accuracyMean` | Acurácia geral média (%) |
| `positionErrorMean` | Erro médio de posição (m) |
| `positionErrorStdDev` | Desvio padrão do erro de posição (m) |
| `processingTimeMean` | Tempo médio de processamento (ms) |
| `processingTimeStdDev` | Desvio padrão do tempo (ms) |
| `gunshotAccuracy` | Acurácia para disparos (%) |
| `ambientAccuracy` | Acurácia para sons ambiente (%) |

**Exemplo:**
```csv
radius,numDrones,totalTests,accuracyMean,positionErrorMean,positionErrorStdDev,processingTimeMean,processingTimeStdDev,gunshotAccuracy,ambientAccuracy
0.1,3,1000,98.50,2.45,1.23,1234.56,345.67,99.00,97.00
0.3,10,1000,96.20,5.67,2.34,2345.67,456.78,97.50,93.00
```

## 📊 Gráficos Gerados

Todos os gráficos são salvos no mesmo diretório do arquivo `summary.csv`:

### 1. `accuracy_by_radius.png`
- **Tipo:** Gráfico de barras agrupadas com bordas
- **Métricas:** Acurácia geral (azul), disparo (vermelho), ambiente (verde)
- **Eixo X:** Raio (km) + quantidade de drones em duas linhas
- **Eixo Y:** Acurácia (0-105%)
- **Recursos:**
  - Valores sobre as barras (se ≤8 raios)
  - Linha de referência pontilhada em 90% com anotação
  - Grid pontilhado (Y: mais visível, X: discreto)
  - Bordas pretas nas barras para melhor definição
  - Legenda com sombra no canto inferior esquerdo
  - Spines superior e direito removidos

### 2. `position_error_by_radius.png`
- **Tipo:** Gráfico de barras com barras de erro (±1σ)
- **Métrica:** Erro médio de posição em metros
- **Eixo X:** Raio (km) + quantidade de drones
- **Eixo Y:** Erro (metros)
- **Recursos:**
  - Barras de erro robustas (capthick=2, linewidth=2)
  - Valores médios e desvio padrão anotados (se ≤8 raios)
  - Linha de tendência polinomial vermelha tracejada (se >2 raios)
  - Anotação explicativa: "Barras de erro: ±1 desvio padrão"
  - Grid pontilhado para facilitar leitura
  - Cor azul escuro (#2C5F8D) com bordas ainda mais escuras

### 3. `processing_time_by_radius.png`
- **Tipo:** Gráfico de barras com barras de erro (±1σ)
- **Métrica:** Tempo médio de processamento em segundos
- **Eixo X:** Raio (km) + quantidade de drones
- **Eixo Y:** Tempo (segundos, convertido de ms)
- **Recursos:**
  - Barras de erro robustas com caps largos
  - Valores médios e desvio padrão anotados (se ≤8 raios)
  - Linha de tendência polinomial vermelha (se >2 raios)
  - Anotação explicativa sobre barras de erro
  - Cor verde escuro (#3A7D44) para diferenciação
  - Grid pontilhado consistente

### 4. `dashboard_metrics.png`
- **Tipo:** Dashboard vertical com 3 subgráficos (a, b, c)
- **Layout:** Vertical otimizado para apresentações
- **Subgráficos:**
  - (a) Desempenho de Detecção Acústica - Acurácias
  - (b) Precisão da Triangulação TDOA - Erro de posição
  - (c) Desempenho Computacional - Tempo de processamento
- **Recursos:**
  - Título geral no topo com informações do estudo
  - Subtítulos descritivos com prefixos (a), (b), (c)
  - Legendas apropriadas em cada subgráfico
  - Linhas de tendência nos gráficos (b) e (c)
  - Anotação de rodapé com total de testes e raios
  - Espaçamento otimizado (hspace=0.35)
  - Cores consistentes entre gráficos individuais e dashboard

## 🎨 Personalização

### Paleta de Cores Acadêmica

As cores foram escolhidas para máximo contraste e clareza em publicações:

```python
# Cores principais (RGB hex)
cores = {
    'geral': '#2C5F8D',      # Azul escuro - Acurácia geral
    'disparo': '#C44536',    # Vermelho escuro - Disparos
    'ambiente': '#3A7D44',   # Verde escuro - Sons ambiente
    'tendencia': '#C44536',  # Vermelho - Linhas de tendência
    'grid': '#999999',       # Cinza médio - Grid
    'referencia': '#666666', # Cinza escuro - Linhas de referência
}
```

### Alterar Estilo dos Gráficos

Edite `scripts/plot_results.py` na seção de configuração inicial:

```python
# Estilo base
plt.style.use('seaborn-v0_8-whitegrid')  
# Alternativas: 'classic', 'ggplot', 'bmh'

# Grid
'grid.linestyle': '--',    # Padrão: pontilhado
'grid.linewidth': 0.8,     # Espessura
'grid.alpha': 0.4,         # Transparência

# Fontes
'font.family': 'serif',
'font.serif': ['DejaVu Serif', 'Times New Roman'],
'font.size': 11,
```

### Alterar Resolução

```python
# Na configuração inicial
'savefig.dpi': 300,  # Aumentar para 600 para impressão de alta qualidade

# Ou na linha plt.savefig() de cada função
dpi=600  # Para revistas científicas
```

### Personalizar Cores das Barras

Em cada função de plot, procure por:

```python
color='#2C5F8D'      # Cor principal
edgecolor='black'    # Borda das barras
linewidth=1.2        # Espessura da borda
alpha=0.85           # Transparência (0=transparente, 1=opaco)
```

### Ajustar Grid

```python
# Mais visível
grid.alpha = 0.6
grid.linewidth = 1.0

# Mais discreto  
grid.alpha = 0.2
grid.linewidth = 0.5
```

## 📈 Interpretação dos Gráficos

### Acurácia
- **Ideal:** ≥ 90% em todos os raios
- **Tendência esperada:** Diminui conforme raio aumenta
- **Disparo vs Ambiente:** Disparo geralmente tem maior acurácia

### Erro de Posição
- **Ideal:** < 10m para raios pequenos
- **Tendência esperada:** Aumenta linearmente/exponencialmente com raio
- **Barras de erro grandes:** Alta variabilidade (possível problema)

### Tempo de Processamento
- **Ideal:** < 5s para aplicação prática
- **Tendência esperada:** Aumenta com número de drones
- **Atenção:** Tempos > 10s podem indicar gargalos

## 🔧 Troubleshooting

### Erro: "Module not found: pandas"
```bash
pip3 install pandas matplotlib numpy
```

### Erro: "Permission denied"
```bash
chmod +x scripts/plot-test-results.sh
```

### Gráficos não aparecem
Os gráficos são salvos como arquivos PNG, não abrem em janela interativa. Verifique o diretório de saída.

### Cores não aparecem corretamente
Certifique-se de que seu terminal suporta cores ANSI. Ou use:
```bash
python3 scripts/plot_results.py <arquivo> 2>&1 | cat
```

## 📝 Exemplo Completo

```bash
# 1. Executar testes de carga
npm run test:load -- -22.9035 -43.2096 10

# Saída: tests/load_test_2025-11-05T12-34-56/

# 2. Gerar gráficos
./scripts/plot-test-results.sh tests/load_test_2025-11-05T12-34-56

# 3. Visualizar resultados
# Gráficos salvos em: tests/load_test_2025-11-05T12-34-56/
#   - accuracy_by_radius.png
#   - position_error_by_radius.png
#   - processing_time_by_radius.png
#   - dashboard_metrics.png
```

## 📊 Estatísticas no Console

O script também imprime um resumo estatístico:

```
======================================================================
📊 RESUMO ESTATÍSTICO DOS TESTES
======================================================================

📍 Raios testados: 6
   Raio mínimo: 0.1 km (3 drones)
   Raio máximo: 1.2 km (8103 drones)

🎯 Acurácia:
   Geral:    92.82% (±4.56%)
   Disparo:  94.58% (±3.21%)
   Ambiente: 89.00% (±5.67%)

📏 Erro de Posição:
   Média:    28.48m
   Mínimo:   2.45m
   Máximo:   78.90m

⏱️  Tempo de Processamento:
   Média:    15.23s
   Mínimo:   1.23s
   Máximo:   67.89s

🧪 Total de testes: 6000
======================================================================
```

## 🎓 Análise Avançada

Para análises mais complexas, você pode:

1. **Carregar o CSV em Python/Jupyter:**
   ```python
   import pandas as pd
   df = pd.read_csv('tests/load_test_*/summary.csv')
   # Suas análises personalizadas
   ```

2. **Usar os dados detalhados:**
   ```bash
   # Arquivo detailed_radius_*.csv tem resultados individuais
   python3 scripts/custom_analysis.py tests/load_test_*/detailed_radius_0.5km.csv
   ```

3. **Comparar múltiplos testes:**
   ```python
   # Combine summary.csv de diferentes execuções
   import pandas as pd
   df1 = pd.read_csv('tests/test1/summary.csv')
   df2 = pd.read_csv('tests/test2/summary.csv')
   # Compare otimizações, etc.
   ```

## 📚 Documentação Relacionada

- [LOAD_TEST_README.md](../docs/LOAD_TEST_README.md) - Como executar testes de carga
- [PARALLEL_TESTING.md](../docs/PARALLEL_TESTING.md) - Testes paralelos
- [PERFORMANCE_OPTIMIZATIONS.md](../docs/PERFORMANCE_OPTIMIZATIONS.md) - Otimizações

---

**✨ Dica:** Use o dashboard combinado (`dashboard_metrics.png`) para apresentações rápidas!
