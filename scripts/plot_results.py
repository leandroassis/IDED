#!/usr/bin/env python3
"""
Script para visualização dos resultados dos testes de carga.

Gera gráficos de:
1. Acurácia (geral, disparo, ambiente) por raio
2. Erro de posição por raio (com barras de erro)
3. Tempo de processamento por raio (com barras de erro)

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
    
    # Imprimir estatísticas
    print_summary_stats(df)
    
    print('✅ Todos os gráficos foram gerados com sucesso!\n')
    print(f'📁 Arquivos salvos em: {output_dir}/')
    print('   - accuracy_by_radius.png')
    print('   - position_error_by_radius.png')
    print('   - processing_time_by_radius.png')
    print('   - dashboard_metrics.png\n')


if __name__ == '__main__':
    main()
