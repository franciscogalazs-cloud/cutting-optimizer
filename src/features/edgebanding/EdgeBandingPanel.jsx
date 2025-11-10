import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { computeEdgeTotals } from './edgeBanding';
import { EdgeBandingPattern } from './EdgeBandingPattern.jsx';
import { getEdgeColor } from '@/theme/edge-colors.js';
import { EdgeBandingModal } from '@/components/modals/EdgeBandingModal.jsx';

const formatMeters = (value) => value.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });

const hasAnyEdges = (totals) => Object.values(totals).some((total) => total > 0);

export const EdgeBandingPanel = ({ pieces = [], units = 'cm', onEditPiece, onDeletePiece, onGoToPiece }) => {
  const [wastePercent, setWastePercent] = useState(0);
  const [edgeBandingModal, setEdgeBandingModal] = useState({ isOpen: false, piece: null });
  
  // Cargar desperdicio desde localStorage al iniciar
  useEffect(() => {
    try {
      const raw = localStorage.getItem('edgebanding-waste-percent');
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) setWastePercent(n);
    } catch {
      // noop: ignorar errores de localStorage
    }
  }, []);

  // Lista expandida de piezas individuales (repitiendo por cantidad)
  const expandedPieces = useMemo(
    () =>
      pieces.flatMap((p) =>
        Array.from({ length: p.quantity || 1 }, (_, idx) => {
          // Crear una pieza individual con configuración de tapacantos específica para esta instancia
          const instanceKey = `${p.id}-${idx}`;
          
          // Si existe configuración específica para esta instancia, usarla; sino usar la configuración base
          let instanceEdges;
          if (p.instanceEdges && p.instanceEdges[idx]) {
            instanceEdges = p.instanceEdges[idx];
          } else {
            // Para compatibilidad hacia atrás, usar la configuración base de la pieza
            instanceEdges = p.edges || {};
          }
          
          return {
            piece: p,
            instance: idx + 1,
            instanceKey,
            // Pieza virtual con configuración específica de esta instancia
            virtualPiece: {
              ...p,
              id: instanceKey,
              edges: instanceEdges,
              originalId: p.id,
              originalInstance: idx
            }
          };
        }),
      ),
    [pieces],
  );

  // Calcular totales considerando las configuraciones por instancia
  const totals = useMemo(() => {
    const piecesForCalculation = expandedPieces.map(({ virtualPiece }) => ({
      ...virtualPiece,
      units: units // Agregar las unidades a cada pieza virtual
    }));
    return computeEdgeTotals(piecesForCalculation);
  }, [expandedPieces, units]);
  
  const sortedEntries = useMemo(
    () => Object.entries(totals).sort(([a], [b]) => a.localeCompare(b, 'es')),
    [totals],
  );

  const totalMm = useMemo(() => sortedEntries.reduce((acc, [, mm]) => acc + mm, 0), [sortedEntries]);
  const totalMeters = totalMm / 1000;
  const totalWithWaste = totalMeters * (1 + wastePercent / 100);

  const handleWasteChange = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
      setWastePercent(0);
      return;
    }
    setWastePercent(numeric);
    try {
      localStorage.setItem('edgebanding-waste-percent', String(numeric));
    } catch {
      // noop: ignorar errores de escritura en localStorage
    }
  };

  return (
    <div>
      <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <CardHeader>
          <CardTitle>Tapacantos - Totales por tipo</CardTitle>
        </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Piezas individuales</span>
            <span className="text-xl font-semibold">{expandedPieces.length}</span>
          </div>
          <label className="flex flex-col">
            <span className="text-sm text-muted-foreground">Desperdicio (%)</span>
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={wastePercent}
              onChange={(event) => handleWasteChange(event.target.value)}
              className="mt-1"
            />
          </label>
        </div>

        {hasAnyEdges(totals) ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Color</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Longitud (cm)</TableHead>
                <TableHead>Longitud (m)</TableHead>
                <TableHead>Con desperdicio (m)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.map(([tipo, mm]) => {
                const cm = mm / 10; // Convertir mm a cm
                const meters = mm / 1000;
                const metersWithWaste = meters * (1 + wastePercent / 100);
                const edgeColor = getEdgeColor(tipo);
                return (
                  <TableRow key={tipo}>
                    <TableCell>
                      <div 
                        className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                        style={{ backgroundColor: edgeColor }}
                        title={`Color para ${tipo}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{tipo}</TableCell>
                    <TableCell>{cm.toLocaleString(undefined, { maximumFractionDigits: 1 })}</TableCell>
                    <TableCell>{formatMeters(meters)}</TableCell>
                    <TableCell>{formatMeters(metersWithWaste)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell></TableCell>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="font-semibold">{(totalMm / 10).toLocaleString(undefined, { maximumFractionDigits: 1 })}</TableCell>
                <TableCell className="font-semibold">{formatMeters(totalMeters)}</TableCell>
                <TableCell className="font-semibold">{formatMeters(totalWithWaste)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        ) : (
          <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-center text-sm text-muted-foreground">
            Activa tapacantos en las piezas para ver los totales por tipo.
          </div>
        )}

        {/* Nueva sección: Lista de todas las piezas para editar tapacantos */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-[var(--text)]">Configurar tapacantos por pieza</h3>
          <p className="text-xs text-[var(--muted)]">
            Edita los tapacantos de cada pieza individualmente. Las piezas sin tapacantos aparecen en gris.
          </p>
          
          {expandedPieces.length > 0 ? (
            <div className="space-y-2">
              {expandedPieces.map(({ piece, instance, virtualPiece }, globalIndex) => {
                const hasEdges = virtualPiece.edges && Object.values(virtualPiece.edges).some((edge) => edge?.enabled);
                const quantity = piece.quantity || 1;
                
                return (
                  <div
                    key={`${piece.id ?? 'piece'}-${instance}-${globalIndex}`}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      hasEdges 
                        ? 'border-[var(--border)] bg-[var(--surface)]' 
                        : 'border-[var(--border)]/50 bg-[var(--surface)]/50'
                    }`}
                  >
                    <button
                      onClick={() => onGoToPiece?.(virtualPiece, globalIndex)}
                      className="mr-3 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--text)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-colors cursor-pointer"
                      title="Ir al canvas y resaltar esta pieza"
                    >
                      {globalIndex + 1}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${hasEdges ? 'text-[var(--text)]' : 'text-[var(--muted)]'}`}>
                          {piece.label || `Pieza`}
                        </span>
                        {quantity > 1 && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            instancia {instance}/{quantity}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--muted)] mt-1">
                        {piece.length} × {piece.width} {units}
                        {piece.material && ` • ${piece.material}`}
                      </div>
                      
                      {/* Mostrar tapacantos activos de esta instancia específica */}
                      {hasEdges && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {Object.entries(virtualPiece.edges || {}).map(([side, edge], sideIndex) => {
                            if (!edge?.enabled) return null;
                            const sideLabels = {
                              arriba: 'Arriba',
                              abajo: 'Abajo', 
                              izquierda: 'Izquierda',
                              derecha: 'Dcha'
                            };
                            
                            // Obtener color específico para este tipo de tapacanto
                            const baseFill = virtualPiece.color || piece.color || undefined;
                            const edgeColor = getEdgeColor(edge.tipo || 'General', sideIndex, baseFill);
                            
                            return (
                              <span 
                                key={side}
                                className="text-xs px-2 py-0.5 rounded text-white font-medium"
                                style={{ 
                                  backgroundColor: edgeColor,
                                  color: '#ffffff'
                                }}
                              >
                                {sideLabels[side]}: {edge.tipo || 'General'}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          console.log('Abriendo modal EdgeBanding para pieza:', virtualPiece);
                          setEdgeBandingModal({ 
                            isOpen: true, 
                            piece: virtualPiece 
                          });
                        }}
                        className="text-xs px-2 py-1 text-green-600 hover:text-white hover:bg-green-600 border-green-300 hover:border-green-600 transition-colors"
                      >
                        {hasEdges ? 'Editar tapacantos' : 'Agregar tapacantos'}
                      </Button>
                      {hasEdges && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const pieceName = virtualPiece.label || `Pieza ${globalIndex + 1}`;
                            if (confirm(`¿Borrar todos los tapacantos de "${pieceName}"?`)) {
                              // Crear una pieza virtual sin tapacantos (edges vacíos/deshabilitados)
                              const clearedEdges = {
                                arriba: { enabled: false, tipo: 'General' },
                                abajo: { enabled: false, tipo: 'General' },
                                izquierda: { enabled: false, tipo: 'General' },
                                derecha: { enabled: false, tipo: 'General' }
                              };
                              
                              const virtualPieceWithClearedEdges = {
                                ...virtualPiece,
                                edges: clearedEdges
                              };
                              
                              onEditPiece?.(virtualPieceWithClearedEdges);
                            }
                          }}
                          className="p-1 text-red-600 hover:text-white hover:bg-red-600 border-red-300 hover:border-red-600 transition-colors"
                          title="Borrar todos los tapacantos"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--border)]/40 p-6 text-center text-sm text-[var(--muted)]">
              No hay piezas registradas. Agrega piezas en la pestaña "Inicio" para configurar sus tapacantos.
            </div>
          )}
        </div>

        <EdgeBandingPattern pieces={pieces} units={units} onEditPiece={onEditPiece} onDeletePiece={onDeletePiece} onGoToPiece={onGoToPiece} />
      </CardContent>
    </Card>

    <EdgeBandingModal
      isOpen={edgeBandingModal.isOpen}
      onClose={() => setEdgeBandingModal({ isOpen: false, piece: null })}
      piece={edgeBandingModal.piece}
      onSave={(updatedPiece) => {
        console.log('Guardando pieza con tapacantos:', updatedPiece);
        onEditPiece?.(updatedPiece);
      }}
      title="Agregar Tapacantos"
    />
    </div>
  );
};
