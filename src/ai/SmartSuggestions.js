/**
 * Sistema de Sugerencias Inteligentes en Tiempo Real
 * Analiza el input del usuario y ofrece sugerencias mientras trabaja
 */

import { adaptiveLearning } from './AdaptiveLearning.js';
import { wastePredictor } from './WastePredictor.js';

export class SmartSuggestions {
  constructor() {
    this.suggestionHistory = [];
    this.maxSuggestions = 5;
    this.analyzeDelay = 1000; // 1 segundo de delay para evitar análisis excesivo
    this.lastAnalysis = 0;
  }

  /**
   * Analiza el estado actual y genera sugerencias inteligentes
   */
  async analyzeLiveInput(pieces, materials, config) {
    const now = Date.now();
    if (now - this.lastAnalysis < this.analyzeDelay) {
      return this.getLastSuggestions();
    }

    this.lastAnalysis = now;

    try {
      const suggestions = [];
      
      // Análisis básico de entrada
      const basicSuggestions = this.analyzeBasicInput(pieces, materials, config);
      suggestions.push(...basicSuggestions);

      // Sugerencias basadas en predicción IA
      if (pieces.length > 0 && materials.length > 0) {
        const aiSuggestions = await this.generateAISuggestions(pieces, materials, config);
        suggestions.push(...aiSuggestions);
      }

      // Sugerencias basadas en patrones históricos
      const historicalSuggestions = this.generateHistoricalSuggestions(pieces, materials, config);
      suggestions.push(...historicalSuggestions);

      // Sugerencias de optimización proactiva
      const optimizationSuggestions = this.generateOptimizationSuggestions(pieces, materials, config);
      suggestions.push(...optimizationSuggestions);

      // Filtrar y priorizar sugerencias
      const finalSuggestions = this.prioritizeAndFilterSuggestions(suggestions);
      
      this.suggestionHistory = finalSuggestions;
      return finalSuggestions;

    } catch (error) {
      console.warn('Error generando sugerencias:', error);
      return this.getBasicSuggestions(pieces, materials, config);
    }
  }

  /**
   * Análisis básico de la entrada del usuario
   */
  analyzeBasicInput(pieces, materials, config) {
    const suggestions = [];

    // Validaciones básicas
    if (pieces.length === 0) {
      suggestions.push({
        id: 'no-pieces',
        type: 'info',
        priority: 1,
        title: '📋 Agrega piezas para comenzar',
        message: 'Define las piezas que necesitas cortar',
        action: 'Usar el formulario de piezas para agregar elementos',
        category: 'input'
      });
      return suggestions;
    }

    if (materials.length === 0) {
      suggestions.push({
        id: 'no-materials',
        type: 'warning',
        priority: 1,
        title: '📦 Necesitas agregar materiales',
        message: 'Define los tableros disponibles para cortar',
        action: 'Agregar materiales en la pestaña correspondiente',
        category: 'input'
      });
      return suggestions;
    }

    // Análisis de área
    const totalPieceArea = pieces.reduce((sum, p) => sum + (p.length * p.width * p.quantity), 0);
    const totalMaterialArea = materials.reduce((sum, m) => sum + (m.length * m.width * m.quantity), 0);

    if (totalPieceArea > totalMaterialArea) {
      suggestions.push({
        id: 'insufficient-material',
        type: 'error',
        priority: 1,
        title: '❌ Material insuficiente',
        message: `Necesitas ${Math.round(totalPieceArea - totalMaterialArea)} unidades² más de material`,
        action: 'Agregar más material o reducir la cantidad de piezas',
        category: 'validation'
      });
    }

    // Análisis de dimensiones
    const oversizedPieces = this.findOversizedPieces(pieces, materials);
    if (oversizedPieces.length > 0) {
      suggestions.push({
        id: 'oversized-pieces',
        type: 'error',
        priority: 1,
        title: '📏 Piezas demasiado grandes',
        message: `${oversizedPieces.length} piezas no caben en ningún material`,
        action: 'Revisar dimensiones o agregar materiales más grandes',
        category: 'validation',
        details: oversizedPieces
      });
    }

    // Análisis de configuración
    if (config.kerfWidth > 5) {
      suggestions.push({
        id: 'high-kerf',
        type: 'warning',
        priority: 2,
        title: '⚠️ Kerf muy alto',
        message: `Kerf de ${config.kerfWidth}mm puede reducir significativamente la eficiencia`,
        action: 'Considera reducir el kerf si tu herramienta lo permite',
        category: 'config'
      });
    }

    if (config.margin > 10) {
      suggestions.push({
        id: 'high-margin',
        type: 'tip',
        priority: 3,
        title: '💡 Margen alto detectado',
        message: `Margen de ${config.margin}mm es conservador`,
        action: 'Podrías reducir el margen para mejorar aprovechamiento',
        category: 'config'
      });
    }

    return suggestions;
  }

