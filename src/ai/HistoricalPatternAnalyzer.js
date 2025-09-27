/**
 * Análisis de Patrones Históricos
 * Sistema que analiza historial de proyectos e identifica tendencias y mejores prácticas
 */

import { adaptiveLearning } from './AdaptiveLearning.js';

export class HistoricalPatternAnalyzer {
  constructor() {
    this.analysisCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutos
  }

  /**
   * Genera análisis completo de patrones históricos
   */
  generateHistoricalAnalysis() {
    const cacheKey = 'full_analysis';
    const cached = this.getCachedAnalysis(cacheKey);
    if (cached) return cached;

    try {
      const history = adaptiveLearning.getHistory();
      
      if (history.length < 3) {
        return this.getMinimalDataAnalysis(history);
      }

      const analysis = {
        overview: this.generateOverview(history),
        trends: this.analyzeTrends(history),
        patterns: this.identifyPatterns(history),
        performance: this.analyzePerformance(history),
        recommendations: this.generateRecommendations(history),
        insights: this.generateInsights(history),
        timestamp: new Date().toISOString()
      };

      this.setCachedAnalysis(cacheKey, analysis);
      return analysis;

    } catch (error) {
      console.warn('Error generando análisis histórico:', error);
      return this.getErrorAnalysis();
    }
  }

  /**
   * Genera resumen general del historial
   */
  generateOverview(history) {
    const totalOptimizations = history.length;
    const successfulOptimizations = history.filter(r => r.success).length;
    const successRate = totalOptimizations > 0 ? successfulOptimizations / totalOptimizations : 0;
    
    const avgUtilization = successfulOptimizations > 0
      ? history.filter(r => r.success).reduce((sum, r) => sum + r.result.totalUtilization, 0) / successfulOptimizations
      : 0;

    const dateRange = this.getDateRange(history);
    const projectFrequency = this.calculateProjectFrequency(history, dateRange);

    return {
      totalOptimizations,
      successfulOptimizations,
      successRate: Math.round(successRate * 100),
      avgUtilization: Math.round(avgUtilization * 100),
      dateRange,
      projectFrequency: Math.round(projectFrequency * 10) / 10,
      mostActiveMonth: this.getMostActiveMonth(history),
      avgProjectSize: this.calculateAvgProjectSize(history)
    };
  }

  /**
   * Analiza tendencias temporales
   */
  analyzeTrends(history) {
    const monthlyData = this.groupByMonth(history);
    const trends = {
      utilizationTrend: this.calculateUtilizationTrend(monthlyData),
      volumeTrend: this.calculateVolumeTrend(monthlyData),
      successRateTrend: this.calculateSuccessRateTrend(monthlyData),
      seasonality: this.identifySeasonality(monthlyData),
      improvements: this.identifyImprovements(history)
    };

    return trends;
  }

  /**
   * Identifica patrones recurrentes
   */
  identifyPatterns(history) {
    return {
      materialPreferences: this.analyzeMaterialPatterns(history),
      piecePatterns: this.analyzePiecePatterns(history),
      configurationPatterns: this.analyzeConfigurationPatterns(history),
      algorithmPreferences: this.analyzeAlgorithmPreferences(history),
      projectTypes: this.identifyProjectTypes(history),
      commonMistakes: this.identifyCommonMistakes(history)
    };
  }

  /**
   * Analiza rendimiento y eficiencia
   */
  analyzePerformance(history) {
    const successfulProjects = history.filter(r => r.success);
    
    return {
      bestPerformance: this.findBestPerformance(successfulProjects),
      worstPerformance: this.findWorstPerformance(history),
      performanceDistribution: this.calculatePerformanceDistribution(successfulProjects),
      efficiencyFactors: this.identifyEfficiencyFactors(successfulProjects),
      consistencyScore: this.calculateConsistencyScore(successfulProjects)
    };
  }

