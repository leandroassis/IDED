#!/usr/bin/env python3
"""
Script para visualização dos resultados dos testes de carga.

Gera gráficos de:
1. Acurácia (geral, disparo, ambiente) por raio
2. Erro de posição por raio (com barras de erro)
3. Tempo de processamento por raio (com barras de erro)
4. Dashboard combinado com todas as métricas
5. Matriz de confusão (soundType vs detectedAsGunshot)

Uso:
    python scripts/plot_results.py <caminho_para_summary.csv>
    
Exemplo:
    python scripts/plot_results.py tests/load_test_2025-11-05/summary.csv
"""

import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.ticker import MaxNLocator, FuncFormatter
import numpy as np
import sys
import os
from pathlib import Path
from glob import glob

# Configuração de estilo acadêmico
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams.update({
    'figure.figsize': (12, 7),
    'font.size': 11,
    'font.family': 'serif',
    'font.serif': ['DejaVu Serif', 'Times New Roman', 'Computer Modern Roman'],
    'axes.labelsize': 12,
    'axes.titlesize': 14,
    'axes.titleweight': 'bold',
    'axes.labelweight': 'bold',
    'axes.linewidth': 1.2,
    'axes.edgecolor': '#333333',
    'axes.grid': True,
    'axes.axisbelow': True,
    'grid.alpha': 0.4,
    'grid.linestyle': '--',
    'grid.linewidth': 0.8,
    'grid.color': '#999999',
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'xtick.major.width': 1.2,
    'ytick.major.width': 1.2,
    'xtick.direction': 'out',
    'ytick.direction': 'out',
    'legend.fontsize': 10,
    'legend.framealpha': 0.95,
    'legend.edgecolor': '#666666',
    'legend.fancybox': True,
    'legend.shadow': True,
    'lines.linewidth': 2,
    'lines.markersize': 8,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight',
    'savefig.facecolor': 'white',
    'savefig.edgecolor': 'none',
})


def format_x_labels(radii, num_drones):
    """
    Formata labels do eixo X com raio e quantidade de drones.
    
    Args:
        radii: Array com os raios em km
        num_drones: Array com quantidade de drones
        
    Returns:
        Lista de labels formatadas
    """
    labels = []
    for r, n in zip(radii, num_drones):
        labels.append(f'{r:.1f}km\n({n} drones)')
    return labels


