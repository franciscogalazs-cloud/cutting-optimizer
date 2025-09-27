import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Ruler, Tag, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PatternCanvas2D from './PatternCanvas2D.jsx';
// eliminado control de tamaño

const PREFS_STORAGE_KEY = 'pattern-view-preferences';

const BOARD_THEMES = [
  { background: '#eff6ff', border: '#1d4ed8', palette: ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb'] },
  { background: '#f5f3ff', border: '#6d28d9', palette: ['#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6'] },
  { background: '#ecfdf5', border: '#047857', palette: ['#6ee7b7', '#34d399', '#10b981', '#059669'] },
  { background: '#fff7ed', border: '#c2410c', palette: ['#fdba74', '#fb923c', '#f97316', '#ea580c'] },
];

const hashString = (value = '') => {
  let hash = 0;
  const str = value;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return hash;
};

const getMaterialTheme = (materialName = '') => {
  const key = materialName.trim().toLowerCase();
  if (!key) return BOARD_THEMES[0];
  const index = Math.abs(hashString(key)) % BOARD_THEMES.length;
  return BOARD_THEMES[index];
};

const formatDimension = (value) =>
  Number.isFinite(Number(value))
    ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : value;

const loadPreferences = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (error) {
    console.warn('No se pudo cargar la configuración de patrones', error);
  }
  return null;
};

const savePreferences = (prefs) => {
  try {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.warn('No se pudo guardar la configuración de patrones', error);
  }
};

const DEFAULT_PREFS = {
  showDimensions: true,
  showLabels: true,
  showEdges: true,
};

export const AdvancedCuttingPattern = ({ patterns, units = 'mm', ai = null }) => {
  const preferencesFromStorage = useMemo(() => loadPreferences(), []);
  const [prefs, setPrefs] = useState(() => ({ ...DEFAULT_PREFS, ...(preferencesFromStorage ?? {}) }));
  const { showDimensions, showLabels, showEdges } = prefs;

  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [hoveredPiece, setHoveredPiece] = useState(null);
  // Render por defecto en Canvas 2D (sin switch de alternancia)

  const validPatterns = useMemo(() => (Array.isArray(patterns) ? patterns : []), [patterns]);

  useEffect(() => {
    savePreferences(prefs);
  }, [prefs]);

  useEffect(() => {
    const handleKeyNavigation = (event) => {
      if (!validPatterns.length) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setCurrentPatternIndex((prev) => (prev + 1) % validPatterns.length);
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentPatternIndex((prev) => (prev - 1 + validPatterns.length) % validPatterns.length);
      }
    };
    window.addEventListener('keydown', handleKeyNavigation);
    return () => window.removeEventListener('keydown', handleKeyNavigation);
  }, [validPatterns.length]);

  const setPref = (key, value) => setPrefs((prev) => ({ ...prev, [key]: value }));
  

  if (!validPatterns.length) {
    return (
      <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <CardHeader>
          <CardTitle className="text-[var(--text)]">Patrones de corte</CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center text-[var(--muted)]">
          <p>No hay patrones generados.</p>
          <p className="text-xs">Ejecuta la optimización para visualizar los cortes.</p>
        </CardContent>
      </Card>
    );
  }

  const currentPattern = validPatterns[currentPatternIndex];
  const materialKey = currentPattern.materialName ?? currentPattern.materialId ?? '';
  const theme = getMaterialTheme(materialKey);
  // Variables para dibujo se recalculan dentro de PatternCanvas; evitar duplicados en este scope.

  const nextPattern = () => setCurrentPatternIndex((prev) => (prev + 1) % validPatterns.length);
  const prevPattern = () => setCurrentPatternIndex((prev) => (prev - 1 + validPatterns.length) % validPatterns.length);

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
      <CardHeader className="flex flex-col gap-3">
        <CardTitle className="flex items-center justify-between text-[var(--text)]">
          <div>
            <span className="block text-sm text-[var(--muted)]">Patrones de corte</span>
            <span className="text-lg font-semibold">Hoja {currentPatternIndex + 1} de {validPatterns.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prevPattern} disabled={validPatterns.length <= 1} className="border-[var(--border)] text-[var(--text)]">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextPattern} disabled={validPatterns.length <= 1} className="border-[var(--border)] text-[var(--text)]">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <TooltipProvider>
            <div className="absolute right-2 top-2 z-10 flex flex-col gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Alternar dimensiones"
                    onClick={() => setPref('showDimensions', !showDimensions)}
                    className={`h-8 w-8 rounded-full border transition-colors flex items-center justify-center ${
                      showDimensions ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]'
                    }`}
                  >
                    <Ruler className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Dimensiones</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Alternar etiquetas"
                    onClick={() => setPref('showLabels', !showLabels)}
                    className={`h-8 w-8 rounded-full border transition-colors flex items-center justify-center ${
                      showLabels ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]'
                    }`}
                  >
                    <Tag className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Etiquetas</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Alternar cantos"
                    onClick={() => setPref('showEdges', !showEdges)}
                    className={`h-8 w-8 rounded-full border transition-colors flex items-center justify-center ${
                      showEdges ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]'
                    }`}
                  >
                    <Square className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Cantos</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <PatternCanvas2D
            pattern={currentPattern}
            theme={theme}
            width={820}
            height={520}
            paddingPx={24}
            showLabels={showLabels}
            showDimensions={showDimensions}
            showEdges={showEdges}
            units={units}
          />
        </div>

        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-[var(--text)]">Piezas en este patrón</h4>
          <div className="grid max-h-48 grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2 lg:grid-cols-3">
            {currentPattern.pieces.map((piece, index) => {
              const fillColor = piece.color ?? theme.palette[index % theme.palette.length];
              const isHovered = hoveredPiece === index;
              return (
                <div
                  key={`${piece.pieceId ?? piece.id ?? index}-summary`}
                  className={`flex items-center gap-3 rounded-[var(--radius)] border p-3 transition-colors ${
                    isHovered ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)] bg-[var(--surface)]'
                  }`}
                  onMouseEnter={() => setHoveredPiece(index)}
                  onMouseLeave={() => setHoveredPiece(null)}
                >
                  <div className="h-4 w-4 rounded" style={{ backgroundColor: fillColor }} />
                  <div className="flex min-w-0 flex-1 flex-col text-xs text-[var(--muted)]">
                    <span className="text-sm font-medium text-[var(--text)] break-words">{piece.label}</span>
                    <span>
                      {formatDimension(piece.width)} × {formatDimension(piece.height)} {units}
                    </span>
                    <span>
                      Posición: ({formatDimension(piece.x)}, {formatDimension(piece.y)})
                    </span>
                  </div>
                  {piece.rotated && (
                    <Badge variant="outline" className="text-xs">
                      <span className="mr-1">↻</span>
                      90°
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
 
