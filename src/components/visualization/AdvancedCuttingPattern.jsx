import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  Pointer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const PREFS_STORAGE_KEY = 'pattern-view-preferences';

const BOARD_THEMES = [
  { background: '#eff6ff', border: '#1d4ed8', palette: ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb'] },
  { background: '#f5f3ff', border: '#6d28d9', palette: ['#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6'] },
  { background: '#ecfdf5', border: '#047857', palette: ['#6ee7b7', '#34d399', '#10b981', '#059669'] },
  { background: '#fff7ed', border: '#c2410c', palette: ['#fdba74', '#fb923c', '#f97316', '#ea580c'] },
];

const formatDimension = (value) =>
  Number.isFinite(Number(value))
    ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : value;

const formatArea = (value, units) => {
  const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
  const formatted = numeric.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `${formatted} ${units}Â²`;
};

const loadPreferences = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (error) {
    console.warn('No se pudo cargar la configuraciÃ³n de patrones', error);
  }
  return null;
};

const savePreferences = (prefs) => {
  try {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.warn('No se pudo guardar la configuraciÃ³n de patrones', error);
  }
};

const DEFAULT_PREFS = {
  showGrid: true,
  showDimensions: true,
  showLabels: true,
  showWaste: false,
  zoom: 1,
  mode: 'select',
};