  /**
   * Genera sugerencias basadas en IA
   */
  async generateAISuggestions(pieces, materials, config) {
    const suggestions = [];

    try {
      // Obtener predicción
      const prediction = await wastePredictor.predictOptimization(pieces, materials, config);
      
      if (prediction.predictedUtilization < 70) {
        suggestions.push({
          id: 'low-efficiency-predicted',
          type: 'warning',
          priority: 1,
          title: '🤖 IA: Baja eficiencia esperada',
          message: `Se predice ${prediction.predictedUtilization}% de aprovechamiento`,
          action: 'Revisar sugerencias de optimización de la IA',
          category: 'ai-prediction',
          details: prediction.suggestions
        });
      }

      // Sugerencias del predictor
      if (prediction.suggestions && prediction.suggestions.length > 0) {
        prediction.suggestions.slice(0, 2).forEach((suggestion, index) => {
          suggestions.push({
            id: `ai-suggestion-${index}`,
            type: suggestion.type || 'tip',
            priority: 2,
            title: `🤖 ${suggestion.title}`,
            message: suggestion.message,
            action: suggestion.action,
            category: 'ai-suggestion'
          });
        });
      }

      // Recomendaciones de configuración
      const recommendations = adaptiveLearning.predictOptimalConfig({ pieces, materials, config });
      
      if (recommendations.confidence > 0.5) {
        if (Math.abs(config.kerfWidth - recommendations.recommendedKerf) > 0.5) {
          suggestions.push({
            id: 'ai-kerf-recommendation',
            type: 'tip',
            priority: 2,
            title: `🎯 IA recomienda kerf de ${recommendations.recommendedKerf}mm`,
            message: `Basado en ${recommendations.basedOnCases} casos similares`,
            action: `Cambiar de ${config.kerfWidth}mm a ${recommendations.recommendedKerf}mm`,
            category: 'ai-config'
          });
        }

        if (config.allowRotation !== recommendations.recommendedRotation) {
          const action = recommendations.recommendedRotation ? 'Habilitar' : 'Deshabilitar';
          suggestions.push({
            id: 'ai-rotation-recommendation',
            type: 'tip',
            priority: 2,
            title: `🔄 IA recomienda ${action.toLowerCase()} rotación`,
            message: `Mejora esperada en casos similares`,
            action: `${action} rotación de piezas`,
            category: 'ai-config'
          });
        }
      }

    } catch (error) {
      console.warn('Error generando sugerencias de IA:', error);
    }

    return suggestions;
  }

  /**
   * Genera sugerencias basadas en patrones históricos
   */
  generateHistoricalSuggestions(pieces, materials, config) {
    const suggestions = [];
    const stats = adaptiveLearning.getStats();

    if (stats.totalOptimizations === 0) {
      suggestions.push({
        id: 'first-time-user',
        type: 'info',
        priority: 3,
        title: '🚀 ¡Bienvenido!',
        message: 'Es tu primera optimización. El sistema aprenderá de tus preferencias.',
        action: 'Ejecuta algunas optimizaciones para obtener sugerencias personalizadas',
        category: 'onboarding'
      });
      return suggestions;
    }

    if (stats.successRate < 0.7) {
      suggestions.push({
        id: 'low-success-rate',
        type: 'tip',
        priority: 2,
        title: '📊 Mejora tu tasa de éxito',
        message: `Tu tasa de éxito actual es ${Math.round(stats.successRate * 100)}%`,
        action: 'Considera seguir más las recomendaciones de la IA',
        category: 'performance'
      });
    }

    if (stats.avgUtilization > 0 && stats.avgUtilization < 0.75) {
      suggestions.push({
        id: 'improve-utilization',
        type: 'tip',
        priority: 2,
        title: '📈 Oportunidad de mejora',
        message: `Tu aprovechamiento promedio es ${Math.round(stats.avgUtilization * 100)}%`,
        action: 'Prueba agrupar piezas de tamaños similares',
        category: 'performance'
      });
    }

    return suggestions;
  }

