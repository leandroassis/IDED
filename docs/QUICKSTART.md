# Guia Rápido de Início

## Instalação

```bash
cd /home/leandro/Documentos/proc_voz/simulador
npm install
```

## Executar

```bash
npm run dev
```

Abra seu navegador em: **http://localhost:3000**

## Primeiros Passos

### 1. Configure os Parâmetros (Painel Direito)

- **Raio de Operação**: 0.3 km (recomendado para testes)
- **Quantidade de Drones**: 5 (ou mais, mínimo 3)

### 2. Defina a Área de Operação

1. Clique no botão **"Definir Área de Operação"**
2. Clique em qualquer ponto do mapa
3. Os drones serão dispersos aleatoriamente em volta do ponto

Você verá:
- ✅ Círculo azul semitransparente mostrando a área
- ✅ Ícones de drones nas posições calculadas

### 3. Simule um Disparo

1. Clique no botão **"Simular Disparo"**
2. Clique em um ponto dentro ou próximo da área azul
3. Aguarde alguns segundos para a análise

### 4. Veja os Resultados

No painel direito você verá:
- 🔴 **Detecção**: Se foi identificado como disparo ou não
- **Confiança**: Percentual de certeza
- **Drones que detectaram**: Quantos concordaram

No mapa você verá:
- 🔴 **Ponto vermelho**: Posição REAL do disparo (onde você clicou)
- 🟢 **Ponto verde**: Posição CALCULADA pelo sistema

## Dicas

### Melhores Resultados
- Use raio entre 0.3 - 0.5 km
- Use pelo menos 5 drones
- Simule disparos DENTRO da área azul
- Quanto mais perto do centro, melhor a precisão

### Testando a Precisão
1. Defina a área
2. Clique no CENTRO da área azul
3. Compare os pontos vermelho e verde - devem estar muito próximos!

### Testando nas Bordas
1. Defina a área
2. Clique na BORDA da área azul
3. A precisão será menor (é esperado)

## Entendendo a Interface

### Status
- **Drones ativos**: Quantos drones estão posicionados
- **Centro de operação**: ✓ se área foi definida
- **Raio atual**: Tamanho da área em km

### Análise em Progresso
Quando você vê "⏳ Analisando áudio...", o sistema está:
1. Simulando propagação do som
2. Aplicando atenuação por distância
3. Calculando delays (tempo de chegada)
4. Comparando com templates usando DTW
5. Triangulando a posição

### Legenda do Mapa
- **● Azul**: Área de operação dos drones
- **● Vermelho**: Posição REAL do disparo
- **● Verde**: Posição CALCULADA pelo sistema

## Troubleshooting

### Nenhum drone aparece
- ✅ Certifique-se de clicar em "Definir Área de Operação" primeiro
- ✅ Verifique se o raio é > 0

### Botão "Simular Disparo" desabilitado
- ✅ Você precisa definir a área primeiro
- ✅ Aguarde a análise anterior terminar

### Posição calculada muito longe da real
Isso pode acontecer por:
- Poucos drones (use mais)
- Disparo muito longe da área
- É uma simulação - algoritmo simplificado!

### Não detectou o disparo
- O threshold pode estar alto
- Ajuste em `/app/api/audio/analyze/route.ts` linha com `threshold`

## Arquitetura Simplificada

```
Você clica no mapa
    ↓
Frontend envia posição para /api/audio/simulate
    ↓
Backend gera áudio sintético de disparo
    ↓
Backend simula captura por cada drone
    ↓
Frontend envia áudio de cada drone para /api/audio/analyze
    ↓
Backend analisa com DTW (Dynamic Time Warping)
    ↓
Backend triangula posição com TDOA
    ↓
Frontend mostra resultado no mapa
```

## Próximos Passos

1. ✅ Teste com diferentes configurações
2. ✅ Observe como a precisão muda com mais/menos drones
3. ✅ Teste posições diferentes (centro vs borda)
4. 📚 Leia o README_PROJETO.md para detalhes técnicos
5. 🎵 Adicione arquivos WAV reais (opcional, ver database/README.md)

## Recursos

- **OpenLayers Docs**: https://openlayers.org/
- **Dynamic Time Warping**: https://en.wikipedia.org/wiki/Dynamic_time_warping
- **TDOA**: https://en.wikipedia.org/wiki/Time_of_arrival

---

**Divirta-se explorando! 🚁🔊**
