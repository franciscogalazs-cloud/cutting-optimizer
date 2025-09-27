/**
 * Hook personalizado para integrar IA Avanzada en componentes React
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  aiOrchestrator, 
  getLiveSuggestions, 
  chatWithAssistant,
  processOptimizationWithAI,
  getHistoricalInsights 
} from '../ai/index.js';

/**
 * Hook principal para funcionalidades de IA
 */
export function useAI() {
  const [isAIReady, setIsAIReady] = useState(false);
  const [aiStats, setAiStats] = useState(null);
  const initializeRef = useRef(false);

  useEffect(() => {
    if (!initializeRef.current) {
      initializeRef.current = true;
      
      const initAI = async () => {
        try {
          const initialized = await aiOrchestrator.initialize();
          setIsAIReady(initialized);
          
          if (initialized) {
            setAiStats(aiOrchestrator.getAIStats());
          }
        } catch (error) {
          console.warn('Error inicializando IA:', error);
          setIsAIReady(false);
        }
      };

      initAI();
    }
  }, []);

  const processOptimization = useCallback(async (pieces, materials, config, result, userFeedback = null) => {
    if (!isAIReady) return null;
    
    try {
      return await processOptimizationWithAI(pieces, materials, config, result, userFeedback);
    } catch (error) {
      console.warn('Error procesando optimización con IA:', error);
      return null;
    }
  }, [isAIReady]);

  const getInsights = useCallback(async () => {
    if (!isAIReady) return null;
    
    try {
      return await getHistoricalInsights();
    } catch (error) {
      console.warn('Error obteniendo insights:', error);
      return null;
    }
  }, [isAIReady]);

  const clearAIData = useCallback(() => {
    if (!isAIReady) return false;
    return aiOrchestrator.clearAllData();
  }, [isAIReady]);

  const exportData = useCallback(() => {
    if (!isAIReady) return null;
    return aiOrchestrator.exportAIData();
  }, [isAIReady]);

  return {
    isAIReady,
    aiStats,
    processOptimization,
    getInsights,
    clearAIData,
    exportData
  };
}

/**
 * Hook para sugerencias inteligentes en tiempo real
 */
