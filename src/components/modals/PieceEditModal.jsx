import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { normalizePiece, toMillimeters } from '@/types/pieces.js';



export const PieceEditModal = ({ open, onClose, piece, onSave, units = 'mm', materials = [] }) => {
  const mmToUnits = (valueMm, u) => {
    const n = Number(valueMm);
    if (!Number.isFinite(n)) return 0;
    switch (u) {
      case 'cm':
        return Number((n / 10).toFixed(3));
      case 'in':
        return Number((n / 25.4).toFixed(3));
      default:
        return Number(n.toFixed(3));
    }
  };
  const labelInputRef = useRef(null);
  const [form, setForm] = useState({
    label: '',
    length: 0,
    width: 0,
    quantity: 1,
    material: 'Melamina',
    canRotate: true,
  });
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
      // Mostrar siempre en unidades actuales
      length: mmToUnits(normalized.largoMm ?? 0, units),
      width: mmToUnits(normalized.anchoMm ?? 0, units),
      quantity: normalized.quantity ?? normalized.cantidad ?? 1,
      material: normalized.material ?? (materialNames[0] ?? ''),
      canRotate: normalized.canRotate ?? true,
    });
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
      }, 100);
    }
  }, [open]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const nextErrors = {};
    const lengthNum = Number(form.length);
    const widthNum = Number(form.width);
    const quantityNum = Number(form.quantity);
    
    if (!Number.isFinite(lengthNum) || lengthNum <= 0) nextErrors.length = 'Debe ser > 0';
    if (!Number.isFinite(widthNum) || widthNum <= 0) nextErrors.width = 'Debe ser > 0';
    if (!Number.isFinite(quantityNum) || !Number.isInteger(quantityNum) || quantityNum <= 0) nextErrors.quantity = 'Debe ser entero > 0';
    
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    
    try {
      const lengthValue = Number(form.length);
      const widthValue = Number(form.width);
      const qRaw = Number(form.quantity);
      const quantityValue = Number.isFinite(qRaw) && qRaw > 0 ? Math.floor(qRaw) : 1;
      
      const pieceData = {
        label: (form.label || '').trim(),
        length: lengthValue,
        width: widthValue,
        quantity: quantityValue,
        material: materialNames.length > 0 && materialNames.includes(form.material) ? form.material : '',
        canRotate: Boolean(form.canRotate),
        largoMm: toMillimeters(lengthValue, units),
        anchoMm: toMillimeters(widthValue, units),
      };
      
      onSave?.(pieceData);
      onClose?.();
    } catch (error) {
      console.error('Error al guardar pieza:', error);
    }
  };



  const handleClose = () => {
    setErrors({});
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-[var(--surface)] border-[var(--border)]" aria-describedby="piece-edit-desc">
        <DialogHeader>
          <DialogTitle className="text-[var(--text)]">Editar Pieza</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p id="piece-edit-desc" className="sr-only">Formulario para editar una pieza.</p>
          <div>
            <Label className="text-[var(--text)]">Etiqueta</Label>
            <Input ref={labelInputRef} value={form.label} onChange={(event) => setField('label', event.target.value)} />
            {errors.label && <p className="mt-1 text-xs text-[var(--danger)]">{errors.label}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[var(--text)]">Largo ({units})</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={form.length}
                onChange={(event) => setField('length', event.target.value)}
              />
              {errors.length && <p className="mt-1 text-xs text-[var(--danger)]">{errors.length}</p>}
            </div>
            <div>
              <Label className="text-[var(--text)]">Ancho ({units})</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={form.width}
                onChange={(event) => setField('width', event.target.value)}
              />
              {errors.width && <p className="mt-1 text-xs text-[var(--danger)]">{errors.width}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[var(--text)]">Cantidad</Label>
              <Input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(event) => setField('quantity', event.target.value)}
              />
              {errors.quantity && <p className="mt-1 text-xs text-[var(--danger)]">{errors.quantity}</p>}
            </div>
            <div>
              <Label className="text-[var(--text)]">Material</Label>
              {materialNames.length === 0 ? (
                <Input value="Sin materiales disponibles" disabled />
              ) : (
                <Select
                  value={materialNames.includes(form.material) ? form.material : ''}
                  onValueChange={(value) => {
                    if (value && materialNames.includes(value)) {
                      setField('material', value);
                    }
                  }}
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
              {errors.material && <p className="mt-1 text-xs text-[var(--danger)]">{errors.material}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="canRotate_edit" checked={!!form.canRotate} onCheckedChange={(value) => setField('canRotate', value === true)} />
            <Label htmlFor="canRotate_edit" className="text-[var(--text)]">Permitir rotación</Label>
          </div>

          {/* Campo de orientación fija (veta) eliminado por solicitud */}

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