  /**
   * Genera sugerencias de optimización proactiva
   */
  generateOptimizationSuggestions(pieces, materials, config) {
    const suggestions = [];

    // Análisis de agrupación de piezas
    const groupingSuggestion = this.analyzeGroupingOpportunities(pieces);
    if (groupingSuggestion) {
      suggestions.push(groupingSuggestion);
    }

    // Análisis de rotación de piezas
    if (!config.allowRotation) {
      const rotationBenefit = this.estimateRotationBenefit(pieces, materials);
      if (rotationBenefit > 0.05) {
        suggestions.push({
          id: 'rotation-benefit',
          type: 'tip',
          priority: 2,
          title: '🔄 Habilita rotación para mejor eficiencia',
          message: `Mejora estimada: +${Math.round(rotationBenefit * 100)}%`,
          action: 'Activar "Permitir rotación" en configuración',
          category: 'optimization'
        });
      }
    }

    // Análisis de tamaños de material
    const materialSuggestion = this.analyzeMaterialSizes(pieces, materials);
    if (materialSuggestion) {
      suggestions.push(materialSuggestion);
    }

    // Sugerencias de algoritmo
    const algorithmSuggestion = this.suggestAlgorithmBasedOnData(pieces, materials);
    if (algorithmSuggestion) {
      suggestions.push(algorithmSuggestion);
    }

    return suggestions;
  }

  /**
   * Analiza oportunidades de agrupación de piezas
   */
  analyzeGroupingOpportunities(pieces) {
    const sizeGroups = this.groupPiecesBySimilarSize(pieces);
    
    // Si hay muchos grupos pequeños, sugerir agrupación
    const smallGroups = sizeGroups.filter(group => group.pieces.length <= 2);
    
    if (smallGroups.length > pieces.length * 0.5) {
      return {
        id: 'grouping-opportunity',
        type: 'tip',
        priority: 3,
        title: '📦 Oportunidad de agrupación',
        message: 'Tienes muchas piezas de tamaños únicos',
        action: 'Considera estandarizar algunos tamaños para mejor eficiencia',
        category: 'optimization'
      };
    }

    return null;
  }

  /**
   * Analiza tamaños de material
   */
  analyzeMaterialSizes(pieces, materials) {
    const avgPieceSize = pieces.reduce((sum, p) => sum + p.length * p.width, 0) / pieces.length;
    const avgMaterialSize = materials.reduce((sum, m) => sum + m.length * m.width, 0) / materials.length;
    
    const sizeRatio = avgPieceSize / avgMaterialSize;
    
    if (sizeRatio < 0.1) {
      return {
        id: 'material-too-large',
        type: 'tip',
        priority: 3,
        title: '📏 Materiales muy grandes para las piezas',
        message: 'Podrías usar materiales más pequeños para reducir desperdicio',
        action: 'Considera usar tableros más pequeños si están disponibles',
        category: 'optimization'
      };
    }

    if (sizeRatio > 0.6) {
      return {
        id: 'material-tight',
        type: 'warning',
        priority: 2,
        title: '⚠️ Espacio muy ajustado',
        message: 'Las piezas ocupan mucho espacio relativo al material',
        action: 'Considera agregar más material para mejores opciones',
        category: 'optimization'
      };
    }

    return null;
  }

  /**
   * Sugiere algoritmo basado en características de los datos
   */
  suggestAlgorithmBasedOnData(pieces, materials) {
    const sizeVariance = this.calculateSizeVariance(pieces);
    const pieceCount = pieces.reduce((sum, p) => sum + p.quantity, 0);
    
    if (sizeVariance > 0.7 && pieceCount > 20) {
      return {
        id: 'algorithm-suggestion',
        type: 'tip',
        priority: 3,
        title: '🧠 Sugerencia de algoritmo',
        message: 'Para muchas piezas de tamaños variados, prueba Hybrid',
        action: 'Cambiar algoritmo a "Hybrid" antes de optimizar',
        category: 'algorithm'
      };
    }

    if (pieceCount < 10 && sizeVariance < 0.3) {
      return {
        id: 'algorithm-simple',
        type: 'tip',
        priority: 3,
        title: '🎯 Algoritmo recomendado',
        message: 'Para pocas piezas similares, Best Fit es eficiente',
        action: 'Prueba algoritmo "Best Fit Decreasing"',
        category: 'algorithm'
      };
    }

    return null;
  }

