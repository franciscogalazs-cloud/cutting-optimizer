import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const CuttingPattern = ({ patterns, units = 'mm' }) => {
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [hoveredPiece, setHoveredPiece] = useState(null);

  if (!patterns || patterns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patrones de Corte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No hay patrones de corte generados</p>
            <p className="text-sm">Ejecuta la optimización para ver los resultados</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPattern = patterns[currentPatternIndex];
  const maxDimension = Math.max(currentPattern.materialLength, currentPattern.materialWidth);
  const scale = (400 / maxDimension) * zoom;

  const nextPattern = () => {
    setCurrentPatternIndex((prev) => (prev + 1) % patterns.length);
  };

  const prevPattern = () => {
    setCurrentPatternIndex((prev) => (prev - 1 + patterns.length) % patterns.length);
  };

  const zoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Patrones de Corte</span>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              Hoja {currentPatternIndex + 1} de {patterns.length}
            </Badge>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={prevPattern}
                disabled={patterns.length <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextPattern}
                disabled={patterns.length <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Información del patrón */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium text-gray-700">Dimensiones</div>
              <div>{currentPattern.materialLength} × {currentPattern.materialWidth} {units}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded">
              <div className="font-medium text-blue-700">Utilización</div>
              <div>{currentPattern.utilization.toFixed(1)}%</div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="font-medium text-red-700">Desperdicio</div>
              <div>{currentPattern.waste.toLocaleString()} {units}²</div>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <div className="font-medium text-green-700">Piezas</div>
              <div>{currentPattern.pieces.length}</div>
            </div>
          </div>

          {/* Controles de zoom */}
          <div className="flex items-center justify-center space-x-2">
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600">Zoom: {Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Visualización del patrón */}
          <div className="flex justify-center">
            <div className="relative border-2 border-gray-300 bg-gray-100">
              <svg
                width={currentPattern.materialLength * scale}
                height={currentPattern.materialWidth * scale}
                className="bg-white"
                onMouseLeave={() => setHoveredPiece(null)}
              >
                {/* Tablero base */}
                <rect
                  x="0"
                  y="0"
                  width={currentPattern.materialLength * scale}
                  height={currentPattern.materialWidth * scale}
                  fill="white"
                  stroke="#d1d5db"
                  strokeWidth="2"
                />

                {/* Piezas */}
                {currentPattern.pieces.map((piece, index) => (
                  <g key={index}>
                    <rect
                      x={piece.x * scale}
                      y={piece.y * scale}
                      width={piece.width * scale}
                      height={piece.height * scale}
                      fill={piece.color || '#3B82F6'}
                      fillOpacity={hoveredPiece === index ? 0.8 : 0.6}
                      stroke="#1f2937"
                      strokeWidth="1"
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredPiece(index)}
                    />
                    
                    {/* Etiqueta de la pieza */}
                    {piece.width * scale > 40 && piece.height * scale > 20 && (
                      <text
                        x={piece.x * scale + (piece.width * scale) / 2}
                        y={piece.y * scale + (piece.height * scale) / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-medium fill-white pointer-events-none"
                        style={{ fontSize: Math.max(8, Math.min(12, zoom * 10)) }}
                      >
                        {piece.label}
                      </text>
                    )}

                    {/* Indicador de rotación */}
                    {piece.rotated && (
                      <RotateCcw
                        className="absolute text-white"
                        style={{
                          left: piece.x * scale + 4,
                          top: piece.y * scale + 4,
                          width: Math.min(16, piece.width * scale * 0.2),
                          height: Math.min(16, piece.height * scale * 0.2)
                        }}
                      />
                    )}
                  </g>
                ))}
              </svg>

              {/* Tooltip para pieza seleccionada */}
              {hoveredPiece !== null && (
                <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
                  <div className="font-medium">{currentPattern.pieces[hoveredPiece].label}</div>
                  <div>
                    {currentPattern.pieces[hoveredPiece].width} × {currentPattern.pieces[hoveredPiece].height} {units}
                  </div>
                  {currentPattern.pieces[hoveredPiece].rotated && (
                    <div className="text-yellow-300">Rotado</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lista de piezas en el patrón */}
          <div className="mt-4">
            <h4 className="font-medium mb-2">Piezas en este patrón:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {currentPattern.pieces.map((piece, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-2 bg-gray-50 rounded"
                  onMouseEnter={() => setHoveredPiece(index)}
                  onMouseLeave={() => setHoveredPiece(null)}
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: piece.color }}
                  />
                  <span className="font-medium">{piece.label}</span>
                  <span className="text-gray-600">
                    {piece.width} × {piece.height} {units}
                  </span>
                  {piece.rotated && (
                    <Badge variant="outline" className="text-xs">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Rotado
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