export function useSmartSuggestions(pieces = [], materials = [], config = {}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(0);
  const { isAIReady } = useAI();

  const updateSuggestions = useCallback(async (forcedUpdate = false) => {
    if (!isAIReady) return;
    
    const now = Date.now();
    if (!forcedUpdate && now - lastUpdate < 2000) return; // Throttle updates

    setIsLoading(true);
    try {
      const newSuggestions = await getLiveSuggestions(pieces, materials, config);
      setSuggestions(newSuggestions || []);
      setLastUpdate(now);
    } catch (error) {
      console.warn('Error actualizando sugerencias:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [pieces, materials, config, isAIReady, lastUpdate]);

  useEffect(() => {
    updateSuggestions();
  }, [updateSuggestions]);

  const applySuggestion = useCallback((suggestionId) => {
    setSuggestions(prev => 
      prev.map(s => 
        s.id === suggestionId 
          ? { ...s, applied: true, appliedAt: new Date().toISOString() }
          : s
      )
    );
  }, []);

  const dismissSuggestion = useCallback((suggestionId) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  return {
    suggestions,
    isLoading,
    updateSuggestions: () => updateSuggestions(true),
    applySuggestion,
    dismissSuggestion
  };
}

/**
 * Hook para el asistente conversacional
 */
export function useAssistant() {
  const [conversation, setConversation] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const { isAIReady } = useAI();

  const sendMessage = useCallback(async (message, context = {}) => {
    if (!isAIReady || !message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setConversation(prev => [...prev, userMessage]);
    setIsThinking(true);

    try {
      const response = await chatWithAssistant(message, context);
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: response.response,
        suggestions: response.suggestions || [],
        responseType: response.type,
        timestamp: new Date().toISOString()
      };

      setConversation(prev => [...prev, assistantMessage]);
      
      return response;
    } catch (error) {
      console.warn('Error enviando mensaje al asistente:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Lo siento, tuve un problema procesando tu mensaje. ¿Puedes intentar de nuevo?',
        suggestions: ['Ayuda', 'Reintentar'],
        responseType: 'error',
        timestamp: new Date().toISOString()
      };

      setConversation(prev => [...prev, errorMessage]);
      return null;
    } finally {
      setIsThinking(false);
    }
  }, [isAIReady]);

  const clearConversation = useCallback(() => {
    setConversation([]);
  }, []);

  const getLastAssistantMessage = useCallback(() => {
    const assistantMessages = conversation.filter(m => m.type === 'assistant');
    return assistantMessages[assistantMessages.length - 1] || null;
  }, [conversation]);

  return {
    conversation,
    isThinking,
    sendMessage,
    clearConversation,
    getLastAssistantMessage,
    isReady: isAIReady
  };
}

/**
 * Hook para predicciones de desperdicio
 */
export function useWastePrediction(pieces = [], materials = [], config = {}) {
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAIReady } = useAI();

  const predict = useCallback(async () => {
    if (!isAIReady || pieces.length === 0 || materials.length === 0) {
      setPrediction(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { wastePredictor } = await import('../ai/WastePredictor.js');
      
      // Usar predicción avanzada si hay suficientes datos históricos
      const historicalData = JSON.parse(localStorage.getItem('ai_cutting_history') || '[]');
      let result;
      
      if (historicalData.length >= 5) {
        // Usar predicción avanzada con ML
        result = await wastePredictor.predictAdvanced(pieces, materials, config);
        console.log('🤖 Usando predicción avanzada con ML');
      } else {
        // Usar predicción tradicional
        result = await wastePredictor.predictOptimization(pieces, materials, config);
        console.log('📊 Usando predicción tradicional');
      }
      
      setPrediction(result);
    } catch (err) {
      console.warn('Error predicting waste:', err);
      setError(err.message);
      setPrediction(null);
    } finally {
      setIsLoading(false);
    }
  }, [pieces, materials, config, isAIReady]);

  useEffect(() => {
    predict();
  }, [predict]);

  return {
    prediction,
    isLoading,
    error,
    refresh: predict
  };
}

/**
 * Hook para análisis histórico
 */
export function useHistoricalAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAIReady } = useAI();

  const loadAnalysis = useCallback(async () => {
    if (!isAIReady) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getHistoricalInsights();
      setAnalysis(result);
    } catch (err) {
      console.warn('Error loading historical analysis:', err);
      setError(err.message);
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAIReady]);

  useEffect(() => {
    loadAnalysis();
  }, [loadAnalysis]);

  const exportAnalysis = useCallback(() => {
    if (!analysis) return null;
    const dataStr = JSON.stringify(analysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `cutting-optimizer-analysis-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [analysis]);

  return {
    analysis,
    isLoading,
    error,
    refresh: loadAnalysis,
    exportAnalysis
  };
}

/**
 * Hook para feedback del usuario sobre optimizaciones
 */
export function useFeedback() {
  const [pendingFeedback, setPendingFeedback] = useState(null);
  const { processOptimization } = useAI();

  const requestFeedback = useCallback((optimizationData) => {
    setPendingFeedback(optimizationData);
  }, []);

  const submitFeedback = useCallback(async (rating, comments = '') => {
    if (!pendingFeedback) return;

    try {
      await processOptimization(
        pendingFeedback.pieces,
        pendingFeedback.materials,
        pendingFeedback.config,
        pendingFeedback.result,
        {
          rating: rating / 5, // Normalizar a 0-1
          comments,
          timestamp: new Date().toISOString()
        }
      );

      setPendingFeedback(null);
      return true;
    } catch (error) {
      console.warn('Error enviando feedback:', error);
      return false;
    }
  }, [pendingFeedback, processOptimization]);

  const skipFeedback = useCallback(() => {
    setPendingFeedback(null);
  }, []);

  return {
    pendingFeedback,
    requestFeedback,
    submitFeedback,
    skipFeedback,
    hasPendingFeedback: !!pendingFeedback
  };
}

/**
 * Hook combinado para proyectos inteligentes
 */
export function useSmartProject(pieces, materials, config) {
  const suggestions = useSmartSuggestions(pieces, materials, config);
  const prediction = useWastePrediction(pieces, materials, config);
  const assistant = useAssistant();
  const feedback = useFeedback();
  // Llamar hooks en el nivel superior
  const { processOptimization } = useAI();

  const processProject = useCallback(async (result) => {
    // Procesar con IA
    const aiResult = await processOptimization(pieces, materials, config, result);

    // Solicitar feedback si es apropiado
    if (result.totalUtilization < 0.8 || result.failedPlacements > 0) {
      feedback.requestFeedback({ pieces, materials, config, result });
    }

    return aiResult;
  }, [pieces, materials, config, feedback, processOptimization]);

  return {
    suggestions,
    prediction,
    assistant,
    feedback,
    processProject
  };
}