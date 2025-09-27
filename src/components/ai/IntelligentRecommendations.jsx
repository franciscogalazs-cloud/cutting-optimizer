/**
 * Componente de Recomendaciones Inteligentes
 * Muestra sugerencias y optimizaciones basadas en IA
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Lightbulb, 
  Settings, 
  Zap, 
  Workflow,
  CheckCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  Target,
  Clock,
  Star
} from 'lucide-react';
import { intelligentRecommendationSystem } from '../../ai/IntelligentRecommendationSystem';

export function IntelligentRecommendations({ pieces = [], materials = [], config = {}, currentResult = null, onApplyRecommendation }) {
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [appliedRecommendations, setAppliedRecommendations] = useState(new Set());

  const generateRecommendations = useCallback(async () => {
    if (pieces.length === 0 || materials.length === 0) {
      setRecommendations(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await intelligentRecommendationSystem.generateRecommendations(
        pieces, materials, config, currentResult
      );
      setRecommendations(result);
    } catch (err) {
      console.error('Error generando recomendaciones:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pieces, materials, config, currentResult]);

  useEffect(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  const handleApplyRecommendation = async (recommendation) => {
    if (onApplyRecommendation) {
      try {
        await onApplyRecommendation(recommendation);
        setAppliedRecommendations(prev => new Set([...prev, recommendation.title]));
      } catch (err) {
        console.error('Error aplicando recomendación:', err);
      }
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTabIcon = (tabType) => {
    switch (tabType) {
      case 'immediate': return <Zap className="h-4 w-4" />;
      case 'configuration': return <Settings className="h-4 w-4" />;
      case 'optimization': return <TrendingUp className="h-4 w-4" />;
      case 'workflow': return <Workflow className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-[var(--border)] bg-[var(--surface)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--text)]">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            Recomendaciones Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-[var(--muted)]">Analizando y generando recomendaciones...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-[var(--border)] bg-[var(--surface)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--text)]">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            Recomendaciones Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Error generando recomendaciones: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || Object.values(recommendations.recommendations).every(arr => arr.length === 0)) {
    return (
      <Card className="border-[var(--border)] bg-[var(--surface)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--text)]">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            Recomendaciones Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-[var(--muted)]">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p>¡Excelente! No hay recomendaciones adicionales.</p>
            <p className="text-sm">Tu configuración actual parece óptima.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { recommendations: recs, confidence, basedOnCases } = recommendations;

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-[var(--text)]">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-500" />
            Recomendaciones Inteligentes
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">
              <Star className="h-3 w-3 mr-1" />
              {Math.round(confidence * 100)}% confianza
            </Badge>
            {basedOnCases > 0 && (
              <Badge variant="outline">
                <Target className="h-3 w-3 mr-1" />
                {basedOnCases} casos similares
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="immediate" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="immediate" className="flex items-center gap-1">
              {getTabIcon('immediate')}
              <span className="hidden sm:inline">Inmediato</span>
            </TabsTrigger>
            <TabsTrigger value="configuration" className="flex items-center gap-1">
              {getTabIcon('configuration')}
              <span className="hidden sm:inline">Configuración</span>
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-1">
              {getTabIcon('optimization')}
              <span className="hidden sm:inline">Optimización</span>
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-1">
              {getTabIcon('workflow')}
              <span className="hidden sm:inline">Flujo</span>
            </TabsTrigger>
          </TabsList>

          {Object.entries(recs).map(([category, categoryRecs]) => {
            if (category === 'priority' || categoryRecs.length === 0) return null;
            
            return (
              <TabsContent key={category} value={category} className="space-y-4">
                {categoryRecs.map((rec, index) => (
                  <RecommendationCard
                    key={`${category}-${index}`}
                    recommendation={rec}
                    isApplied={appliedRecommendations.has(rec.title)}
                    onApply={() => handleApplyRecommendation(rec)}
                    getPriorityIcon={getPriorityIcon}
                    getPriorityColor={getPriorityColor}
                  />
                ))}
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Resumen de prioridad */}
        {recs.priority && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Recomendación Principal</span>
            </div>
            <p className="text-sm text-blue-800">
              {recs.priority.recommendation === 'focus_efficiency' && 
                'Enfócate en mejorar la eficiencia de utilización del material.'}
              {recs.priority.recommendation === 'simplify_approach' && 
                'Simplifica la configuración debido a la complejidad del problema.'}
              {recs.priority.recommendation === 'optimize_incrementally' && 
                'Optimiza gradualmente haciendo ajustes pequeños.'}
              {recs.priority.recommendation === 'basic_setup' && 
                'Verifica la configuración básica antes de continuar.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ recommendation, isApplied, onApply, getPriorityIcon, getPriorityColor }) {
  return (
    <div className={`border rounded-lg p-4 ${isApplied ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          {getPriorityIcon(recommendation.priority)}
          <div>
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              {recommendation.title}
              {isApplied && <CheckCircle className="h-4 w-4 text-green-500" />}
            </h4>
            <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
          </div>
        </div>
        <Badge className={getPriorityColor(recommendation.priority)}>
          {recommendation.priority}
        </Badge>
      </div>

      {recommendation.actions && recommendation.actions.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Acciones sugeridas:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            {recommendation.actions.map((action, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {recommendation.expectedImprovement && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {recommendation.expectedImprovement}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {Math.round((recommendation.confidence || 0) * 100)}% confianza
          </div>
        </div>
        
        {onApply && !isApplied && (
          <Button
            size="sm"
            variant="outline"
            onClick={onApply}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            Aplicar
          </Button>
        )}
        
        {isApplied && (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aplicado
          </Badge>
        )}
      </div>
    </div>
  );
}

export default IntelligentRecommendations;