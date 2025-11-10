import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EDGE_SIDES } from '@/types/pieces.js';

const EDGE_LABELS = {
  arriba: 'Arriba',
  abajo: 'Abajo',
  izquierda: 'Izquierda',
  derecha: 'Derecha'
};

const EDGE_TYPES = [
  'General',
  'Melamina',
  'Madera',
  'PVC',
  'ABS',
  'Acrilico',
  'Personalizado'
];

export const EdgeBandingModal = ({ 
  isOpen, 
  onClose, 
  piece, 
  onSave,
  title = "Configurar Tapacantos"
}) => {
  const [edges, setEdges] = useState({
    arriba: { enabled: false, tipo: 'General' },
    abajo: { enabled: false, tipo: 'General' },
    izquierda: { enabled: false, tipo: 'General' },
    derecha: { enabled: false, tipo: 'General' }
  });

  // Inicializar con los tapacantos actuales de la pieza
  useEffect(() => {
    if (piece?.edges) {
      setEdges({
        arriba: { enabled: piece.edges.arriba?.enabled || false, tipo: piece.edges.arriba?.tipo || 'General' },
        abajo: { enabled: piece.edges.abajo?.enabled || false, tipo: piece.edges.abajo?.tipo || 'General' },
        izquierda: { enabled: piece.edges.izquierda?.enabled || false, tipo: piece.edges.izquierda?.tipo || 'General' },
        derecha: { enabled: piece.edges.derecha?.enabled || false, tipo: piece.edges.derecha?.tipo || 'General' }
      });
    } else {
      // Si no hay tapacantos, empezar con todos habilitados
      setEdges({
        arriba: { enabled: true, tipo: 'General' },
        abajo: { enabled: true, tipo: 'General' },
        izquierda: { enabled: true, tipo: 'General' },
        derecha: { enabled: true, tipo: 'General' }
      });
    }
  }, [piece]);

  const handleEdgeToggle = (side, enabled) => {
    setEdges(prev => ({
      ...prev,
      [side]: { ...prev[side], enabled }
    }));
  };

  const handleEdgeTypeChange = (side, tipo) => {
    setEdges(prev => ({
      ...prev,
      [side]: { ...prev[side], tipo }
    }));
  };

  const handleSelectAll = () => {
    setEdges(prev => {
      const newEdges = {};
      EDGE_SIDES.forEach(side => {
        newEdges[side] = { ...prev[side], enabled: true };
      });
      return newEdges;
    });
  };

  const handleDeselectAll = () => {
    setEdges(prev => {
      const newEdges = {};
      EDGE_SIDES.forEach(side => {
        newEdges[side] = { ...prev[side], enabled: false };
      });
      return newEdges;
    });
  };

  const handleSave = () => {
    if (piece && onSave) {
      const updatedPiece = {
        ...piece,
        edges
      };
      onSave(updatedPiece);
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const enabledCount = EDGE_SIDES.filter(side => edges[side]?.enabled).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {piece && (
            <p className="text-sm text-muted-foreground">
              {piece.label || `Pieza ${piece.id}`} - {piece.length} × {piece.width} mm
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Controles rápidos */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex-1"
            >
              Seleccionar todos
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
              className="flex-1"
            >
              Deseleccionar todos
            </Button>
          </div>

          {/* Contador */}
          <div className="text-center text-sm text-muted-foreground">
            {enabledCount} de {EDGE_SIDES.length} lados seleccionados
          </div>

          {/* Configuración por lado */}
          <div className="space-y-3">
            {EDGE_SIDES.map((side) => (
              <div key={side} className="flex items-center gap-3 p-3 border rounded-lg">
                <Checkbox
                  id={`edge-${side}`}
                  checked={edges[side]?.enabled || false}
                  onCheckedChange={(checked) => handleEdgeToggle(side, checked)}
                />
                <Label 
                  htmlFor={`edge-${side}`}
                  className="flex-1 font-medium"
                >
                  {EDGE_LABELS[side]}
                </Label>
                <Select
                  value={edges[side]?.tipo || 'General'}
                  onValueChange={(value) => handleEdgeTypeChange(side, value)}
                  disabled={!edges[side]?.enabled}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EDGE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="flex-1"
              disabled={enabledCount === 0}
            >
              Guardar tapacantos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};