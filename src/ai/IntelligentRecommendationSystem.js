/**
 * Sistema de Recomendaciones Inteligente
 * Analiza patrones históricos y sugiere optimizaciones automáticas
 * basadas en configuraciones previas exitosas
 */

export class IntelligentRecommendationSystem {
  constructor() {
    this.patterns = new Map();
    this.successfulConfigurations = [];
    this.userPreferences = new Map();
    this.contextualFactors = [];
  }

  /**
   * Genera recomendaciones inteligentes basadas en el contexto actual
   */
  async generateRecommendations(pieces, materials, config, currentResult = null) {
    console.log('🧠 Generando recomendaciones inteligentes...');
    
    try {
      // Analizar el contexto actual
      const context = this.analyzeCurrentContext(pieces, materials, config, currentResult);
      
      // Buscar patrones exitosos similares
      const similarSuccessPatterns = await this.findSimilarSuccessPatterns(context);
      
      // Generar recomendaciones categorizadas
      const recommendations = {
        immediate: await this.generateImmediateRecommendations(context, similarSuccessPatterns),
        configuration: await this.generateConfigurationRecommendations(context, similarSuccessPatterns),
        optimization: await this.generateOptimizationRecommendations(context, similarSuccessPatterns),
        workflow: await this.generateWorkflowRecommendations(context, similarSuccessPatterns),
        priority: this.prioritizeRecommendations(context)
      };

      // Aprender de la sesión actual
      this.updatePatternsFromCurrentSession(context);
      
      return {
        recommendations,
        context,
        confidence: this.calculateRecommendationConfidence(similarSuccessPatterns),
        basedOnCases: similarSuccessPatterns.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error generando recomendaciones:', error);
      return this.getFallbackRecommendations(pieces, materials, config);
    }
  }

  /**
   * Analiza el contexto actual de la optimización
   */
  analyzeCurrentContext(pieces, materials, config, result) {
    // Características básicas
    const totalPieceArea = pieces.reduce((sum, p) => sum + p.length * p.width * p.quantity, 0);
    const totalMaterialArea = materials.reduce((sum, m) => sum + m.length * m.width * m.quantity, 0);
    const utilizationRatio = totalMaterialArea > 0 ? totalPieceArea / totalMaterialArea : 0;
    
    // Análisis de distribución de tamaños
    const pieceSizes = pieces.map(p => p.length * p.width);
    const materialSizes = materials.map(m => m.length * m.width);
    
    // Patrones geométricos
    const pieceComplexity = this.analyzeGeometricComplexity(pieces);
    const materialVariety = this.analyzeMaterialVariety(materials);
    
    // Rendimiento actual (si existe resultado)
    const currentPerformance = result ? {
      utilization: result.totalUtilization || 0,
      waste: result.totalWaste || 0,
      patterns: result.patterns?.length || 0,
      efficiency: (result.totalUtilization || 0) / 100
    } : null;

    return {
      // Métricas básicas
      totalPieceArea,
      totalMaterialArea,
      utilizationRatio,
      pieceCount: pieces.reduce((sum, p) => sum + p.quantity, 0),
      materialCount: materials.reduce((sum, m) => sum + m.quantity, 0),
      
      // Análisis de tamaños
      avgPieceSize: pieceSizes.reduce((a, b) => a + b, 0) / pieceSizes.length || 0,
      avgMaterialSize: materialSizes.reduce((a, b) => a + b, 0) / materialSizes.length || 0,
      sizeVariance: this.calculateVariance(pieceSizes),
      
      // Complejidad y patrones
      pieceComplexity,
      materialVariety,
      aspectRatioSpread: this.calculateAspectRatioSpread(pieces),
      
      // Configuración
      algorithm: config.algorithm || 'bestFit',
      kerfWidth: config.kerfWidth || 3,
      margin: config.margin || 5,
      units: config.units || 'mm',
      
      // Rendimiento actual
      currentPerformance,
      
      // Contexto temporal
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      
      // Categorización del problema
      problemType: this.categorizeOptimizationProblem(pieces, materials, config),
      difficultyLevel: this.assessDifficultyLevel(pieces, materials)
    };
  }

  /**
   * Busca patrones exitosos similares en el historial
   */
  async findSimilarSuccessPatterns(context) {
    const historicalData = this.loadHistoricalOptimizations();
    
    // Filtrar solo casos exitosos (utilización > 75%)
    const successfulCases = historicalData.filter(h => 
      h.result && h.result.totalUtilization > 75
    );
    
    // Calcular similitud con casos exitosos
    const similarCases = successfulCases.map(case_ => ({
      ...case_,
      similarity: this.calculateContextSimilarity(context, case_.context),
      successScore: this.calculateSuccessScore(case_.result)
    }))
    .filter(case_ => case_.similarity > 0.6) // Solo casos similares
    .sort((a, b) => (b.similarity * b.successScore) - (a.similarity * a.successScore))
    .slice(0, 10); // Top 10 casos más relevantes

    return similarCases;
  }

  /**
   * Genera recomendaciones inmediatas
   */
  async generateImmediateRecommendations(context, similarPatterns) {
    const recommendations = [];
    
    // Recomendaciones basadas en utilización baja
    if (context.currentPerformance && context.currentPerformance.utilization < 70) {
      recommendations.push({
        type: 'immediate',
        priority: 'high',
        category: 'efficiency',
        title: 'Mejorar utilización inmediatamente',
        description: 'La utilización actual está por debajo del óptimo',
        actions: [
          'Reordenar piezas por tamaño',
          'Cambiar algoritmo a hybrid',
          'Reducir márgenes si es posible'
        ],
        expectedImprovement: '10-15% más eficiencia',
        confidence: 0.8
      });
    }
    
    // Recomendaciones basadas en patrones exitosos
    if (similarPatterns.length > 0) {
      const bestPattern = similarPatterns[0];
      const recommendedAlgorithm = bestPattern.context.algorithm;
      
      if (context.algorithm !== recommendedAlgorithm) {
        recommendations.push({
          type: 'immediate',
          priority: 'medium',
          category: 'algorithm',
          title: `Cambiar algoritmo a ${recommendedAlgorithm}`,
          description: `Casos similares tuvieron ${Math.round(bestPattern.result.totalUtilization)}% de utilización con este algoritmo`,
          actions: [`Seleccionar algoritmo ${recommendedAlgorithm}`],
          expectedImprovement: `+${Math.round(bestPattern.result.totalUtilization - (context.currentPerformance?.utilization || 70))}% utilización`,
          confidence: bestPattern.similarity
        });
      }
    }
    
    // Recomendaciones basadas en configuración de corte
    if (context.kerfWidth > 4) {
      recommendations.push({
        type: 'immediate',
        priority: 'medium',
        category: 'cutting',
        title: 'Optimizar ancho de corte',
        description: 'El ancho de corte actual puede estar reduciendo la eficiencia',
        actions: ['Revisar configuración de sierra', 'Considerar reducir a 3mm si es posible'],
        expectedImprovement: '2-5% menos desperdicio',
        confidence: 0.7
      });
    }

    return recommendations;
  }

  /**
   * Genera recomendaciones de configuración
   */
  async generateConfigurationRecommendations(context, similarPatterns) {
    const recommendations = [];
    
    // Análisis de configuración óptima basado en casos similares
    if (similarPatterns.length >= 3) {
      const optimalConfigs = this.analyzeOptimalConfigurations(similarPatterns);
      
      recommendations.push({
        type: 'configuration',
        priority: 'medium',
        category: 'settings',
        title: 'Configuración óptima sugerida',
        description: 'Basado en casos similares exitosos',
        actions: [
          `Algoritmo: ${optimalConfigs.algorithm}`,
          `Ancho de corte: ${optimalConfigs.kerfWidth}mm`,
          `Margen: ${optimalConfigs.margin}mm`
        ],
        expectedImprovement: `${Math.round(optimalConfigs.avgUtilization)}% utilización esperada`,
        confidence: optimalConfigs.confidence
      });
    }
    
    // Recomendaciones basadas en el tipo de problema
    const problemSpecificRecommendations = this.generateProblemSpecificRecommendations(context);
    recommendations.push(...problemSpecificRecommendations);

    return recommendations;
  }

  /**
   * Genera recomendaciones de optimización
   */
  async generateOptimizationRecommendations(context, similarPatterns) {
    const recommendations = [];
    
    // Recomendaciones sobre distribución de piezas
    if (context.sizeVariance > 10000) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        category: 'layout',
        title: 'Optimizar distribución de tamaños',
        description: 'Las piezas tienen tamaños muy variados',
        actions: [
          'Agrupar piezas similares',
          'Considerar materiales de diferentes tamaños',
          'Usar algoritmo híbrido para mejor distribución'
        ],
        expectedImprovement: '5-10% mejor utilización',
        confidence: 0.75
      });
    }
    
    // Recomendaciones sobre material
    const materialOptimization = this.analyzeMaterialOptimization(context, similarPatterns);
    if (materialOptimization) {
      recommendations.push(materialOptimization);
    }
    
    // Recomendaciones sobre secuencia de optimización
    if (context.pieceCount > 50) {
      recommendations.push({
        type: 'optimization',
        priority: 'low',
        category: 'workflow',
        title: 'Optimización por lotes',
        description: 'Muchas piezas pueden beneficiarse de optimización por lotes',
        actions: [
          'Dividir en lotes de 20-30 piezas',
          'Optimizar lotes similares juntos',
          'Combinar resultados eficientemente'
        ],
        expectedImprovement: 'Mejor rendimiento y resultados',
        confidence: 0.65
      });
    }

    return recommendations;
  }

  /**
   * Genera recomendaciones de flujo de trabajo
   */
  async generateWorkflowRecommendations(context, similarPatterns) {
    const recommendations = [];
    
    // Análisis de preferencias del usuario
    const userPrefs = this.getUserPreferences();
    
    if (userPrefs.preferredAlgorithm && context.algorithm !== userPrefs.preferredAlgorithm) {
      recommendations.push({
        type: 'workflow',
        priority: 'low',
        category: 'user_preference',
        title: 'Usar algoritmo preferido',
        description: `Habitualmente usas ${userPrefs.preferredAlgorithm}`,
        actions: [`Cambiar a ${userPrefs.preferredAlgorithm}`],
        expectedImprovement: 'Consistente con tus preferencias',
        confidence: 0.6
      });
    }
    
    // Recomendaciones de automatización
    const automationOpportunities = this.identifyAutomationOpportunities(context);
    recommendations.push(...automationOpportunities);

    return recommendations;
  }

  /**
   * Prioriza las recomendaciones según impacto y confianza
   */
  prioritizeRecommendations(context) {
    const factors = {
      efficiency: context.currentPerformance ? 
        (100 - context.currentPerformance.utilization) / 100 : 0.5,
      complexity: Math.min(1, context.difficultyLevel),
      urgency: context.currentPerformance && context.currentPerformance.utilization < 60 ? 1 : 0.3
    };

    return {
      factors,
      recommendation: factors.efficiency > 0.3 ? 'focus_efficiency' : 
                    factors.complexity > 0.7 ? 'simplify_approach' : 'optimize_incrementally'
    };
  }

  /**
   * Calcula la confianza de las recomendaciones
   */
  calculateRecommendationConfidence(similarPatterns) {
    if (similarPatterns.length === 0) return 0.4;
    
    const avgSimilarity = similarPatterns.reduce((sum, p) => sum + p.similarity, 0) / similarPatterns.length;
    const avgSuccess = similarPatterns.reduce((sum, p) => sum + p.successScore, 0) / similarPatterns.length;
    const dataQuality = Math.min(1, similarPatterns.length / 5);
    
    return (avgSimilarity * 0.4 + avgSuccess * 0.4 + dataQuality * 0.2);
  }

  /**
   * Actualiza los patrones aprendidos de la sesión actual
   */
  updatePatternsFromCurrentSession(context) {
    const sessionPattern = {
      context,
      timestamp: Date.now(),
      sessionId: context.sessionId
    };
    
    // Agregar al historial de patrones
    const patterns = this.loadPatterns();
    patterns.push(sessionPattern);
    
    // Mantener solo los últimos 100 patrones
    if (patterns.length > 100) {
      patterns.splice(0, patterns.length - 100);
    }
    
    this.savePatterns(patterns);
  }

  // Métodos auxiliares

  calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  analyzeGeometricComplexity(pieces) {
    const aspectRatios = pieces.map(p => Math.max(p.length, p.width) / Math.min(p.length, p.width));
    const avgAspectRatio = aspectRatios.reduce((a, b) => a + b, 0) / aspectRatios.length;
    const aspectVariance = this.calculateVariance(aspectRatios);
    
    return {
      avgAspectRatio,
      aspectVariance,
      complexity: Math.min(1, aspectVariance / 4) // Normalizado 0-1
    };
  }

  analyzeMaterialVariety(materials) {
    const uniqueSizes = new Set(materials.map(m => `${m.length}x${m.width}`));
    const sizeVariety = uniqueSizes.size / materials.length;
    
    return {
      uniqueSizes: uniqueSizes.size,
      sizeVariety,
      variety: sizeVariety > 0.7 ? 'high' : sizeVariety > 0.4 ? 'medium' : 'low'
    };
  }

  calculateAspectRatioSpread(pieces) {
    const aspectRatios = pieces.map(p => Math.max(p.length, p.width) / Math.min(p.length, p.width));
    const min = Math.min(...aspectRatios);
    const max = Math.max(...aspectRatios);
    return max - min;
  }

  categorizeOptimizationProblem(pieces, materials, config) {
    const pieceVariety = new Set(pieces.map(p => `${p.length}x${p.width}`)).size;
    const materialVariety = new Set(materials.map(m => `${m.length}x${m.width}`)).size;
    const totalPieces = pieces.reduce((sum, p) => sum + p.quantity, 0);
    
    if (totalPieces > 100) return 'large_batch';
    if (pieceVariety > 20) return 'high_variety';
    if (materialVariety > 5) return 'multi_material';
    if (totalPieces < 10) return 'small_batch';
    return 'standard';
  }

  assessDifficultyLevel(pieces, materials) {
    const factors = [
      pieces.length > 30 ? 0.3 : 0,
      materials.length > 10 ? 0.2 : 0,
      this.calculateVariance(pieces.map(p => p.length * p.width)) > 5000 ? 0.3 : 0,
      new Set(pieces.map(p => `${p.length}x${p.width}`)).size / pieces.length > 0.5 ? 0.2 : 0
    ];
    
    return factors.reduce((sum, f) => sum + f, 0);
  }

  calculateContextSimilarity(context1, context2) {
    if (!context2) return 0;
    
    const factors = [
      1 - Math.abs(context1.utilizationRatio - context2.utilizationRatio),
      1 - Math.abs(context1.avgPieceSize - context2.avgPieceSize) / Math.max(context1.avgPieceSize, context2.avgPieceSize, 1),
      context1.problemType === context2.problemType ? 1 : 0.5,
      1 - Math.abs(context1.difficultyLevel - context2.difficultyLevel)
    ];
    
    return factors.reduce((sum, f) => sum + f, 0) / factors.length;
  }

  calculateSuccessScore(result) {
    if (!result) return 0;
    return (result.totalUtilization || 0) / 100;
  }

  analyzeOptimalConfigurations(patterns) {
    const configs = patterns.map(p => p.context);
    const algorithmCounts = {};
    let totalUtilization = 0;
    let totalKerf = 0;
    let totalMargin = 0;
    
    configs.forEach(config => {
      algorithmCounts[config.algorithm] = (algorithmCounts[config.algorithm] || 0) + 1;
      totalUtilization += (config.currentPerformance?.utilization || 0);
      totalKerf += config.kerfWidth;
      totalMargin += config.margin;
    });
    
    const bestAlgorithm = Object.keys(algorithmCounts).reduce((a, b) => 
      algorithmCounts[a] > algorithmCounts[b] ? a : b
    );
    
    return {
      algorithm: bestAlgorithm,
      avgUtilization: totalUtilization / configs.length,
      kerfWidth: Math.round(totalKerf / configs.length),
      margin: Math.round(totalMargin / configs.length),
      confidence: Math.min(1, patterns.length / 5)
    };
  }

  generateProblemSpecificRecommendations(context) {
    const recommendations = [];
    
    switch (context.problemType) {
      case 'large_batch':
        recommendations.push({
          type: 'configuration',
          priority: 'medium',
          category: 'batch_processing',
          title: 'Optimización para lotes grandes',
          description: 'Configuración específica para muchas piezas',
          actions: ['Usar algoritmo hybrid', 'Aumentar tiempo de procesamiento', 'Considerar pre-agrupación'],
          expectedImprovement: 'Mejor manejo de complejidad',
          confidence: 0.7
        });
        break;
        
      case 'high_variety':
        recommendations.push({
          type: 'configuration',
          priority: 'high',
          category: 'variety_handling',
          title: 'Manejo de alta variedad',
          description: 'Muchos tamaños diferentes requieren estrategia especial',
          actions: ['Usar algoritmo maxRects', 'Aumentar tiempo de búsqueda', 'Considerar clasificación previa'],
          expectedImprovement: 'Mejor aprovechamiento de espacios',
          confidence: 0.8
        });
        break;
        
      case 'small_batch':
        recommendations.push({
          type: 'configuration',
          priority: 'low',
          category: 'small_batch',
          title: 'Optimización rápida para lote pequeño',
          description: 'Pocas piezas permiten algoritmos más simples',
          actions: ['Usar bestFit para velocidad', 'Reducir configuraciones complejas'],
          expectedImprovement: 'Resultados más rápidos',
          confidence: 0.6
        });
        break;
    }
    
    return recommendations;
  }

  analyzeMaterialOptimization(context, similarPatterns) {
    if (context.utilizationRatio > 0.9) {
      return {
        type: 'optimization',
        priority: 'high',
        category: 'material',
        title: 'Insuficiente material disponible',
        description: 'Las piezas ocupan más del 90% del material disponible',
        actions: [
          'Agregar más material del mismo tipo',
          'Considerar materiales más grandes',
          'Revisar si todas las piezas son necesarias'
        ],
        expectedImprovement: 'Evitar falla de optimización',
        confidence: 0.9
      };
    }
    
    if (context.materialVariety.variety === 'high' && context.pieceComplexity.complexity > 0.5) {
      return {
        type: 'optimization',
        priority: 'medium',
        category: 'material',
        title: 'Simplificar selección de material',
        description: 'Mucha variedad de materiales con piezas complejas puede reducir eficiencia',
        actions: [
          'Usar menos tipos de material',
          'Agrupar por tipo de material',
          'Optimizar cada grupo por separado'
        ],
        expectedImprovement: '5-15% mejor utilización',
        confidence: 0.7
      };
    }
    
    return null;
  }

  identifyAutomationOpportunities(context) {
    const opportunities = [];
    
    // Si el usuario repite configuraciones similares
    const recentConfigs = this.getRecentConfigurations();
    const similarConfigCount = recentConfigs.filter(config => 
      Math.abs(config.kerfWidth - context.kerfWidth) < 1 &&
      Math.abs(config.margin - context.margin) < 2 &&
      config.algorithm === context.algorithm
    ).length;
    
    if (similarConfigCount >= 3) {
      opportunities.push({
        type: 'workflow',
        priority: 'low',
        category: 'automation',
        title: 'Guardar como configuración predeterminada',
        description: 'Has usado configuraciones similares varias veces',
        actions: ['Crear preset con configuración actual', 'Usar configuración rápida'],
        expectedImprovement: 'Ahorro de tiempo en configuración',
        confidence: 0.8
      });
    }
    
    return opportunities;
  }

  getUserPreferences() {
    const history = this.loadHistoricalOptimizations();
    const algorithms = {};
    
    history.forEach(h => {
      if (h.context && h.context.algorithm) {
        algorithms[h.context.algorithm] = (algorithms[h.context.algorithm] || 0) + 1;
      }
    });
    
    const preferredAlgorithm = Object.keys(algorithms).length > 0 ? 
      Object.keys(algorithms).reduce((a, b) => algorithms[a] > algorithms[b] ? a : b) : null;
    
    return {
      preferredAlgorithm,
      totalOptimizations: history.length,
      averageUtilization: history.reduce((sum, h) => sum + (h.result?.totalUtilization || 0), 0) / history.length || 0
    };
  }

  getFallbackRecommendations(pieces, materials, config) {
    return {
      recommendations: {
        immediate: [{
          type: 'immediate',
          priority: 'medium',
          category: 'basic',
          title: 'Verificar configuración básica',
          description: 'Asegurar que todos los parámetros sean correctos',
          actions: ['Revisar dimensiones', 'Verificar unidades', 'Comprobar algoritmo'],
          expectedImprovement: 'Configuración correcta',
          confidence: 0.5
        }],
        configuration: [],
        optimization: [],
        workflow: [],
        priority: { recommendation: 'basic_setup' }
      },
      context: { problemType: 'unknown', difficultyLevel: 0.5 },
      confidence: 0.3,
      basedOnCases: 0,
      timestamp: new Date().toISOString()
    };
  }

  // Métodos de persistencia
  loadHistoricalOptimizations() {
    return JSON.parse(localStorage.getItem('ai_cutting_history') || '[]');
  }

  loadPatterns() {
    return JSON.parse(localStorage.getItem('ai_recommendation_patterns') || '[]');
  }

  savePatterns(patterns) {
    localStorage.setItem('ai_recommendation_patterns', JSON.stringify(patterns));
  }

  getRecentConfigurations(limit = 10) {
    const history = this.loadHistoricalOptimizations();
    return history.slice(-limit).map(h => h.context).filter(Boolean);
  }

  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    return this.sessionId;
  }
}

// Instancia global
export const intelligentRecommendationSystem = new IntelligentRecommendationSystem();