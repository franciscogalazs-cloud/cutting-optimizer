import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, RotateCcw, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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

export const PieceForm = ({ onAddPiece, onRemovePiece, onEditRequest, units = 'mm', materials = [], allowRotation = true, onToggleRotation, pieces = [] }) => {
  const formRef = useRef(null);
  const hiddenSubmitRef = useRef(null);
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
    canRotate: true,
  });

  const [edges, setEdges] = useState(() => cloneEdges(defaultEdges));
  const [errors, setErrors] = useState({});
  const prevUnits = useRef(units);
  const prevMaterialKey = useRef(materialNames.join('|'));

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
        if (materialNames.length === 0) {
          // Mantener vacío si no hay materiales disponibles
          return { ...prev, material: '' };
        }
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
    // Nombre y material no bloquean el alta (se podrán editar después)
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateForm()) {
      try { console.warn('[PieceForm] validateForm() failed', { formData }); } catch {}
      return;
    }

    const qRaw = parseInt(formData.quantity, 10);
    const safeQty = Number.isFinite(qRaw) && qRaw > 0 ? qRaw : 1;
    const L = Number.parseFloat(formData.length);
    const W = Number.parseFloat(formData.width);
    if (!Number.isFinite(L) || !Number.isFinite(W) || L <= 0 || W <= 0) {
      try { console.warn('[PieceForm] invalid dimensions', { L, W, formData }); } catch {}
      return;
    }
    const piece = createPiece(
      {
        length: L,
        width: W,
        quantity: safeQty,
        label: formData.label.trim(),
        material: formData.material,
        canRotate: formData.canRotate,
        edges,
        largoMm: toMillimeters(L, units),
        anchoMm: toMillimeters(W, units),
      },
      { units },
    );

    // Forzar id string para consistencia en comparaciones
    const normalizedPiece = { ...piece, id: String(piece.id) };
    try {
      onAddPiece?.(normalizedPiece);
    } catch (err) {
      console.warn('[PieceForm] onAddPiece threw', err);
    }
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
  <Card className="rounded-2xl shadow-lg border border-[var(--border)] bg-white overflow-hidden">
      <CardHeader className="sticky top-0 z-10 px-4 py-2 pb-0 bg-white text-slate-900">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2 font-semibold uppercase tracking-wide">
            <Plus className="h-4 w-4 text-cyan-700" />
            <span>Agregar pieza</span>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="piece-can-rotate" className="flex items-center gap-2 text-sm text-[var(--text)]">
              <Checkbox
                id="piece-can-rotate"
                checked={formData.canRotate}
                onCheckedChange={(checked) => {
                  const value = checked === true;
                  handleFieldChange('canRotate', value);
                  onToggleRotation?.(value);
                }}
              />
              <span className="flex items-center gap-1" title="Permitir rotación" aria-label="Permitir rotación"><RotateCcw className="h-4 w-4" /></span>
            </label>
            <Button
              type="submit"
              form="piece-form"
              className="rounded-full py-2 px-4"
              onClick={(e) => {
                // Robustecer envío en navegadores que ignoren el atributo form
                try {
                  const formEl = formRef.current;
                  if (formEl?.requestSubmit) {
                    e.preventDefault();
                    formEl.requestSubmit();
                    return;
                  }
                } catch {}
                // Fallback: usar botón submit oculto
                try { hiddenSubmitRef.current?.click(); } catch {}
              }}
            >
              <Plus className="h-4 w-4" />
              Agregar pieza
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="bg-white">
  <form id="piece-form" ref={formRef} onSubmit={handleSubmit} className="card-scroll p-4 pt-2 space-y-4 max-h-[520px] overflow-auto">
          {/* Submit oculto para compatibilidad con navegadores sin requestSubmit y para Enter */}
          <button ref={hiddenSubmitRef} type="submit" className="hidden" aria-hidden="true" />
          <div className="grid items-end gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <div className="flex flex-col justify-end gap-2 min-w-0">
              <Label htmlFor="piece-label">Nombre de pieza</Label>
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
            <div className="flex flex-col justify-end gap-2 min-w-0">
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
            <div className="flex flex-col justify-end gap-2 min-w-0">
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
            <div className="flex flex-col justify-end gap-2 min-w-0">
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
            <div className="flex flex-col justify-end gap-2 min-w-0">
              <Label>Material</Label>
              <Select
                value={materialOptions.find((option) => option.name === formData.material) ? formData.material : ''}
                onValueChange={(value) => handleFieldChange('material', value)}
                disabled={materialOptions.length === 0}
              >
                <SelectTrigger className="w-full h-10 border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
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
            </div>
          </div>

          {/* Ayuda general para Material (fuera de la grilla, para no romper alineación) */}
          {materialOptions.length === 0 && (
            <p className="text-xs text-[var(--muted)] mt-1">Agrega materiales para habilitar esta lista.</p>
          )}

          {/* Lista compacta de piezas agregadas (debajo de la fila) */}
          {Array.isArray(pieces) && pieces.length > 0 && (
            <div className="mt-2">
              <p className="text-[11px] text-slate-500 mb-1">Piezas agregadas</p>
              <div className="flex flex-wrap gap-1.5">
                {pieces.map((p) => {
                  const name = String(p?.label ?? '').trim() || 'Pieza';
                  const L = p?.length ?? '';
                  const W = p?.width ?? '';
                  const Q = Number.isFinite(Number(p?.quantity)) ? Number(p.quantity) : 1;
                  const MAT = String(p?.material ?? '').trim();
                  const title = `${name} · ${L} × ${W} (${units}) · x${Q}${MAT ? ` · ${MAT}` : ''}`;
                  return (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] text-[var(--text)]"
                      title={title}
                    >
                      <button
                        type="button"
                        className="truncate max-w-[16rem] text-left hover:underline"
                        onClick={() => onEditRequest && onEditRequest(p)}
                        title="Editar pieza"
                        aria-label="Editar pieza"
                      >
                        {name} · {L} × {W} ({units}) · x{Q}{MAT ? ` · ${MAT}` : ''}
                      </button>
                      <button
                        type="button"
                        aria-label="Editar pieza"
                        title="Editar"
                        className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full border border-[var(--border)] text-[10px] leading-none hover:bg-slate-50"
                        onClick={() => onEditRequest && onEditRequest(p)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        aria-label="Quitar pieza"
                        title="Quitar"
                        className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full border border-[var(--border)] hover:bg-red-50 text-[10px] leading-none"
                        onClick={() => onRemovePiece && onRemovePiece(p.id)}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-1 flex items-center gap-4 whitespace-nowrap">
            <span className="text-sm font-medium text-slate-800 shrink-0">Tapacantos</span>
            {EDGE_SIDES.map((side) => {
              const info = edges[side];
              const id = `edge-${side}`;
              return (
                <div key={side} className="inline-flex items-center gap-2 pr-2 shrink-0">
                  <Checkbox
                    id={id}
                    checked={info.enabled}
                    onCheckedChange={(checked) => handleEdgeToggle(side, checked === true)}
                  />
                  <Label htmlFor={id} className="mr-1 shrink-0 font-medium text-slate-800">{EDGE_LABELS[side]}</Label>
                  <EdgeTypeSelect
                    disabled={!info.enabled}
                    value={info.tipo}
                    onChange={(tipo) => handleEdgeTypeChange(side, tipo)}
                    className="h-9 w-[100px] text-sm"
                  />
                </div>
              );
            })}
          </div>

          {/* botón de acción movido al header */}

          <p className="mt-2 text-xs text-slate-500">Activa los lados que requieren canto</p>
        </form>
      </CardContent>
    </Card>
  );
};






