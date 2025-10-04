import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cloneEdges, EDGE_SIDES, defaultEdges, normalizePiece, toMillimeters } from '@/types/pieces.js';
import { EdgeTypeSelect } from '@/features/edgebanding/EdgeTypeSelect.jsx';

const EDGE_LABELS = {
  arriba: 'Arriba',
  abajo: 'Abajo',
  izquierda: 'Izquierda',
  derecha: 'Derecha',
};

const createEdgesFromPiece = (piece, units) => {
  const normalized = normalizePiece(piece, units);
  return cloneEdges(normalized.edges ?? defaultEdges);
};

export const PieceEditModal = ({ open, onClose, piece, onSave, units = 'mm', materials = [] }) => {
  const labelInputRef = useRef(null);
  const [form, setForm] = useState({
    label: '',
    length: 0,
    width: 0,
    quantity: 1,
    material: 'Melamina',
    canRotate: true,
  });
  const [edges, setEdges] = useState(cloneEdges(defaultEdges));
  const [errors, setErrors] = useState({});

  const materialNames = useMemo(
    () => Array.from(new Set(materials.map((material) => material.material))).filter(Boolean),
    [materials],
  );
  const nameToSample = useMemo(() => {
    const map = new Map();
    for (const material of materials) {
      if (material.material && !map.has(material.material)) {
        map.set(material.material, material);
      }
    }
    return map;
  }, [materials]);

  useEffect(() => {
    if (!piece) return;
    const normalized = normalizePiece(piece, units);
    setForm({
      label: normalized.label ?? '',
      length: normalized.length ?? normalized.largoMm ?? 0,
      width: normalized.width ?? normalized.anchoMm ?? 0,
      quantity: normalized.quantity ?? normalized.cantidad ?? 1,
      material: normalized.material ?? (materialNames[0] ?? ''),
      canRotate: normalized.canRotate ?? true,
    });
    setEdges(createEdgesFromPiece(normalized, units));
    setErrors({});
  }, [piece, materialNames, units]);

  useEffect(() => {
    setForm((prev) => {
      if (materialNames.length === 0) {
        return { ...prev, material: '' };
      }
      if (!materialNames.includes(prev.material)) {
        return { ...prev, material: materialNames[0] };
      }
      return prev;
    });
  }, [materialNames]);

  useEffect(() => {
    if (open) {
      // Esperar al siguiente tick para asegurar que el input esté montado
      setTimeout(() => {
        try {
          labelInputRef.current?.focus();
          labelInputRef.current?.select();
        } catch {
          // noop
        }
      }, 0);
    }
  }, [open]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const nextErrors = {};
    if (!form.label.trim()) nextErrors.label = 'Requerido';
    if (!(Number(form.length) > 0)) nextErrors.length = 'Debe ser > 0';
    if (!(Number(form.width) > 0)) nextErrors.width = 'Debe ser > 0';
    if (!(Number.isInteger(Number(form.quantity)) && Number(form.quantity) > 0)) nextErrors.quantity = 'Debe ser entero > 0';
    if (!form.material || !materialNames.includes(form.material)) nextErrors.material = 'Selecciona un material disponible';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const lengthValue = Number(form.length);
    const widthValue = Number(form.width);
    const quantityValue = Number(form.quantity);
    onSave?.({
      label: form.label.trim(),
      length: lengthValue,
      width: widthValue,
      quantity: quantityValue,
      material: form.material,
      canRotate: Boolean(form.canRotate),
      edges: cloneEdges(edges),
      largoMm: toMillimeters(lengthValue, units),
      anchoMm: toMillimeters(widthValue, units),
    });
    onClose?.();
  };

  const handleEdgeToggle = (side, checked) => {
    const enabled = checked === true;
    setEdges((prev) => ({
      ...prev,
      [side]: {
        enabled,
        tipo: enabled ? (prev[side].tipo ?? 'General') : prev[side].tipo,
      },
    }));
  };

  const handleEdgeTypeChange = (side, tipo) => {
    setEdges((prev) => ({
      ...prev,
      [side]: {
        ...prev[side],
        tipo,
      },
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-white" aria-describedby="piece-edit-desc">
        <DialogHeader>
          <DialogTitle>Editar Pieza</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p id="piece-edit-desc" className="sr-only">Formulario para editar una pieza.</p>
          <div>
            <Label>Etiqueta</Label>
            <Input ref={labelInputRef} value={form.label} onChange={(event) => setField('label', event.target.value)} />
            {errors.label && <p className="mt-1 text-xs text-red-600">{errors.label}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Largo ({units})</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={form.length}
                onChange={(event) => setField('length', event.target.value)}
              />
              {errors.length && <p className="mt-1 text-xs text-red-600">{errors.length}</p>}
            </div>
            <div>
              <Label>Ancho ({units})</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={form.width}
                onChange={(event) => setField('width', event.target.value)}
              />
              {errors.width && <p className="mt-1 text-xs text-red-600">{errors.width}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cantidad</Label>
              <Input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(event) => setField('quantity', event.target.value)}
              />
              {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>}
            </div>
            <div>
              <Label>Material</Label>
              {materialNames.length === 0 ? (
                <Input value="Sin materiales disponibles" disabled />
              ) : (
                <Select
                  value={materialNames.includes(form.material) ? form.material : undefined}
                  onValueChange={(value) => setField('material', value)}
                  disabled={materialNames.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un material" />
                  </SelectTrigger>
                  <SelectContent>
                    {materialNames.map((name) => {
                      const sample = nameToSample.get(name);
                      const label = sample && sample.length && sample.width
                        ? `${name} - ${sample.length}x${sample.width} ${units}`
                        : name;
                      return (
                        <SelectItem key={name} value={name}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
              {errors.material && <p className="mt-1 text-xs text-red-600">{errors.material}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="canRotate_edit" checked={!!form.canRotate} onCheckedChange={(value) => setField('canRotate', value === true)} />
            <Label htmlFor="canRotate_edit">Permitir rotación</Label>
          </div>

          {/* Campo de orientación fija (veta) eliminado por solicitud */}

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Tapacantos</span>
              <span className="text-xs text-gray-500">Ajusta los lados necesarios</span>
            </div>
            <div className="space-y-3">
              {EDGE_SIDES.map((side) => {
                const edgeId = `edit-edge-${side}`;
                const info = edges[side];
                return (
                  <div key={side} className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={edgeId}
                        checked={info.enabled}
                        onCheckedChange={(checked) => handleEdgeToggle(side, checked)}
                      />
                      <Label htmlFor={edgeId}>{EDGE_LABELS[side]}</Label>
                    </div>
                    <EdgeTypeSelect
                      disabled={!info.enabled}
                      value={info.tipo}
                      onChange={(tipo) => handleEdgeTypeChange(side, tipo)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