def plot_accuracy(df, output_dir):
    """
    Gráfico de acurácia (geral, disparo, ambiente) por raio.
    
    Args:
        df: DataFrame com os dados
        output_dir: Diretório para salvar o gráfico
    """
    fig, ax = plt.subplots(figsize=(12, 7))
    
    x = np.arange(len(df))
    width = 0.26
    
    # Cores acadêmicas
    colors = {
        'geral': '#2C5F8D',      # Azul escuro
        'disparo': '#C44536',    # Vermelho escuro
        'ambiente': '#3A7D44'    # Verde escuro
    }
    
    # Barras para cada métrica
    bars1 = ax.bar(x - width, df['accuracyMean'], width, 
                   label='Acurácia Geral', 
                   color=colors['geral'], 
                   alpha=0.85,
                   edgecolor='black',
                   linewidth=1.2)
    bars2 = ax.bar(x, df['gunshotAccuracy'], width, 
                   label='Acurácia Disparo', 
                   color=colors['disparo'], 
                   alpha=0.85,
                   edgecolor='black',
                   linewidth=1.2)
    bars3 = ax.bar(x + width, df['ambientAccuracy'], width, 
                   label='Acurácia Ambiente', 
                   color=colors['ambiente'], 
                   alpha=0.85,
                   edgecolor='black',
                   linewidth=1.2)
    
    # Adicionar valores sobre as barras (apenas se houver poucos dados)
    if len(df) <= 8:
        def autolabel(bars):
            for bar in bars:
                height = bar.get_height()
                ax.annotate(f'{height:.1f}',
                           xy=(bar.get_x() + bar.get_width() / 2, height),
                           xytext=(0, 4),
                           textcoords="offset points",
                           ha='center', va='bottom',
                           fontsize=9,
                           fontweight='normal')
        
        autolabel(bars1)
        autolabel(bars2)
        autolabel(bars3)
    
    # Configurações do gráfico
    ax.set_xlabel('Raio de Operação (km) e Quantidade de Drones', fontweight='bold', fontsize=12)
    ax.set_ylabel('Acurácia (%)', fontweight='bold', fontsize=12)
    ax.set_title('Desempenho de Detecção Acústica por Raio de Operação', 
                 fontweight='bold', fontsize=14, pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(format_x_labels(df['radius'], df['numDrones']), fontsize=10)
    
    # Grid pontilhado
    ax.grid(True, axis='y', alpha=0.4, linestyle='--', linewidth=0.8)
    ax.grid(True, axis='x', alpha=0.2, linestyle='--', linewidth=0.6)
    ax.set_axisbelow(True)
    
    # Limites e ticks
    ax.set_ylim(0, 105)
    ax.yaxis.set_major_locator(MaxNLocator(integer=False, prune='lower', nbins=10))
    
    # Linha de referência com anotação
    ax.axhline(y=90, color='#666666', linestyle=':', alpha=0.6, linewidth=2, zorder=1)
    ax.text(len(df) - 0.1, 91.5, 'Meta: 90%', 
            ha='right', va='bottom', color='#666666', fontsize=9, 
            style='italic', bbox=dict(boxstyle='round,pad=0.4', 
            facecolor='white', edgecolor='#666666', alpha=0.8))
    
    # Legenda otimizada
    ax.legend(loc='lower left', 
             frameon=True, 
             shadow=True,
             fancybox=True,
             ncol=1,
             fontsize=10)
    
    # Spines
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'accuracy_by_radius.png'), 
                dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f'✅ Gráfico salvo: {os.path.join(output_dir, "accuracy_by_radius.png")}')


def plot_position_error(df, output_dir):
    """
    Gráfico de erro de posição por raio com barras de erro.
    
    Args:
        df: DataFrame com os dados
        output_dir: Diretório para salvar o gráfico
    """
    fig, ax = plt.subplots(figsize=(12, 7))
    
    x = np.arange(len(df))
    
    # Cor principal
    color_main = '#2C5F8D'
    color_edge = '#1A3A5C'
    
    # Gráfico de barras com erro
    bars = ax.bar(x, df['positionErrorMean'], 
                  yerr=df['positionErrorStdDev'],
                  capsize=6, 
                  color=color_main, 
                  alpha=0.85,
                  edgecolor=color_edge,
                  linewidth=1.2,
                  error_kw={'linewidth': 2, 'ecolor': color_edge, 'capthick': 2})
    
    # Adicionar valores sobre as barras (apenas se houver poucos dados)
    if len(df) <= 8:
        for i, (bar, mean, std) in enumerate(zip(bars, df['positionErrorMean'], 
                                                  df['positionErrorStdDev'])):
            height = bar.get_height()
            # Valor médio
            ax.annotate(f'{mean:.1f}m',
                       xy=(bar.get_x() + bar.get_width() / 2, height + std),
                       xytext=(0, 8),
                       textcoords="offset points",
                       ha='center', va='bottom',
                       fontsize=9, fontweight='bold')
            # Desvio padrão
            ax.annotate(f'±{std:.1f}',
                       xy=(bar.get_x() + bar.get_width() / 2, height + std),
                       xytext=(0, -3),
                       textcoords="offset points",
                       ha='center', va='top',
                       fontsize=8, color='#666666', style='italic')
    
    # Configurações do gráfico
    ax.set_xlabel('Raio de Operação (km) e Quantidade de Drones', fontweight='bold', fontsize=12)
    ax.set_ylabel('Erro de Posição (metros)', fontweight='bold', fontsize=12)
    ax.set_title('Precisão da Triangulação TDOA por Raio de Operação', 
                 fontweight='bold', fontsize=14, pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(format_x_labels(df['radius'], df['numDrones']), fontsize=10)
    
    # Grid pontilhado
    ax.grid(True, axis='y', alpha=0.4, linestyle='--', linewidth=0.8)
    ax.grid(True, axis='x', alpha=0.2, linestyle='--', linewidth=0.6)
    ax.set_axisbelow(True)
    
    # Limites
    max_error_with_std = (df['positionErrorMean'] + df['positionErrorStdDev']).max()
    ax.set_ylim(0, max_error_with_std * 1.15)
    ax.yaxis.set_major_locator(MaxNLocator(integer=False, prune='lower', nbins=10))
    
    # Adicionar linha de tendência (apenas se houver mais de 2 pontos)
    if len(df) > 2:
        z = np.polyfit(x, df['positionErrorMean'], 2)
        p = np.poly1d(z)
        x_trend = np.linspace(x.min(), x.max(), 100)
        ax.plot(x_trend, p(x_trend), 
                color='#C44536', 
                linestyle='--', 
                alpha=0.7, 
                linewidth=2.5, 
                label='Tendência Polinomial (grau 2)',
                zorder=5)
        ax.legend(loc='upper left', frameon=True, shadow=True, fancybox=True)
    
    # Spines
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    # Anotação de interpretação
    textstr = 'Barras de erro: ±1 desvio padrão'
    ax.text(0.98, 0.02, textstr, transform=ax.transAxes,
            fontsize=9, verticalalignment='bottom', horizontalalignment='right',
            bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.3),
            style='italic', color='#555555')
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'position_error_by_radius.png'), 
                dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f'✅ Gráfico salvo: {os.path.join(output_dir, "position_error_by_radius.png")}')


