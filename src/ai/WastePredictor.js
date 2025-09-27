/**
 * Predictor de Desperdicio Inteligente
 * Predice eficiencia y desperdicio antes de ejecutar la optimización
 */

import { adaptiveLearning } from './AdaptiveLearning.js';
import { advancedMLPredictor } from './AdvancedMLPredictor.js';

export class WastePredictor {
  constructor() {
    this.historicalAccuracy = 0.85; // Precisión inicial estimada
    this.confidenceThreshold = 0.6;
  }

  /**
   * Predice el resultado de una optimización antes de ejecutarla
   */
  async predictOptimization(pieces, materials, config) {
    try {
      const input = { pieces, materials, config };
      const features = this.extractPredictionFeatures(input);
      const historicalData = adaptiveLearning.getHistory();
      
      if (historicalData.length < 3) {
        return this.getBasicPrediction(features);
      }

      const prediction = await this.generateAdvancedPrediction(features, historicalData);
      const suggestions = this.generateOptimizationSuggestions(features, prediction);
      
      return {
        ...prediction,
        suggestions,
        confidence: this.calculatePredictionConfidence(features, historicalData),
        basedOnData: historicalData.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn('Error en predicción:', error);
      return this.getBasicPrediction(this.extractPredictionFeatures({ pieces, materials, config }));
    }
  }

  /**
   * Extrae características para predicción
   */
  extractPredictionFeatures(input) {
    const { pieces, materials, config } = input;
    
    // Áreas totales
    const totalPieceArea = pieces.reduce((sum, p) => sum + (p.length * p.width * p.quantity), 0);
    const totalMaterialArea = materials.reduce((sum, m) => sum + (m.length * m.width * m.quantity), 0);
    
    // Características geométricas
    const avgPieceAspectRatio = this.calculateAvgAspectRatio(pieces);
    const avgMaterialAspectRatio = this.calculateAvgAspectRatio(materials);
    const sizeComplexity = this.calculateSizeComplexity(pieces);
    
    // Métricas de ajuste
    const theoreticalUtilization = totalMaterialArea > 0 ? totalPieceArea / totalMaterialArea : 0;
    const packingDifficulty = this.calculatePackingDifficulty(pieces, materials);
    
    return {
      totalPieceArea,
      totalMaterialArea,
      theoreticalUtilization,
      packingDifficulty,
      avgPieceAspectRatio,
      avgMaterialAspectRatio,
      sizeComplexity,
      kerfImpact: this.calculateKerfImpact(pieces, config.kerfWidth || 3),
      marginImpact: this.calculateMarginImpact(materials, config.margin || 5),
      rotationBenefit: this.estimateRotationBenefit(pieces, materials, config.allowRotation),
      pieceCount: pieces.reduce((sum, p) => sum + p.quantity, 0),
      materialCount: materials.reduce((sum, m) => sum + m.quantity, 0),
      avgPieceSize: totalPieceArea / Math.max(1, pieces.reduce((sum, p) => sum + p.quantity, 0)),
      avgMaterialSize: totalMaterialArea / Math.max(1, materials.reduce((sum, m) => sum + m.quantity, 0))
    };
  }

  /**
   * Genera predicción avanzada basada en datos históricos
   */
  async generateAdvancedPrediction(features, historicalData) {
    const similarCases = this.findSimilarHistoricalCases(features, historicalData);
    
    if (similarCases.length === 0) {
      return this.getBasicPrediction(features);
    }

    // Predicción basada en casos similares
    const predictedUtilization = this.predictUtilizationFromHistory(features, similarCases);
    const predictedWaste = features.totalMaterialArea * (1 - predictedUtilization);
    const predictedPatterns = this.predictPatternCount(features, similarCases);
    const estimatedTime = this.predictExecutionTime(features, similarCases);
    
    return {
      predictedUtilization: Math.round(predictedUtilization * 1000) / 10, // Porcentaje con 1 decimal
      predictedWaste: Math.round(predictedWaste),
      predictedWastePercentage: Math.round((1 - predictedUtilization) * 1000) / 10,
      predictedPatterns,
      estimatedExecutionTime: estimatedTime,
      utilizationRange: this.calculateUtilizationRange(similarCases),
      wasteRange: this.calculateWasteRange(features.totalMaterialArea, similarCases),
      algorithm: this.predictBestAlgorithm(similarCases),
      riskFactors: this.identifyRiskFactors(features, similarCases)
    };
  }

  /**
   * Encuentra casos históricos similares
   */
  findSimilarHistoricalCases(targetFeatures, historicalData) {
    return historicalData
      .filter(record => record.success) // Solo casos exitosos
      .map(record => {
        const recordFeatures = this.extractPredictionFeatures(record.input);
        return {
          ...record,
          similarity: this.calculateFeatureSimilarity(targetFeatures, recordFeatures)
        };
      })
      .filter(record => record.similarity > this.confidenceThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 15); // Top 15 casos más similares
  }

  /**
   * Predicción avanzada usando Machine Learning sofisticado
   */
  async predictAdvanced(pieces, materials, config) {
    try {
      console.log('🤖 Ejecutando predicción avanzada con ML...');
      
      // Cargar datos históricos para el ML
      const historicalData = this.loadHistoricalData().slice(-100); // Últimos 100 casos
      
      // Usar el predictor ML avanzado
      const mlPrediction = await advancedMLPredictor.predictWasteAdvanced(
        pieces, materials, config, historicalData
      );
      
      // Combinar con predicción tradicional para mayor robustez
      const traditionalPrediction = this.predictWaste(pieces, materials, config);
      
      // Combinar predicciones con pesos adaptativos
      const combinedResult = this.combineTraditionalAndML(traditionalPrediction, mlPrediction);
      
      // Agregar información específica del ML
      return {
        ...combinedResult,
        mlInsights: mlPrediction.insights,
        modelAccuracy: mlPrediction.modelAccuracy,
        predictionMethod: 'advanced_ml',
        individualPredictions: {
          traditional: traditionalPrediction,
          ml: mlPrediction
        },
        advancedFeatures: {
          useML: true,
          confidence: mlPrediction.confidence,
          modelConsensus: this.calculateModelConsensus(mlPrediction.predictions)
        }
      };
      
    } catch (error) {
      console.warn('Error en predicción avanzada, usando método tradicional:', error);
      return this.predictWaste(pieces, materials, config);
    }
  }

  /**
   * Combina predicción tradicional con ML
   */
  combineTraditionalAndML(traditional, ml) {
    // Calcular pesos basados en confianza
    const mlWeight = ml.confidence;
    const traditionalWeight = traditional.confidence || 0.7;
    const totalWeight = mlWeight + traditionalWeight;
    
    const mlNormWeight = mlWeight / totalWeight;
    const tradNormWeight = traditionalWeight / totalWeight;
    
    // Combinar predicciones principales
    const combinedUtilization = (
      traditional.predictedUtilization * tradNormWeight +
      ml.predictedUtilization * mlNormWeight
    );
    
    const combinedWaste = (
      traditional.predictedWaste * tradNormWeight +
      ml.predictedWaste * mlNormWeight
    );
    
    // Combinar rangos
    const combinedWasteRange = {
      min: Math.min(traditional.wasteRange?.min || combinedWaste * 0.8, ml.wasteRange.min),
      max: Math.max(traditional.wasteRange?.max || combinedWaste * 1.2, ml.wasteRange.max)
    };
    
    return {
      predictedUtilization: Math.round(combinedUtilization * 10) / 10,
      predictedWaste: Math.round(combinedWaste),
      predictedWastePercentage: Math.round((100 - combinedUtilization) * 10) / 10,
      predictedPatterns: traditional.predictedPatterns,
      estimatedExecutionTime: traditional.estimatedExecutionTime,
      utilizationRange: traditional.utilizationRange,
      wasteRange: combinedWasteRange,
      algorithm: traditional.algorithm,
      riskFactors: [...(traditional.riskFactors || []), ...(ml.insights || [])],
      confidence: Math.max(traditional.confidence || 0.7, ml.confidence),
      suggestions: this.combineTraditionalAndMLSuggestions(traditional, ml),
      basedOnData: traditional.basedOnData,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Combina sugerencias de ambos métodos
   */
  combineTraditionalAndMLSuggestions(traditional, ml) {
    const suggestions = [...(traditional.suggestions || [])];
    
    // Agregar insights del ML como sugerencias
    ml.insights?.forEach(insight => {
      if (insight.suggestion) {
        suggestions.push({
          type: insight.type,
          message: insight.suggestion,
          impact: insight.type === 'warning' ? 'medium' : 'low',
          source: 'ml_analysis'
        });
      }
    });
    
    // Remover duplicados
    const uniqueSuggestions = suggestions.filter((suggestion, index, arr) => 
      arr.findIndex(s => s.message === suggestion.message) === index
    );
    
    return uniqueSuggestions;
  }

  /**
   * Calcula consenso entre modelos ML
   */
  calculateModelConsensus(predictions) {
    const values = Object.values(predictions);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Consenso alto = baja desviación estándar relativa
    const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 1;
    const consensus = Math.max(0, Math.min(1, 1 - coefficientOfVariation));
    
    return {
      consensus: Math.round(consensus * 100),
      agreement: consensus > 0.8 ? 'high' : consensus > 0.6 ? 'medium' : 'low',
      standardDeviation: Math.round(standardDeviation),
      predictions: predictions
    };
  }

  /**
   * Predice utilización basada en historial
   */
  predictUtilizationFromHistory(features, similarCases) {
    if (similarCases.length === 0) {
      return this.estimateBasicUtilization(features);
    }

    // Promedio ponderado por similitud
    let totalWeight = 0;
    let weightedUtilization = 0;

    similarCases.forEach(caseData => {
      const weight = caseData.similarity;
      const utilization = caseData.result.totalUtilization;
      
      weightedUtilization += utilization * weight;
      totalWeight += weight;
    });

    const predictedUtilization = totalWeight > 0 ? weightedUtilization / totalWeight : 0;
    
    // Ajustes basados en diferencias específicas
    return this.adjustPredictionBasedOnDifferences(predictedUtilization, features, similarCases);
  }

  /**
   * Ajusta predicción basada en diferencias específicas del caso actual
   */
  adjustPredictionBasedOnDifferences(basePrediction, features, similarCases) {
    let adjustment = 0;
    
    // Ajuste por complejidad de empaque
    const avgComplexity = similarCases.reduce((sum, c) => 
      sum + this.extractPredictionFeatures(c.input).packingDifficulty, 0) / similarCases.length;
    
    if (features.packingDifficulty > avgComplexity * 1.2) {
      adjustment -= 0.05; // -5% por mayor complejidad
    } else if (features.packingDifficulty < avgComplexity * 0.8) {
      adjustment += 0.03; // +3% por menor complejidad
    }

    // Ajuste por utilización teórica
    if (features.theoreticalUtilization > 0.95) {
      adjustment -= 0.08; // -8% si la utilización teórica es muy alta (poco realista)
    }

    // Ajuste por beneficio de rotación
    if (features.rotationBenefit > 0.1) {
      adjustment += 0.04; // +4% si la rotación puede ayudar mucho
    }

    return Math.max(0.1, Math.min(0.98, basePrediction + adjustment));
  }

  /**
   * Genera sugerencias de optimización
   */
  generateOptimizationSuggestions(features, prediction) {
    const suggestions = [];

    // Sugerencias basadas en predicción
    if (prediction.predictedUtilization < 0.7) {
      suggestions.push({
        type: 'warning',
        title: 'Baja eficiencia esperada',
        message: `Se predice ${prediction.predictedUtilization}% de aprovechamiento`,
        action: 'Considera ajustar las dimensiones de las piezas o usar materiales más grandes'
      });
    } else if (prediction.predictedUtilization > 0.9) {
      suggestions.push({
        type: 'success',
        title: 'Excelente eficiencia esperada',
        message: `Se predice ${prediction.predictedUtilization}% de aprovechamiento`,
        action: 'Configuración óptima detectada'
      });
    }

    // Sugerencias específicas
    if (features.kerfImpact > 0.1) {
      suggestions.push({
        type: 'tip',
        title: 'Alto impacto del kerf',
        message: 'El ancho de corte está afectando significativamente la eficiencia',
        action: `Reduce el kerf si es posible (actual: ${features.kerfImpact * 100}% de impacto)`
      });
    }

    if (features.rotationBenefit > 0.05 && !features.allowRotation) {
      suggestions.push({
        type: 'tip',
        title: 'Beneficio de rotación detectado',
        message: 'Permitir rotación podría mejorar la eficiencia',
        action: `Mejora estimada: +${Math.round(features.rotationBenefit * 100)}%`
      });
    }

    if (features.packingDifficulty > 0.8) {
      suggestions.push({
        type: 'warning',
        title: 'Alta complejidad de empaque',
        message: 'Las piezas tienen tamaños muy variados',
        action: 'Considera agrupar piezas de tamaños similares'
      });
    }

    if (features.theoreticalUtilization > 0.95) {
      suggestions.push({
        type: 'warning',
        title: 'Espacio muy ajustado',
        message: 'Hay muy poco material disponible para las piezas requeridas',
        action: 'Considera agregar más material para mejorar las opciones de corte'
      });
    }

    // Sugerencias de algoritmo
    if (features.sizeComplexity > 0.7) {
      suggestions.push({
        type: 'tip',
        title: 'Recomendación de algoritmo',
        message: 'Para piezas de tamaños muy variados, prueba diferentes algoritmos',
        action: 'MaxRects o Hybrid suelen funcionar mejor en estos casos'
      });
    }

    return suggestions;
  }

  /**
   * Métodos auxiliares de cálculo
   */
  calculateAvgAspectRatio(items) {
    if (items.length === 0) return 1;
    const ratios = items.map(item => Math.max(item.length, item.width) / Math.min(item.length, item.width));
    return ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
  }

  calculateSizeComplexity(pieces) {
    if (pieces.length <= 1) return 0;
    
    const sizes = pieces.map(p => p.length * p.width);
    const avg = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avg, 2), 0) / sizes.length;
    const stdDev = Math.sqrt(variance);
    
    return avg > 0 ? Math.min(1, stdDev / avg) : 0;
  }

  calculatePackingDifficulty(pieces, materials) {
    const pieceComplexity = this.calculateSizeComplexity(pieces);
    const avgPieceSize = pieces.reduce((sum, p) => sum + p.length * p.width, 0) / pieces.length;
    const avgMaterialSize = materials.reduce((sum, m) => sum + m.length * m.width, 0) / materials.length;
    
    const sizeRatio = avgMaterialSize > 0 ? avgPieceSize / avgMaterialSize : 0;
    
    // La dificultad aumenta con la complejidad y cuando las piezas son grandes relativas al material
    return Math.min(1, pieceComplexity + Math.max(0, sizeRatio - 0.3));
  }

  calculateKerfImpact(pieces, kerfWidth) {
    const totalCutLength = pieces.reduce((sum, piece) => {
      const cuts = 2 * (piece.length + piece.width) * piece.quantity;
      return sum + cuts;
    }, 0);
    
    const totalPieceArea = pieces.reduce((sum, p) => sum + p.length * p.width * p.quantity, 0);
    const kerfWasteArea = totalCutLength * kerfWidth;
    
    return totalPieceArea > 0 ? kerfWasteArea / totalPieceArea : 0;
  }

  calculateMarginImpact(materials, margin) {
    const totalMaterialArea = materials.reduce((sum, m) => sum + m.length * m.width * m.quantity, 0);
    const totalMaterialPerimeter = materials.reduce((sum, m) => 
      sum + (2 * (m.length + m.width) * m.quantity), 0);
    
    const marginWasteArea = totalMaterialPerimeter * margin;
    return totalMaterialArea > 0 ? marginWasteArea / totalMaterialArea : 0;
  }

  estimateRotationBenefit(pieces, materials, allowRotation) {
    if (allowRotation) return 0; // Ya está habilitada
    
    // Estima el beneficio de permitir rotación
    let potentialImprovement = 0;
    
    pieces.forEach(piece => {
      materials.forEach(material => {
        const fitsNormal = piece.length <= material.length && piece.width <= material.width;
        const fitsRotated = piece.width <= material.length && piece.length <= material.width;
        
        if (!fitsNormal && fitsRotated) {
          potentialImprovement += 0.02; // +2% por cada pieza que podría beneficiarse
        }
      });
    });
    
    return Math.min(0.2, potentialImprovement); // Máximo 20% de mejora
  }

  calculateFeatureSimilarity(features1, features2) {
    const weights = {
      theoreticalUtilization: 0.25,
      packingDifficulty: 0.2,
      avgPieceSize: 0.15,
      avgMaterialSize: 0.15,
      sizeComplexity: 0.1,
      pieceCount: 0.05,
      materialCount: 0.05,
      kerfImpact: 0.03,
      marginImpact: 0.02
    };

    let similarity = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(weights)) {
      if (features1[key] !== undefined && features2[key] !== undefined) {
        const f1 = features1[key];
        const f2 = features2[key];
        
        const featureSimilarity = this.calculateNumericSimilarity(f1, f2);
        similarity += featureSimilarity * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? similarity / totalWeight : 0;
  }

  calculateNumericSimilarity(value1, value2) {
    const diff = Math.abs(value1 - value2);
    const avg = (value1 + value2) / 2;
    if (avg === 0) return value1 === value2 ? 1 : 0;
    return Math.max(0, 1 - (diff / avg));
  }

  // Predicciones básicas cuando no hay suficientes datos históricos
  getBasicPrediction(features) {
    const baseUtilization = this.estimateBasicUtilization(features);
    const predictedWaste = features.totalMaterialArea * (1 - baseUtilization);
    
    return {
      predictedUtilization: Math.round(baseUtilization * 1000) / 10,
      predictedWaste: Math.round(predictedWaste),
      predictedWastePercentage: Math.round((1 - baseUtilization) * 1000) / 10,
      predictedPatterns: Math.ceil(features.materialCount * 0.8),
      estimatedExecutionTime: Math.max(500, features.pieceCount * 50),
      utilizationRange: { min: baseUtilization - 0.1, max: baseUtilization + 0.1 },
      wasteRange: { min: predictedWaste * 0.8, max: predictedWaste * 1.2 },
      algorithm: 'maxRects',
      riskFactors: this.identifyBasicRiskFactors(features)
    };
  }

  estimateBasicUtilization(features) {
    let baseUtilization = Math.min(0.9, features.theoreticalUtilization * 0.8);
    
    // Ajustes básicos
    baseUtilization -= features.packingDifficulty * 0.15;
    baseUtilization -= features.kerfImpact;
    baseUtilization += features.rotationBenefit;
    
    return Math.max(0.3, Math.min(0.95, baseUtilization));
  }

  identifyRiskFactors(features, similarCases) {
    const risks = [];
    
    if (features.theoreticalUtilization > 0.95) {
      risks.push('Espacio muy limitado - Alto riesgo de piezas sin colocar');
    }
    
    if (features.packingDifficulty > 0.8) {
      risks.push('Alta variabilidad en tamaños - Puede reducir eficiencia');
    }
    
    if (features.kerfImpact > 0.15) {
      risks.push('Kerf muy alto - Impacto significativo en aprovechamiento');
    }
    
    if (similarCases && similarCases.length > 0) {
      const avgSuccessUtilization = similarCases.reduce((sum, c) => sum + c.result.totalUtilization, 0) / similarCases.length;
      if (avgSuccessUtilization < 0.7) {
        risks.push('Casos similares tuvieron baja eficiencia histórica');
      }
    }
    
    return risks;
  }

  identifyBasicRiskFactors(features) {
    const risks = [];
    
    if (features.theoreticalUtilization > 0.95) {
      risks.push('Espacio muy limitado');
    }
    
    if (features.packingDifficulty > 0.8) {
      risks.push('Alta complejidad de empaque');
    }
    
    return risks;
  }

  calculatePredictionConfidence(features, historicalData) {
    const similarCases = this.findSimilarHistoricalCases(features, historicalData);
    const baseConfidence = Math.min(1, similarCases.length / 10);
    
    // Ajustes de confianza
    let confidenceAdjustment = 0;
    
    if (similarCases.length > 0) {
      const avgSimilarity = similarCases.reduce((sum, c) => sum + c.similarity, 0) / similarCases.length;
      confidenceAdjustment += (avgSimilarity - 0.7) * 0.5;
    }
    
    return Math.max(0.1, Math.min(1, baseConfidence + confidenceAdjustment));
  }

  predictPatternCount(features, similarCases) {
    if (similarCases.length === 0) {
      return Math.ceil(features.materialCount * 0.8);
    }
    
    const avgPatterns = similarCases.reduce((sum, c) => sum + c.result.patternsCount, 0) / similarCases.length;
    return Math.round(avgPatterns);
  }

  predictExecutionTime(features, similarCases) {
    if (similarCases.length === 0) {
      return Math.max(500, features.pieceCount * 50);
    }
    
    const avgTime = similarCases.reduce((sum, c) => sum + (c.result.executionTime || 1000), 0) / similarCases.length;
    return Math.round(avgTime);
  }

  calculateUtilizationRange(similarCases) {
    if (similarCases.length === 0) {
      return { min: 0.6, max: 0.9 };
    }
    
    const utilizations = similarCases.map(c => c.result.totalUtilization);
    const min = Math.min(...utilizations);
    const max = Math.max(...utilizations);
    
    return {
      min: Math.round(min * 1000) / 10,
      max: Math.round(max * 1000) / 10
    };
  }

  calculateWasteRange(totalMaterialArea, similarCases) {
    if (similarCases.length === 0) {
      const baseWaste = totalMaterialArea * 0.25;
      return { min: baseWaste * 0.6, max: baseWaste * 1.4 };
    }
    
    const wastes = similarCases.map(c => c.result.totalWaste);
    const min = Math.min(...wastes);
    const max = Math.max(...wastes);
    
    return {
      min: Math.round(min),
      max: Math.round(max)
    };
  }

  predictBestAlgorithm(similarCases) {
    if (similarCases.length === 0) {
      return 'maxRects';
    }
    
    const algorithms = {};
    similarCases.forEach(c => {
      const algo = c.result.algorithm;
      algorithms[algo] = (algorithms[algo] || 0) + 1;
    });
    
    return Object.keys(algorithms).reduce((a, b) => 
      algorithms[a] > algorithms[b] ? a : b
    );
  }
}

// Instancia singleton
export const wastePredictor = new WastePredictor();