import { useState, useCallback } from 'react';
import { BestFitDecreasing } from '../algorithms/bestFitDecreasing.js';
import { BacktrackingOptimizer } from '../algorithms/backtrackingOptimizer.js';
import { MaxRectsOptimizer } from '../algorithms/maxRectsOptimizer.js';
import { GuillotineOptimizer } from '../algorithms/guillotineOptimizer.js';

const ALGORITHM_FALLBACK = 'bfd';

const createOptimizer = (config) => {
  const key = String(config.algorithm ?? ALGORITHM_FALLBACK).toLowerCase();
  switch (key) {
    case 'bfd':
    case 'bestfit':
    case 'bestfitdecreasing':
      return new BestFitDecreasing(config);
    case 'maxrects':
    case 'max-rects':
      return new MaxRectsOptimizer(config);
    case 'backtracking':
    case 'bt':
      return new BacktrackingOptimizer(config);
    case 'guillotine':
    case 'shelf':
    case 'shelves':
      return new GuillotineOptimizer(config);
    default:
      return new BestFitDecreasing(config);
  }
};

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

    let progressInterval;

    try {
      const normalizedConfig = {
        ...config,
        kerf: config.kerf ?? config.kerfWidth,
      };

      const optimizer = createOptimizer(normalizedConfig);

      progressInterval = window.setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const optimizationResult = await new Promise((resolve, reject) => {
        window.setTimeout(() => {
          try {
            resolve(optimizer.optimize(pieces, materials));
          } catch (err) {
            reject(err);
          }
        }, 1000);
      });

      setProgress(100);
      setResult(optimizationResult);
    } catch (err) {
      setError(err?.message || 'Error durante la optimizacion');
      console.error('Error en optimizacion:', err);
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
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
    progress,
  };
};


