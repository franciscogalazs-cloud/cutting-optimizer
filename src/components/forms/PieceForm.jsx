import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EdgeTypeSelect } from '@/features/edgebanding/EdgeTypeSelect.jsx';
import { cloneEdges, EDGE_SIDES, defaultEdges, toMillimeters } from '@/types/pieces.js';
import { createPiece } from '../../types/index.js';

const EDGE_LABELS = {
  arriba: 'Arriba',
  abajo: 'Abajo',
  izquierda: 'Izquierda',
  derecha: 'Derecha',
};

export const PieceForm = ({ onAddPiece, units = 'mm', materials = [], allowRotation = true, onToggleRotation }) => {
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

  const materialOptions = useMemo(
    () =>
      materialNames.map((name) => {
        const sample = nameToSample.get(name);
        if (sample && sample.length && sample.width) {
          return { name, label: `${name} - ${sample.length}x${sample.width} ${units}` };
        }
        return { name, label: name };
      }),
    [materialNames, nameToSample, units],
  );

  const [formData, setFormData] = useState({
    length: '',
    width: '',
    quantity: '1',
    label: '',
    material: materialOptions[0]?.name || '',
    canRotate: allowRotation,
  });

  const [edges, setEdges] = useState(() => cloneEdges(defaultEdges));
  const [errors, setErrors] = useState({});
  const prevUnits = useRef(units);
  const prevMaterialKey = useRef(materialNames.join('|'));

  useEffect(() => {
    setFormData((prev) => ({ ...prev, canRotate: allowRotation }));
  }, [allowRotation]);

  useEffect(() => {
    if (prevUnits.current !== units) {
      const from = prevUnits.current;
      const to = units;
      const factor = from === 'mm' && to === 'cm' ? 0.1 : 10;
      setFormData((prev) => ({
        ...prev,
        length: prev.length !== '' ? String(Number((parseFloat(prev.length) * factor).toFixed(3))) : prev.length,
        width: prev.width !== '' ? String(Number((parseFloat(prev.width) * factor).toFixed(3))) : prev.width,
      }));
      prevUnits.current = units;
    }
  }, [units]);

  useEffect(() => {
    const key = materialNames.join('|');
    if (prevMaterialKey.current !== key) {
      setFormData((prev) => {
        if (!materialNames.includes(prev.material)) {
          return { ...prev, material: materialOptions[0]?.name || '' };
        }
        return prev;
      });
      prevMaterialKey.current = key;
    }
  }, [materialNames, materialOptions]);

  const resetForm = () => {
    setFormData({
      length: '',
      width: '',
      quantity: '1',
      label: '',
      material: materialOptions[0]?.name || '',
      canRotate: allowRotation,
    });
    setEdges(cloneEdges(defaultEdges));
    setErrors({});
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.length || parseFloat(formData.length) <= 0) nextErrors.length = 'El largo debe ser mayor a 0';
    if (!formData.width || parseFloat(formData.width) <= 0) nextErrors.width = 'El ancho debe ser mayor a 0';
    if (!formData.quantity || parseInt(formData.quantity, 10) <= 0) nextErrors.quantity = 'La cantidad debe ser mayor a 0';
    if (!formData.label.trim()) nextErrors.label = 'La etiqueta es requerida';
    if (!formData.material || !materialNames.includes(formData.material)) nextErrors.material = 'Selecciona un material disponible';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const piece = createPiece({
      length: parseFloat(formData.length),
      width: parseFloat(formData.width),
      quantity: parseInt(formData.quantity, 10),
      label: formData.label.trim(),
      material: formData.material,
      canRotate: formData.canRotate,
      edges,
      largoMm: toMillimeters(parseFloat(formData.length), units),
      anchoMm: toMillimeters(parseFloat(formData.width), units),
    }, { units });

    onAddPiece?.(piece);
    resetForm();
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleEdgeToggle = (side, checked) => {
    setEdges((prev) => ({
      ...prev,
      [side]: {
        enabled: checked,
        tipo: checked ? prev[side].tipo ?? 'General' : prev[side].tipo,
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
    <Card className="rounded-2xl shadow-lg border border-cyan-300/60 dark:border-cyan-700 bg-slate-50 dark:bg-slate-800 overflow-hidden">
      <CardHeader className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 font-semibold uppercase tracking-wide break-words bg-cyan-100 text-slate-900 dark:bg-cyan-600/30 dark:text-cyan-200">
        <Plus className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
        <span>Agregar pieza</span>
      </CardHeader>
      <CardContent>
        <div className="p-4 pb-0 text-xs text-slate-500 dark:text-slate-400">Ingresa las dimensiones en {units}. Puedes activar tapacantos para cada lado individualmente.</div>
        <form onSubmit={handleSubmit} className="card-scroll p-4 space-y-4 max-h-[420px] overflow-auto">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="piece-length">Largo ({units})</Label>
              <Input
                id="piece-length"
                type="number"
                step="0.1"
                min="0"
                value={formData.length}
                onChange={(event) => handleFieldChange('length', event.target.value)}
                className={'w-full ' + (errors.length ? 'border-red-500' : '')}
              />
              {errors.length && <p className="text-xs text-[var(--danger)]">{errors.length}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="piece-width">Ancho ({units})</Label>
              <Input
                id="piece-width"
                type="number"
                step="0.1"
                min="0"
                value={formData.width}
                onChange={(event) => handleFieldChange('width', event.target.value)}
                className={'w-full ' + (errors.width ? 'border-red-500' : '')}
              />
              {errors.width && <p className="text-xs text-[var(--danger)]">{errors.width}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="piece-quantity">Cantidad</Label>
              <Input
                id="piece-quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(event) => handleFieldChange('quantity', event.target.value)}
                className={'w-full ' + (errors.quantity ? 'border-red-500' : '')}
              />
              {errors.quantity && <p className="text-xs text-[var(--danger)]">{errors.quantity}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="piece-label">Etiqueta</Label>
              <Input
                id="piece-label"
                type="text"
                value={formData.label}
                onChange={(event) => handleFieldChange('label', event.target.value)}
                placeholder="Ej: Puerta, Estante..."
                className={'w-full ' + (errors.label ? 'border-red-500' : '')}
              />
              {errors.label && <p className="text-xs text-[var(--danger)]">{errors.label}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Material</Label>
            <Select
              value={materialOptions.find((option) => option.name === formData.material) ? formData.material : undefined}
              onValueChange={(value) => handleFieldChange('material', value)}
              disabled={materialOptions.length === 0}
            >
              <SelectTrigger className="w-full border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
                <SelectValue placeholder={materialOptions.length === 0 ? 'Sin materiales disponibles' : 'Selecciona un material'} />
              </SelectTrigger>
              <SelectContent>
                {materialOptions.map((option) => (
                  <SelectItem key={option.name} value={option.name}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.material && <p className="text-xs text-[var(--danger)]">{errors.material}</p>}
            {materialOptions.length === 0 && (
              <p className="text-xs text-[var(--muted)]">Agrega materiales para habilitar esta lista.</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="piece-can-rotate"
              checked={formData.canRotate}
              onCheckedChange={(checked) => {
                const value = checked === true;
                handleFieldChange('canRotate', value);
                onToggleRotation?.(value);
              }}
            />
            <Label htmlFor="piece-can-rotate" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Permitir rotación
            </Label>
          </div>

          <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--text)]">Tapacantos</span>
              <span className="text-xs text-[var(--muted)]">Activa los lados que requieren canto</span>
            </div>
            <div className="space-y-3">
              {EDGE_SIDES.map((side) => {
                const info = edges[side];
                const id = `edge-${side}`;
                return (
                  <div key={side} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={id}
                        checked={info.enabled}
                        onCheckedChange={(checked) => handleEdgeToggle(side, checked === true)}
                      />
                      <Label htmlFor={id}>{EDGE_LABELS[side]}</Label>
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

          <Button type="submit" className="mt-1 w-full rounded-xl py-2 font-bold bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">
            <Plus className="h-4 w-4" />
            Agregar pieza
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};