  /**
   * Prioriza y filtra sugerencias
   */
  prioritizeAndFilterSuggestions(suggestions) {
    // Remover duplicados por ID
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
      index === self.findIndex(s => s.id === suggestion.id)
    );

    // Ordenar por prioridad
    const sortedSuggestions = uniqueSuggestions.sort((a, b) => a.priority - b.priority);

    // Limitar número de sugerencias
    return sortedSuggestions.slice(0, this.maxSuggestions);
  }

  /**
   * Métodos auxiliares
   */
  findOversizedPieces(pieces, materials) {
    const oversized = [];
    
    pieces.forEach(piece => {
      const canFit = materials.some(material => 
        (piece.length <= material.length && piece.width <= material.width) ||
        (piece.width <= material.length && piece.length <= material.width)
      );
      
      if (!canFit) {
        oversized.push({
          id: piece.id,
          name: piece.name || `${piece.length}x${piece.width}`,
          dimensions: `${piece.length}x${piece.width}`,
          quantity: piece.quantity
        });
      }
    });
    
    return oversized;
  }

  estimateRotationBenefit(pieces, materials) {
    let benefitCount = 0;
    
    pieces.forEach(piece => {
      materials.forEach(material => {
        const fitsNormal = piece.length <= material.length && piece.width <= material.width;
        const fitsRotated = piece.width <= material.length && piece.length <= material.width;
        
        if (!fitsNormal && fitsRotated) {
          benefitCount++;
        }
      });
    });
    
    const totalPieces = pieces.reduce((sum, p) => sum + p.quantity, 0);
    return totalPieces > 0 ? benefitCount / totalPieces : 0;
  }

  groupPiecesBySimilarSize(pieces, tolerance = 0.1) {
    const groups = [];
    
    pieces.forEach(piece => {
      const size = piece.length * piece.width;
      let foundGroup = false;
      
      for (const group of groups) {
        const groupAvgSize = group.avgSize;
        const sizeDiff = Math.abs(size - groupAvgSize) / groupAvgSize;
        
        if (sizeDiff <= tolerance) {
          group.pieces.push(piece);
          group.avgSize = group.pieces.reduce((sum, p) => sum + p.length * p.width, 0) / group.pieces.length;
          foundGroup = true;
          break;
        }
      }
      
      if (!foundGroup) {
        groups.push({
          pieces: [piece],
          avgSize: size
        });
      }
    });
    
    return groups;
  }

  calculateSizeVariance(pieces) {
    if (pieces.length <= 1) return 0;
    
    const sizes = pieces.map(p => p.length * p.width);
    const avg = sizes.reduce((sum, size) => sum + size, 0) / sizes.length;
    const variance = sizes.reduce((sum, size) => sum + Math.pow(size - avg, 2), 0) / sizes.length;
    
    return avg > 0 ? Math.sqrt(variance) / avg : 0;
  }

  getLastSuggestions() {
    return this.suggestionHistory;
  }

  getBasicSuggestions(pieces, materials, config) {
    return [{
      id: 'basic-help',
      type: 'info',
      priority: 1,
      title: '💡 Sugerencias básicas',
      message: 'Revisa que todas las piezas puedan caber en los materiales disponibles',
      action: 'Verificar dimensiones y agregar materiales si es necesario',
      category: 'basic'
    }];
  }

  /**
   * Marca una sugerencia como vista/aplicada por el usuario
   */
  markSuggestionAsApplied(suggestionId) {
    const suggestion = this.suggestionHistory.find(s => s.id === suggestionId);
    if (suggestion) {
      suggestion.applied = true;
      suggestion.appliedAt = new Date().toISOString();
    }
  }

  /**
   * Obtiene estadísticas de uso de sugerencias
   */
  getSuggestionStats() {
    const total = this.suggestionHistory.length;
    const applied = this.suggestionHistory.filter(s => s.applied).length;
    
    return {
      totalSuggestions: total,
      appliedSuggestions: applied,
      applicationRate: total > 0 ? applied / total : 0,
      categoriesOffered: [...new Set(this.suggestionHistory.map(s => s.category))]
    };
  }
}

// Instancia singleton
export const smartSuggestions = new SmartSuggestions();