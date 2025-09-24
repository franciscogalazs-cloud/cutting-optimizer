import { useState, useCallback } from 'react';
import { BestFitDecreasing } from '../algorithms/bestFitDecreasing.js';
import { BacktrackingOptimizer } from '../algorithms/backtrackingOptimizer.js';

export const useOptimization = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const optimize = useCallback(async (pieces, materials, config = {}) => {
    if (pieces.length === 0) {
      setError('No hay piezas para optimizar');
      return;
    }

    if (materials.length === 0) {
      setError('No hay materiales disponibles');
      return;
    }

    setIsOptimizing(true);
    setError(null);
    setProgress(0);
    setResult(null);

    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Permitir elegir algoritmo: 'maxrects' o 'bfd' (best fit decreasing)
      const optimizationResult = await new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const normalizedConfig = {
              ...config,
              kerf: config.kerf ?? config.kerfWidth,
            };
            // Siempre usar Backtracking como algoritmo predeterminado
            const optimizer = new BacktrackingOptimizer(normalizedConfig);
            const result = optimizer.optimize(pieces, materials);
            resolve(result);
          } catch (err) {
            reject(err);
          }
        }, 1000);
      });

      clearInterval(progressInterval);
      setProgress(100);
      setResult(optimizationResult);
    } catch (err) {
      setError(err.message || 'Error durante la optimización');
      console.error('Error en optimización:', err);
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(0);
    setIsOptimizing(false);
  }, []);

  return {
    optimize,
    reset,
    isOptimizing,
    result,
    error,
    progress
  };
};
