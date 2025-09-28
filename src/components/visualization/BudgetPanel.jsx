import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calculator, Copy, Plus, Trash2 } from 'lucide-react';
import { computeEdgeTotals } from '@/features/edgebanding/edgeBanding.js';
import { formatCLP } from '@/lib/format.js';

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const unitOptions = [
  { label: 'plancha', value: 'plancha' },
  { label: 'hoja', value: 'hoja' },
  { label: 'unidad', value: 'unidad' },
];

const createMaterialRow = ({ name = '', unit = 'plancha', price = 0, quantity = 0, details = '' } = {}) => ({
  id: createId(),
  name,
  unit,
  price: price ?? 0,
  quantity: quantity ?? 0,
  details,
});

const createEdgeRow = ({ name = '', price = 0, quantity = 0 } = {}) => ({
  id: createId(),
  name,
  price,
  quantity,
});

const createHardwareRow = ({ name = '', price = 0, quantity = 0 } = {}) => ({
  id: createId(),
  name,
  price,
  quantity,
});

const emptyClient = { name: '', email: '', phone: '' };

const printStyles = `
  @media print {
    body {
      background: #fff;
      color: #111827; /* gris oscuro en vez de negro */
    }
    .no-print {
      display: none !important;
    }
    .print-only {
      display: block !important;
    }
  }
  @media screen {
    .print-only {
      display: none !important;
    }
  }
`;

