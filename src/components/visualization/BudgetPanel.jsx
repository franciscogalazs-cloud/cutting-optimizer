import { absoluteUrl } from "@/lib/paths";
import { useEffect, useMemo, useRef } from 'react';
import { printElement } from '@/lib/print.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calculator, Copy, Plus, Trash2 } from 'lucide-react';
import { computeEdgeTotals } from '@/features/edgebanding/edgeBanding.js';
import SummarySheet from '@/components/visualization/SummarySheet';
import { ErrorBoundary } from '@/components/common/ErrorBoundary.jsx';
import { useLocalStorage } from '@/hooks/useLocalStorage.js';
import { formatCLP, rectangleAreaToSquareMeters } from '@/lib/format.js';

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

const createMaterialRow = ({ name = '', unit = 'plancha', price = 0, quantity = 0, details = '', areaM2 } = {}) => ({
  id: createId(),
  name,
  unit,
  price: price ?? 0,
  quantity: quantity ?? 0,
  details,
  // área por ítem (una plancha/hoja) en m², opcional
  areaM2,
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
  const printAreaRef = useRef(null); // contendrá toda la pestaña presupuesto visible
  const [client, setClient] = useLocalStorage('budget-client', emptyClient);
  const [baseMaterials, setBaseMaterials] = useLocalStorage('budget-base-materials', [createMaterialRow()]);
  const [edgeItems, setEdgeItems] = useLocalStorage('budget-edge-items', [createEdgeRow()]);
  const [hardwareItems, setHardwareItems] = useLocalStorage('budget-hardware-items', [createHardwareRow()]);
  const [indirectPercent, setIndirectPercent] = useLocalStorage('budget-indirect-percent', 0);
  const [marginPercent, setMarginPercent] = useLocalStorage('budget-margin-percent', 0);
  const [taxPercent, setTaxPercent] = useLocalStorage('budget-tax-percent', 19);
  const [freight, setFreight] = useLocalStorage('budget-freight', 0);
  // Desperdicio de tapacantos se calcula fuera; no se edita aquí.

  // (ancho eliminado)

  // Precios de materiales no se heredan; se definen en Presupuesto.
  const defaultBaseRows = useMemo(() => {
    if (result?.patterns?.length) {
      const map = new Map();
      for (const pattern of result.patterns) {
        const name = String(pattern.materialName || 'Material').trim();
        const key = `${name}|${pattern.materialLength}x${pattern.materialWidth}`;
        const areaM2 = rectangleAreaToSquareMeters(Number(pattern.materialLength) || 0, Number(pattern.materialWidth) || 0, 1, units);
        const current = map.get(key) ?? {
          name,
          unit: 'plancha',
          quantity: 0,
          price: 0,
          details: `${pattern.materialLength} x ${pattern.materialWidth} ${units}`,
          areaM2,
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
          areaM2: rectangleAreaToSquareMeters(Number(material.length) || 0, Number(material.width) || 0, 1, units),
        }),
      );
    }

    return [createMaterialRow()];
  }, [result, materials, units]);

  const defaultEdgeRows = useMemo(() => {
    const totals = computeEdgeTotals(pieces) || {};
    const entries = Object.entries(totals);
    if (entries.length === 0) {
      return [createEdgeRow({ name: 'General' })];
    }
    return entries.map(([type, lengthMm]) =>
      createEdgeRow({
        name: type,
        price: 0,
        quantity: toNumber((lengthMm ?? 0) / 1000),
      }),
    );
  }, [pieces]);

  useEffect(() => {
    // Si no hay datos previos guardados, inicializamos desde resultado/materiales
    if (!client || (client && !client.__init)) {
      setClient({ ...emptyClient, __init: true });
    }
    if (Array.isArray(baseMaterials) && baseMaterials.length <= 1 && !baseMaterials[0]?.name && defaultBaseRows.length) {
      setBaseMaterials(defaultBaseRows);
    }
    if (Array.isArray(edgeItems) && edgeItems.length <= 1 && !edgeItems[0]?.name && defaultEdgeRows.length) {
      setEdgeItems(defaultEdgeRows);
    }
    if (Array.isArray(hardwareItems) && hardwareItems.length === 1 && !hardwareItems[0]?.name) {
      setHardwareItems([createHardwareRow()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // Datos para la planilla de visualización (solo pantalla)
  const sheetItems = useMemo(() => {
    const materials = (baseMaterials || []).map((m) => ({
      detalle: m.details ? `${m.name || 'Material'} — ${m.details}` : (m.name || 'Material'),
      cantidad: toNumber(m.quantity) || 0,
      unitario: toNumber(m.price) || 0,
      metros2: Number.isFinite(Number(m.areaM2)) ? Number(m.areaM2) : undefined,
      subtotal: toNumber(m.price) * toNumber(m.quantity),
    }));
    const edges = (edgeItems || []).map((e) => ({
      detalle: `Tapacanto ${String(e.name || '').trim()}`.trim(),
      cantidad: toNumber(e.quantity) || 0,
      unitario: toNumber(e.price) || 0,
      subtotal: (toNumber(e.price) * toNumber(e.quantity)) || 0,
    }));
    const hardware = (hardwareItems || []).map((h) => ({
      detalle: `Herraje ${String(h.name || '').trim()}`.trim(),
      cantidad: toNumber(h.quantity) || 0,
      unitario: toNumber(h.price) || 0,
      subtotal: toNumber(h.price) * toNumber(h.quantity),
    }));
    return [...materials, ...edges, ...hardware];
  }, [baseMaterials, edgeItems, hardwareItems]);

  const sheetTotals = useMemo(() => ({
    materialesBase: materialsTotal,
    tapacantos: edgesTotal,
    herrajes: hardwareTotal,
    indirectos: indirects,
    flete: freightValue,
    subtotalNeto: subtotalNet,
    margen: marginValue,
    precioVenta: subtotalWithMargin,
    iva: taxValue,
    totalConIVA: totalWithTax,
  }), [materialsTotal, edgesTotal, hardwareTotal, indirects, freightValue, subtotalNet, marginValue, subtotalWithMargin, taxValue, totalWithTax]);
  const printGeneratedAt = useMemo(() => new Date().toLocaleString('es-CL'), []);
  const printFolio = useMemo(() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `P-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  }, []);

  const printBudget = () => {
    // Cierra posibles popups/portales (Radix Select, Dialog, etc.) antes de imprimir
    try {
      document.activeElement?.blur?.();
      const escDown = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true });
      const escUp = new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', bubbles: true });
      document.dispatchEvent(escDown);
      document.dispatchEvent(escUp);
    } catch {
      /* ignore: si no hay overlays activos, no hay nada que cerrar */
    }

    const node = printAreaRef.current;
    if (!node) return window.print();
    const extraCss = `
      /* Preferir menos hojas */
      @page { size: A4; margin: 6mm; }

      /* Mostrar solo la versión de impresión */
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      .hide-on-print { display: none !important; }
      /* Expandir contenedores con scroll para que entre todo */
  .max-h-[80vh] { max-height: none !important; }
      .overflow-auto, .overflow-y-auto, .overflow-x-auto { overflow: visible !important; }
      /* Evitar posicionamiento sticky que puede romper el layout en papel */
      .sticky { position: static !important; left: auto !important; right: auto !important; top: auto !important; }
      /* Ocultar botones en impresión (dejar visibles sólo triggers de Select/Radix) */
      button:not([role="combobox"]) { display: none !important; }
      [role="button"]:not([role="combobox"]) { display: none !important; }
      /* Neutralizar sombras/bordes si quieres más limpio (opcional) */
  /* .shadow-[var(--shadow)], .shadow, .ring, .border { box-shadow: none !important; } */

  /* ===== Compactación del contenido del presupuesto ===== */
  #budget-print-root { font-size: 10px; line-height: 1.25; }
      #budget-print-root h1 { font-size: 16px; margin: 0 0 6px 0; }
      #budget-print-root h2 { font-size: 14px; margin: 6px 0; }
      #budget-print-root h3, #budget-print-root h4 { font-size: 12px; margin: 4px 0; }
  #budget-print-root svg { display: none !important; }
  #budget-print-root img.print-logo { display: inline-block !important; max-height: 84px; }
      #budget-print-root .shadow, #budget-print-root [class*="shadow-"] { box-shadow: none !important; }
      #budget-print-root .rounded, #budget-print-root [class*="rounded-"] { border-radius: 4px !important; }
      #budget-print-root .border, #budget-print-root [class*="border-"] { border-color: #e5e7eb !important; }

      /* Reducir paddings y gaps frecuentes */
  #budget-print-root .p-4 { padding: 6px !important; }
  #budget-print-root .p-3 { padding: 5px !important; }
  #budget-print-root .p-2 { padding: 3px !important; }
      #budget-print-root .px-4 { padding-left: 8px !important; padding-right: 8px !important; }
  #budget-print-root .px-3 { padding-left: 5px !important; padding-right: 5px !important; }
  #budget-print-root .py-4 { padding-top: 6px !important; padding-bottom: 6px !important; }
  #budget-print-root .py-3 { padding-top: 5px !important; padding-bottom: 5px !important; }
  #budget-print-root .py-2 { padding-top: 3px !important; padding-bottom: 3px !important; }
  #budget-print-root .gap-6 { gap: 6px !important; }
  #budget-print-root .gap-4 { gap: 5px !important; }
  #budget-print-root .gap-3 { gap: 3px !important; }
  #budget-print-root .space-y-6 > * + * { margin-top: 6px !important; }
  #budget-print-root .space-y-4 > * + * { margin-top: 5px !important; }
  #budget-print-root .space-y-3 > * + * { margin-top: 3px !important; }

      /* Inputs/selects como texto simple para ahorrar espacio */
      #budget-print-root input, #budget-print-root select, #budget-print-root textarea {
        border: 0 !important; background: transparent !important; box-shadow: none !important;
        padding: 0 !important; height: auto !important; outline: 0 !important; appearance: none !important;
      }
      #budget-print-root [role="combobox"] { border: 0 !important; background: transparent !important; box-shadow: none !important; padding: 0 !important; }
      #budget-print-root .badge, #budget-print-root [class*="badge"] { padding: 0 4px !important; font-size: 10px !important; }

      /* Tablas compactas */
      #budget-print-root table { border-collapse: collapse !important; width: 100% !important; }
      #budget-print-root th, #budget-print-root td { padding: 3px 5px !important; }
      #budget-print-root th { background: #f8fafc !important; }
      #budget-print-root tr { break-inside: avoid; }
      #budget-print-root section, #budget-print-root .card, #budget-print-root .Card, #budget-print-root .border { break-inside: avoid; }
    `;
    // Pequeño delay para permitir que Radix desmonte portales sin conflicto
    setTimeout(() => {
      printElement(node, { title: 'Presupuesto', extraCss });
    }, 30);
  };

  const scrollToId = (id) => {
    try {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      /* ignore: scroll inalcanzable */
    }
  };

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
      <div ref={printAreaRef} id="budget-print-root" className="">
        {/* Editor visible solo en pantalla (no-print) para agregar/editar valores */}
        <ScrollArea className="no-print max-h-[80vh] pr-2">
          <div className="space-y-6 pb-4">
            <Card id="budget-editor-cliente" className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
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

            <Card id="budget-editor-materiales" className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span>Materiales base</span>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setBaseMaterials((prev) => [...prev, createMaterialRow()])}>
                  <Plus className="h-4 w-4" />
                  Agregar material
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {baseMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="grid items-end gap-3 rounded-[var(--radius)] border border-[var(--border)] p-4"
                    style={{ gridTemplateColumns: 'minmax(160px, 2fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr) auto' }}
                  >
                    <div className="space-y-2 min-w-0">
                      <Label>Tipo</Label>
                      <Input
                        value={material.name}
                        onChange={(event) => handleMaterialChange(material.id, 'name', event.target.value)}
                        placeholder="Ej: Melamina 18mm"
                      />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label>Unidad</Label>
                      <Select value={material.unit} onValueChange={(value) => handleMaterialChange(material.id, 'unit', value)}>
                        <SelectTrigger className="w-full border-[var(--border)] bg-[var(--surface)] text-left">
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
                    <div className="space-y-2 min-w-0">
                      <Label>Precio (CLP)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={material.price}
                        onChange={(event) => handleMaterialChange(material.id, 'price', event.target.value)}
                      />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        min="0"
                        value={material.quantity}
                        onChange={(event) => handleMaterialChange(material.id, 'quantity', event.target.value)}
                      />
                    </div>
                    <div className="space-y-2 min-w-0">
                      <Label>Total</Label>
                      <Input value={formatCLP(toNumber(material.price) * toNumber(material.quantity))} readOnly />
                    </div>
                    <div className="flex justify-end gap-2 justify-self-end">
                      <Button
                        variant="outline"
                        size="icon"
                        title="Duplicar"
                        aria-label="Duplicar"
                        onClick={() => duplicateRow(setBaseMaterials, material.id, createMaterialRow)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Eliminar"
                        aria-label="Eliminar"
                        onClick={() => removeRow(setBaseMaterials, material.id, createMaterialRow)}
                        className="text-[var(--danger)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Ocultamos detalles (dimensiones) en pantalla; se muestran solo en la hoja de impresión */}
                  </div>
                ))}
                <div className="text-right text-sm text-[var(--text)] font-semibold">
                  Total materiales base: {formatCLP(materialsTotal)}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card id="budget-editor-tapacantos" className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span>Tapacantos</span>
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
                    <div
                      key={edge.id}
                      className="grid items-end gap-3 rounded-[var(--radius)] border border-[var(--border)] p-4"
                      style={{ gridTemplateColumns: 'minmax(160px, 2fr) minmax(120px, 1fr) minmax(140px, 1fr) minmax(120px, 1fr) auto' }}
                    >
                      <div className="space-y-2 min-w-0">
                        <Label>Nombre</Label>
                        <Input
                          value={edge.name}
                          onChange={(event) => handleEdgeChange(edge.id, 'name', event.target.value)}
                          placeholder="Ej: Canto ABS"
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label>$ / ml</Label>
                        <Input
                          type="number"
                          min="0"
                          value={edge.price}
                          onChange={(event) => handleEdgeChange(edge.id, 'price', event.target.value)}
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label>Cantidad (ml)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={edge.quantity}
                          onChange={(event) => handleEdgeChange(edge.id, 'quantity', event.target.value)}
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label>Total</Label>
                        <Input value={formatCLP(computeEdgeRowTotal(edge))} readOnly />
                      </div>
                      <div className="flex justify-end gap-2 justify-self-end">
                        <Button
                          variant="outline"
                          size="icon"
                          title="Duplicar"
                          aria-label="Duplicar"
                          onClick={() => duplicateRow(setEdgeItems, edge.id, createEdgeRow)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          title="Eliminar"
                          aria-label="Eliminar"
                          onClick={() => removeRow(setEdgeItems, edge.id, createEdgeRow)}
                          className="text-[var(--danger)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-sm text-[var(--text)] font-semibold">
                    Total tapacantos: {formatCLP(edgesTotal)}
                  </div>
                </CardContent>
              </Card>

              <Card id="budget-editor-herrajes" className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span>Herrajes</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setHardwareItems((prev) => [...prev, createHardwareRow()])}>
                    <Plus className="h-4 w-4" />
                    Agregar nuevo herraje
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hardwareItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid items-end gap-3 rounded-[var(--radius)] border border-[var(--border)] p-4"
                      style={{ gridTemplateColumns: 'minmax(160px, 2fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr) auto' }}
                    >
                      <div className="space-y-2 min-w-0">
                        <Label>Nombre</Label>
                        <Input
                          value={item.name}
                          onChange={(event) => handleHardwareChange(item.id, 'name', event.target.value)}
                          placeholder="Ej: Bisagra 35mm"
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label>$ c/u</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(event) => handleHardwareChange(item.id, 'price', event.target.value)}
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label>Cantidad</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(event) => handleHardwareChange(item.id, 'quantity', event.target.value)}
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label>Total</Label>
                        <Input value={formatCLP(toNumber(item.price) * toNumber(item.quantity))} readOnly />
                      </div>
                      <div className="flex justify-end gap-2 justify-self-end">
                        <Button
                          variant="outline"
                          size="icon"
                          title="Duplicar"
                          aria-label="Duplicar"
                          onClick={() => duplicateRow(setHardwareItems, item.id, createHardwareRow)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          title="Eliminar"
                          aria-label="Eliminar"
                          onClick={() => removeRow(setHardwareItems, item.id, createHardwareRow)}
                          className="text-[var(--danger)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-sm text-[var(--text)] font-semibold">
                    Total herrajes: {formatCLP(hardwareTotal)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fila compacta de parámetros y total (según imagen), ubicada justo debajo de Herrajes */}
            <div className="no-print rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
              <div
                className="grid items-end gap-3"
                style={{ gridTemplateColumns: 'repeat(2, minmax(140px,1fr)) minmax(140px,1fr) minmax(160px,1fr) auto' }}
              >
                <div className="space-y-1 min-w-0">
                  <Label className="text-sm">% Indirectos</Label>
                  <Input
                    type="number"
                    min="0"
                    value={indirectPercent}
                    onChange={(e) => setIndirectPercent(e.target.value)}
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <Label className="text-sm">% Margen</Label>
                  <Input
                    type="number"
                    min="0"
                    value={marginPercent}
                    onChange={(e) => setMarginPercent(e.target.value)}
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <Label className="text-sm">IVA %</Label>
                  <Input
                    type="number"
                    min="0"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <Label className="text-sm">Flete (CLP)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={freight}
                    onChange={(e) => setFreight(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 justify-self-end">
                  <Button
                    variant="outline"
                    size="icon"
                    title="Limpiar parámetros"
                    aria-label="Limpiar parámetros"
                    className="text-[var(--danger)]"
                    onClick={() => {
                      setIndirectPercent(0);
                      setMarginPercent(0);
                      setTaxPercent(0);
                      setFreight(0);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Reemplazado por la planilla de visualización SummarySheet (solo pantalla) */}

            {/* Visualización tipo planilla (solo pantalla) */}
            <div className="no-print">
              <ErrorBoundary>
                <SummarySheet
                  items={sheetItems}
                  totals={sheetTotals}
                  percents={{
                    indirectos: toNumber(indirectPercent),
                    margen: toNumber(marginPercent),
                    iva: toNumber(taxPercent),
                  }}
                />
              </ErrorBoundary>
            </div>

          </div>
        </ScrollArea>
  {/* Resumen consolidado: solo para impresión */}
  <div className="print-only space-y-6 p-6">
          <header className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-3">
              <img src={absoluteUrl('brand/industrial-plate/stencil_main.svg')} alt="Logo" className="print-logo" style={{ height: 64 }} />
              <div>
                <h1 className="text-xl font-semibold text-[var(--text)]">Resumen de presupuesto</h1>
                <p className="text-xs text-[var(--muted)]">Generado: {printGeneratedAt} · Folio: {printFolio}</p>
              </div>
            </div>
            <div className="text-right text-xs text-[var(--muted)]">Cliente</div>
          </header>
          
          {/* Datos del cliente */}
          <section className="space-y-2">
            <div className="text-sm text-[var(--muted)]">Datos del cliente</div>
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-white p-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-[var(--muted)]">Nombre</div>
                  <div className="text-[var(--text)]">{client.name || '—'}</div>
                </div>
                <div>
                  <div className="text-[var(--muted)]">Email</div>
                  <div className="text-[var(--text)]">{client.email || '—'}</div>
                </div>
                <div>
                  <div className="text-[var(--muted)]">Telefono</div>
                  <div className="text-[var(--text)]">{client.phone || '—'}</div>
                </div>
              </div>
            </div>
            <div className="no-print">
              <Button size="sm" variant="outline" onClick={() => scrollToId('budget-editor-cliente')}>Agregar / Editar</Button>
            </div>
          </section>
          {/* Materiales base */}
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--text)]">Materiales base</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--surface)]">
                  <th className="border border-[var(--border)] px-3 py-2 text-left">Tipo</th>
                  <th className="border border-[var(--border)] px-3 py-2 text-left">Unidad</th>
                  <th className="border border-[var(--border)] px-3 py-2 text-right">Precio</th>
                  <th className="border border-[var(--border)] px-3 py-2 text-right">Cantidad</th>
                  <th className="border border-[var(--border)] px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {baseMaterials.map((m) => (
                  <tr key={m.id}>
                    <td className="border border-[var(--border)] px-3 py-2">{m.name || '—'}{m.details ? <div className="text-[10px] text-[var(--muted)]">{m.details}</div> : null}</td>
                    <td className="border border-[var(--border)] px-3 py-2">{m.unit}</td>
                    <td className="border border-[var(--border)] px-3 py-2 text-right">{formatCLP(toNumber(m.price))}</td>
                    <td className="border border-[var(--border)] px-3 py-2 text-right">{toNumber(m.quantity)}</td>
                    <td className="border border-[var(--border)] px-3 py-2 text-right">{formatCLP(toNumber(m.price) * toNumber(m.quantity))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="no-print">
              <Button size="sm" variant="outline" onClick={() => scrollToId('budget-editor-materiales')}>Agregar material</Button>
            </div>
          </section>
          {/* Tapacantos */}
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--text)]">Tapacantos</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--surface)]">
                  <th className="border border-[var(--border)] px-3 py-2 text-left">Nombre</th>
                  <th className="border border-[var(--border)] px-3 py-2 text-right">$/ml</th>
                  <th className="border border-[var(--border)] px-3 py-2 text-right">Cantidad (ml)</th>
                  <th className="border border-[var(--border)] px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {edgeItems.map((e) => (
                  <tr key={e.id}>
                    <td className="border border-[var(--border)] px-3 py-2">{e.name || '—'}</td>
                    <td className="border border-[var(--border)] px-3 py-2 text-right">{formatCLP(toNumber(e.price))}</td>
                    <td className="border border-[var(--border)] px-3 py-2 text-right">{toNumber(e.quantity)}</td>
                    <td className="border border-[var(--border)] px-3 py-2 text-right">{formatCLP(toNumber(e.price) * toNumber(e.quantity))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="no-print">
              <Button size="sm" variant="outline" onClick={() => scrollToId('budget-editor-tapacantos')}>Agregar tapacanto</Button>
            </div>
          </section>
          {/* Herrajes */}
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--text)]">Herrajes</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[var(--surface)]">
                  <th className="border border-[var(--border)] px-3 py-2 text-left">Nombre</th>
                  <th className="border border-[var(--border)] px-3 py-2 text-right">$ c/u</th>
                  <th className="border border-[var(--border)] px-3 py-2 text-right">Cantidad</th>
                  <th className="border border-[var(--border)] px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {hardwareItems.map((h) => (
                  <tr key={h.id}>
                    <td className="border border-[var(--border)] px-3 py-2">{h.name || '—'}</td>
                    <td className="border border-[var(--border)] px-3 py-2 text-right">{formatCLP(toNumber(h.price))}</td>
                    <td className="border border-[var(--border)] px-3 py-2 text-right">{toNumber(h.quantity)}</td>
                    <td className="border border-[var(--border)] px-3 py-2 text-right">{formatCLP(toNumber(h.price) * toNumber(h.quantity))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="no-print">
              <Button size="sm" variant="outline" onClick={() => scrollToId('budget-editor-herrajes')}>Agregar herraje</Button>
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
                  <th className="border border-[var(--border)] px-3 py-2 text-right">Utilización</th>
                  <th className="border border-[var(--border)] px-3 py-2 text-right">Piezas</th>
                </tr>
              </thead>
              <tbody>
                {result.patterns.map((pattern, index) => (
                  <tr key={pattern.id ?? index}>
                    <td className="border border-[var(--border)] px-3 py-2">Hoja {index + 1}</td>
                    <td className="border border-[var(--border)] px-3 py-2">{pattern.materialName || 'N/A'}</td>
                    <td className="border border-[var(--border)] px-3 py-2">{pattern.materialLength} × {pattern.materialWidth} {units}</td>
                    <td className="border border-[var(--border)] px-3 py-2 text-right">{Number(pattern.utilization ?? 0).toFixed(1)}%</td>
                    <td className="border border-[var(--border)] px-3 py-2 text-right">{(pattern.pieces || []).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {/* Bloque de parámetros debajo de patrones removido (usamos sólo la fila compacta bajo Herrajes) */}
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--text)]">Totales</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Parámetros */}
              <div className="space-y-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)]/40 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>% Indirectos</span>
                  <span className="font-medium">{toNumber(indirectPercent)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>% Margen</span>
                  <span className="font-medium">{toNumber(marginPercent)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>IVA %</span>
                  <span className="font-medium">{toNumber(taxPercent)}%</span>
                </div>
              </div>
              {/* Totales */}
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
                  <Button variant="outline" size="sm" onClick={printBudget}>
                    Imprimir
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