def plot_processing_time(df, output_dir):
    """
    Gráfico de tempo de processamento por raio com barras de erro.
    
    Args:
        df: DataFrame com os dados
        output_dir: Diretório para salvar o gráfico
    """
    fig, ax = plt.subplots(figsize=(12, 7))
    
    x = np.arange(len(df))
    
    # Converter para segundos
    time_mean_sec = df['processingTimeMean'] / 1000
    time_std_sec = df['processingTimeStdDev'] / 1000
    
    # Cor principal
    color_main = '#3A7D44'
    color_edge = '#2A5A32'
    
    # Gráfico de barras com erro
    bars = ax.bar(x, time_mean_sec, 
                  yerr=time_std_sec,
                  capsize=6, 
                  color=color_main, 
                  alpha=0.85,
                  edgecolor=color_edge,
                  linewidth=1.2,
                  error_kw={'linewidth': 2, 'ecolor': color_edge, 'capthick': 2})
    
    # Adicionar valores sobre as barras (apenas se houver poucos dados)
    if len(df) <= 8:
        for i, (bar, mean, std) in enumerate(zip(bars, time_mean_sec, time_std_sec)):
            height = bar.get_height()
            # Valor médio
            ax.annotate(f'{mean:.2f}s',
                       xy=(bar.get_x() + bar.get_width() / 2, height + std),
                       xytext=(0, 8),
                       textcoords="offset points",
                       ha='center', va='bottom',
                       fontsize=9, fontweight='bold')
            # Desvio padrão
            ax.annotate(f'±{std:.2f}',
                       xy=(bar.get_x() + bar.get_width() / 2, height + std),
                       xytext=(0, -3),
                       textcoords="offset points",
                       ha='center', va='top',
                       fontsize=8, color='#666666', style='italic')
    
    # Configurações do gráfico
    ax.set_xlabel('Raio de Operação (km) e Quantidade de Drones', fontweight='bold', fontsize=12)
    ax.set_ylabel('Tempo de Processamento (segundos)', fontweight='bold', fontsize=12)
    ax.set_title('Desempenho Computacional por Raio de Operação', 
                 fontweight='bold', fontsize=14, pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(format_x_labels(df['radius'], df['numDrones']), fontsize=10)
    
    # Grid pontilhado
    ax.grid(True, axis='y', alpha=0.4, linestyle='--', linewidth=0.8)
    ax.grid(True, axis='x', alpha=0.2, linestyle='--', linewidth=0.6)
    ax.set_axisbelow(True)
    
    # Limites
    max_time_with_std = (time_mean_sec + time_std_sec).max()
    ax.set_ylim(0, max_time_with_std * 1.15)
    ax.yaxis.set_major_locator(MaxNLocator(integer=False, prune='lower', nbins=10))
    
    # Adicionar linha de tendência (apenas se houver mais de 2 pontos)
    if len(df) > 2:
        z = np.polyfit(x, time_mean_sec, 2)
        p = np.poly1d(z)
        x_trend = np.linspace(x.min(), x.max(), 100)
        ax.plot(x_trend, p(x_trend), 
                color='#C44536', 
                linestyle='--', 
                alpha=0.7, 
                linewidth=2.5, 
                label='Tendência Polinomial (grau 2)',
                zorder=5)
        ax.legend(loc='upper left', frameon=True, shadow=True, fancybox=True)
    
    # Spines
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    # Anotação de interpretação
    textstr = 'Barras de erro: ±1 desvio padrão'
    ax.text(0.98, 0.02, textstr, transform=ax.transAxes,
            fontsize=9, verticalalignment='bottom', horizontalalignment='right',
            bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.3),
            style='italic', color='#555555')
    
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'processing_time_by_radius.png'), 
                dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f'✅ Gráfico salvo: {os.path.join(output_dir, "processing_time_by_radius.png")}')