export const BudgetPanel = ({ result, pieces = [], materials = [], units = 'cm' }) => {
  const [client, setClient] = useState(emptyClient);
  const [baseMaterials, setBaseMaterials] = useState([createMaterialRow()]);
  const [edgeItems, setEdgeItems] = useState([createEdgeRow()]);
  const [hardwareItems, setHardwareItems] = useState([createHardwareRow()]);
  const [indirectPercent, setIndirectPercent] = useState(0);
  const [marginPercent, setMarginPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(19);
  const [freight, setFreight] = useState(0);
  // Desperdicio de tapacantos se calcula fuera; no se edita aquí.

  // (ancho eliminado)

  // Precios de materiales no se heredan; se definen en Presupuesto.

  const defaultBaseRows = useMemo(() => {
    if (result?.patterns?.length) {
      const map = new Map();
      for (const pattern of result.patterns) {
        const name = String(pattern.materialName || 'Material').trim();
        const key = `${name}|${pattern.materialLength}x${pattern.materialWidth}`;
        const current = map.get(key) ?? {
          name,
          unit: 'plancha',
          quantity: 0,
          price: 0,
          details: `${pattern.materialLength} x ${pattern.materialWidth} ${units}`,
        };
        current.quantity += 1;
        map.set(key, current);
      }
      return Array.from(map.values()).map((item) => createMaterialRow(item));
    }

    if (materials.length) {
      return materials.map((material) =>
        createMaterialRow({
          name: material.material,
          unit: 'plancha',
          price: 0,
          quantity: toNumber(material.quantity),
          details: `${material.length} x ${material.width} ${units}`,
        }),
      );
    }

    return [createMaterialRow()];
  }, [materials, result, units]);

  const defaultEdgeRows = useMemo(() => {
    const totals = computeEdgeTotals(pieces);
    const entries = Object.entries(totals);
    if (entries.length === 0) {
      return [createEdgeRow({ name: 'General' })];
    }
    return entries.map(([type, lengthMm]) =>
      createEdgeRow({
        name: type,
        price: 0,
        quantity: Number(((lengthMm / 1000)).toFixed(2)),
      }),
    );
  }, [pieces]);

  useEffect(() => {
    setClient(emptyClient);
    setBaseMaterials(defaultBaseRows);
    setEdgeItems(defaultEdgeRows);
    setHardwareItems([createHardwareRow()]);
    setIndirectPercent(0);
    setMarginPercent(0);
    setTaxPercent(19);
    setFreight(0);
  }, [defaultBaseRows, defaultEdgeRows]);

  const handleMaterialChange = (id, key, value) => {
    setBaseMaterials((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const handleEdgeChange = (id, key, value) => {
    setEdgeItems((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const handleHardwareChange = (id, key, value) => {
    setHardwareItems((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const duplicateRow = (setter, id, factory) => {
    setter((prev) => {
      const current = prev.find((row) => row.id === id);
      if (!current) return prev;
      return [...prev, factory({ ...current, id: undefined })];
    });
  };

  const removeRow = (setter, id, fallbackFactory) => {
    setter((prev) => {
      if (prev.length === 1) {
        return [fallbackFactory()];
      }
      return prev.filter((row) => row.id !== id);
    });
  };

  const materialsTotal = baseMaterials.reduce((sum, item) => sum + toNumber(item.price) * toNumber(item.quantity), 0);
  const computeEdgeRowTotal = (row) => {
    const qty = toNumber(row.quantity);
    const pricePerMl = toNumber(row.price);
    return pricePerMl * qty;
  };
  const edgesTotal = edgeItems.reduce((sum, item) => sum + computeEdgeRowTotal(item), 0);
  const hardwareTotal = hardwareItems.reduce((sum, item) => sum + toNumber(item.price) * toNumber(item.quantity), 0);
  const directTotal = materialsTotal + edgesTotal + hardwareTotal;
  const indirects = directTotal * (toNumber(indirectPercent) / 100);
  const freightValue = toNumber(freight);
  const subtotalNet = directTotal + indirects + freightValue;
  const marginValue = subtotalNet * (toNumber(marginPercent) / 100);
  const subtotalWithMargin = subtotalNet + marginValue;
  const taxValue = subtotalWithMargin * (toNumber(taxPercent) / 100);
  const totalWithTax = subtotalWithMargin + taxValue;
  const printGeneratedAt = useMemo(() => new Date().toLocaleString('es-CL'), []);

  if (!result) {
    return (
      <>
        <style>{printStyles}</style>
        <div className="no-print">
          <Card className="border-[var(--border)] bg-[var(--surface)] text-center shadow-[var(--shadow)]">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-[var(--text)]">
                <Calculator className="h-5 w-5" />
                Presupuesto de melamina
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 py-12 text-[var(--muted)]">
              <p>Genera una optimizacion para calcular automaticamente el presupuesto.</p>
              <Button variant="outline" disabled>
                Esperando optimizacion
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="print-only space-y-6 p-8">
          <h2 className="text-2xl font-semibold text-[var(--text)]">Sin datos de optimizacion</h2>
          <p className="text-sm text-[var(--muted)]">Ejecuta la optimizacion para imprimir un resumen de presupuesto y patrones.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{printStyles}</style>
      <div className="no-print">
        <ScrollArea className="max-h-[80vh] pr-2">
          <div className="space-y-6 pb-4">
            <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
              <CardHeader>
                <CardTitle>Datos del cliente</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="budget-client-name">Nombre</Label>
                  <Input
                    id="budget-client-name"
                    value={client.name}
                    onChange={(event) => setClient((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-client-email">Email</Label>
                  <Input
                    id="budget-client-email"
                    type="email"
                    value={client.email}
                    onChange={(event) => setClient((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-client-phone">Telefono</Label>
                  <Input
                    id="budget-client-phone"
                    value={client.phone}
                    onChange={(event) => setClient((prev) => ({ ...prev, phone: event.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span>Materiales base</span>
                  <Badge variant="outline">{formatCLP(materialsTotal)}</Badge>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setBaseMaterials((prev) => [...prev, createMaterialRow()])}>
                  <Plus className="h-4 w-4" />
                  Agregar material
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {baseMaterials.map((material) => (
                  <div key={material.id} className="grid gap-4 rounded-[var(--radius)] border border-[var(--border)] p-4 sm:grid-cols-12">
                    <div className="space-y-2 sm:col-span-3">
                      <Label>Tipo</Label>
                      <Input
                        value={material.name}
                        onChange={(event) => handleMaterialChange(material.id, 'name', event.target.value)}
                        placeholder="Ej: Melamina 18mm"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Unidad</Label>
                      <Select value={material.unit} onValueChange={(value) => handleMaterialChange(material.id, 'unit', value)}>
                        <SelectTrigger className="border-[var(--border)] bg-[var(--surface)] text-left">
                          <SelectValue placeholder="plancha" />
                        </SelectTrigger>
                        <SelectContent>
                          {unitOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Precio (CLP)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={material.price}
                        onChange={(event) => handleMaterialChange(material.id, 'price', event.target.value)}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        min="0"
                        value={material.quantity}
                        onChange={(event) => handleMaterialChange(material.id, 'quantity', event.target.value)}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Total</Label>
                      <Input value={formatCLP(toNumber(material.price) * toNumber(material.quantity))} readOnly />
                    </div>
                    <div className="sm:col-span-12 flex flex-wrap justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateRow(setBaseMaterials, material.id, createMaterialRow)}
                      >
                        <Copy className="h-4 w-4" />
                        Duplicar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRow(setBaseMaterials, material.id, createMaterialRow)}
                        className="text-[var(--danger)]"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                    {material.details && (
                      <div className="sm:col-span-12">
                        <p className="text-xs text-[var(--muted)]">{material.details}</p>
                      </div>
                    )}
                  </div>
                ))}
                <div className="text-right text-sm text-[var(--text)] font-semibold">
                  Total materiales base: {formatCLP(materialsTotal)}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span>Tapacantos</span>
                    <Badge variant="outline">{formatCLP(edgesTotal)}</Badge>
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEdgeItems((prev) => [...prev, createEdgeRow()])}>
                      <Plus className="h-4 w-4" />
                      Agregar tapacanto
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {edgeItems.map((edge) => (
                    <div key={edge.id} className="grid gap-4 rounded-[var(--radius)] border border-[var(--border)] p-4 sm:grid-cols-12">
                      <div className="space-y-2 sm:col-span-4">
                        <Label>Nombre</Label>
                        <Input
                          value={edge.name}
                          onChange={(event) => handleEdgeChange(edge.id, 'name', event.target.value)}
                          placeholder="Ej: Canto ABS"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>$ / ml</Label>
                        <Input
                          type="number"
                          min="0"
                          value={edge.price}
                          onChange={(event) => handleEdgeChange(edge.id, 'price', event.target.value)}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Cantidad (ml)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={edge.quantity}
                          onChange={(event) => handleEdgeChange(edge.id, 'quantity', event.target.value)}
                        />
                      </div>
                      <div className="flex items-end justify-end gap-2 sm:col-span-12">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-[var(--muted)]">Total:</span>
                          <span className="text-sm font-medium text-[var(--text)]">{formatCLP(computeEdgeRowTotal(edge))}</span>
                        </div>
                        <div className="ml-auto flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => duplicateRow(setEdgeItems, edge.id, createEdgeRow)}
                          >
                            <Copy className="h-4 w-4" />
                            Duplicar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeRow(setEdgeItems, edge.id, createEdgeRow)}
                            className="text-[var(--danger)]"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-sm text-[var(--text)] font-semibold">
                    Total tapacantos: {formatCLP(edgesTotal)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span>Herrajes</span>
                    <Badge variant="outline">{formatCLP(hardwareTotal)}</Badge>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setHardwareItems((prev) => [...prev, createHardwareRow()])}>
                    <Plus className="h-4 w-4" />
                    Agregar nuevo herraje
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hardwareItems.map((item) => (
                    <div key={item.id} className="grid gap-4 rounded-[var(--radius)] border border-[var(--border)] p-4 sm:grid-cols-12">
                      <div className="space-y-2 sm:col-span-5">
                        <Label>Nombre</Label>
                        <Input
                          value={item.name}
                          onChange={(event) => handleHardwareChange(item.id, 'name', event.target.value)}
                          placeholder="Ej: Bisagra 35mm"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-3">
                        <Label>$ c/u</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(event) => handleHardwareChange(item.id, 'price', event.target.value)}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Cantidad</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(event) => handleHardwareChange(item.id, 'quantity', event.target.value)}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Total</Label>
                        <Input value={formatCLP(toNumber(item.price) * toNumber(item.quantity))} readOnly />
                      </div>
                      <div className="flex items-end justify-end gap-2 sm:col-span-12">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => duplicateRow(setHardwareItems, item.id, createHardwareRow)}
                          >
                            <Copy className="h-4 w-4" />
                            Duplicar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeRow(setHardwareItems, item.id, createHardwareRow)}
                            className="text-[var(--danger)]"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-sm text-[var(--text)] font-semibold">
                    Total herrajes: {formatCLP(hardwareTotal)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
              <CardHeader>
                <CardTitle>Totales</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="grid gap-3">
                    <div className="space-y-2">
                      <Label>% Indirectos</Label>
                      <Input
                        type="number"
                        min="0"
                        value={indirectPercent}
                        onChange={(event) => setIndirectPercent(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>% Margen</Label>
                      <Input
                        type="number"
                        min="0"
                        value={marginPercent}
                        onChange={(event) => setMarginPercent(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>IVA %</Label>
                      <Input
                        type="number"
                        min="0"
                        value={taxPercent}
                        onChange={(event) => setTaxPercent(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Flete (CLP)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={freight}
                        onChange={(event) => setFreight(event.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)]/40 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Materiales base</span>
                    <span className="font-medium">{formatCLP(materialsTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tapacantos</span>
                    <span className="font-medium">{formatCLP(edgesTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Herrajes</span>
                    <span className="font-medium">{formatCLP(hardwareTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Indirectos</span>
                    <span className="font-medium">{formatCLP(indirects)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Flete</span>
                    <span className="font-medium">{formatCLP(freightValue)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-semibold text-[var(--text)]">Subtotal neto</span>
                    <span className="font-semibold text-[var(--text)]">{formatCLP(subtotalNet)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Margen</span>
                    <span className="font-medium">{formatCLP(marginValue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Precio de venta</span>
                    <span className="font-medium">{formatCLP(subtotalWithMargin)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>IVA</span>
                    <span className="font-medium">{formatCLP(taxValue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total con IVA</span>
                    <span className="font-semibold text-[var(--primary)]">{formatCLP(totalWithTax)}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                      Imprimir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>

      <div className="print-only space-y-6 p-8">
        <header className="border-b border-[var(--border)] pb-4">
          <h1 className="text-2xl font-semibold text-[var(--text)]">Resumen de presupuesto</h1>
          <p className="text-sm text-[var(--muted)]">Generado: {printGeneratedAt}</p>
        </header>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--text)]">Totales</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs text-[var(--muted)]">Materiales base</p>
              <p className="text-lg font-semibold text-[var(--text)]">{formatCLP(materialsTotal)}</p>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs text-[var(--muted)]">Tapacantos</p>
              <p className="text-lg font-semibold text-[var(--text)]">{formatCLP(edgesTotal)}</p>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs text-[var(--muted)]">Herrajes</p>
              <p className="text-lg font-semibold text-[var(--text)]">{formatCLP(hardwareTotal)}</p>
            </div>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-xs text-[var(--muted)]">Total con IVA</p>
              <p className="text-lg font-semibold text-[var(--primary)]">{formatCLP(totalWithTax)}</p>
            </div>
          </div>
        </section>
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-[var(--text)]">Patrones optimizados</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--surface)]">
                <th className="border border-[var(--border)] px-3 py-2 text-left">Hoja</th>
                <th className="border border-[var(--border)] px-3 py-2 text-left">Material</th>
                <th className="border border-[var(--border)] px-3 py-2 text-left">Dimensiones</th>
                <th className="border border-[var(--border)] px-3 py-2 text-right">Utilizacion</th>
                <th className="border border-[var(--border)] px-3 py-2 text-right">Piezas</th>
              </tr>
            </thead>
            <tbody>
              {result.patterns.map((pattern, index) => (
                <tr key={pattern.id ?? index}>
                  <td className="border border-[var(--border)] px-3 py-2">Hoja {index + 1}</td>
                  <td className="border border-[var(--border)] px-3 py-2">{pattern.materialName || '�'}</td>
                  <td className="border border-[var(--border)] px-3 py-2">
                    {pattern.materialLength} � {pattern.materialWidth} {units}
                  </td>
                  <td className="border border-[var(--border)] px-3 py-2 text-right">{pattern.utilization.toFixed(1)}%</td>
                  <td className="border border-[var(--border)] px-3 py-2 text-right">{pattern.pieces.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
};

