import { absoluteUrl } from "@/lib/paths";
import { useEffect, useMemo, useRef } from 'react';
import { printElement } from '@/lib/print.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calculator, Copy, Plus, Trash2, Printer } from 'lucide-react';
import { computeEdgeTotals } from '@/features/edgebanding/edgeBanding.js';
// SummarySheet removido según requerimiento de diseño
import { ErrorBoundary } from '@/components/common/ErrorBoundary.jsx';
import { useLocalStorage } from '@/hooks/useLocalStorage.js';
import { formatCLP, rectangleAreaToSquareMeters } from '@/lib/format.js';

const createId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const toNumber = (value) => {
  // Normaliza números escritos con separadores locales (p. ej. "1.234,56" o "1,234.56")
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  let v = String(value ?? '').trim();
  if (!v) return 0;
  // Eliminar caracteres no numéricos relevantes (mantener dígitos, punto, coma y signo menos)
  v = v.replace(/[^0-9,.-]/g, '');
  // Si hay ambos separadores, decide el decimal por el último que aparezca
  const lastComma = v.lastIndexOf(',');
  const lastDot = v.lastIndexOf('.');
  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      // coma como decimal: remover puntos (miles) y cambiar coma a punto
      v = v.replace(/\./g, '').replace(',', '.');
    } else {
      // punto como decimal: remover comas (miles)
      v = v.replace(/,/g, '');
    }
  } else if (lastComma !== -1) {
    // Solo coma: tratarla como decimal
    v = v.replace(',', '.');
  } else {
    // Solo punto o sólo dígitos: ya válido
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Helpers de validación para formularios
const validateEmail = (email) => {
  const v = String(email ?? '').trim();
  if (!v) return true; // vacío permitido
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
};
// Sin validación ni formateo obligatorio para RUT: permitir letras y símbolos habituales.
// Se mantiene en mayúsculas por consistencia visual.
const cleanRut = (rut) => String(rut ?? '').toUpperCase();

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

const createOtherRow = ({ name = '', price = 0, quantity = 0 } = {}) => ({
  id: createId(),
  name,
  price,
  quantity,
});

const emptyClient = { name: '', email: '', phone: '' };
const emptyCompany = { name: '', email: '', phone: '', rut: '', address: '', notes: '' };

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
  const [company, setCompany] = useLocalStorage('budget-company', emptyCompany);
  const [baseMaterials, setBaseMaterials] = useLocalStorage('budget-base-materials', [createMaterialRow()]);
  const [edgeItems, setEdgeItems] = useLocalStorage('budget-edge-items', [createEdgeRow()]);
  const [hardwareItems, setHardwareItems] = useLocalStorage('budget-hardware-items', [createHardwareRow()]);
  const [otherItems, setOtherItems] = useLocalStorage('budget-other-items', [createOtherRow()]);
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
      setClient((prev) => ({ ...emptyClient, ...(prev || {}), __init: true }));
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

  const handleOtherChange = (id, key, value) => {
    setOtherItems((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
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
  const othersTotal = otherItems.reduce((sum, item) => sum + toNumber(item.price) * toNumber(item.quantity), 0);
  const directTotal = materialsTotal + edgesTotal + hardwareTotal + othersTotal;
  const indirects = directTotal * (toNumber(indirectPercent) / 100);
  const freightValue = toNumber(freight);
  const subtotalNet = directTotal + indirects + freightValue;
  const marginValue = subtotalNet * (toNumber(marginPercent) / 100);
  const subtotalWithMargin = subtotalNet + marginValue;
  const taxValue = subtotalWithMargin * (toNumber(taxPercent) / 100);
  const totalWithTax = subtotalWithMargin + taxValue;
  // (planillas intermedias removidas; se usa solo resumen de costos en impresión)

  // Exportación CSV removida por solicitud

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
      /* Página y visibilidad */
      @page { size: A4; margin: 12mm; }
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      #budget-print-root [data-print-hide] { display: none !important; }
      .hide-on-print { display: none !important; }

      /* Comportamiento de contenedores */
      .max-h-[80vh], .max-h-[70vh] { max-height: none !important; }
      .overflow-auto, .overflow-y-auto, .overflow-x-auto { overflow: visible !important; }
      .sticky { position: static !important; left: auto !important; right: auto !important; top: auto !important; }
      button:not([role="combobox"]) { display: none !important; }
      [role="button"]:not([role="combobox"]) { display: none !important; }

      /* Estética similar a pantalla */
      #budget-print-root { font-size: 12px; line-height: 1.35; color: #111827; }
      #budget-print-root h1 { font-size: 22px; font-weight: 700; letter-spacing: .02em; }
      #budget-print-root .card-like { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; }
      #budget-print-root .field { border: 1px solid #e5e7eb; border-radius: 8px; padding: 6px 10px; background: #ffffff; }
      #budget-print-root .label { color: #6b7280; font-size: 11px; text-transform: uppercase; }
      #budget-print-root .value { color: #111827; font-size: 12px; }
      #budget-print-root .section-title { text-transform: uppercase; letter-spacing: .06em; font-weight: 600; color: #111827; }
      #budget-print-root .muted { color: #6b7280; }
      #budget-print-root .total-label { text-transform: uppercase; color: #6b7280; font-size: 11px; }
      #budget-print-root .total-value { color: #111827; font-weight: 600; }
      #budget-print-root .grid-gap { gap: 8px; }
      #budget-print-root .row-gap { row-gap: 6px; }
      #budget-print-root section, #budget-print-root .card-like { break-inside: avoid; }
      #budget-print-root .print-footer { text-align: center; margin-top: 10mm; }
      #budget-print-root .print-footer img { opacity: 0.15; height: 48px; }
    `;
    // Pequeño delay para permitir que Radix desmonte portales sin conflicto
    setTimeout(() => {
      printElement(node, { title: 'Presupuesto', extraCss });
    }, 30);
  };

  // scroll helper removido en impresión compacta

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
          <div className="space-y-2 pb-1">
            <Card id="budget-editor-empresa" className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
              <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="uppercase tracking-wide">Datos de la empresa</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="budget-company-name" className="uppercase text-[12px] text-[var(--muted)]">Nombre</Label>
                  <Input
                    className="h-8 px-2 py-1 text-sm"
                    id="budget-company-name"
                    value={company.name}
                    onChange={(event) => setCompany((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="budget-company-email" className="uppercase text-[12px] text-[var(--muted)]">Email</Label>
                  <Input
                    className={"h-8 px-2 py-1 text-sm " + (!validateEmail(company.email) ? 'border-red-500 focus-visible:ring-red-200' : '')}
                    id="budget-company-email"
                    type="email"
                    aria-invalid={!validateEmail(company.email)}
                    value={company.email}
                    onChange={(event) => setCompany((prev) => ({ ...prev, email: event.target.value }))}
                  />
                  {!validateEmail(company.email) && (
                    <div className="text-xs text-[var(--danger)]">Email inválido</div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="budget-company-phone" className="uppercase text-[12px] text-[var(--muted)]">Telefono</Label>
                  <Input
                    className="h-8 px-2 py-1 text-sm"
                    id="budget-company-phone"
                    value={company.phone}
                    onChange={(event) => setCompany((prev) => ({ ...prev, phone: event.target.value }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-1">
                  <Label htmlFor="budget-company-rut" className="uppercase text-[12px] text-[var(--muted)]">RUT</Label>
                  <Input
                    className="h-8 px-2 py-1 text-sm"
                    id="budget-company-rut"
                    placeholder="RUT / ID"
                    value={company.rut}
                    onChange={(event) => setCompany((prev) => ({ ...prev, rut: cleanRut(event.target.value) }))}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="budget-company-address" className="uppercase text-[12px] text-[var(--muted)]">Direccion</Label>
                  <Input
                    className="h-8 px-2 py-1 text-sm"
                    id="budget-company-address"
                    value={company.address}
                    onChange={(event) => setCompany((prev) => ({ ...prev, address: event.target.value }))}
                  />
                </div>
                {/* Notas y condiciones movidas al final de la pestaña */}
              </CardContent>
            </Card>
            <Card id="budget-editor-cliente" className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
              <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="uppercase tracking-wide">Datos del cliente</CardTitle>
                <div className="no-print">
                  <Button size="sm" onClick={printBudget} className="rounded-full bg-green-500 text-white hover:bg-green-600">
                    <Printer className="h-4 w-4" />
                    <span className="hidden sm:inline">Imprimir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="budget-client-name" className="uppercase text-[12px] text-[var(--muted)]">Nombre</Label>
                  <Input
                    className="h-8 px-2 py-1 text-sm"
                    id="budget-client-name"
                    value={client.name}
                    onChange={(event) => setClient((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="budget-client-email" className="uppercase text-[12px] text-[var(--muted)]">Email</Label>
                  <Input
                    className={"h-8 px-2 py-1 text-sm " + (!validateEmail(client.email) ? 'border-red-500 focus-visible:ring-red-200' : '')}
                    id="budget-client-email"
                    type="email"
                    aria-invalid={!validateEmail(client.email)}
                    value={client.email}
                    onChange={(event) => setClient((prev) => ({ ...prev, email: event.target.value }))}
                  />
                  {!validateEmail(client.email) && (
                    <div className="text-xs text-[var(--danger)]">Email inválido</div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="budget-client-phone" className="uppercase text-[12px] text-[var(--muted)]">Telefono</Label>
                  <Input
                    className="h-8 px-2 py-1 text-sm"
                    id="budget-client-phone"
                    value={client.phone}
                    onChange={(event) => setClient((prev) => ({ ...prev, phone: event.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card id="budget-editor-materiales" className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
              <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="uppercase tracking-wide">Materiales base</span>
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => setBaseMaterials((prev) => [...prev, createMaterialRow()])}>
                    <Plus className="h-4 w-4" />
                    Agregar material
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {baseMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="grid items-end gap-1 rounded-[var(--radius)] border border-[var(--border)] p-2"
                    style={{ gridTemplateColumns: 'minmax(160px, 2fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr) auto' }}
                  >
                    <div className="space-y-1 min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Tipo</Label>
                      <Input
                        className="h-8 px-2 py-1 text-sm"
                        value={material.name}
                        onChange={(event) => handleMaterialChange(material.id, 'name', event.target.value)}
                        placeholder="Ej: Melamina 18mm"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Unidad</Label>
                      <Select value={material.unit} onValueChange={(value) => handleMaterialChange(material.id, 'unit', value)}>
                        <SelectTrigger size="sm" className="w-full border-[var(--border)] bg-[var(--surface)] text-left">
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
                    <div className="space-y-1 min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Precio (CLP)</Label>
                      <Input
                        className="h-8 px-2 py-1 text-sm"
                        type="number"
                        step="any"
                        min="0"
                        value={material.price}
                        onChange={(event) => handleMaterialChange(material.id, 'price', event.target.value)}
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Cantidad</Label>
                      <Input
                        className="h-8 px-2 py-1 text-sm"
                        type="number"
                        step="any"
                        min="0"
                        value={material.quantity}
                        onChange={(event) => handleMaterialChange(material.id, 'quantity', event.target.value)}
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Total</Label>
                      <Input className="h-8 px-2 py-1 text-sm" value={formatCLP(toNumber(material.price) * toNumber(material.quantity))} readOnly />
                    </div>
                    <div className="flex justify-end gap-1 justify-self-end">
                      <Button
                        variant="outline"
                        size="icon"
                        title="Duplicar"
                        aria-label="Duplicar"
                        onClick={() => duplicateRow(setBaseMaterials, material.id, createMaterialRow)}
                        className="size-8"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Eliminar"
                        aria-label="Eliminar"
                        onClick={() => removeRow(setBaseMaterials, material.id, createMaterialRow)}
                        className="text-[var(--danger)] size-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Ocultamos detalles (dimensiones) en pantalla; se muestran solo en la hoja de impresión */}
                  </div>
                ))}
                <div className="text-right text-sm">
                  <span className="uppercase text-[12px] text-[var(--muted)]">Total materiales base:</span>{' '}
                  <span className="font-semibold text-[var(--text)]">{formatCLP(materialsTotal)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card id="budget-editor-tapacantos" className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
                <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="uppercase tracking-wide">Tapacantos</span>
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => setEdgeItems((prev) => [...prev, createEdgeRow()])}>
                      <Plus className="h-4 w-4" />
                      Agregar tapacanto
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {edgeItems.map((edge) => (
                    <div
                      key={edge.id}
                      className="grid items-end gap-1 rounded-[var(--radius)] border border-[var(--border)] p-2"
                      style={{ gridTemplateColumns: 'minmax(160px, 2fr) minmax(120px, 1fr) minmax(140px, 1fr) minmax(120px, 1fr) auto' }}
                    >
                      <div className="space-y-1 min-w-0">
                        <Label className="uppercase text-[12px] text-[var(--muted)]">Nombre</Label>
                        <Input
                          className="h-8 px-2 py-1 text-sm"
                          value={edge.name}
                          onChange={(event) => handleEdgeChange(edge.id, 'name', event.target.value)}
                          placeholder="Ej: Canto ABS"
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <Label className="uppercase text-[12px] text-[var(--muted)]">$ / ml</Label>
                        <Input
                          className="h-8 px-2 py-1 text-sm"
                          type="number"
                          step="any"
                          min="0"
                          value={edge.price}
                          onChange={(event) => handleEdgeChange(edge.id, 'price', event.target.value)}
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <Label className="uppercase text-[12px] text-[var(--muted)]">Cantidad (ml)</Label>
                        <Input
                          className="h-8 px-2 py-1 text-sm"
                          type="number"
                          step="any"
                          min="0"
                          value={edge.quantity}
                          onChange={(event) => handleEdgeChange(edge.id, 'quantity', event.target.value)}
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <Label className="uppercase text-[12px] text-[var(--muted)]">Total</Label>
                        <Input className="h-8 px-2 py-1 text-sm" value={formatCLP(computeEdgeRowTotal(edge))} readOnly />
                      </div>
                      <div className="flex justify-end gap-1 justify-self-end">
                        <Button
                          variant="outline"
                          size="icon"
                          title="Duplicar"
                          aria-label="Duplicar"
                          onClick={() => duplicateRow(setEdgeItems, edge.id, createEdgeRow)}
                          className="size-8"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          title="Eliminar"
                          aria-label="Eliminar"
                          onClick={() => removeRow(setEdgeItems, edge.id, createEdgeRow)}
                          className="text-[var(--danger)] size-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-sm">
                    <span className="uppercase text-[12px] text-[var(--muted)]">Total tapacantos:</span>{' '}
                    <span className="font-semibold text-[var(--text)]">{formatCLP(edgesTotal)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card id="budget-editor-herrajes" className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
                <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="uppercase tracking-wide">Herrajes</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setHardwareItems((prev) => [...prev, createHardwareRow()])}>
                    <Plus className="h-4 w-4" />
                    Agregar nuevo herraje
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {hardwareItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid items-end gap-1 rounded-[var(--radius)] border border-[var(--border)] p-2"
                      style={{ gridTemplateColumns: 'minmax(160px, 2fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr) auto' }}
                    >
                      <div className="space-y-1 min-w-0">
                        <Label className="uppercase text-[12px] text-[var(--muted)]">Nombre</Label>
                        <Input
                          className="h-8 px-2 py-1 text-sm"
                          value={item.name}
                          onChange={(event) => handleHardwareChange(item.id, 'name', event.target.value)}
                          placeholder="Ej: Bisagra 35mm"
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <Label className="uppercase text-[12px] text-[var(--muted)]">$ c/u</Label>
                        <Input
                          className="h-8 px-2 py-1 text-sm"
                          type="number"
                          step="any"
                          min="0"
                          value={item.price}
                          onChange={(event) => handleHardwareChange(item.id, 'price', event.target.value)}
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <Label className="uppercase text-[12px] text-[var(--muted)]">Cantidad</Label>
                        <Input
                          className="h-8 px-2 py-1 text-sm"
                          type="number"
                          step="any"
                          min="0"
                          value={item.quantity}
                          onChange={(event) => handleHardwareChange(item.id, 'quantity', event.target.value)}
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <Label className="uppercase text-[12px] text-[var(--muted)]">Total</Label>
                        <Input className="h-8 px-2 py-1 text-sm" value={formatCLP(toNumber(item.price) * toNumber(item.quantity))} readOnly />
                      </div>
                      <div className="flex justify-end gap-1 justify-self-end">
                        <Button
                          variant="outline"
                          size="icon"
                          title="Duplicar"
                          aria-label="Duplicar"
                          onClick={() => duplicateRow(setHardwareItems, item.id, createHardwareRow)}
                          className="size-8"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          title="Eliminar"
                          aria-label="Eliminar"
                          onClick={() => removeRow(setHardwareItems, item.id, createHardwareRow)}
                          className="text-[var(--danger)] size-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-sm">
                    <span className="uppercase text-[12px] text-[var(--muted)]">Total herrajes:</span>{' '}
                    <span className="font-semibold text-[var(--text)]">{formatCLP(hardwareTotal)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Otros */}
              <Card id="budget-editor-otros" className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
                <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="uppercase tracking-wide">Otros</span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setOtherItems((prev) => [...prev, createOtherRow()])}>
                    <Plus className="h-4 w-4" />
                    Agregar nuevo
                  </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                  {otherItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid items-end gap-1 rounded-[var(--radius)] border border-[var(--border)] p-2"
                      style={{ gridTemplateColumns: 'minmax(160px, 2fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr) auto' }}
                    >
                      <div className="space-y-1 min-w-0">
                        <Label className="uppercase text-[12px] text-[var(--muted)]">Nombre</Label>
                        <Input
                          className="h-8 px-2 py-1 text-sm"
                          value={item.name}
                          onChange={(event) => handleOtherChange(item.id, 'name', event.target.value)}
                          placeholder="Ej: Servicio extra"
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <Label className="uppercase text-[12px] text-[var(--muted)]">$ c/u</Label>
                        <Input
                          className="h-8 px-2 py-1 text-sm"
                          type="number"
                          step="any"
                          min="0"
                          value={item.price}
                          onChange={(event) => handleOtherChange(item.id, 'price', event.target.value)}
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <Label className="uppercase text-[12px] text-[var(--muted)]">Cantidad</Label>
                        <Input
                          className="h-8 px-2 py-1 text-sm"
                          type="number"
                          step="any"
                          min="0"
                          value={item.quantity}
                          onChange={(event) => handleOtherChange(item.id, 'quantity', event.target.value)}
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <Label className="uppercase text-[12px] text-[var(--muted)]">Total</Label>
                        <Input className="h-8 px-2 py-1 text-sm" value={formatCLP(toNumber(item.price) * toNumber(item.quantity))} readOnly />
                      </div>
                      <div className="flex justify-end gap-1 justify-self-end">
                        <Button
                          variant="outline"
                          size="icon"
                          title="Duplicar"
                          aria-label="Duplicar"
                          onClick={() => duplicateRow(setOtherItems, item.id, createOtherRow)}
                          className="size-8"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          title="Eliminar"
                          aria-label="Eliminar"
                          onClick={() => removeRow(setOtherItems, item.id, createOtherRow)}
                          className="text-[var(--danger)] size-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="text-right text-sm">
                    <span className="uppercase text-[12px] text-[var(--muted)]">Total otros:</span>{' '}
                    <span className="font-semibold text-[var(--text)]">{formatCLP(othersTotal)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fila compacta de parámetros y total (según imagen), ubicada justo debajo de Herrajes */}
            <div className="no-print rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2">
              <div
                className="grid items-end gap-1"
                style={{ gridTemplateColumns: 'repeat(2, minmax(140px,1fr)) minmax(140px,1fr) minmax(160px,1fr) auto' }}
              >
                <div className="space-y-1 min-w-0">
                  <Label className="uppercase text-[12px] text-[var(--muted)]">% Indirectos</Label>
                  <Input
                    className="h-8 px-2 py-1 text-sm"
                    type="number"
                    step="any"
                    min="0"
                    value={indirectPercent}
                    onChange={(e) => setIndirectPercent(e.target.value)}
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <Label className="uppercase text-[12px] text-[var(--muted)]">% Margen</Label>
                  <Input
                    className="h-8 px-2 py-1 text-sm"
                    type="number"
                    step="any"
                    min="0"
                    value={marginPercent}
                    onChange={(e) => setMarginPercent(e.target.value)}
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <Label className="uppercase text-[12px] text-[var(--muted)]">IVA %</Label>
                  <Input
                    className="h-8 px-2 py-1 text-sm"
                    type="number"
                    step="any"
                    min="0"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <Label className="uppercase text-[12px] text-[var(--muted)]">Flete (CLP)</Label>
                  <Input
                    className="h-8 px-2 py-1 text-sm"
                    type="number"
                    step="any"
                    min="0"
                    value={freight}
                    onChange={(e) => setFreight(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-1 justify-self-end">
                  <Button
                    variant="outline"
                    size="icon"
                    title="Limpiar parámetros"
                    aria-label="Limpiar parámetros"
                    className="text-[var(--danger)] size-8"
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

            {/* Visualización tipo planilla removida: se ajustará a diseño de imagen */}

            {/* Bloque de totales finales según la imagen */}
            <div className="no-print rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2">
              <div className="grid items-end gap-1" style={{ gridTemplateColumns: 'repeat(4, minmax(160px,1fr)) auto' }}>
                <div className="space-y-1 min-w-0">
                  <Label className="uppercase text-[12px] text-[var(--muted)]">Costo directo</Label>
                  <Input className="h-8 px-2 py-1 text-sm" readOnly value={formatCLP(directTotal)} />
                </div>
                <div className="space-y-1 min-w-0">
                  <Label className="uppercase text-[12px] text-[var(--muted)]">Neto</Label>
                  <Input className="h-8 px-2 py-1 text-sm" readOnly value={formatCLP(subtotalWithMargin)} />
                </div>
                <div className="space-y-1 min-w-0">
                  <Label className="uppercase text-[12px] text-[var(--muted)]">IVA</Label>
                  <Input className="h-8 px-2 py-1 text-sm" readOnly value={formatCLP(taxValue)} />
                </div>
                <div className="space-y-1 min-w-0">
                  <Label className="uppercase text-[12px] text-[var(--muted)]">Total</Label>
                  <Input className="h-8 px-2 py-1 text-sm" readOnly value={formatCLP(totalWithTax)} />
                </div>
                <div className="flex justify-end gap-2 justify-self-end">
                  <Button variant="outline" size="icon" className="size-8" title="Copiar totales" aria-label="Copiar totales"
                    onClick={() => {
                      const txt = `Costo directo: ${formatCLP(directTotal)}\nNeto: ${formatCLP(subtotalWithMargin)}\nIVA: ${formatCLP(taxValue)}\nTotal: ${formatCLP(totalWithTax)}`;
                      navigator.clipboard?.writeText?.(txt).catch(() => {});
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Notas y condiciones (al final de la pestaña) */}
            <div className="no-print rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2">
              <div className="space-y-1">
                <Label htmlFor="budget-company-notes" className="uppercase text-[12px] text-[var(--muted)]">Notas y condiciones</Label>
                <Textarea
                  className="min-h-24 px-2 py-1 text-sm"
                  id="budget-company-notes"
                  value={company.notes}
                  onChange={(event) => setCompany((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Tiempos de entrega, condiciones de pago, validez de la oferta, etc."
                />
              </div>
            </div>

          </div>
        </ScrollArea>
  {/* Hoja de impresión: replica el layout de pantalla como en la imagen */}
  <div className="print-only p-6 space-y-4">
          {/* Encabezado: logo izquierda + título centrado */}
          <header className="flex items-center justify-between">
            <div className="flex-1 flex items-center gap-3">
              <img src={absoluteUrl('brand/industrial-plate/stencil_main.svg')} alt="Logo" style={{ height: 84 }} />
              {(company?.name ?? '').trim() ? (
                <div className="value" style={{ fontSize: 14, fontWeight: 600 }}>{company.name}</div>
              ) : null}
            </div>
            <div className="flex-1 text-center">
              <h1 className="uppercase">
                {(() => {
                  const n = (company?.name ?? '').trim();
                  return n ? `PRESUPUESTO — ${n}` : 'PRESUPUESTO';
                })()}
              </h1>
            </div>
            <div className="flex-1" />
          </header>

          {/* Datos de la empresa */}
          <section className="card-like p-3 space-y-2">
            <div className="section-title">Datos de la empresa</div>
            <div className="grid grid-cols-3 grid-gap">
              <div className="space-y-1">
                <div className="label">Nombre</div>
                <div className="field value">{company.name || ' '}</div>
              </div>
              <div className="space-y-1">
                <div className="label">Email</div>
                <div className="field value">{company.email || ' '}</div>
              </div>
              <div className="space-y-1">
                <div className="label">Telefono</div>
                <div className="field value">{company.phone || ' '}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 grid-gap">
              <div className="space-y-1">
                <div className="label">RUT</div>
                <div className="field value">{company.rut || ' '}</div>
              </div>
              <div className="space-y-1 col-span-2">
                <div className="label">Direccion</div>
                <div className="field value">{company.address || ' '}</div>
              </div>
            </div>
          </section>

          {/* Datos del cliente */}
          <section className="card-like p-3 space-y-2">
            <div className="section-title">Datos del cliente</div>
            <div className="grid grid-cols-3 grid-gap">
              <div className="space-y-1">
                <div className="label">Nombre</div>
                <div className="field value">{client.name || ' '}</div>
              </div>
              <div className="space-y-1">
                <div className="label">Email</div>
                <div className="field value">{client.email || ' '}</div>
              </div>
              <div className="space-y-1">
                <div className="label">Telefono</div>
                <div className="field value">{client.phone || ' '}</div>
              </div>
            </div>
          </section>

          {/* Materiales base */}
          <section className="card-like p-3 space-y-2">
            <div className="section-title">Materiales base</div>
            {baseMaterials.map((m) => (
              <div key={m.id} className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
                <div className="space-y-1 pr-2">
                  <div className="label">Tipo</div>
                  <div className="field value">{m.name || ' '}</div>
                </div>
                <div className="space-y-1 pr-2">
                  <div className="label">Unidad</div>
                  <div className="field value">{m.unit || ' '}</div>
                </div>
                <div className="space-y-1 pr-2">
                  <div className="label">Precio (CLP)</div>
                  <div className="field value">{formatCLP(toNumber(m.price))}</div>
                </div>
                <div className="space-y-1 pr-2">
                  <div className="label">Cantidad</div>
                  <div className="field value">{toNumber(m.quantity)}</div>
                </div>
                <div className="space-y-1">
                  <div className="label">Total</div>
                  <div className="field value">{formatCLP(toNumber(m.price) * toNumber(m.quantity))}</div>
                </div>
              </div>
            ))}
            <div className="text-right"><span className="total-label">Total materiales base: </span><span className="total-value">{formatCLP(materialsTotal)}</span></div>
          </section>

          {/* Tapacantos */}
          <section className="card-like p-3 space-y-2">
            <div className="section-title">Tapacantos</div>
            {edgeItems.map((e) => (
              <div key={e.id} className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                <div className="space-y-1 pr-2">
                  <div className="label">Nombre</div>
                  <div className="field value">{e.name || ' '}</div>
                </div>
                <div className="space-y-1 pr-2">
                  <div className="label">$ / ml</div>
                  <div className="field value">{formatCLP(toNumber(e.price))}</div>
                </div>
                <div className="space-y-1 pr-2">
                  <div className="label">Cantidad (ml)</div>
                  <div className="field value">{toNumber(e.quantity)}</div>
                </div>
                <div className="space-y-1">
                  <div className="label">Total</div>
                  <div className="field value">{formatCLP(toNumber(e.price) * toNumber(e.quantity))}</div>
                </div>
              </div>
            ))}
            <div className="text-right"><span className="total-label">Total tapacantos: </span><span className="total-value">{formatCLP(edgesTotal)}</span></div>
          </section>

          {/* Herrajes */}
          <section className="card-like p-3 space-y-2">
            <div className="section-title">Herrajes</div>
            {hardwareItems.map((h) => (
              <div key={h.id} className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                <div className="space-y-1 pr-2">
                  <div className="label">Nombre</div>
                  <div className="field value">{h.name || ' '}</div>
                </div>
                <div className="space-y-1 pr-2">
                  <div className="label">$ c/u</div>
                  <div className="field value">{formatCLP(toNumber(h.price))}</div>
                </div>
                <div className="space-y-1 pr-2">
                  <div className="label">Cantidad</div>
                  <div className="field value">{toNumber(h.quantity)}</div>
                </div>
                <div className="space-y-1">
                  <div className="label">Total</div>
                  <div className="field value">{formatCLP(toNumber(h.price) * toNumber(h.quantity))}</div>
                </div>
              </div>
            ))}
            <div className="text-right"><span className="total-label">Total herrajes: </span><span className="total-value">{formatCLP(hardwareTotal)}</span></div>
          </section>

          {/* Otros */}
          <section className="card-like p-3 space-y-2">
            <div className="section-title">Otros</div>
            {otherItems.map((o) => (
              <div key={o.id} className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
                <div className="space-y-1 pr-2">
                  <div className="label">Nombre</div>
                  <div className="field value">{o.name || ' '}</div>
                </div>
                <div className="space-y-1 pr-2">
                  <div className="label">$ c/u</div>
                  <div className="field value">{formatCLP(toNumber(o.price))}</div>
                </div>
                <div className="space-y-1 pr-2">
                  <div className="label">Cantidad</div>
                  <div className="field value">{toNumber(o.quantity)}</div>
                </div>
                <div className="space-y-1">
                  <div className="label">Total</div>
                  <div className="field value">{formatCLP(toNumber(o.price) * toNumber(o.quantity))}</div>
                </div>
              </div>
            ))}
            <div className="text-right"><span className="total-label">Total otros: </span><span className="total-value">{formatCLP(othersTotal)}</span></div>
          </section>

          {/* Parámetros e Índices */}
          <section className="card-like p-3">
            <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="space-y-1 pr-2">
                <div className="label">% Indirectos</div>
                <div className="field value">{toNumber(indirectPercent)}</div>
              </div>
              <div className="space-y-1 pr-2">
                <div className="label">% Margen</div>
                <div className="field value">{toNumber(marginPercent)}</div>
              </div>
              <div className="space-y-1 pr-2">
                <div className="label">IVA %</div>
                <div className="field value">{toNumber(taxPercent)}</div>
              </div>
              <div className="space-y-1">
                <div className="label">Flete (CLP)</div>
                <div className="field value">{formatCLP(freightValue)}</div>
              </div>
            </div>
          </section>

          {/* Totales finales */}
          <section className="card-like p-3">
            <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr) auto' }}>
              <div className="space-y-1 pr-2">
                <div className="label">Costo directo</div>
                <div className="field value">{formatCLP(directTotal)}</div>
              </div>
              <div className="space-y-1 pr-2">
                <div className="label">Neto</div>
                <div className="field value">{formatCLP(subtotalWithMargin)}</div>
              </div>
              <div className="space-y-1 pr-2">
                <div className="label">IVA</div>
                <div className="field value">{formatCLP(taxValue)}</div>
              </div>
              <div className="space-y-1">
                <div className="label">Total</div>
                <div className="field value">{formatCLP(totalWithTax)}</div>
              </div>
              <div />
            </div>
          </section>

          {/* Notas y condiciones (al final de la hoja) */}
          {(company.notes ?? '').trim() ? (
            <section className="card-like p-3 space-y-2">
              <div className="section-title">Notas y condiciones</div>
              <div className="field value" style={{ whiteSpace: 'pre-wrap' }}>{company.notes}</div>
            </section>
          ) : null}

          {/* Footer con logo transparente centrado */}
          <footer className="print-footer">
            <img src={absoluteUrl('brand/industrial-plate/stencil_main.svg')} alt="Logo" />
          </footer>
        </div>
      </div>
    </>
  );
};

