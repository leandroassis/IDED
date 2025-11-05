# 📄 Artigo Acadêmico - Sistema de Detecção de Disparos

## 📋 Informações

**Título**: Sistema de Detecção Acústica de Disparos de Arma de Fogo Utilizando Enxame de Drones: Arquitetura, Algoritmos e Análise de Desempenho

**Formato**: Artigo em duas colunas (estilo IEEE/ACM)

**Arquivo**: `artigo.tex` (LaTeX) → `artigo.pdf` (PDF compilado)

**Páginas**: 6 páginas

**Tamanho**: ~1,6 MB (inclui 5 gráficos em alta resolução)

## 📊 Conteúdo

### Estrutura do Artigo

1. **Abstract** - Resumo executivo com métricas principais
2. **Introdução** - Contextualização e contribuições
3. **Trabalhos Relacionados** - Estado da arte
4. **Arquitetura do Sistema** - Visão geral e fluxo de processamento
5. **Processamento e Classificação Acústica** - DTW e features
6. **Fusão de Decisões e Triangulação** - Votação ponderada e TDOA
7. **Metodologia de Avaliação** - Configuração dos testes
8. **Resultados Experimentais** - Análise de desempenho
9. **Discussão** - Parâmetros críticos e limitações
10. **Trabalhos Futuros** - Direções de pesquisa
11. **Conclusão** - Síntese dos resultados
12. **Referências** - 9 citações acadêmicas

### Figuras Incluídas

- **Figura 1**: Fluxo de processamento (diagrama textual)
- **Figura 2**: Acurácia por raio (`accuracy_by_radius.png`)
- **Figura 3**: Erro de posição (`position_error_by_radius.png`)
- **Figura 4**: Tempo de processamento (`processing_time_by_radius.png`)
- **Figura 5**: Matriz de confusão (`confusion_matrix.png`)
- **Figura 6**: Dashboard consolidado (`dashboard_metrics.png`)

### Métricas Reportadas

- **Acurácia Geral**: 68,65%
- **Precisão**: 95,17%
- **Recall**: 57,93%
- **F1-Score**: 72,39%
- **Erro de Posição**: 67,42 m (média)
- **Latência**: 1,52 s (média)
- **Testes Totais**: 5.000 simulações

## 🔧 Compilação

### Requisitos

```bash
sudo apt-get install texlive-latex-base texlive-latex-extra texlive-lang-portuguese
```

### Compilar PDF

```bash
# Primeira passagem
pdflatex artigo.tex

# Segunda passagem (para resolver referências)
pdflatex artigo.tex
```

O PDF será gerado como `artigo.pdf`.

### Compilação Rápida

```bash
make -f - <<'EOF'
artigo.pdf: artigo.tex
	pdflatex -interaction=nonstopmode artigo.tex
	pdflatex -interaction=nonstopmode artigo.tex

clean:
	rm -f *.aux *.log *.out *.toc *.bbl *.blg

.PHONY: clean
EOF
```

## 📐 Equações Principais

### Dispersão de Drones

$$N_d = \min\left(100, \max\left(3, \left\lfloor e^{7.5 \cdot R} \right\rfloor\right)\right)$$

### Atenuação por Distância

$$A_i = \frac{A_0}{d(P_s, P_i)^2}$$

### DTW Normalizado

$$\text{DTW}_{\text{norm}}(X, Y) = \frac{D_{m,n}}{m + n}$$

### Votação Ponderada

$$S = \frac{\sum_{i: \hat{y}_i = 1} w_i \cdot c_i}{\sum_{i=1}^{N_d} w_i}$$

onde $w_i = e^{-0.1 \cdot d(P_i, \hat{P})}$

### Triangulação TDOA

$$\hat{\text{lat}} = \frac{\sum_{i=1}^{N_d} \omega_i \cdot \text{lat}_i}{\sum_{i=1}^{N_d} \omega_i}$$

## 🎓 Características Acadêmicas