  /**
   * Genera recomendaciones basadas en análisis
   */
  generateRecommendations(history) {
    const recommendations = [];
    const successfulProjects = history.filter(r => r.success);
    const avgUtilization = successfulProjects.length > 0
      ? successfulProjects.reduce((sum, r) => sum + r.result.totalUtilization, 0) / successfulProjects.length
      : 0;

    // Recomendaciones de configuración
    if (avgUtilization < 0.75) {
      recommendations.push({
        type: 'configuration',
        priority: 'high',
        title: 'Optimizar configuración general',
        description: 'Tu aprovechamiento promedio está por debajo del 75%',
        action: 'Revisar configuraciones de kerf, margen y rotación',
        impact: 'Mejora potencial del 10-15% en aprovechamiento'
      });
    }

    // Recomendaciones de materiales
    const materialPatterns = this.analyzeMaterialPatterns(history);
    if (materialPatterns.mostEfficient) {
      recommendations.push({
        type: 'materials',
        priority: 'medium',
        title: `Usar más materiales ${materialPatterns.mostEfficient.size}`,
        description: `Este tamaño de material te da ${materialPatterns.mostEfficient.avgUtilization}% de aprovechamiento`,
        action: 'Estandarizar en este tamaño cuando sea posible',
        impact: 'Aprovechamiento más consistente'
      });
    }

    // Recomendaciones de algoritmo
    const algoPrefs = this.analyzeAlgorithmPreferences(history);
    if (algoPrefs.bestAlgorithm && algoPrefs.bestAlgorithm.usage < 0.5) {
      recommendations.push({
        type: 'algorithm',
        priority: 'medium',
        title: `Usar más algoritmo ${algoPrefs.bestAlgorithm.name}`,
        description: `Te da ${algoPrefs.bestAlgorithm.avgUtilization}% de aprovechamiento promedio`,
        action: 'Configurar como algoritmo preferido',
        impact: 'Mejora potencial del 5-8% en aprovechamiento'
      });
    }

    // Recomendaciones de proceso
    const mistakes = this.identifyCommonMistakes(history);
    if (mistakes.length > 0) {
      recommendations.push({
        type: 'process',
        priority: 'high',
        title: 'Evitar errores comunes',
        description: `Se identificaron ${mistakes.length} patrones de errores recurrentes`,
        action: 'Revisar configuraciones antes de optimizar',
        impact: 'Reducir fallos del 20-30%'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Genera insights profundos
   */
  generateInsights(history) {
    const insights = [];
    
    // Insight de productividad
    const productivity = this.analyzeProductivity(history);
    if (productivity.trend > 0.1) {
      insights.push({
        type: 'productivity',
        title: 'Tu productividad está mejorando',
        description: `Has mejorado ${Math.round(productivity.trend * 100)}% en las últimas optimizaciones`,
        evidence: productivity.evidence
      });
    }

    // Insight de especialización
    const specialization = this.analyzeSpecialization(history);
    if (specialization.dominantType) {
      insights.push({
        type: 'specialization',
        title: `Te especializas en proyectos de ${specialization.dominantType.type}`,
        description: `${specialization.dominantType.percentage}% de tus proyectos son de este tipo`,
        evidence: specialization.evidence
      });
    }

    // Insight de eficiencia
    const efficiency = this.analyzeEfficiencyPattern(history);
    if (efficiency.pattern) {
      insights.push({
        type: 'efficiency',
        title: efficiency.title,
        description: efficiency.description,
        evidence: efficiency.evidence
      });
    }

    return insights;
  }

  // Métodos auxiliares de análisis

  getDateRange(history) {
    if (history.length === 0) return null;
    
    const dates = history.map(r => new Date(r.timestamp)).sort();
    return {
      start: dates[0].toISOString().split('T')[0],
      end: dates[dates.length - 1].toISOString().split('T')[0],
      spanDays: Math.ceil((dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24))
    };
  }

  calculateProjectFrequency(history, dateRange) {
    if (!dateRange || dateRange.spanDays === 0) return 0;
    return history.length / (dateRange.spanDays / 7); // Proyectos por semana
  }

  getMostActiveMonth(history) {
    const monthCounts = {};
    
    history.forEach(record => {
      const month = new Date(record.timestamp).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });

    return Object.keys(monthCounts).reduce((a, b) => 
      monthCounts[a] > monthCounts[b] ? a : b, 'N/A'
    );
  }

  calculateAvgProjectSize(history) {
    if (history.length === 0) return 0;
    
    const avgPieces = history.reduce((sum, r) => sum + r.input.totalPieces, 0) / history.length;
    const avgMaterials = history.reduce((sum, r) => sum + r.input.totalMaterials, 0) / history.length;
    
    return {
      avgPieces: Math.round(avgPieces),
      avgMaterials: Math.round(avgMaterials)
    };
  }

  groupByMonth(history) {
    const monthlyData = {};
    
    history.forEach(record => {
      const monthKey = new Date(record.timestamp).toISOString().slice(0, 7); // YYYY-MM
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = [];
      }
      
      monthlyData[monthKey].push(record);
    });

    return monthlyData;
  }

  calculateUtilizationTrend(monthlyData) {
    const months = Object.keys(monthlyData).sort();
    if (months.length < 2) return 'insufficient_data';

    const utilizationByMonth = months.map(month => {
      const monthRecords = monthlyData[month].filter(r => r.success);
      return monthRecords.length > 0
        ? monthRecords.reduce((sum, r) => sum + r.result.totalUtilization, 0) / monthRecords.length
        : 0;
    });

    const firstHalf = utilizationByMonth.slice(0, Math.ceil(utilizationByMonth.length / 2));
    const secondHalf = utilizationByMonth.slice(Math.floor(utilizationByMonth.length / 2));

    const firstAvg = firstHalf.reduce((sum, u) => sum + u, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, u) => sum + u, 0) / secondHalf.length;

    const improvement = secondAvg - firstAvg;

    if (improvement > 0.05) return 'improving';
    if (improvement < -0.05) return 'declining';
    return 'stable';
  }

  analyzeMaterialPatterns(history) {
    const materialSizes = {};
    
    history.forEach(record => {
      const avgMaterialSize = record.input.avgMaterialSize;
      const sizeCategory = this.categorizeMaterialSize(avgMaterialSize);
      
      if (!materialSizes[sizeCategory]) {
        materialSizes[sizeCategory] = {
          count: 0,
          totalUtilization: 0,
          avgUtilization: 0
        };
      }
      
      materialSizes[sizeCategory].count++;
      if (record.success) {
        materialSizes[sizeCategory].totalUtilization += record.result.totalUtilization;
      }
    });

    // Calcular promedios
    Object.values(materialSizes).forEach(data => {
      data.avgUtilization = data.count > 0 ? (data.totalUtilization / data.count) * 100 : 0;
    });

    const mostUsed = Object.keys(materialSizes).reduce((a, b) => 
      materialSizes[a].count > materialSizes[b].count ? a : b, null
    );

    const mostEfficient = Object.keys(materialSizes).reduce((a, b) => 
      materialSizes[a].avgUtilization > materialSizes[b].avgUtilization ? a : b, null
    );

    return {
      distribution: materialSizes,
      mostUsed: mostUsed ? { size: mostUsed, ...materialSizes[mostUsed] } : null,
      mostEfficient: mostEfficient ? { size: mostEfficient, ...materialSizes[mostEfficient] } : null
    };
  }

  categorizeMaterialSize(size) {
    if (size < 50000) return 'pequeño';
    if (size < 200000) return 'mediano';
    if (size < 500000) return 'grande';
    return 'extra_grande';
  }

  analyzeAlgorithmPreferences(history) {
    const algorithms = {};
    
    history.forEach(record => {
      const algo = record.result.algorithm || 'unknown';
      
      if (!algorithms[algo]) {
        algorithms[algo] = {
          count: 0,
          successes: 0,
          totalUtilization: 0,
          avgUtilization: 0,
          successRate: 0
        };
      }
      
      algorithms[algo].count++;
      if (record.success) {
        algorithms[algo].successes++;
        algorithms[algo].totalUtilization += record.result.totalUtilization;
      }
    });

    // Calcular métricas
    Object.values(algorithms).forEach(data => {
      data.successRate = data.count > 0 ? data.successes / data.count : 0;
      data.avgUtilization = data.successes > 0 ? (data.totalUtilization / data.successes) * 100 : 0;
      data.usage = data.count / history.length;
    });

    const mostUsed = Object.keys(algorithms).reduce((a, b) => 
      algorithms[a].count > algorithms[b].count ? a : b, null
    );

    const bestAlgorithm = Object.keys(algorithms).reduce((a, b) => 
      algorithms[a].avgUtilization > algorithms[b].avgUtilization ? a : b, null
    );

    return {
      distribution: algorithms,
      mostUsed: mostUsed ? { name: mostUsed, ...algorithms[mostUsed] } : null,
      bestAlgorithm: bestAlgorithm ? { name: bestAlgorithm, ...algorithms[bestAlgorithm] } : null
    };
  }

  identifyCommonMistakes(history) {
    const mistakes = [];
    const failedProjects = history.filter(r => !r.success);

    if (failedProjects.length === 0) return mistakes;

    // Kerf muy alto
    const highKerfFails = failedProjects.filter(r => r.input.kerfWidth > 5).length;
    if (highKerfFails > failedProjects.length * 0.3) {
      mistakes.push({
        type: 'high_kerf',
        frequency: highKerfFails,
        description: 'Kerf muy alto causing failures',
        suggestion: 'Reducir kerf a 3-4mm'
      });
    }

    // Material insuficiente
    const insufficientMaterial = failedProjects.filter(r => 
      r.input.piecesToMaterialRatio > 0.9
    ).length;
    
    if (insufficientMaterial > failedProjects.length * 0.4) {
      mistakes.push({
        type: 'insufficient_material',
        frequency: insufficientMaterial,
        description: 'Proyectos con muy poco material disponible',
        suggestion: 'Agregar 20-30% más material del calculado'
      });
    }

    return mistakes;
  }

  findBestPerformance(successfulProjects) {
    if (successfulProjects.length === 0) return null;
    
    return successfulProjects.reduce((best, current) => 
      current.result.totalUtilization > best.result.totalUtilization ? current : best
    );
  }

  analyzeProductivity(history) {
    if (history.length < 5) return { trend: 0, evidence: 'Datos insuficientes' };

    const recentProjects = history.slice(-Math.ceil(history.length / 3));
    const olderProjects = history.slice(0, Math.floor(history.length / 3));

    const recentAvgUtilization = this.calculateAvgUtilization(recentProjects);
    const olderAvgUtilization = this.calculateAvgUtilization(olderProjects);

    return {
      trend: recentAvgUtilization - olderAvgUtilization,
      evidence: `Aprovechamiento: ${Math.round(olderAvgUtilization * 100)}% → ${Math.round(recentAvgUtilization * 100)}%`
    };
  }

  calculateAvgUtilization(projects) {
    const successful = projects.filter(r => r.success);
    return successful.length > 0 
      ? successful.reduce((sum, r) => sum + r.result.totalUtilization, 0) / successful.length
      : 0;
  }

  // Métodos de cache
  getCachedAnalysis(key) {
    const cached = this.analysisCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  setCachedAnalysis(key, data) {
    this.analysisCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Respuestas por defecto
  getMinimalDataAnalysis(history) {
    return {
      overview: {
        totalOptimizations: history.length,
        message: `Tienes ${history.length} optimizaciones registradas. Necesitas al menos 3 para análisis detallado.`
      },
      trends: { message: 'Datos insuficientes para análisis de tendencias' },
      patterns: { message: 'Continúa usando la aplicación para identificar patrones' },
      performance: { message: 'Análisis de rendimiento disponible después de más uso' },
      recommendations: [{
        type: 'usage',
        priority: 'high',
        title: 'Continuar usando la aplicación',
        description: 'Ejecuta más optimizaciones para obtener análisis personalizados',
        action: 'Crear y optimizar más proyectos',
        impact: 'Análisis inteligente personalizado'
      }],
      insights: [{
        type: 'onboarding',
        title: '¡Bienvenido al análisis inteligente!',
        description: 'El sistema aprenderá de tus patrones conforme uses la aplicación',
        evidence: 'Análisis disponible después de 3+ optimizaciones'
      }]
    };
  }

  getErrorAnalysis() {
    return {
      overview: { message: 'Error generando análisis. Intenta más tarde.' },
      trends: { message: 'No disponible' },
      patterns: { message: 'No disponible' },
      performance: { message: 'No disponible' },
      recommendations: [],
      insights: []
    };
  }

  /**
   * Exporta análisis completo para descarga
   */
  exportAnalysis() {
    const analysis = this.generateHistoricalAnalysis();
    const exportData = {
      analysis,
      exportDate: new Date().toISOString(),
      version: '1.0',
      metadata: {
        totalRecords: adaptiveLearning.getHistory().length,
        exportFormat: 'JSON'
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Genera reporte en texto plano
   */
  generateTextReport() {
    const analysis = this.generateHistoricalAnalysis();
    let report = `📊 REPORTE DE ANÁLISIS HISTÓRICO\n`;
    report += `Generado: ${new Date().toLocaleDateString('es-ES')}\n\n`;

    // Overview
    if (analysis.overview.totalOptimizations) {
      report += `RESUMEN GENERAL:\n`;
      report += `• Total optimizaciones: ${analysis.overview.totalOptimizations}\n`;
      report += `• Tasa de éxito: ${analysis.overview.successRate}%\n`;
      report += `• Aprovechamiento promedio: ${analysis.overview.avgUtilization}%\n\n`;
    }

    // Recomendaciones principales
    if (analysis.recommendations.length > 0) {
      report += `RECOMENDACIONES PRINCIPALES:\n`;
      analysis.recommendations.slice(0, 3).forEach((rec, i) => {
        report += `${i + 1}. ${rec.title}\n   ${rec.description}\n   Acción: ${rec.action}\n\n`;
      });
    }

    // Insights
    if (analysis.insights.length > 0) {
      report += `INSIGHTS CLAVE:\n`;
      analysis.insights.forEach(insight => {
        report += `• ${insight.title}: ${insight.description}\n`;
      });
    }

    return report;
  }
}

// Instancia singleton
export const historicalPatternAnalyzer = new HistoricalPatternAnalyzer();