import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Ruler, Tag, Square, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PatternCanvas2D from './PatternCanvas2D.jsx';
import ThumbnailStrip from './ThumbnailStrip.jsx';
import { mapSideOriginalToPlaced } from '@/lib/edge-mapping.js';
import { getEdgeColor as pickEdgeColor } from '@/theme/edge-colors.js';
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
// utilidades no usadas eliminadas para pasar lint
// pickEdgeColor viene de util centralizado (evita negro y mantiene contraste)

export const AdvancedCuttingPattern = ({ patterns, materials = [], units = 'mm', ai: _ai = null, onExport = null }) => {
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

  // La navegación por teclado (flechas) la maneja ThumbnailStrip; evitamos duplicar aquí.

  const setPref = (key, value) => setPrefs((prev) => ({ ...prev, [key]: value }));
  
  // Normalizar a mm para miniaturas SVG (hook antes de cualquier return)
  const toMmFactor = units === 'cm' ? 10 : units === 'in' ? 25.4 : 1;
  const thumbPatterns = useMemo(() => {
    return validPatterns.map((pat, idx) => {
      const wSheet = Math.max(1, Number(pat.materialLength) || 0) * toMmFactor;
      const hSheet = Math.max(1, Number(pat.materialWidth) || 0) * toMmFactor;
      const kerf = Number(pat.kerf || pat.kerfWidth || 0) * toMmFactor;
      const pieces = Array.isArray(pat.pieces)
        ? pat.pieces.map((pc) => ({
            x: Number(pc.x) * toMmFactor,
            y: Number(pc.y) * toMmFactor,
            w: Number(pc.width) * toMmFactor,
            h: Number(pc.height) * toMmFactor,
            color: pc.color,
          }))
        : [];
      const pMatKey = pat.materialName ?? pat.materialId ?? '';
      return {
        id: String(pat.id ?? pat.materialName ?? pat.materialId ?? idx),
        widthMm: wSheet,
        heightMm: hSheet,
        kerfMm: kerf,
        pieces,
        theme: getMaterialTheme(pMatKey),
      };
    });
  }, [validPatterns, toMmFactor]);

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
  const resolveMaterialName = (pat) => pat?.materialName ?? (Array.isArray(materials) ? (materials.find(m => m.id === pat?.materialId)?.material) : undefined) ?? '';
  const materialName = resolveMaterialName(currentPattern);
  const materialKey = currentPattern.materialName ?? currentPattern.materialId ?? '';
  const theme = getMaterialTheme(materialKey);
  // Variables para dibujo se recalculan dentro de PatternCanvas; evitar duplicados en este scope.

  const nextPattern = () => setCurrentPatternIndex((prev) => (prev + 1) % validPatterns.length);
  const prevPattern = () => setCurrentPatternIndex((prev) => (prev - 1 + validPatterns.length) % validPatterns.length);
  // pieceCount removido: no se usa en la UI

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
      <CardHeader className="relative">
        <CardTitle className="text-[var(--text)]">
          <h2 className="text-2xl font-normal leading-tight truncate pr-40 text-[var(--text)]">{materialName || 'Patrones'}</h2>
        </CardTitle>
        <div className="absolute right-3 top-3 flex items-center gap-2">
          {onExport ? (
            <Button variant="outline" size="sm" onClick={onExport} className="border-[var(--border)] text-[var(--text)]">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={prevPattern} disabled={validPatterns.length <= 1} className="border-[var(--border)] text-[var(--text)]">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextPattern} disabled={validPatterns.length <= 1} className="border-[var(--border)] text-[var(--text)]">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Tira de miniaturas (navegación entre hojas) */}
        <div className="-mt-1 mb-2">
          <ThumbnailStrip
          patterns={thumbPatterns}
          activeIndex={currentPatternIndex}
          onSelect={setCurrentPatternIndex}
          />
        </div>
        
  <section className="grid grid-rows-[auto,1fr] min-h-[calc(100vh-160px)]">
          <div>
            <div className="flex justify-center">
              <div className="relative inline-block">
                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
                  <button
                    type="button"
                    aria-label="Alternar dimensiones"
                    onClick={() => setPref('showDimensions', !showDimensions)}
                    className={`h-8 w-8 rounded-full border transition-colors flex items-center justify-center ${
                      showDimensions ? 'bg-[var(--primary)] text-white border-[var(--primary)] hover:brightness-110' : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:bg-[var(--border)]/40 hover:border-[var(--border)] hover:text-[var(--text)]'
                    }`}
                  >
                    <Ruler className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Alternar etiquetas"
                    onClick={() => setPref('showLabels', !showLabels)}
                    className={`h-8 w-8 rounded-full border transition-colors flex items-center justify-center ${
                      showLabels ? 'bg-[var(--primary)] text-white border-[var(--primary)] hover:brightness-110' : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:bg-[var(--border)]/40 hover:border-[var(--border)] hover:text-[var(--text)]'
                    }`}
                  >
                    <Tag className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Alternar cantos"
                    onClick={() => setPref('showEdges', !showEdges)}
                    className={`h-8 w-8 rounded-full border transition-colors flex items-center justify-center ${
                      showEdges ? 'bg-[var(--primary)] text-white border-[var(--primary)] hover:brightness-110' : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:bg-[var(--border)]/40 hover:border-[var(--border)] hover:text-[var(--text)]'
                    }`}
                  >
                    <Square className="h-4 w-4" />
                  </button>
                </div>

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
                responsive={true}
                highlightPieceIndex={hoveredPiece}
                highlightEdge={hoveredEdge}
              />
              </div>
            </div>
            <h4 className="mt-6 text-sm font-medium text-[var(--text)]">Piezas en este patrón</h4>
          </div>

          <div className="mt-3">
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
            >
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
                          Dim: {formatDimension(piece.width)} × {formatDimension(piece.height)} {units}
                        </span>
                      </div>
                    {piece.edges && (
                      <ul className="mt-2 space-y-1">
                        {sides
                          .filter(({ key }) => (piece.edges?.[key]?.enabled))
                          .sort((a, b) => a.order - b.order)
                          .map(({ key, label, order }) => {
                            const conf = piece.edges?.[key];
                            // Calcular largo mostrado según el lado ORIGINAL y el estado de rotación
                            // Usar el lado COLOCADO para alinear el número con lo dibujado en el canvas
                            const placedSide = mapSideOriginalToPlaced(key, rotated, 'CW');
                            const shownLen = (placedSide === 'arriba' || placedSide === 'abajo')
                              ? Number(piece.width)
                              : Number(piece.height);
                            const color = pickEdgeColor(conf?.tipo, order, fillColor);
                            const title = `${label} · ${conf?.tipo || 'General'} · ${formatLenUnits(shownLen, units)} ${units}`;
                            // Para resaltar en canvas, mapear lado ORIGINAL -> lado colocado
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
 