def plot_combined_dashboard(df, output_dir):
    """
    Gráfico combinado com todos as métricas em um dashboard.
    
    Args:
        df: DataFrame com os dados
        output_dir: Diretório para salvar o gráfico
    """
    fig = plt.figure(figsize=(16, 13))
    gs = fig.add_gridspec(3, 1, hspace=0.35, top=0.94, bottom=0.06, left=0.08, right=0.96)
    
    x = np.arange(len(df))
    width = 0.26
    
    # Cores consistentes
    colors = {
        'geral': '#2C5F8D',
        'disparo': '#C44536',
        'ambiente': '#3A7D44'
    }
    
    # ============= 1. ACURÁCIA =============
    ax1 = fig.add_subplot(gs[0])
    
    bars1 = ax1.bar(x - width, df['accuracyMean'], width, 
                    label='Geral', color=colors['geral'], alpha=0.85,
                    edgecolor='black', linewidth=1)
    bars2 = ax1.bar(x, df['gunshotAccuracy'], width, 
                    label='Disparo', color=colors['disparo'], alpha=0.85,
                    edgecolor='black', linewidth=1)
    bars3 = ax1.bar(x + width, df['ambientAccuracy'], width, 
                    label='Ambiente', color=colors['ambiente'], alpha=0.85,
                    edgecolor='black', linewidth=1)
    
    ax1.set_ylabel('Acurácia (%)', fontweight='bold', fontsize=11)
    ax1.set_title('(a) Desempenho de Detecção Acústica', 
                  fontweight='bold', fontsize=12, loc='left', pad=10)
    ax1.set_xticks(x)
    ax1.set_xticklabels(format_x_labels(df['radius'], df['numDrones']), fontsize=9)
    ax1.legend(loc='lower left', frameon=True, shadow=True, ncol=3, fontsize=9)
    ax1.grid(True, axis='y', alpha=0.4, linestyle='--', linewidth=0.8)
    ax1.grid(True, axis='x', alpha=0.2, linestyle='--', linewidth=0.6)
    ax1.set_axisbelow(True)
    ax1.set_ylim(0, 105)
    ax1.yaxis.set_major_locator(MaxNLocator(nbins=10))
    ax1.axhline(y=90, color='#666666', linestyle=':', alpha=0.6, linewidth=1.8, zorder=1)
    ax1.spines['top'].set_visible(False)
    ax1.spines['right'].set_visible(False)
    
    # ============= 2. ERRO DE POSIÇÃO =============
    ax2 = fig.add_subplot(gs[1])
    
    bars_pos = ax2.bar(x, df['positionErrorMean'], 
                       yerr=df['positionErrorStdDev'],
                       capsize=5, color=colors['geral'], alpha=0.85,
                       edgecolor='black', linewidth=1,
                       error_kw={'linewidth': 1.8, 'ecolor': '#1A3A5C', 'capthick': 1.8})
    
    ax2.set_ylabel('Erro de Posição (m)', fontweight='bold', fontsize=11)
    ax2.set_title('(b) Precisão da Triangulação TDOA', 
                  fontweight='bold', fontsize=12, loc='left', pad=10)
    ax2.set_xticks(x)
    ax2.set_xticklabels(format_x_labels(df['radius'], df['numDrones']), fontsize=9)
    ax2.grid(True, axis='y', alpha=0.4, linestyle='--', linewidth=0.8)
    ax2.grid(True, axis='x', alpha=0.2, linestyle='--', linewidth=0.6)
    ax2.set_axisbelow(True)
    ax2.yaxis.set_major_locator(MaxNLocator(nbins=10))
    ax2.spines['top'].set_visible(False)
    ax2.spines['right'].set_visible(False)
    
    # Linha de tendência
    if len(df) > 2:
        z = np.polyfit(x, df['positionErrorMean'], 2)
        p = np.poly1d(z)
        x_trend = np.linspace(x.min(), x.max(), 100)
        ax2.plot(x_trend, p(x_trend), color=colors['disparo'], 
                linestyle='--', alpha=0.7, linewidth=2, 
                label='Tendência', zorder=5)
        ax2.legend(loc='upper left', frameon=True, shadow=True, fontsize=9)
    
    # ============= 3. TEMPO DE PROCESSAMENTO =============
    ax3 = fig.add_subplot(gs[2])
    
    time_mean_sec = df['processingTimeMean'] / 1000
    time_std_sec = df['processingTimeStdDev'] / 1000
    
    bars_time = ax3.bar(x, time_mean_sec, 
                        yerr=time_std_sec,
                        capsize=5, color=colors['ambiente'], alpha=0.85,
                        edgecolor='black', linewidth=1,
                        error_kw={'linewidth': 1.8, 'ecolor': '#2A5A32', 'capthick': 1.8})
    
    ax3.set_xlabel('Raio de Operação (km) e Quantidade de Drones', 
                   fontweight='bold', fontsize=11)
    ax3.set_ylabel('Tempo (s)', fontweight='bold', fontsize=11)
    ax3.set_title('(c) Desempenho Computacional', 
                  fontweight='bold', fontsize=12, loc='left', pad=10)
    ax3.set_xticks(x)
    ax3.set_xticklabels(format_x_labels(df['radius'], df['numDrones']), fontsize=9)
    ax3.grid(True, axis='y', alpha=0.4, linestyle='--', linewidth=0.8)
    ax3.grid(True, axis='x', alpha=0.2, linestyle='--', linewidth=0.6)
    ax3.set_axisbelow(True)
    ax3.yaxis.set_major_locator(MaxNLocator(nbins=10))
    ax3.spines['top'].set_visible(False)
    ax3.spines['right'].set_visible(False)
    
    # Linha de tendência
    if len(df) > 2:
        z = np.polyfit(x, time_mean_sec, 2)
        p = np.poly1d(z)
        x_trend = np.linspace(x.min(), x.max(), 100)
        ax3.plot(x_trend, p(x_trend), color=colors['disparo'], 
                linestyle='--', alpha=0.7, linewidth=2, 
                label='Tendência', zorder=5)
        ax3.legend(loc='upper left', frameon=True, shadow=True, fontsize=9)
    
    # Título geral
    fig.suptitle('Métricas de Desempenho do Sistema de Detecção Acústica de Disparos', 
                 fontweight='bold', fontsize=15, y=0.98)
    
    plt.savefig(os.path.join(output_dir, 'dashboard_metrics.png'), 
                dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f'✅ Dashboard salvo: {os.path.join(output_dir, "dashboard_metrics.png")}')