export const AdvancedCuttingPattern = ({ patterns, units = 'mm' }) => {
  const preferencesFromStorage = useMemo(() => loadPreferences(), []);
  const [prefs, setPrefs] = useState(preferencesFromStorage ?? DEFAULT_PREFS);
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [hoveredPiece, setHoveredPiece] = useState(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panState = useRef({ active: false, pointerId: null, start: { x: 0, y: 0 }, origin: { x: 0, y: 0 } });
  const canvasWrapperRef = useRef(null);
  const [fitScale, setFitScale] = useState(1);

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

  useEffect(() => {
    const computeFitScale = () => {
      if (!canvasWrapperRef.current || !validPatterns.length) return;
      const wrapper = canvasWrapperRef.current;
      const currentPattern = validPatterns[currentPatternIndex];
      if (!currentPattern) return;
      const paddingX = 40;
      const topPadding = 80;
      const bottomPadding = 60;
      const maxWidth = wrapper.clientWidth - paddingX * 2;
      const maxHeight = Math.max(wrapper.clientHeight - (topPadding + bottomPadding), 100);
      if (maxWidth <= 0 || maxHeight <= 0) return;
      const horizontalScale = maxWidth / currentPattern.materialLength;
      const verticalScale = maxHeight / currentPattern.materialWidth;
      const nextFit = Math.max(0.2, Math.min(horizontalScale, verticalScale));
      setFitScale(nextFit);
    };

    computeFitScale();
    window.addEventListener('resize', computeFitScale);
    return () => window.removeEventListener('resize', computeFitScale);
  }, [currentPatternIndex, validPatterns]);

  const setPref = (key, value) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const { showGrid, showDimensions, showLabels, showWaste, zoom, mode } = prefs;
  const safeZoom = Math.min(3, Math.max(0.2, zoom ?? 1));

  const thumbnails = useMemo(() =>
    validPatterns.map((pattern) => {
      const ratio = Math.min(1, 70 / pattern.materialWidth);
      const scaledWidth = Math.max(40, pattern.materialLength * ratio * 0.25);
      return { scaledWidth, ratio };
    }),
  [validPatterns]);

  if (!validPatterns.length) {
    return (
      <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <CardHeader>
          <CardTitle className="text-[var(--text)]">Patrones de corte</CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center text-[var(--muted)]">
          <p>No hay patrones generados.</p>
          <p className="text-xs">Ejecuta la optimizaciÃ³n para visualizar los cortes.</p>
        </CardContent>
      </Card>
    );
  }

  const currentPattern = validPatterns[currentPatternIndex];
  const theme = BOARD_THEMES[currentPatternIndex % BOARD_THEMES.length];
  const boardWidth = currentPattern.materialLength;
  const boardHeight = currentPattern.materialWidth;
  const paddingX = 40;
  const topPadding = 80;
  const bottomPadding = 60;
  const viewBoxWidth = boardWidth + paddingX * 2;
  const viewBoxHeight = boardHeight + topPadding + bottomPadding;

  const zoomIn = () => setPref('zoom', Math.min(3, safeZoom + 0.2));
  const zoomOut = () => setPref('zoom', Math.max(0.2, safeZoom - 0.2));
  const fitToCanvas = () => setPref('zoom', fitScale || 1);
  const toggleMode = () => setPref('mode', mode === 'pan' ? 'select' : 'pan');

  const nextPattern = () => setCurrentPatternIndex((prev) => (prev + 1) % validPatterns.length);
  const prevPattern = () => setCurrentPatternIndex((prev) => (prev - 1 + validPatterns.length) % validPatterns.length);

  const renderGrid = () => {
    if (!showGrid) return null;
    const gridSize = 100;
    const lines = [];
    for (let x = 0; x <= boardWidth; x += gridSize) {
      lines.push(
        <line
          key={`grid-v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={boardHeight}
          stroke="#e5e7eb"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />,
      );
    }
    for (let y = 0; y <= boardHeight; y += gridSize) {
      lines.push(
        <line
          key={`grid-h-${y}`}
          x1={0}
          y1={y}
          x2={boardWidth}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />,
      );
    }
    return lines;
  };

  const renderWaste = () => {
    if (!showWaste) return null;
    const materialArea = boardWidth * boardHeight;
    const usedArea = currentPattern.pieces.reduce((sum, piece) => sum + piece.width * piece.height, 0);
    if (materialArea <= usedArea) return null;
    return (
      <rect
        key="waste"
        x="0"
        y="0"
        width={boardWidth}
        height={boardHeight}
        fill={theme.border}
        fillOpacity="0.08"
        pointerEvents="none"
      />
    );
  };

  const handlePointerDown = (event) => {
    if (mode !== 'pan') return;
    panState.current = {
      active: true,
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      origin: { ...panOffset },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!panState.current.active || panState.current.pointerId !== event.pointerId) return;
    const dx = (event.clientX - panState.current.start.x) / safeZoom;
    const dy = (event.clientY - panState.current.start.y) / safeZoom;
    setPanOffset({ x: panState.current.origin.x + dx, y: panState.current.origin.y + dy });
  };

  const handlePointerUp = (event) => {
    if (panState.current.pointerId === event.pointerId) {
      panState.current = { active: false, pointerId: null, start: { x: 0, y: 0 }, origin: { x: 0, y: 0 } };
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
      <CardHeader className="flex flex-col gap-3">
        <CardTitle className="flex flex-col gap-2 text-[var(--text)]">
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-sm text-[var(--muted)]">Patrones de corte</span>
              <span className="text-lg font-semibold">Hoja {currentPatternIndex + 1} de {validPatterns.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPattern}
                disabled={validPatterns.length <= 1}
                className="border-[var(--border)] text-[var(--text)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextPattern}
                disabled={validPatterns.length <= 1}
                className="border-[var(--border)] text-[var(--text)]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2">
            {validPatterns.map((pattern, index) => {
              const { scaledWidth, ratio } = thumbnails[index];
              return (
                <button
                  key={pattern.id ?? index}
                  type="button"
                  onClick={() => setCurrentPatternIndex(index)}
                  className={`relative flex h-14 flex-shrink-0 items-center justify-center rounded-[var(--radius)] border px-2 transition focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${
                    index === currentPatternIndex
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                      : 'border-[var(--border)] bg-[var(--surface)]'
                  }`}
                >
                  <svg
                    width={scaledWidth}
                    height={pattern.materialWidth * ratio * 0.25}
                    viewBox={`0 0 ${pattern.materialLength} ${pattern.materialWidth}`}
                    className="rounded-[calc(var(--radius)/1.5)] border border-[var(--border)]"
                  >
                    <rect
                      x="0"
                      y="0"
                      width={pattern.materialLength}
                      height={pattern.materialWidth}
                      fill={BOARD_THEMES[index % BOARD_THEMES.length].background}
                      stroke={BOARD_THEMES[index % BOARD_THEMES.length].border}
                      strokeWidth="10"
                    />
                    {pattern.pieces.slice(0, 12).map((piece, idx) => (
                      <rect
                        key={idx}
                        x={piece.x}
                        y={piece.y}
                        width={piece.width}
                        height={piece.height}
                        fill={BOARD_THEMES[index % BOARD_THEMES.length].palette[idx % BOARD_THEMES[index % BOARD_THEMES.length].palette.length]}
                        opacity={0.85}
                      />
                    ))}
                  </svg>
                </button>
              );
            })}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm">
              <div className="text-xs text-[var(--muted)] uppercase">Dimensiones</div>
              <div className="text-sm font-semibold text-[var(--text)]">
                {formatDimension(currentPattern.materialLength)} Ã— {formatDimension(currentPattern.materialWidth)} {units}
              </div>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm">
              <div className="text-xs text-[var(--muted)] uppercase">UtilizaciÃ³n</div>
              <div className="text-sm font-semibold text-[var(--text)]">{currentPattern.utilization.toFixed(1)}%</div>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm">
              <div className="text-xs text-[var(--muted)] uppercase">Desperdicio</div>
              <div className="text-sm font-semibold text-[var(--text)]">{formatArea(currentPattern.waste, units)}</div>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm">
              <div className="text-xs text-[var(--muted)] uppercase">Piezas</div>
              <div className="text-sm font-semibold text-[var(--text)]">{currentPattern.pieces.length}</div>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm">
              <div className="text-xs text-[var(--muted)] uppercase">Grosor sierra</div>
              <div className="text-sm font-semibold text-[var(--text)]">{(currentPattern.kerf ?? 0).toFixed(2)} {units}</div>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm">
              <div className="text-xs text-[var(--muted)] uppercase">Margen</div>
              <div className="text-sm font-semibold text-[var(--text)]">{(currentPattern.margin ?? 0).toFixed(2)} {units}</div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute right-4 top-4 z-10 flex flex-col gap-3">
              <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)]/90 px-2 py-1 shadow-sm backdrop-blur">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--text)]" onClick={zoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <div className="px-2 text-xs font-medium text-[var(--muted)]">{Math.round(safeZoom * 100)}%</div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--text)]" onClick={zoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--text)]" onClick={fitToCanvas}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${mode === 'pan' ? 'text-[var(--primary)]' : 'text-[var(--text)]'}`}
                  onClick={toggleMode}
                  title={mode === 'pan' ? 'Cambiar a selecciÃ³n' : 'Cambiar a modo panorÃ¡mica'}
                >
                  {mode === 'pan' ? <Hand className="h-4 w-4" /> : <Pointer className="h-4 w-4" />}
                </Button>
              </div>

              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]/90 p-3 text-xs shadow-sm backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-[var(--muted)]">Mostrar grilla</Label>
                  <Switch checked={showGrid} onCheckedChange={(checked) => setPref('showGrid', checked)} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <Label className="text-[var(--muted)]">Dimensiones</Label>
                  <Switch checked={showDimensions} onCheckedChange={(checked) => setPref('showDimensions', checked)} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <Label className="text-[var(--muted)]">Etiquetas</Label>
                  <Switch checked={showLabels} onCheckedChange={(checked) => setPref('showLabels', checked)} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <Label className="text-[var(--muted)]">Ãreas de desperdicio</Label>
                  <Switch checked={showWaste} onCheckedChange={(checked) => setPref('showWaste', checked)} />
                </div>
              </div>
            </div>

            <div
              ref={canvasWrapperRef}
              className={`relative rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 ${
                mode === 'pan' ? 'cursor-grab' : 'cursor-default'
              }`}
            >
              <svg
                viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                className="h-full w-full"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              >
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
                  </marker>
                </defs>

                <g transform={`translate(${paddingX + panOffset.x}, ${topPadding + panOffset.y}) scale(${safeZoom})`}>
                  {renderGrid()}
                  {/* Nombre del material centrado arriba del tablero */}
                  <text
                    x={boardWidth / 2}
                    y={-18}
                    textAnchor="middle"
                    className="text-[13px] font-semibold fill-[var(--primary)]"
                  >
                    {currentPattern.materialName || 'Material'}
                  </text>
                  {/* Medidas del material en los bordes, letra pequeÃ±a */}
                  <text
                    x={boardWidth / 2}
                    y={-4}
                    textAnchor="middle"
                    className="text-[8px] fill-gray-700 font-medium"
                  >
                    {formatDimension(boardWidth)} {units}
                  </text>
                  <text
                    x={-4}
                    y={boardHeight / 2}
                    textAnchor="middle"
                    className="text-[8px] fill-gray-700 font-medium"
                    transform={`rotate(-90,-4,${boardHeight / 2})`}
                  >
                    {formatDimension(boardHeight)} {units}
                  </text>
                  <rect
                    x="0"
                    y="0"
                    width={boardWidth}
                    height={boardHeight}
                    fill={theme.background}
                    stroke={theme.border}
                    strokeWidth="1"
                  />
                  {/* Sin sombra en el tablero */}
                  {renderWaste()}
                  {currentPattern.pieces.map((piece, index) => {
                    const palette = theme.palette;
                    const fillColor = palette[index % palette.length];
                    const isHovered = hoveredPiece === index;
                    const minDimension = Math.min(piece.width, piece.height);
                    const fontSize = Math.max(8, Math.min(18, minDimension / 6));

                    return (
                      <g key={`${piece.pieceId ?? piece.id ?? index}`}>
                        <rect
                          x={piece.x}
                          y={piece.y}
                          width={piece.width}
                          height={piece.height}
                          fill={fillColor}
                          fillOpacity={isHovered ? 0.98 : 0.82}
                          stroke="#2563eb"
                          strokeWidth="1"
                          filter={isHovered ? "url(#pieceShadow)" : undefined}
                          className="cursor-pointer transition-all duration-200"
                          onMouseEnter={() => setHoveredPiece(index)}
                          onMouseLeave={() => setHoveredPiece(null)}
                        />
                        <filter id="pieceShadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#2563eb" flood-opacity="0.25" />
                        </filter>
                        {showLabels && piece.width > 40 && piece.height > 30 && (
                          <text
                            x={piece.x + piece.width / 2}
                            y={piece.y + piece.height / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="font-semibold fill-white pointer-events-none"
                            style={{ fontSize: fontSize * 0.6 }}
                          >
                            {piece.label}
                          </text>
                        )}
                        {piece.rotated && (
                          <g transform={`translate(${piece.x + 6}, ${piece.y + 6})`}>
                            <circle r="9" fill="rgba(15, 23, 42, 0.75)" />
                            <text x="-6" y="4" className="text-xs fill-white">â†»</text>
                          </g>
                        )}
                        {showDimensions && (
                          <>
                            {/* Medida horizontal (centro del borde superior) */}
                            <text
                              x={piece.x + piece.width / 2}
                              y={piece.y + 6}
                              textAnchor="middle"
                              className="text-[6px] fill-gray-700 font-medium"
                            >
                              {formatDimension(piece.width)} {units}
                            </text>
                            {/* Medida vertical (centro del borde izquierdo, rotada) */}
                            <text
                              x={piece.x + 6}
                              y={piece.y + piece.height / 2}
                              textAnchor="middle"
                              className="text-[6px] fill-gray-700 font-medium"
                              transform={`rotate(-90,${piece.x + 6},${piece.y + piece.height / 2})`}
                            >
                              {formatDimension(piece.height)} {units}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}
                  {/* Medidas del tablero sin flechas y mÃ¡s pequeÃ±as */}
                  {showDimensions && (
                    <text
                      x={boardWidth / 2}
                      y={boardHeight + 18}
                      textAnchor="middle"
                      className="text-[11px] fill-gray-600"
                    >
                      {formatDimension(boardWidth)} Ã— {formatDimension(boardHeight)} {units}
                    </text>
                  )}
                </g>
              </svg>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-[var(--text)]">Piezas en este patrÃ³n</h4>
            <div className="grid max-h-48 grid-cols-1 gap-3 overflow-y-auto md:grid-cols-2 lg:grid-cols-3">
              {currentPattern.pieces.map((piece, index) => {
                const palette = theme.palette;
                const fillColor = palette[index % palette.length];
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
                    <div
                      className="h-4 w-4 rounded"
                      style={{ backgroundColor: fillColor }}
                    />
                    <div className="flex min-w-0 flex-1 flex-col text-xs text-[var(--muted)]">
                      <span className="truncate text-sm font-medium text-[var(--text)]">{piece.label}</span>
                      <span>
                        {formatDimension(piece.width)} Ã— {formatDimension(piece.height)} {units}
                      </span>
                      <span>PosiciÃ³n: ({formatDimension(piece.x)}, {formatDimension(piece.y)})</span>
                    </div>
                    {piece.rotated && (
                      <Badge variant="outline" className="text-xs">
                        <span className="mr-1">â†»</span>
                        90Â°
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