### Rigor Matemático

- ✅ 25+ equações numeradas
- ✅ Notação matemática formal consistente
- ✅ Demonstração de complexidade algorítmica
- ✅ Análise estatística com média e desvio padrão

### Metodologia Científica

- ✅ Testes de carga com 5.000 simulações
- ✅ Múltiplas configurações (6 raios diferentes)
- ✅ Distribuição realista (70% disparos, 30% ambiente)
- ✅ Métricas padrão da literatura (Acurácia, Precisão, Recall, F1)

### Apresentação

- ✅ Formato duas colunas (padrão IEEE/ACM)
- ✅ Gráficos em alta resolução (300 DPI)
- ✅ Tabelas formatadas
- ✅ Referências bibliográficas
- ✅ Abstract estruturado

## 📚 Seções Detalhadas

### 1. Arquitetura do Sistema

Descreve:
- Dispersão de drones (Poisson Disk Sampling)
- Propagação acústica (velocidade, atenuação, delay)
- Ruído gaussiano e ganho de captura

### 2. Processamento Acústico

Explica:
- Extração de features (Energia, ZCR)
- Dynamic Time Warping (DTW)
- Threshold de classificação (0,3)
- Cálculo de confiança individual

### 3. Fusão de Decisões

Detalha:
- Votação simples vs ponderada
- Threshold adaptativo (5% de detecção)
- Peso exponencial por distância ($\lambda = 0.1$)
- Triangulação TDOA com weighted centroid

### 4. Resultados

Apresenta:
- Gráficos de acurácia, erro de posição e latência
- Matriz de confusão com TP, TN, FP, FN
- Dashboard consolidado
- Análise de escalabilidade

### 5. Discussão

Analisa:
- Parâmetros críticos (threshold, ganho, decay)
- Limitações (simulação sintética, propagação simplificada)
- Trade-offs (precisão vs recall)

## 🔬 Aplicações

Este artigo documenta completamente o sistema para:

- **Publicação Acadêmica**: Formato pronto para submissão em conferências
- **Documentação Técnica**: Referência completa da arquitetura
- **Validação Científica**: Metodologia reproduzível
- **Trabalhos Futuros**: Base sólida para extensões

## 📖 Leitura Recomendada

Para entender completamente o sistema, leia na ordem:

1. `README.md` - Visão geral do projeto
2. `artigo.pdf` - Fundamentos matemáticos e resultados
3. `docs/API_DOCS.md` - Detalhes de implementação
4. `docs/LOAD_TEST_README.md` - Metodologia de testes

## 🎯 Citação Sugerida

```bibtex
@article{assis2025gunshot,
  title={Sistema de Detecção Acústica de Disparos de Arma de Fogo Utilizando Enxame de Drones: Arquitetura, Algoritmos e Análise de Desempenho},
  author={Assis, Leandro},
  year={2025},
  institution={Universidade Federal}
}
```

## ✨ Destaques

### Contribuições Originais

1. ✅ Votação ponderada adaptativa baseada em taxa de detecção
2. ✅ Algoritmo de peso exponencial por distância
3. ✅ Análise abrangente com 5.000 testes sintéticos
4. ✅ Limitação pragmática a 100 drones para viabilidade

### Métricas de Qualidade

- **Precisão**: 95,17% (poucos falsos positivos)
- **Recall**: 57,93% (conservador, prioriza especificidade)
- **F1-Score**: 72,39% (balanceamento adequado)
- **Latência**: < 2 segundos (tempo real)

## 📝 Notas

- Todas as imagens são referenciadas automaticamente no texto
- Equações estão numeradas e cross-referenciadas
- Tabelas seguem formato IEEE
- Referências bibliográficas incluem trabalhos clássicos (DTW, TDOA, Haversine)

---

**Status**: ✅ **Artigo completo e compilado**  
**Última atualização**: 5 de novembro de 2025  
**Versão**: 1.0