def plot_confusion_matrix(output_dir):
    """
    Gera matriz de confusão agregada de todos os raios testados.
    
    Lê todos os arquivos detailed_radius_*.csv e agrega as classificações
    para criar uma matriz de confusão geral.
    
    Args:
        output_dir: Diretório contendo os arquivos CSV detalhados e onde salvar o gráfico
    """
    # Buscar todos os arquivos detailed_radius_*.csv
    pattern = os.path.join(output_dir, 'detailed_radius_*.csv')
    detailed_files = glob(pattern)
    
    if not detailed_files:
        print(f'⚠️  Aviso: Nenhum arquivo detailed_radius_*.csv encontrado em {output_dir}')
        print('   Matriz de confusão não será gerada.')
        return
    
    print(f'\n📊 Gerando matriz de confusão...')
    print(f'   Arquivos encontrados: {len(detailed_files)}')
    
    # Agregar dados de todos os arquivos
    all_data = []
    for file_path in detailed_files:
        try:
            df_temp = pd.read_csv(file_path)
            all_data.append(df_temp)
        except Exception as e:
            print(f'⚠️  Erro ao ler {file_path}: {e}')
            continue
    
    if not all_data:
        print('❌ Erro: Não foi possível ler nenhum arquivo detalhado')
        return
    
    # Concatenar todos os dados
    df_all = pd.concat(all_data, ignore_index=True)
    
    # Filtrar apenas testes bem-sucedidos
    df_all = df_all[df_all['success'] == True].copy()
    
    if len(df_all) == 0:
        print('❌ Erro: Nenhum teste bem-sucedido encontrado')
        return
    
    # Criar matriz de confusão
    # True Positive: soundType='gunshot' e detectedAsGunshot=True
    # True Negative: soundType='ambient' e detectedAsGunshot=False
    # False Positive: soundType='ambient' e detectedAsGunshot=True
    # False Negative: soundType='gunshot' e detectedAsGunshot=False
    
    tp = len(df_all[(df_all['soundType'] == 'gunshot') & (df_all['detectedAsGunshot'] == True)])
    tn = len(df_all[(df_all['soundType'] == 'ambient') & (df_all['detectedAsGunshot'] == False)])
    fp = len(df_all[(df_all['soundType'] == 'ambient') & (df_all['detectedAsGunshot'] == True)])
    fn = len(df_all[(df_all['soundType'] == 'gunshot') & (df_all['detectedAsGunshot'] == False)])
    
    # Matriz de confusão
    confusion_matrix = np.array([[tp, fn],
                                  [fp, tn]])
    
    # Calcular métricas
    total = tp + tn + fp + fn
    accuracy = (tp + tn) / total * 100 if total > 0 else 0
    precision = tp / (tp + fp) * 100 if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) * 100 if (tp + fn) > 0 else 0
    f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    
    # Criar figura com GridSpec para controle preciso do layout
    fig = plt.figure(figsize=(16, 8))
    gs = fig.add_gridspec(1, 2, width_ratios=[3, 1], wspace=0.3, 
                          left=0.1, right=0.95, top=0.9, bottom=0.15)
    
    # Subplot principal para a matriz
    ax = fig.add_subplot(gs[0])
    
    # Cores para a matriz (azul escuro para valores altos, branco para baixos)
    cmap = plt.cm.Blues
    im = ax.imshow(confusion_matrix, cmap=cmap, aspect='auto', alpha=0.8)
    
    # Colorbar dentro do subplot principal
    from mpl_toolkits.axes_grid1 import make_axes_locatable
    divider = make_axes_locatable(ax)
    cax = divider.append_axes("right", size="5%", pad=0.15)
    cbar = plt.colorbar(im, cax=cax)
    cbar.set_label('Quantidade de Predições', rotation=270, labelpad=25, 
                   fontweight='bold', fontsize=11)
    cbar.ax.tick_params(labelsize=10)
    
    # Labels dos eixos
    classes = ['Disparo', 'Ambiente']
    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(classes, fontsize=12, fontweight='bold')
    ax.set_yticklabels(classes, fontsize=12, fontweight='bold')
    
    ax.set_xlabel('Classe Predita', fontweight='bold', fontsize=13, labelpad=10)
    ax.set_ylabel('Classe Real', fontweight='bold', fontsize=13, labelpad=10)
    ax.set_title('Matriz de Confusão - Classificação de Sons\n(Agregado de Todos os Raios)', 
                 fontweight='bold', fontsize=14, pad=20)
    
    # Adicionar valores nas células
    for i in range(2):
        for j in range(2):
            value = confusion_matrix[i, j]
            percentage = (value / total * 100) if total > 0 else 0
            
            # Texto principal (valor absoluto)
            text = ax.text(j, i, f'{value:,}',
                          ha="center", va="center",
                          color="white" if value > confusion_matrix.max()/2 else "black",
                          fontsize=20, fontweight='bold')
            
            # Texto secundário (percentual)
            text2 = ax.text(j, i + 0.25, f'({percentage:.1f}%)',
                           ha="center", va="center",
                           color="white" if value > confusion_matrix.max()/2 else "black",
                           fontsize=11, style='italic')
    
    # Adicionar grid sutil
    ax.set_xticks([0.5], minor=True)
    ax.set_yticks([0.5], minor=True)
    ax.grid(which="minor", color="gray", linestyle='-', linewidth=2)
    ax.tick_params(which="minor", size=0)
    
    # Subplot para métricas (à direita)
    ax_metrics = fig.add_subplot(gs[1])
    ax_metrics.axis('off')  # Esconder eixos
    
    # Adicionar caixa com métricas no subplot dedicado
    metrics_text = (
        f'Métricas Gerais\n'
        f'(n={total:,} testes)\n'
        f'{"─" * 20}\n\n'
        f'Acurácia:\n  {accuracy:.2f}%\n\n'
        f'Precisão:\n  {precision:.2f}%\n\n'
        f'Recall:\n  {recall:.2f}%\n\n'
        f'F1-Score:\n  {f1_score:.2f}%'
    )
    
    props = dict(boxstyle='round,pad=1.0', facecolor='#F0F0F0', 
                 edgecolor='#666666', linewidth=2.5, alpha=0.95)
    ax_metrics.text(0.1, 0.95, metrics_text, transform=ax_metrics.transAxes,
                    fontsize=12, verticalalignment='top', horizontalalignment='left',
                    bbox=props, family='monospace', fontweight='bold')
    
    # Adicionar legenda explicativa no subplot de métricas (parte inferior)
    legend_text = (
        'Legenda:\n'
        '─────────\n'
        'TP: True Positive\n'
        '     Disparo → Disparo ✓\n\n'
        'TN: True Negative\n'
        '     Ambiente → Ambiente ✓\n\n'
        'FP: False Positive\n'
        '     Ambiente → Disparo ✗\n\n'
        'FN: False Negative\n'
        '     Disparo → Ambiente ✗'
    )
    
    props_legend = dict(boxstyle='round,pad=0.8', facecolor='#FFF8DC', 
                        edgecolor='#999999', linewidth=2, alpha=0.9)
    ax_metrics.text(0.1, 0.35, legend_text, transform=ax_metrics.transAxes,
                    fontsize=9, verticalalignment='top', horizontalalignment='left',
                    bbox=props_legend, family='sans-serif', linespacing=1.3)
    
    plt.savefig(os.path.join(output_dir, 'confusion_matrix.png'), 
                dpi=300, bbox_inches='tight', facecolor='white')
    plt.close()
    
    print(f'✅ Matriz de confusão salva: {os.path.join(output_dir, "confusion_matrix.png")}')
    print(f'   Total de testes: {total:,}')
    print(f'   TP={tp:,} | TN={tn:,} | FP={fp:,} | FN={fn:,}')
    print(f'   Acurácia: {accuracy:.2f}% | Precisão: {precision:.2f}% | Recall: {recall:.2f}%')


