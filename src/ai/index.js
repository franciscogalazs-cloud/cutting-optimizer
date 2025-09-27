/**
 * Módulo principal de IA Avanzada para Cutting Optimizer
 * Exporta el orquestador y funciones de conveniencia. Los submódulos
 * (aprendizaje, predicción, sugerencias, análisis) se cargan bajo demanda
 * para evitar incluirlos en el bundle cuando no se usan.
 */

/**
 * Clase principal que orquesta todas las funcionalidades de IA
 */
export class AIOrchestrator {
  constructor() {
    this.isInitialized = false;
    this.modules = {
      learning: null,
      predictor: null,
      suggestions: null,
      assistant: null,
      analyzer: null
    };
    this.initializationTime = null;
  }

  /**
   * Asegura que un submódulo esté cargado. Carga dinámica por nombre.
   */
  async ensureModule(name) {
    if (this.modules[name]) return true;
    try {
      switch (name) {
        case 'assistant': {
          const { conversationalAssistant } = await import('./ConversationalAssistant.js');
          this.modules.assistant = conversationalAssistant;
          break;
        }
        case 'learning': {
          const { adaptiveLearning } = await import('./AdaptiveLearning.js');
          this.modules.learning = adaptiveLearning;
          break;
        }
        case 'predictor': {
          const { wastePredictor } = await import('./WastePredictor.js');
          this.modules.predictor = wastePredictor;
          break;
        }
        case 'suggestions': {
          const { smartSuggestions } = await import('./SmartSuggestions.js');
          this.modules.suggestions = smartSuggestions;
          break;
        }
        case 'analyzer': {
          const { historicalPatternAnalyzer } = await import('./HistoricalPatternAnalyzer.js');
          this.modules.analyzer = historicalPatternAnalyzer;
          break;
        }
        default:
          return false;
      }
      return true;
    } catch (error) {
      console.warn(`No se pudo cargar el módulo de IA: ${name}`, error);
      return false;
    }
  }

  /**
   * Inicializa la IA cargando solo el asistente por defecto.
   * Otros módulos se cargarán bajo demanda cuando se usen.
   */
  async initialize() {
    try {
      const ok = await this.ensureModule('assistant');
      this.isInitialized = ok;
      this.initializationTime = new Date().toISOString();
      if (ok) console.log('🤖 IA (asistente) inicializada');
      return ok;
    } catch (error) {
      console.error('Error inicializando IA:', error);
      return false;
    }
  }

  /**
   * Procesa una optimización completa con todas las funcionalidades de IA
   */
  async processOptimization(pieces, materials, config, result, userFeedback = null) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Carga bajo demanda de módulos necesarios
      await this.ensureModule('learning');
      await this.ensureModule('predictor');
      await this.ensureModule('suggestions');
      await this.ensureModule('analyzer');

      const aiResults = {};

      // 1. Registrar en sistema de aprendizaje
      const learningRecord = this.modules.learning?.recordOptimization?.(
        { pieces, materials, config }, 
        result, 
        userFeedback
      );
      aiResults.learning = learningRecord;

      // 2. Generar análisis de predicción vs realidad
      const predictionAccuracy = await this.analyzePredictionAccuracy(
        pieces, materials, config, result
      );
      aiResults.predictionAccuracy = predictionAccuracy;

      // 3. Actualizar contexto del asistente
      this.modules.assistant?.updateContext?.({
        pieces,
        materials,
        config,
        lastOptimization: result
      });

      // 4. Generar sugerencias post-optimización
      const postSuggestions = await this.generatePostOptimizationSuggestions(result);
      aiResults.postSuggestions = postSuggestions;

