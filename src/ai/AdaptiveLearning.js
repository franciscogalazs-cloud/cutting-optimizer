/**
 * Sistema de Aprendizaje Adaptativo para Cutting Optimizer
 * Aprende de las optimizaciones exitosas y patrones del usuario
 */

export class AdaptiveLearning {
  constructor() {
    this.storageKey = 'cutting-ai-learning-data';
    this.minDataPoints = 5; // Mínimo de datos para hacer predicciones
    this.maxHistorySize = 1000; // Límite de registros históricos
  }

  /**
   * Registra una optimización exitosa para aprendizaje
   */
  recordOptimization(input, result, userFeedback = null) {
    try {
      const record = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        input: this.extractFeatures(input),
        result: this.extractResultMetrics(result),
        userFeedback: userFeedback,
        success: this.determineSuccess(result, userFeedback),
        context: this.extractContextualInfo(input, result)
      };

      this.saveRecord(record);
      this.updateUserPreferences(record);
      this.updatePerformanceBaselines(record);
      console.log('🤖 AI: Registrada optimización para aprendizaje', record);
      
      return record;
    } catch (error) {
      console.warn('Error registrando optimización:', error);
      return null;
    }
  }

  /**
   * Aprende y adapta recomendaciones basado en el comportamiento del usuario
   */
  async adaptToUserBehavior(currentInput, previousResults = []) {
    try {
      const userProfile = this.buildUserProfile();
      const contextualPreferences = this.analyzeContextualPreferences(currentInput);
      const performancePatterns = this.identifyPerformancePatterns();
      
      const adaptations = {
        recommendedAlgorithm: this.getPreferredAlgorithm(userProfile, contextualPreferences),
        suggestedConfig: this.getSuggestedConfiguration(userProfile, currentInput),
        personalizedTips: this.generatePersonalizedTips(userProfile, performancePatterns),
        difficultyAdjustment: this.calculateDifficultyAdjustment(userProfile),
        confidenceBoost: this.calculateConfidenceBoost(userProfile, currentInput)
      };

      return {
        adaptations,
        userProfile,
        learningStats: this.getLearningStatistics(),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error en adaptación:', error);
      return this.getDefaultAdaptations();
    }
  }

  /**
   * Construye un perfil del usuario basado en su historial
   */
  buildUserProfile() {
    const history = this.loadLearningData();
    if (history.length === 0) return this.getDefaultUserProfile();
    
    const recentHistory = history.slice(-50); // Últimas 50 optimizaciones
    
    return {
      experience: this.calculateExperienceLevel(history),
      preferences: this.extractUserPreferences(recentHistory),
      performance: this.analyzeUserPerformance(recentHistory),
      patterns: this.identifyUserPatterns(recentHistory),
      adaptation: this.calculateAdaptationRate(history)
    };
  }

  /**
   * Calcula el nivel de experiencia del usuario
   */
  calculateExperienceLevel(history) {
    const totalOptimizations = history.length;
    const successRate = history.filter(h => h.success).length / totalOptimizations;
    const avgUtilization = history.reduce((sum, h) => sum + (h.result.utilization || 0), 0) / totalOptimizations;
    
    let level = 'beginner';
    let score = 0;
    
    // Puntuación basada en cantidad
    if (totalOptimizations >= 50) score += 30;
    else if (totalOptimizations >= 20) score += 20;
    else if (totalOptimizations >= 10) score += 10;
    
    // Puntuación basada en éxito
    if (successRate >= 0.8) score += 30;
    else if (successRate >= 0.6) score += 20;
    else if (successRate >= 0.4) score += 10;
    
    // Puntuación basada en eficiencia
    if (avgUtilization >= 80) score += 40;
    else if (avgUtilization >= 70) score += 30;
    else if (avgUtilization >= 60) score += 20;
    else if (avgUtilization >= 50) score += 10;
    
    if (score >= 80) level = 'expert';
    else if (score >= 60) level = 'advanced';
    else if (score >= 30) level = 'intermediate';
    
    return {
      level,
      score,
      totalOptimizations,
      successRate: Math.round(successRate * 100),
      avgUtilization: Math.round(avgUtilization * 10) / 10
    };
  }

  /**
   * Extrae preferencias del usuario
   */
  extractUserPreferences(history) {
    const algorithms = {};
    const configPatterns = {
      kerfWidths: [],
      margins: [],
      units: {}
    };
    
    history.forEach(record => {
      const config = record.input.config || {};
      
      // Contar algoritmos usados
      if (config.algorithm) {
        algorithms[config.algorithm] = (algorithms[config.algorithm] || 0) + 1;
      }
      
      // Recopilar patrones de configuración
      if (config.kerfWidth) configPatterns.kerfWidths.push(config.kerfWidth);
      if (config.margin) configPatterns.margins.push(config.margin);
      if (config.units) {
        configPatterns.units[config.units] = (configPatterns.units[config.units] || 0) + 1;
      }
    });
    
    return {
      preferredAlgorithm: Object.keys(algorithms).reduce((a, b) => 
        algorithms[a] > algorithms[b] ? a : b, null),
      algorithmDistribution: algorithms,
      avgKerfWidth: this.average(configPatterns.kerfWidths),
      avgMargin: this.average(configPatterns.margins),
      preferredUnits: Object.keys(configPatterns.units).reduce((a, b) => 
        configPatterns.units[a] > configPatterns.units[b] ? a : b, 'mm')
    };
  }

  /**
   * Analiza el rendimiento del usuario
   */
  analyzeUserPerformance(history) {
    const utilizations = history.map(h => h.result.utilization || 0);
    const wastes = history.map(h => h.result.waste || 0);
    
    return {
      avgUtilization: this.average(utilizations),
      bestUtilization: Math.max(...utilizations),
      utilizationTrend: this.calculateTrend(utilizations),
      avgWaste: this.average(wastes),
      wasteTrend: this.calculateTrend(wastes),
      consistencyScore: this.calculateConsistency(utilizations),
      improvementRate: this.calculateImprovementRate(utilizations)
    };
  }

  /**
   * Identifica patrones en el comportamiento del usuario
   */
  identifyUserPatterns(history) {
    return {
      workingSessions: this.identifyWorkingSessions(history),
      projectTypes: this.identifyProjectTypes(history),
      complexityPreference: this.analyzeComplexityPreference(history),
      timePatterns: this.analyzeTimePatterns(history),
      feedbackPatterns: this.analyzeFeedbackPatterns(history)
    };
  }

  /**
   * Obtiene el algoritmo preferido basado en contexto
   */
  getPreferredAlgorithm(userProfile, context) {
    const { preferences, performance } = userProfile;
    
    // Si el usuario es experto, respetar su preferencia
    if (userProfile.experience.level === 'expert' && preferences.preferredAlgorithm) {
      return {
        algorithm: preferences.preferredAlgorithm,
        reason: 'Basado en tu experiencia y preferencia',
        confidence: 0.9
      };
    }
    
    // Para usuarios menos experimentados, recomendar basado en contexto
    const contextScore = this.calculateContextScore(context);
    
    if (contextScore.complexity > 0.7) {
      return {
        algorithm: 'hybrid',
        reason: 'Configuración compleja requiere algoritmo avanzado',
        confidence: 0.8
      };
    } else if (contextScore.pieceCount > 50) {
      return {
        algorithm: 'maxRects',
        reason: 'Muchas piezas se benefician de MaxRects',
        confidence: 0.75
      };
    } else {
      return {
        algorithm: preferences.preferredAlgorithm || 'bestFit',
        reason: 'Basado en tu historial de uso',
        confidence: 0.7
      };
    }
  }

  /**
   * Genera configuración sugerida personalizada
   */
  getSuggestedConfiguration(userProfile, currentInput) {
    const { preferences, performance } = userProfile;
    
    const suggestions = {
      kerfWidth: preferences.avgKerfWidth || 3,
      margin: preferences.avgMargin || 5,
      units: preferences.preferredUnits || 'mm',
      algorithm: this.getPreferredAlgorithm(userProfile, currentInput).algorithm
    };
    
    // Ajustar basado en rendimiento histórico
    if (performance.avgUtilization < 70) {
      suggestions.optimizationFocus = 'efficiency';
      suggestions.additionalTime = true;
    } else if (performance.consistencyScore < 0.7) {
      suggestions.optimizationFocus = 'consistency';
      suggestions.conservativeSettings = true;
    }
    
    return suggestions;
  }

  /**
   * Genera tips personalizados
   */
  generatePersonalizedTips(userProfile, patterns) {
    const tips = [];
    const { experience, performance } = userProfile;
    
    if (experience.level === 'beginner') {
      tips.push({
        category: 'basic',
        tip: 'Comienza con piezas simples y materiales estándar',
        priority: 'high'
      });
      tips.push({
        category: 'learning',
        tip: 'Observa cómo diferentes algoritmos afectan el resultado',
        priority: 'medium'
      });
    }
    
    if (performance.avgUtilization < 75) {
      tips.push({
        category: 'efficiency',
        tip: 'Intenta agrupar piezas de tamaños similares',
        priority: 'high'
      });
    }
    
    if (performance.consistencyScore < 0.6) {
      tips.push({
        category: 'consistency',
        tip: 'Mantén configuraciones similares para proyectos parecidos',
        priority: 'medium'
      });
    }
    
    return tips;
  }

  /**
   * Extrae información contextual
   */
  extractContextualInfo(input, result) {
    return {
      sessionDuration: this.calculateSessionDuration(),
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      projectComplexity: this.assessProjectComplexity(input),
      userSatisfaction: this.inferUserSatisfaction(result),
      performanceCategory: this.categorizePerformance(result)
    };
  }

  /**
   * Actualiza preferencias del usuario
   */
  updateUserPreferences(record) {
    const preferences = JSON.parse(localStorage.getItem('ai_user_preferences') || '{}');
    
    // Actualizar contadores de algoritmos
    const algorithm = record.input.config?.algorithm;
    if (algorithm) {
      preferences.algorithms = preferences.algorithms || {};
      preferences.algorithms[algorithm] = (preferences.algorithms[algorithm] || 0) + 1;
    }
    
    // Actualizar configuraciones exitosas
    if (record.success) {
      preferences.successfulConfigs = preferences.successfulConfigs || [];
      preferences.successfulConfigs.push({
        config: record.input.config,
        utilization: record.result.utilization,
        timestamp: record.timestamp
      });
      
      // Mantener solo las últimas 20 configuraciones exitosas
      if (preferences.successfulConfigs.length > 20) {
        preferences.successfulConfigs = preferences.successfulConfigs.slice(-20);
      }
    }
    
    localStorage.setItem('ai_user_preferences', JSON.stringify(preferences));
  }

  /**
   * Actualiza líneas base de rendimiento
   */
  updatePerformanceBaselines(record) {
    const baselines = JSON.parse(localStorage.getItem('ai_performance_baselines') || '{}');
    
    const projectType = this.categorizeProject(record.input);
    baselines[projectType] = baselines[projectType] || {
      utilizationHistory: [],
      wasteHistory: [],
      bestUtilization: 0
    };
    
    const baseline = baselines[projectType];
    baseline.utilizationHistory.push(record.result.utilization || 0);
    baseline.wasteHistory.push(record.result.waste || 0);
    baseline.bestUtilization = Math.max(baseline.bestUtilization, record.result.utilization || 0);
    
    // Mantener solo los últimos 50 registros por tipo
    if (baseline.utilizationHistory.length > 50) {
      baseline.utilizationHistory = baseline.utilizationHistory.slice(-50);
      baseline.wasteHistory = baseline.wasteHistory.slice(-50);
    }
    
    localStorage.setItem('ai_performance_baselines', JSON.stringify(baselines));
  }

  // Métodos auxiliares mejorados

  calculateTrend(values) {
    if (values.length < 3) return 'insufficient_data';
    
    const recent = values.slice(-5);
    const earlier = values.slice(0, -5);
    
    if (earlier.length === 0) return 'stable';
    
    const recentAvg = this.average(recent);
    const earlierAvg = this.average(earlier);
    const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    
    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  calculateConsistency(values) {
    if (values.length < 3) return 0.5;
    
    const mean = this.average(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 1;
    
    return Math.max(0, Math.min(1, 1 - coefficientOfVariation));
  }

  calculateImprovementRate(values) {
    if (values.length < 5) return 0;
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = this.average(firstHalf);
    const secondAvg = this.average(secondHalf);
    
    return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  }

  getDefaultAdaptations() {
    return {
      adaptations: {
        recommendedAlgorithm: { algorithm: 'bestFit', reason: 'Configuración por defecto', confidence: 0.5 },
        suggestedConfig: { kerfWidth: 3, margin: 5, units: 'mm', algorithm: 'bestFit' },
        personalizedTips: [],
        difficultyAdjustment: 0,
        confidenceBoost: 0
      },
      userProfile: this.getDefaultUserProfile(),
      learningStats: { totalOptimizations: 0, successRate: 0, avgUtilization: 0 },
      timestamp: new Date().toISOString()
    };
  }

  getDefaultUserProfile() {
    return {
      experience: { level: 'beginner', score: 0, totalOptimizations: 0, successRate: 0, avgUtilization: 0 },
      preferences: { preferredAlgorithm: null, algorithmDistribution: {}, avgKerfWidth: 3, avgMargin: 5, preferredUnits: 'mm' },
      performance: { avgUtilization: 0, bestUtilization: 0, utilizationTrend: 'stable', avgWaste: 0, wasteTrend: 'stable', consistencyScore: 0.5, improvementRate: 0 },
      patterns: { workingSessions: [], projectTypes: [], complexityPreference: 'medium', timePatterns: {}, feedbackPatterns: {} },
      adaptation: 0.5
    };
  }

  average(values) {
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  /**
   * Extrae características relevantes del input
   */
  extractFeatures(input) {
    const { pieces, materials, config } = input;
    
    return {
      // Características de las piezas
      totalPieces: pieces.reduce((sum, p) => sum + p.quantity, 0),
      avgPieceSize: this.calculateAvgPieceSize(pieces),
      pieceSizeVariance: this.calculatePieceSizeVariance(pieces),
      hasLargePieces: pieces.some(p => p.length > 1000 || p.width > 1000),
      hasSmallPieces: pieces.some(p => p.length < 100 && p.width < 100),
      
      // Características de los materiales
      totalMaterials: materials.reduce((sum, m) => sum + m.quantity, 0),
      avgMaterialSize: this.calculateAvgMaterialSize(materials),
      materialSizeVariance: this.calculateMaterialSizeVariance(materials),
      
      // Configuración
      kerfWidth: config.kerfWidth || 3,
      margin: config.margin || 5,
      allowRotation: config.allowRotation || false,
      units: config.units || 'cm',
      
      // Ratios calculados
      piecesToMaterialRatio: this.calculatePiecesToMaterialRatio(pieces, materials),
      avgPieceToMaterialSizeRatio: this.calculateAvgPieceToMaterialSizeRatio(pieces, materials)
    };
  }

  /**
   * Extrae métricas del resultado
   */
  extractResultMetrics(result) {
    return {
      totalUtilization: result.totalUtilization || 0,
      totalWaste: result.totalWaste || 0,
      patternsCount: result.patterns?.length || 0,
      algorithm: result.algorithm || 'unknown',
      executionTime: result.executionTime || 0,
      successfulPlacements: result.successfulPlacements || 0,
      failedPlacements: result.failedPlacements || 0
    };
  }

  /**
   * Determina si una optimización fue exitosa
   */
  determineSuccess(result, userFeedback) {
    if (userFeedback !== null) {
      return userFeedback >= 0.7; // 70% o más de satisfacción
    }
    
    // Criterios automáticos de éxito
    const utilization = result.totalUtilization || 0;
    const hasFailedPlacements = (result.failedPlacements || 0) > 0;
    
    return utilization >= 0.75 && !hasFailedPlacements;
  }

  /**
   * Predice la configuración óptima basada en historial
   */
  predictOptimalConfig(currentInput) {
    const history = this.getHistory();
    if (history.length < this.minDataPoints) {
      return this.getDefaultRecommendations();
    }

    const currentFeatures = this.extractFeatures(currentInput);
    const similarCases = this.findSimilarCases(currentFeatures, history);
    
    if (similarCases.length === 0) {
      return this.getDefaultRecommendations();
    }

    return this.generateRecommendations(similarCases);
  }

  /**
   * Encuentra casos similares en el historial
   */
  findSimilarCases(targetFeatures, history) {
    const successfulCases = history.filter(record => record.success);
    
    return successfulCases
      .map(record => ({
        ...record,
        similarity: this.calculateSimilarity(targetFeatures, record.input)
      }))
      .filter(record => record.similarity > 0.6) // 60% de similitud mínima
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10); // Top 10 casos más similares
  }

  /**
   * Calcula similitud entre dos conjuntos de características
   */
  calculateSimilarity(features1, features2) {
    const weights = {
      totalPieces: 0.2,
      avgPieceSize: 0.15,
      totalMaterials: 0.15,
      avgMaterialSize: 0.15,
      piecesToMaterialRatio: 0.1,
      kerfWidth: 0.05,
      margin: 0.05,
      allowRotation: 0.15
    };

    let totalWeight = 0;
    let weightedSimilarity = 0;

    for (const [key, weight] of Object.entries(weights)) {
      if (features1[key] !== undefined && features2[key] !== undefined) {
        const similarity = this.calculateFeatureSimilarity(features1[key], features2[key], key);
        weightedSimilarity += similarity * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? weightedSimilarity / totalWeight : 0;
  }

  /**
   * Calcula similitud para una característica específica
   */
  calculateFeatureSimilarity(value1, value2, featureType) {
    if (typeof value1 === 'boolean' && typeof value2 === 'boolean') {
      return value1 === value2 ? 1 : 0;
    }

    if (typeof value1 === 'number' && typeof value2 === 'number') {
      const diff = Math.abs(value1 - value2);
      const avg = (value1 + value2) / 2;
      if (avg === 0) return value1 === value2 ? 1 : 0;
      return Math.max(0, 1 - (diff / avg));
    }

    if (typeof value1 === 'string' && typeof value2 === 'string') {
      return value1 === value2 ? 1 : 0;
    }

    return 0;
  }

  /**
   * Genera recomendaciones basadas en casos similares
   */
  generateRecommendations(similarCases) {
    if (similarCases.length === 0) {
      return this.getDefaultRecommendations();
    }

    // Promedios ponderados por similitud
    const avgUtilization = this.calculateWeightedAverage(
      similarCases, 
      'result.totalUtilization', 
      'similarity'
    );

    const bestAlgorithm = this.getMostFrequent(
      similarCases.map(c => c.result.algorithm)
    );

    const avgKerf = this.calculateWeightedAverage(
      similarCases,
      'input.kerfWidth',
      'similarity'
    );

    const avgMargin = this.calculateWeightedAverage(
      similarCases,
      'input.margin',
      'similarity'
    );

    const shouldAllowRotation = this.getMostFrequent(
      similarCases.map(c => c.input.allowRotation)
    );

    return {
      expectedUtilization: Math.round(avgUtilization * 100) / 100,
      recommendedAlgorithm: bestAlgorithm,
      recommendedKerf: Math.round(avgKerf * 10) / 10,
      recommendedMargin: Math.round(avgMargin * 10) / 10,
      recommendedRotation: shouldAllowRotation,
      confidence: Math.min(1, similarCases.length / 10), // Confianza basada en cantidad de casos
      basedOnCases: similarCases.length,
      suggestions: this.generateTextualSuggestions(similarCases)
    };
  }

  /**
   * Genera sugerencias textuales para el usuario
   */
  generateTextualSuggestions(similarCases) {
    const suggestions = [];
    
    const avgUtilization = this.calculateWeightedAverage(
      similarCases, 
      'result.totalUtilization', 
      'similarity'
    );

    if (avgUtilization > 0.85) {
      suggestions.push('🎯 Casos similares lograron excelente aprovechamiento (+85%)');
    } else if (avgUtilization > 0.75) {
      suggestions.push('✅ Casos similares tuvieron buen aprovechamiento (75-85%)');
    } else {
      suggestions.push('⚠️ Casos similares tuvieron aprovechamiento moderado (<75%)');
    }

    const bestAlgorithm = this.getMostFrequent(
      similarCases.map(c => c.result.algorithm)
    );
    
    suggestions.push(`🤖 Algoritmo más exitoso: ${bestAlgorithm}`);

    const rotationCases = similarCases.filter(c => c.input.allowRotation);
    if (rotationCases.length > similarCases.length * 0.7) {
      suggestions.push('🔄 Permitir rotación mejora resultados en casos similares');
    }

    return suggestions;
  }

  // Métodos auxiliares de cálculo
  calculateAvgPieceSize(pieces) {
    if (pieces.length === 0) return 0;
    const totalArea = pieces.reduce((sum, p) => sum + (p.length * p.width * p.quantity), 0);
    const totalQuantity = pieces.reduce((sum, p) => sum + p.quantity, 0);
    return totalQuantity > 0 ? totalArea / totalQuantity : 0;
  }

  calculatePieceSizeVariance(pieces) {
    if (pieces.length <= 1) return 0;
    const sizes = pieces.map(p => p.length * p.width);
    const avg = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avg, 2), 0) / sizes.length;
    return Math.sqrt(variance);
  }

  calculateAvgMaterialSize(materials) {
    if (materials.length === 0) return 0;
    const totalArea = materials.reduce((sum, m) => sum + (m.length * m.width * m.quantity), 0);
    const totalQuantity = materials.reduce((sum, m) => sum + m.quantity, 0);
    return totalQuantity > 0 ? totalArea / totalQuantity : 0;
  }

  calculateMaterialSizeVariance(materials) {
    if (materials.length <= 1) return 0;
    const sizes = materials.map(m => m.length * m.width);
    const avg = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avg, 2), 0) / sizes.length;
    return Math.sqrt(variance);
  }

  calculatePiecesToMaterialRatio(pieces, materials) {
    const totalPieces = pieces.reduce((sum, p) => sum + p.quantity, 0);
    const totalMaterials = materials.reduce((sum, m) => sum + m.quantity, 0);
    return totalMaterials > 0 ? totalPieces / totalMaterials : 0;
  }

  calculateAvgPieceToMaterialSizeRatio(pieces, materials) {
    const avgPieceSize = this.calculateAvgPieceSize(pieces);
    const avgMaterialSize = this.calculateAvgMaterialSize(materials);
    return avgMaterialSize > 0 ? avgPieceSize / avgMaterialSize : 0;
  }

  calculateWeightedAverage(data, path, weightPath) {
    let totalValue = 0;
    let totalWeight = 0;

    data.forEach(item => {
      const value = this.getNestedValue(item, path);
      const weight = this.getNestedValue(item, weightPath);
      
      if (typeof value === 'number' && typeof weight === 'number') {
        totalValue += value * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? totalValue / totalWeight : 0;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => 
      current && current[key] !== undefined ? current[key] : undefined, obj
    );
  }

  getMostFrequent(array) {
    const frequency = {};
    array.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    
    return Object.keys(frequency).reduce((a, b) => 
      frequency[a] > frequency[b] ? a : b
    );
  }

  /**
   * Recomendaciones por defecto cuando no hay suficientes datos
   */
  getDefaultRecommendations() {
    return {
      expectedUtilization: 0.75,
      recommendedAlgorithm: 'maxRects',
      recommendedKerf: 3,
      recommendedMargin: 5,
      recommendedRotation: true,
      confidence: 0,
      basedOnCases: 0,
      suggestions: [
        '📚 Aún no hay suficientes datos para recomendaciones personalizadas',
        '🚀 Usa estas configuraciones estándar y el sistema aprenderá de tus resultados',
        '💡 Después de 5 optimizaciones tendrás sugerencias inteligentes'
      ]
    };
  }

  /**
   * Guarda un registro en el historial
   */
  saveRecord(record) {
    const history = this.getHistory();
    history.push(record);

    // Mantener solo los registros más recientes
    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize);
    }

    localStorage.setItem(this.storageKey, JSON.stringify(history));
  }

  /**
   * Obtiene el historial de aprendizaje
   */
  getHistory() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Error cargando historial de IA:', error);
      return [];
    }
  }

  /**
   * Limpia el historial de aprendizaje
   */
  clearHistory() {
    localStorage.removeItem(this.storageKey);
    console.log('🤖 AI: Historial de aprendizaje limpiado');
  }

  /**
   * Obtiene estadísticas del sistema de aprendizaje
   */
  getStats() {
    const history = this.getHistory();
    const successfulOptimizations = history.filter(r => r.success);
    
    return {
      totalOptimizations: history.length,
      successfulOptimizations: successfulOptimizations.length,
      successRate: history.length > 0 ? successfulOptimizations.length / history.length : 0,
      avgUtilization: successfulOptimizations.length > 0 
        ? successfulOptimizations.reduce((sum, r) => sum + r.result.totalUtilization, 0) / successfulOptimizations.length 
        : 0,
      canMakePredictions: history.length >= this.minDataPoints,
      oldestRecord: history.length > 0 ? history[0].timestamp : null,
      newestRecord: history.length > 0 ? history[history.length - 1].timestamp : null
    };
  }
}

// Instancia singleton para uso global
export const adaptiveLearning = new AdaptiveLearning();