/**
 * Sistema de Análisis de Eficiencia en Tiempo Real
 * Monitorea continuamente la configuración y sugiere mejoras
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Zap,
  Target,
  Clock,
  BarChart3
} from 'lucide-react';
// import { intelligentRecommendationSystem } from '../../ai/IntelligentRecommendationSystem';

// Helpers puros fuera del componente para estabilidad y evitar recreaciones en cada render
const calculateConfigurationComplexityHelper = (pieces, materials, config) => {
  let complexityScore = 0;
  const pieceVariety = new Set(pieces.map(p => `${p.length}x${p.width}`)).size;
  const materialVariety = new Set(materials.map(m => `${m.length}x${m.width}`)).size;
  complexityScore += Math.min(0.3, (pieceVariety / (pieces.length || 1)) * 0.5);
  complexityScore += Math.min(0.2, (materialVariety / (materials.length || 1)) * 0.3);
  const totalPieces = pieces.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  if (totalPieces > 50) complexityScore += 0.2;
  if (totalPieces > 100) complexityScore += 0.1;
  if ((config.kerfWidth || 0) > 4) complexityScore += 0.1;
  if ((config.margin || 0) > 10) complexityScore += 0.1;
  return complexityScore;
};

const calculateOptimizationPotentialHelper = (theoretical, real, complexity) => {
  const efficiencyGap = Math.max(0, theoretical - real);
  const complexityPenalty = complexity * 20;
  const potential = efficiencyGap - complexityPenalty;
  return Math.max(0, potential);
};

const getTrendHelper = (current, previous, threshold, inverse = false) => {
  const diff = current - previous;
  const significantChange = Math.abs(diff) > threshold;
  if (!significantChange) return 'stable';
  if (inverse) return diff > 0 ? 'worsening' : 'improving';
  return diff > 0 ? 'improving' : 'worsening';
};

export function RealTimeEfficiencyAnalysis({ 
  pieces = [], 
  materials = [], 
  config = {}, 
  result = null, 
  onSuggestionApply,
  isActive = true 
}) {
  const [analysis, setAnalysis] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metrics, setMetrics] = useState({
    efficiency: 0,
    wasteLevel: 0,
    complexity: 0,
    optimizationPotential: 0
  });
  const [trends, setTrends] = useState({
    efficiency: 'stable',
    waste: 'stable',
    complexity: 'stable'
  });

  // Análisis automático cada vez que cambian los datos
  useEffect(() => {
    if (isActive && pieces.length > 0 && materials.length > 0) {
      const timeoutId = setTimeout(() => {
        performRealTimeAnalysis();
      }, 500); // Debounce de 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [pieces, materials, config, result, isActive, performRealTimeAnalysis]);

  const calculateCurrentMetrics = useCallback((piecesArg, materialsArg, configArg, resultArg) => {
    const totalPieceArea = piecesArg.reduce((sum, p) => sum + (p.length || 0) * (p.width || 0) * (p.quantity || 0), 0);
    const totalMaterialArea = materialsArg.reduce((sum, m) => sum + (m.length || 0) * (m.width || 0) * (m.quantity || 0), 0);
    const theoreticalEfficiency = totalMaterialArea > 0 ? (totalPieceArea / totalMaterialArea) * 100 : 0;
    const realEfficiency = resultArg ? resultArg.totalUtilization || 0 : theoreticalEfficiency * 0.8;
    const wasteLevel = 100 - realEfficiency;
    const complexity = calculateConfigurationComplexityHelper(piecesArg, materialsArg, configArg);
    const optimizationPotential = calculateOptimizationPotentialHelper(
      theoreticalEfficiency,
      realEfficiency,
      complexity
    );
    return {
      efficiency: Math.min(100, Math.max(0, realEfficiency)),
      wasteLevel: Math.min(100, Math.max(0, wasteLevel)),
      complexity: Math.min(100, Math.max(0, complexity * 100)),
      optimizationPotential: Math.min(100, Math.max(0, optimizationPotential))
    };
  }, []);

  const analyzeTrends = useCallback((currentMetrics, previousMetrics) => {
    const threshold = 2;
    return {
      efficiency: getTrendHelper(currentMetrics.efficiency, previousMetrics.efficiency, threshold),
      waste: getTrendHelper(currentMetrics.wasteLevel, previousMetrics.wasteLevel, threshold, true),
      complexity: getTrendHelper(currentMetrics.complexity, previousMetrics.complexity, threshold, true)
    };
  }, []);

  const generateDetailedAnalysis = useCallback(async (_pieces, _materials, _config, _result) => {
    const analysis = {
      timestamp: new Date().toISOString(),
      summary: '',
      details: [],
      alerts: [],
      recommendations: []
    };
    if (metrics.efficiency < 60) {
      analysis.alerts.push({
        level: 'high',
        message: 'Eficiencia muy baja detectada',
        detail: `Solo ${metrics.efficiency.toFixed(1)}% de utilización`
      });
    } else if (metrics.efficiency < 75) {
      analysis.alerts.push({
        level: 'medium',
        message: 'Eficiencia por debajo del óptimo',
        detail: 'Hay oportunidades de mejora'
      });
    }
    if (metrics.wasteLevel > 40) {
      analysis.alerts.push({
        level: 'high',
        message: 'Alto nivel de desperdicio',
        detail: `${metrics.wasteLevel.toFixed(1)}% de material desperdiciado`
      });
    }
    if (metrics.complexity > 70) {
      analysis.alerts.push({
        level: 'medium',
        message: 'Configuración muy compleja',
        detail: 'Considerar simplificar para mejores resultados'
      });
    }
    if (analysis.alerts.length === 0) {
      analysis.summary = '✅ Configuración óptima detectada';
    } else {
      const highAlerts = analysis.alerts.filter(a => a.level === 'high').length;
      analysis.summary = highAlerts > 0
        ? `⚠️ ${highAlerts} problema(s) crítico(s) detectado(s)`
        : `📊 ${analysis.alerts.length} oportunidad(es) de mejora detectada(s)`;
    }
    return analysis;
  }, [metrics]);

  const getImmediateSuggestions = useCallback(async (_pieces, _materials, _config, currentMetrics) => {
    const suggestions = [];
    if (currentMetrics.efficiency < 70) {
      suggestions.push({
        id: 'improve-efficiency',
        type: 'efficiency',
        priority: 'high',
        title: 'Mejorar eficiencia',
        action: 'Cambiar algoritmo a hybrid',
        impact: '+10-15% utilización',
        timeToApply: '1 click'
      });
    }
    if (currentMetrics.wasteLevel > 35) {
      suggestions.push({
        id: 'reduce-waste',
        type: 'waste',
        priority: 'high',
        title: 'Reducir desperdicio',
        action: 'Ajustar márgenes de corte',
        impact: '-5-10% desperdicio',
        timeToApply: '30 segundos'
      });
    }
    if (currentMetrics.complexity > 60) {
      suggestions.push({
        id: 'simplify-config',
        type: 'complexity',
        priority: 'medium',
        title: 'Simplificar configuración',
        action: 'Agrupar piezas similares',
        impact: 'Mejor rendimiento',
        timeToApply: '2-3 minutos'
      });
    }
    const totalPieces = _pieces.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
    if (totalPieces > 50 && _config.algorithm === 'bestFit') {
      suggestions.push({
        id: 'better-algorithm',
        type: 'algorithm',
        priority: 'medium',
        title: 'Algoritmo más potente',
        action: 'Usar maxRects para muchas piezas',
        impact: '+5-8% eficiencia',
        timeToApply: '1 click'
      });
    }
    return suggestions;
  }, []);

  const performRealTimeAnalysis = useCallback(async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    
    try {
      // Calcular métricas básicas
      const currentMetrics = calculateCurrentMetrics(pieces, materials, config, result);
      
      // Analizar tendencias
      const currentTrends = analyzeTrends(currentMetrics, metrics);
      
      // Generar análisis detallado
      const detailedAnalysis = await generateDetailedAnalysis(pieces, materials, config, result);
      
      // Obtener sugerencias inmediatas
      const immediateSuggestions = await getImmediateSuggestions(pieces, materials, config, currentMetrics);
      
      // Actualizar estados
      setMetrics(currentMetrics);
      setTrends(currentTrends);
      setAnalysis(detailedAnalysis);
      setSuggestions(immediateSuggestions);
      
    } catch (error) {
      console.error('Error en análisis en tiempo real:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [pieces, materials, config, result, metrics, isAnalyzing, analyzeTrends, calculateCurrentMetrics, generateDetailedAnalysis, getImmediateSuggestions]);

  

  const getMetricColor = (value, type) => {
    switch (type) {
      case 'efficiency':
        if (value >= 80) return 'text-green-600';
        if (value >= 60) return 'text-yellow-600';
        return 'text-red-600';
      case 'waste':
        if (value <= 20) return 'text-green-600';
        if (value <= 35) return 'text-yellow-600';
        return 'text-red-600';
      case 'complexity':
        if (value <= 40) return 'text-green-600';
        if (value <= 70) return 'text-yellow-600';
        return 'text-red-600';
      case 'potential':
        if (value >= 15) return 'text-green-600';
        if (value >= 5) return 'text-yellow-600';
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'worsening':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable':
        return <Activity className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isActive) {
    return (
      <Card className="border-[var(--border)] bg-[var(--surface)] opacity-50">
        <CardContent className="py-6">
          <div className="text-center text-[var(--muted)]">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Análisis en tiempo real desactivado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pieces.length === 0 || materials.length === 0) {
    return (
      <Card className="border-[var(--border)] bg-[var(--surface)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--text)]">
            <Activity className="h-5 w-5 text-blue-500" />
            Análisis en Tiempo Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-[var(--muted)]">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Agrega piezas y materiales para comenzar el análisis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-[var(--text)]">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Análisis en Tiempo Real
            {isAnalyzing && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            )}
          </div>
          <Badge variant={analysis?.alerts.length > 0 ? 'destructive' : 'default'}>
            {analysis?.alerts.length || 0} alertas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métricas principales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Eficiencia</span>
              {getTrendIcon(trends.efficiency)}
            </div>
            <div className={`text-2xl font-bold ${getMetricColor(metrics.efficiency, 'efficiency')}`}>
              {metrics.efficiency.toFixed(1)}%
            </div>
            <Progress value={metrics.efficiency} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Desperdicio</span>
              {getTrendIcon(trends.waste)}
            </div>
            <div className={`text-2xl font-bold ${getMetricColor(metrics.wasteLevel, 'waste')}`}>
              {metrics.wasteLevel.toFixed(1)}%
            </div>
            <Progress value={metrics.wasteLevel} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Complejidad</span>
              {getTrendIcon(trends.complexity)}
            </div>
            <div className={`text-2xl font-bold ${getMetricColor(metrics.complexity, 'complexity')}`}>
              {metrics.complexity.toFixed(0)}%
            </div>
            <Progress value={metrics.complexity} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Potencial</span>
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <div className={`text-2xl font-bold ${getMetricColor(metrics.optimizationPotential, 'potential')}`}>
              +{metrics.optimizationPotential.toFixed(0)}%
            </div>
            <Progress value={metrics.optimizationPotential} className="h-2" />
          </div>
        </div>

        {/* Alertas */}
        {analysis?.alerts && analysis.alerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Alertas Detectadas</h4>
            {analysis.alerts.map((alert, index) => (
              <Alert 
                key={index} 
                className={`${
                  alert.level === 'high' ? 'border-red-200 bg-red-50' : 
                  'border-yellow-200 bg-yellow-50'
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{alert.message}</strong>
                  <br />
                  <span className="text-sm">{alert.detail}</span>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Sugerencias inmediatas */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Sugerencias Inmediatas</h4>
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <div 
                  key={suggestion.id} 
                  className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200"
                >
                  <div className="flex items-start gap-3">
                    {getPriorityIcon(suggestion.priority)}
                    <div>
                      <div className="font-medium text-sm">{suggestion.title}</div>
                      <div className="text-xs text-gray-600">{suggestion.action}</div>
                      <div className="text-xs text-green-600 mt-1">
                        💡 {suggestion.impact} • ⏱️ {suggestion.timeToApply}
                      </div>
                    </div>
                  </div>
                  {onSuggestionApply && (
                    <Button
                      size="sm"
                      onClick={() => onSuggestionApply(suggestion)}
                      className="text-xs"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Aplicar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen del análisis */}
        {analysis?.summary && (
          <div className="p-3 bg-gray-50 rounded-lg border">
            <div className="text-sm font-medium text-gray-900">
              {analysis.summary}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Última actualización: {new Date(analysis.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RealTimeEfficiencyAnalysis;