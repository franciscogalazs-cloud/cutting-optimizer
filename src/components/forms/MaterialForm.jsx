import { useState, useRef, useEffect } from 'react';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createMaterial } from '../../types/index.js';

const PRESETS = [
  { name: 'Durolac 3mm', lengthCm: 250, widthCm: 183 },
  { name: 'Durolac 2,8mm', lengthCm: 244, widthCm: 152 },
  { name: 'Melamina', lengthCm: 250, widthCm: 183 },
  { name: 'Terciado', lengthCm: 240, widthCm: 120 },
];

export const MaterialForm = ({ onAddMaterial, units = 'mm', kerfWidth = 3, margin = 5, pieces = [], onConfigChange }) => {
  const [formData, setFormData] = useState({
    length: '',
    width: '',
    material: 'Melamina',
    kerf: String(kerfWidth),
    margin: String(margin),
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

    onAddMaterial(material);
    onConfigChange?.({ kerfWidth: material.kerf, margin: material.margin });

    setFormData({
      length: '',
      width: '',
      material: 'Melamina',
  // precio eliminado
      kerf: String(kerfWidth),
      margin: String(margin),
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
    <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-[var(--text)]">
          <Package className="h-5 w-5 text-[var(--primary)]" />
          Agregar material
        </CardTitle>
        <p className="text-xs text-[var(--muted)]">
          Completa las dimensiones reales del tablero o usa un preset como base.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label className="text-xs text-[var(--muted)]">Presets comunes</Label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const lengthValue = units === 'mm' ? preset.lengthCm * 10 : preset.lengthCm;
              const widthValue = units === 'mm' ? preset.widthCm * 10 : preset.widthCm;
              return (
                <Button
                  key={preset.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text)] hover:bg-[var(--primary)]/10"
                  onClick={() => applyPreset(preset)}
                >
                  <span className="font-medium">{preset.name}</span>
                  <span className="block text-[var(--muted)]">
                    {lengthValue} × {widthValue} {units}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mat-length">Largo ({units})</Label>
              <Input
                id="mat-length"
                type="number"
                step="0.1"
                min="0"
                value={formData.length}
                onChange={(event) => handleChange('length', event.target.value)}
                className={errors.length ? 'border-red-500' : ''}
                placeholder="2440"
              />
              {errors.length && <p className="text-xs text-[var(--danger)]">{errors.length}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mat-width">Ancho ({units})</Label>
              <Input
                id="mat-width"
                type="number"
                step="0.1"
                min="0"
                value={formData.width}
                onChange={(event) => handleChange('width', event.target.value)}
                className={errors.width ? 'border-red-500' : ''}
                placeholder="1220"
              />
              {errors.width && <p className="text-xs text-[var(--danger)]">{errors.width}</p>}
            </div>
          </div>

          {/* Bloque informativo de cantidad automática removido a pedido del usuario */}

          {/* campo precio eliminado: el precio se aplica directamente en Presupuesto */}

          <div className="space-y-2">
            <Label htmlFor="mat-material">Nombre del material</Label>
            <Input
              id="mat-material"
              type="text"
              value={formData.material}
              onChange={(event) => handleChange('material', event.target.value)}
              placeholder="Melamina"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mat-kerf">Grosor de sierra ({units})</Label>
              <Input
                id="mat-kerf"
                type="number"
                step="0.1"
                min="0"
                value={formData.kerf}
                onChange={(event) => handleChange('kerf', event.target.value)}
                className={errors.kerf ? 'border-red-500' : ''}
                placeholder="3"
              />
              {errors.kerf && <p className="text-xs text-[var(--danger)]">{errors.kerf}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mat-margin">Margen ({units})</Label>
              <Input
                id="mat-margin"
                type="number"
                step="0.1"
                min="0"
                value={formData.margin}
                onChange={(event) => handleChange('margin', event.target.value)}
                className={errors.margin ? 'border-red-500' : ''}
                placeholder="5"
              />
              {errors.margin && <p className="text-xs text-[var(--danger)]">{errors.margin}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full bg-[var(--primary)] text-white hover:brightness-105">
            <Package className="h-4 w-4" />
            Agregar material
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