def print_summary_stats(df):
    """
    Imprime estatísticas resumidas dos testes.
    
    Args:
        df: DataFrame com os dados
    """
    print('\n' + '='*70)
    print('📊 RESUMO ESTATÍSTICO DOS TESTES')
    print('='*70)
    
    print(f'\n📍 Raios testados: {len(df)}')
    print(f'   Raio mínimo: {df["radius"].min():.1f} km ({df.loc[df["radius"].idxmin(), "numDrones"]} drones)')
    print(f'   Raio máximo: {df["radius"].max():.1f} km ({df.loc[df["radius"].idxmax(), "numDrones"]} drones)')
    
    print(f'\n🎯 Acurácia:')
    print(f'   Geral:    {df["accuracyMean"].mean():.2f}% (±{df["accuracyMean"].std():.2f}%)')
    print(f'   Disparo:  {df["gunshotAccuracy"].mean():.2f}% (±{df["gunshotAccuracy"].std():.2f}%)')
    print(f'   Ambiente: {df["ambientAccuracy"].mean():.2f}% (±{df["ambientAccuracy"].std():.2f}%)')
    
    print(f'\n📏 Erro de Posição:')
    print(f'   Média:    {df["positionErrorMean"].mean():.2f}m')
    print(f'   Mínimo:   {df["positionErrorMean"].min():.2f}m')
    print(f'   Máximo:   {df["positionErrorMean"].max():.2f}m')
    
    print(f'\n⏱️  Tempo de Processamento:')
    print(f'   Média:    {df["processingTimeMean"].mean()/1000:.2f}s')
    print(f'   Mínimo:   {df["processingTimeMean"].min()/1000:.2f}s')
    print(f'   Máximo:   {df["processingTimeMean"].max()/1000:.2f}s')
    
    print(f'\n🧪 Total de testes: {df["totalTests"].sum()}')
    print('='*70 + '\n')