      console.log('🎯 Optimización procesada por IA:', aiResults);
      return aiResults;

    } catch (error) {
      console.warn('Error procesando optimización con IA:', error);
      return { error: error.message };
    }
  }

  /**
   * Genera sugerencias inteligentes en tiempo real
   */
  async generateLiveSuggestions(pieces, materials, config) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.ensureModule('suggestions');
      await this.ensureModule('learning');
      await this.ensureModule('predictor');
      // Obtener sugerencias de múltiples fuentes
      const [
        smartSuggestions,
        aiRecommendations,
        predictions
      ] = await Promise.all([
        this.modules.suggestions?.analyzeLiveInput?.(pieces, materials, config),
        this.modules.learning?.predictOptimalConfig?.({ pieces, materials, config }),
        this.modules.predictor?.predictOptimization?.(pieces, materials, config)
      ]);

      // Combinar y priorizar sugerencias
      const combinedSuggestions = this.combineSuggestions(
        smartSuggestions,
        aiRecommendations,
        predictions
      );

      return combinedSuggestions;

    } catch (error) {
      console.warn('Error generando sugerencias live:', error);
      return [];
    }
  }

  /**
   * Procesa mensaje del asistente conversacional
   */
  async processConversation(message, context) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.ensureModule('assistant');
      const response = await this.modules.assistant.processMessage(message, context);
      
      // Si el asistente sugiere una acción, preparar datos adicionales
      if (response.type === 'action') {
        response.aiContext = await this.getAIContextForAction(response.action, context);
      }

      return response;
    } catch (error) {
      console.warn('Error procesando conversación:', error);
      return {
        type: 'error',
        response: 'Lo siento, tuve un problema procesando tu mensaje. Intenta de nuevo.',
        suggestions: ['Ayuda general', 'Reintentar', 'Contactar soporte']
      };
    }
  }

  /**
   * Genera análisis histórico completo
   */
  async generateHistoricalInsights() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.ensureModule('analyzer');
      await this.ensureModule('learning');
      await this.ensureModule('assistant');
      const analysis = this.modules.analyzer?.generateHistoricalAnalysis?.();
      
      // Enriquecer con datos adicionales de otros módulos
      const enrichedAnalysis = {
        ...analysis,
        aiStats: this.getAIStats(),
        learningProgress: this.modules.learning.getStats(),
        assistantStats: this.modules.assistant.getAssistantStats()
      };

      return enrichedAnalysis;
    } catch (error) {
      console.warn('Error generando insights históricos:', error);
      return { error: 'No se pudo generar el análisis histórico' };
    }
  }

  /**
   * Obtiene estadísticas generales de IA
   */
  getAIStats() {
    if (!this.isInitialized) return null;

    return {
      modulesLoaded: Object.keys(this.modules).length,
      learningEnabled: !!this.modules.learning,
      predictionsEnabled: !!this.modules.predictor,
      suggestionsEnabled: !!this.modules.suggestions,
      assistantEnabled: !!this.modules.assistant,
      analyticsEnabled: !!this.modules.analyzer,
      initializationTime: this.initializationTime,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Limpia todos los datos de IA (útil para testing o reset)
   */
  clearAllData() {
    if (!this.isInitialized) return false;

    try {
      this.modules.learning?.clearHistory?.();
      this.modules.assistant?.clearHistory?.();
      console.log('🧹 Todos los datos de IA han sido limpiados');
      return true;
    } catch (error) {
      console.warn('Error limpiando datos de IA:', error);
      return false;
    }
  }

  /**
   * Exporta todos los datos de IA para backup
   */
  exportAIData() {
    if (!this.isInitialized) return null;

    try {
      return {
        learning: this.modules.learning?.getHistory?.(),
        assistant: this.modules.assistant?.getConversationHistory?.(),
        analysis: this.modules.analyzer?.exportAnalysis?.(),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.warn('Error exportando datos de IA:', error);
      return null;
    }
  }

  // Métodos auxiliares privados

  async analyzePredictionAccuracy(pieces, materials, config, actualResult) {
    try {
      await this.ensureModule('predictor');
      const prediction = await this.modules.predictor?.predictOptimization?.(pieces, materials, config);
      if (!prediction) throw new Error('predictor no disponible');
      
      const utilizationDiff = Math.abs(prediction.predictedUtilization/100 - actualResult.totalUtilization);
      const accuracy = Math.max(0, 1 - utilizationDiff);

      return {
        predicted: prediction.predictedUtilization,
        actual: Math.round(actualResult.totalUtilization * 100),
        accuracy: Math.round(accuracy * 100),
        difference: Math.round(utilizationDiff * 100)
      };
    } catch (error) {
      return { error: 'No se pudo calcular precisión de predicción' };
    }
  }

  async generatePostOptimizationSuggestions(result) {
    const suggestions = [];
    const utilization = result.totalUtilization || 0;

    if (utilization < 0.7) {
      suggestions.push({
        type: 'improvement',
        message: 'El aprovechamiento fue bajo. ¿Te gustaría que analice cómo mejorarlo?',
        action: 'analyze_improvement_opportunities'
      });
    } else if (utilization > 0.9) {
      suggestions.push({
        type: 'success',
        message: '¡Excelente aprovechamiento! ¿Quieres guardar esta configuración como favorita?',
        action: 'save_as_favorite_config'
      });
    }

    if (result.failedPlacements > 0) {
      suggestions.push({
        type: 'problem',
        message: `${result.failedPlacements} piezas no pudieron colocarse. ¿Necesitas ayuda?`,
        action: 'troubleshoot_failed_placements'
      });
    }

    return suggestions;
  }

  combineSuggestions(smartSuggestions, aiRecommendations, predictions) {
    const combined = [...smartSuggestions];

    // Agregar recomendaciones de IA si tienen alta confianza
    if (aiRecommendations.confidence > 0.7) {
      aiRecommendations.suggestions.forEach(suggestion => {
        combined.push({
          id: `ai-${Date.now()}`,
          type: 'ai-recommendation',
          priority: 2,
          title: '🤖 ' + suggestion,
          message: `Basado en ${aiRecommendations.basedOnCases} casos similares`,
          action: suggestion,
          category: 'ai-learning'
        });
      });
    }

    // Agregar predicciones si son relevantes
    if (predictions.confidence > 0.6 && predictions.predictedUtilization < 75) {
      combined.push({
        id: 'prediction-warning',
        type: 'warning',
        priority: 1,
        title: '🔮 Predicción: Baja eficiencia esperada',
        message: `Se predice ${predictions.predictedUtilization}% de aprovechamiento`,
        action: 'Ver sugerencias de mejora',
        category: 'ai-prediction'
      });
    }

    return combined.slice(0, 6); // Limitar a 6 sugerencias máximo
  }

  async getAIContextForAction(action, context) {
    switch (action) {
      case 'add_piece':
      case 'add_material':
        await this.ensureModule('learning');
        await this.ensureModule('suggestions');
        return {
          recommendations: await this.modules.learning?.predictOptimalConfig?.(context),
          suggestions: await this.modules.suggestions?.analyzeLiveInput?.(
            context.pieces || [], 
            context.materials || [], 
            context.config || {}
          )
        };
      
      default:
        return null;
    }
  }

  estimateMemoryUsage() {
    // Estimación aproximada del uso de memoria
    const historySize = this.modules.learning?.getHistory?.().length || 0;
    const conversationSize = this.modules.assistant?.getConversationHistory?.().length || 0;
    
    return {
      historyRecords: historySize,
      conversationRecords: conversationSize,
      estimatedKB: Math.round((historySize * 2 + conversationSize * 0.5))
    };
  }
}

// Instancia singleton global
export const aiOrchestrator = new AIOrchestrator();

// Funciones de conveniencia para uso directo
export const initializeAI = () => aiOrchestrator.initialize();
export const processOptimizationWithAI = (pieces, materials, config, result, feedback) => 
  aiOrchestrator.processOptimization(pieces, materials, config, result, feedback);
export const getLiveSuggestions = (pieces, materials, config) => 
  aiOrchestrator.generateLiveSuggestions(pieces, materials, config);
export const chatWithAssistant = (message, context) => 
  aiOrchestrator.processConversation(message, context);
export const getHistoricalInsights = () => 
  aiOrchestrator.generateHistoricalInsights();

// Auto-inicialización en desarrollo
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🚀 Inicializando IA en modo desarrollo...');
  aiOrchestrator.initialize();
}