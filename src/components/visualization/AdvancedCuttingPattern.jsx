import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Ruler, Tag, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PatternCanvas2D from './PatternCanvas2D.jsx';
import { mapSideOriginalToPlaced } from '@/lib/edge-mapping.js';
import { EDGE_TYPE_COLORS, getEdgeColor as pickEdgeColor } from '@/theme/edge-colors.js';
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

// Para los largos de cantos, mostramos enteros en mm/cm y 2 decimales en pulgadas
const formatLenUnits = (value, units) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  if (units === 'mm' || units === 'cm') {
    return Math.round(n).toLocaleString();
  }
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

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

const hexToRgb = (hex = '') => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex) || /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
  if (!m) return { r: 0, g: 0, b: 0 };
  const r = m[1].length === 1 ? parseInt(m[1] + m[1], 16) : parseInt(m[1], 16);
  const g = m[2].length === 1 ? parseInt(m[2] + m[2], 16) : parseInt(m[2], 16);
  const b = m[3].length === 1 ? parseInt(m[3] + m[3], 16) : parseInt(m[3], 16);
  return { r, g, b };
};
const toRgba = (hex, a = 1) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};
const textOn = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  const [R, G, B] = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * R + 0.7152 * G + 0.0722 * B;
  return L > 0.5 ? '#111827' : '#ffffff';
};
// pickEdgeColor viene de util centralizado (evita negro y mantiene contraste)

export const AdvancedCuttingPattern = ({ patterns, units = 'mm', ai = null }) => {
  const preferencesFromStorage = useMemo(() => loadPreferences(), []);
  const [prefs, setPrefs] = useState(() => ({ ...DEFAULT_PREFS, ...(preferencesFromStorage ?? {}) }));
  const { showDimensions, showLabels, showEdges } = prefs;

  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [hoveredPiece, setHoveredPiece] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null); // { pieceIndex, side }
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
        <section className="grid grid-rows-[auto,1fr] min-h-[calc(100vh-160px)]">
          <div>
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
                highlightPieceIndex={hoveredPiece}
                highlightEdge={hoveredEdge}
              />
            </div>
            <h4 className="mt-6 text-sm font-medium text-[var(--text)]">Piezas en este patrón</h4>
          </div>

          <div className="overflow-auto mt-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {currentPattern.pieces.map((piece, index) => {
              const fillColor = piece.color ?? theme.palette[index % theme.palette.length];
              const isHovered = hoveredPiece === index;
              const rotated = !!piece.rotated;
              const sides = [
                { key: 'arriba', short: 'A', label: 'Arriba', len: piece.width, order: 0 },
                { key: 'derecha', short: 'D', label: 'Derecha', len: piece.height, order: 1 },
                { key: 'abajo', short: 'B', label: 'Abajo', len: piece.width, order: 2 },
                { key: 'izquierda', short: 'I', label: 'Izquierda', len: piece.height, order: 3 },
              ];
              return (
                <div
                  key={`${piece.pieceId ?? piece.id ?? index}-summary`}
                  className={`flex items-center gap-3 rounded-[var(--radius)] border p-3 transition-colors ${
                    isHovered ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)] bg-[var(--surface)]'
                  }`}
                  onMouseEnter={() => setHoveredPiece(index)}
                  onMouseLeave={() => setHoveredPiece(null)}
                >
                    <div className="flex min-w-0 flex-1 flex-col text-xs text-[var(--muted)]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: fillColor }} />
                        <span className="text-sm font-medium text-[var(--text)] truncate">{piece.label}</span>
                        {rotated && (
                          <span className="text-sm leading-none text-red-500" title="Rotada 90°" aria-label="Rotada">↻</span>
                        )}
                        <span className="text-sm text-[var(--muted)]">
                          {formatDimension(piece.width)} × {formatDimension(piece.height)} {units}
                        </span>
                      </div>
                    {piece.edges && (
                      <ul className="mt-2 space-y-1">
                        {sides
                          .filter(({ key }) => (piece.edges?.[key]?.enabled))
                          .sort((a, b) => a.label.localeCompare(b.label, 'es'))
                          .map(({ key, label, len, order }) => {
                            const conf = piece.edges?.[key];
                            // Calcular largo mostrado según el lado ORIGINAL y el estado de rotación
                            const originalLength = rotated ? Number(piece.height) : Number(piece.width); // Arriba/Abajo
                            const originalWidth = rotated ? Number(piece.width) : Number(piece.height); // Izquierda/Derecha
                            const shownLen = (key === 'arriba' || key === 'abajo') ? originalLength : originalWidth;
                            const color = pickEdgeColor(conf?.tipo, order, fillColor);
                            const title = `${label} · ${conf?.tipo || 'General'} · ${formatLenUnits(shownLen, units)} ${units}`;
                            // Para resaltar en canvas, mapear lado ORIGINAL -> lado colocado
                            const placedSide = mapSideOriginalToPlaced(key, rotated, 'CW');
                            return (
                              <li
                                key={`${key}-${order}`}
                                title={title}
                                className="flex items-center gap-2 text-[12px] leading-5 text-[var(--text)]"
                                onMouseEnter={() => setHoveredEdge({ pieceIndex: index, side: placedSide, originalSide: key })}
                                onMouseLeave={() => setHoveredEdge(null)}
                              >
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                                <span className="opacity-80">{label}</span>
                                <span className="opacity-70">{conf?.tipo || 'General'}</span>
                                <span className="opacity-60">· {formatLenUnits(shownLen, units)} {units}</span>
                              </li>
                            );
                          })}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
};
 