def main():
    """Função principal."""
    if len(sys.argv) < 2:
        print('❌ Erro: Caminho do arquivo summary.csv não fornecido')
        print('\nUso:')
        print('  python scripts/plot_results.py <caminho_para_summary.csv>')
        print('\nExemplo:')
        print('  python scripts/plot_results.py tests/load_test_2025-11-05/summary.csv')
        sys.exit(1)
    
    csv_path = sys.argv[1]
    
    # Verificar se o arquivo existe
    if not os.path.exists(csv_path):
        print(f'❌ Erro: Arquivo não encontrado: {csv_path}')
        sys.exit(1)
    
    # Ler dados
    print(f'\n📂 Lendo dados de: {csv_path}')
    try:
        df = pd.read_csv(csv_path, comment='#')
    except Exception as e:
        print(f'❌ Erro ao ler CSV: {e}')
        sys.exit(1)
    
    # Validar colunas necessárias
    required_cols = ['radius', 'numDrones', 'totalTests', 'accuracyMean', 
                     'positionErrorMean', 'positionErrorStdDev', 
                     'processingTimeMean', 'processingTimeStdDev',
                     'gunshotAccuracy', 'ambientAccuracy']
    
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        print(f'❌ Erro: Colunas ausentes no CSV: {missing_cols}')
        sys.exit(1)
    
    # Ordenar por raio
    df = df.sort_values('radius').reset_index(drop=True)
    
    # Diretório de saída (mesmo diretório do CSV)
    output_dir = os.path.dirname(csv_path)
    
    print(f'📊 Gerando gráficos...')
    print(f'   Dados: {len(df)} raios diferentes')
    print(f'   Saída: {output_dir}\n')
    
    # Gerar gráficos
    plot_accuracy(df, output_dir)
    plot_position_error(df, output_dir)
    plot_processing_time(df, output_dir)
    plot_combined_dashboard(df, output_dir)
    plot_confusion_matrix(output_dir)
    
    # Imprimir estatísticas
    print_summary_stats(df)
    
    print('✅ Todos os gráficos foram gerados com sucesso!\n')
    print(f'📁 Arquivos salvos em: {output_dir}/')
    print('   - accuracy_by_radius.png')
    print('   - position_error_by_radius.png')
    print('   - processing_time_by_radius.png')
    print('   - dashboard_metrics.png')
    print('   - confusion_matrix.png\n')


if __name__ == '__main__':
    main()
