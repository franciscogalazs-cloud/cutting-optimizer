import { useState, useRef, useEffect } from 'react';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { createMaterial } from '../../types/index.js';

const PRESETS = [
  { name: 'Durolac 3mm', lengthCm: 250, widthCm: 183 },
  { name: 'Durolac 2,8mm', lengthCm: 244, widthCm: 152 },
  { name: 'Melamina', lengthCm: 250, widthCm: 183 },
  { name: 'Terciado', lengthCm: 240, widthCm: 120 },
];

export const MaterialForm = ({ onAddMaterial, onRemoveMaterial, units = 'mm', pieces = [], onConfigChange, materials = [] }) => {
  const formRef = useRef(null);
  const [formData, setFormData] = useState({
    length: '',
    width: '',
    material: 'Melamina',
    kerf: '0',
    margin: '0',
  });

  const [errors, setErrors] = useState({});
  const prevUnits = useRef(units);

  // Funcion para calcular la cantidad automaticamente basada en la demanda
  const calculateRequiredQuantity = () => {
    const lengthValue = Number.parseFloat(formData.length);
    const widthValue = Number.parseFloat(formData.width);
    if (!Number.isFinite(lengthValue) || !Number.isFinite(widthValue) || lengthValue <= 0 || widthValue <= 0) {
      return 1;
    }

    const unitToMillimeters = (value) => {
      if (!Number.isFinite(value)) return NaN;
      switch (units) {
        case 'cm':
          return value * 10;
        case 'in':
          return value * 25.4;
        default:
          return value;
      }
    };

    const normalizedMaterial = String(formData.material ?? '').trim().toLowerCase();
    const relevantPieces = Array.isArray(pieces)
      ? pieces.filter((piece) => {
          const pieceMaterial = String(piece?.material ?? '').trim().toLowerCase();
          return normalizedMaterial ? pieceMaterial === normalizedMaterial : true;
        })
      : [];

    if (relevantPieces.length === 0) {
      return 1;
    }

    const materialArea = unitToMillimeters(lengthValue) * unitToMillimeters(widthValue);
    if (!Number.isFinite(materialArea) || materialArea <= 0) {
      return 1;
    }

    const totalPiecesArea = relevantPieces.reduce((total, piece) => {
      const pieceLength = unitToMillimeters(Number.parseFloat(piece?.length));
      const pieceWidth = unitToMillimeters(Number.parseFloat(piece?.width));
      const quantity = Number.parseInt(piece?.quantity, 10);
      if (!Number.isFinite(pieceLength) || !Number.isFinite(pieceWidth) || pieceLength <= 0 || pieceWidth <= 0) {
        return total;
      }
      const validQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
      return total + pieceLength * pieceWidth * validQuantity;
    }, 0);

    if (!Number.isFinite(totalPiecesArea) || totalPiecesArea <= 0) {
      return 1;
    }

    const efficiency = 0.9;
    const requiredArea = totalPiecesArea / efficiency;
    if (!Number.isFinite(requiredArea) || requiredArea <= 0) {
      return 1;
    }

    return Math.max(1, Math.ceil(requiredArea / materialArea));
  };

  useEffect(() => {
    if (prevUnits.current !== units) {
      const from = prevUnits.current;
      const to = units;
      const factor = from === 'mm' && to === 'cm' ? 0.1 : 10;
      setFormData((prev) => ({
        ...prev,
        length: prev.length !== '' ? String(Number((parseFloat(prev.length) * factor).toFixed(3))) : prev.length,
        width: prev.width !== '' ? String(Number((parseFloat(prev.width) * factor).toFixed(3))) : prev.width,
        kerf: prev.kerf !== '' ? String(Number((parseFloat(prev.kerf) * factor).toFixed(3))) : prev.kerf,
        margin: prev.margin !== '' ? String(Number((parseFloat(prev.margin) * factor).toFixed(3))) : prev.margin,
      }));
      prevUnits.current = units;
    }
  }, [units]);

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.length || parseFloat(formData.length) <= 0) nextErrors.length = 'El largo debe ser mayor a 0';
    if (!formData.width || parseFloat(formData.width) <= 0) nextErrors.width = 'El ancho debe ser mayor a 0';
    if (!formData.kerf || parseFloat(formData.kerf) < 0) nextErrors.kerf = 'El grosor de sierra debe ser mayor o igual a 0';
    if (!formData.margin || parseFloat(formData.margin) < 0) nextErrors.margin = 'El margen debe ser mayor o igual a 0';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const calculatedQuantity = calculateRequiredQuantity();

    const material = createMaterial({
      length: parseFloat(formData.length),
      width: parseFloat(formData.width),
      quantity: calculatedQuantity, // Usar cantidad calculada automaticamente
      material: formData.material,
  // precio eliminado; se define en Presupuesto
      kerf: parseFloat(formData.kerf),
      margin: parseFloat(formData.margin),
    });

    const normalizedMaterial = { ...material, id: String(material.id) };
    onAddMaterial(normalizedMaterial);
    onConfigChange?.({ kerfWidth: material.kerf, margin: material.margin });

    setFormData({
      length: '',
      width: '',
      material: 'Melamina',
  // precio eliminado
      kerf: '0',
      margin: '0',
    });
    setErrors({});
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const applyPreset = (preset) => {
    const lengthValue = units === 'mm' ? preset.lengthCm * 10 : preset.lengthCm;
    const widthValue = units === 'mm' ? preset.widthCm * 10 : preset.widthCm;
    setFormData((prev) => ({
      ...prev,
      length: String(lengthValue),
      width: String(widthValue),
      material: preset.name,
    }));
  };

  return (
  <Card className="rounded-2xl shadow-lg border border-[var(--border)] bg-white overflow-hidden">
      <CardHeader className="sticky top-0 z-10 px-4 py-1 pb-0 bg-white text-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold uppercase tracking-wide">
            <Package className="h-4 w-4 text-emerald-700" />
            <span>Agregar material</span>
          </div>
          <Button
            type="submit"
            form="material-form"
            className="rounded-full py-2 px-4"
          >
            <Package className="h-4 w-4" />
            Agregar material
          </Button>
        </div>
      </CardHeader>
      <CardContent className="card-scroll p-4 pt-0 space-y-3 max-h-[420px] overflow-auto bg-white">
        <div className="flex flex-wrap items-center gap-2 mt-0">
          <Label className="text-xs text-slate-500 shrink-0">Presets comunes</Label>
          {PRESETS.map((preset) => {
            const lengthValue = units === 'mm' ? preset.lengthCm * 10 : preset.lengthCm;
            const widthValue = units === 'mm' ? preset.widthCm * 10 : preset.widthCm;
            return (
              <Button
                key={preset.name}
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-[var(--border)] bg-white px-3 py-1 text-xs text-slate-800 hover:bg-slate-100 whitespace-nowrap"
                onClick={() => applyPreset(preset)}
              >
                <span className="font-medium">{preset.name} — {lengthValue} × {widthValue} {units}</span>
              </Button>
            );
          })}
        </div>

  <form id="material-form" ref={formRef} onSubmit={handleSubmit} className="space-y-0">
    {/* Submit oculto para compatibilidad y tecla Enter */}
    <button type="submit" className="hidden" aria-hidden="true" />
          <div className="grid items-end gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {/* Nombre del material */}
            <div className="space-y-2">
              <Label htmlFor="mat-material">Nombre del material</Label>
              <Input
                id="mat-material"
                type="text"
                value={formData.material}
                onChange={(event) => handleChange('material', event.target.value)}
                placeholder="Melamina"
                className="w-full"
              />
            </div>

            {/* Fila con Largo, Ancho, Grosor, Margen */}
            <div className="space-y-2 min-w-0">
              <Label htmlFor="mat-length">Largo ({units})</Label>
              <Input
                id="mat-length"
                type="number"
                step="0.1"
                min="0"
                value={formData.length}
                onChange={(event) => handleChange('length', event.target.value)}
                className={'w-full ' + (errors.length ? 'border-red-500' : '')}
                placeholder="2440"
              />
              {errors.length && <p className="text-xs text-[var(--danger)]">{errors.length}</p>}
            </div>
            <div className="space-y-2 min-w-0">
              <Label htmlFor="mat-width">Ancho ({units})</Label>
              <Input
                id="mat-width"
                type="number"
                step="0.1"
                min="0"
                value={formData.width}
                onChange={(event) => handleChange('width', event.target.value)}
                className={'w-full ' + (errors.width ? 'border-red-500' : '')}
                placeholder="1220"
              />
              {errors.width && <p className="text-xs text-[var(--danger)]">{errors.width}</p>}
            </div>
            <div className="space-y-2 min-w-0">
              <Label htmlFor="mat-kerf">Grosor de sierra ({units})</Label>
              <Input
                id="mat-kerf"
                type="number"
                step="0.1"
                min="0"
                value={formData.kerf}
                onChange={(event) => handleChange('kerf', event.target.value)}
                className={'w-full ' + (errors.kerf ? 'border-red-500' : '')}
                placeholder="3"
              />
              {errors.kerf && <p className="text-xs text-[var(--danger)]">{errors.kerf}</p>}
            </div>
            <div className="space-y-2 min-w-0">
              <Label htmlFor="mat-margin">Margen ({units})</Label>
              <Input
                id="mat-margin"
                type="number"
                step="0.1"
                min="0"
                value={formData.margin}
                onChange={(event) => handleChange('margin', event.target.value)}
                className={'w-full ' + (errors.margin ? 'border-red-500' : '')}
                placeholder="5"
              />
              {errors.margin && <p className="text-xs text-[var(--danger)]">{errors.margin}</p>}
            </div>
          </div>

          {/* Lista compacta de materiales agregados (debajo de la fila) */}
          {Array.isArray(materials) && materials.length > 0 && (
            <div className="mt-2">
              <p className="text-[11px] text-slate-500 mb-1">Materiales agregados</p>
              <div className="flex flex-wrap gap-1.5">
                {materials.map((m) => {
                  const name = String(m?.material ?? '').trim() || 'Material';
                  const L = m?.length ?? '';
                  const W = m?.width ?? '';
                  const toCm = (val) => {
                    const n = Number.parseFloat(val);
                    if (!Number.isFinite(n)) return '';
                    switch (units) {
                      case 'mm':
                        return n / 10;
                      case 'in':
                        return n * 2.54;
                      default:
                        return n;
                    }
                  };
                  const fmt = (n) => (Number.isFinite(n) ? (Math.abs(n % 1) < 1e-6 ? String(Math.round(n)) : String(Number(n.toFixed(2)))) : '');
                  const Lcm = toCm(L);
                  const Wcm = toCm(W);
                  const title = `${name} · ${fmt(Lcm)} × ${fmt(Wcm)} (cm)`;
                  return (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] text-[var(--text)]"
                      title={title}
                    >
                      <span className="truncate max-w-[16rem]">{name} · {fmt(Lcm)} × {fmt(Wcm)} (cm)</span>
                      <button
                        type="button"
                        aria-label="Quitar material"
                        title="Quitar"
                        className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full border border-[var(--border)] hover:bg-red-50 text-[10px] leading-none"
                        onClick={() => onRemoveMaterial && onRemoveMaterial(m.id)}
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* botón de acción movido al header */}
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Completa las dimensiones reales del tablero o usa un preset como base.
        </p>
      </CardContent>
    </Card>
  );
};
