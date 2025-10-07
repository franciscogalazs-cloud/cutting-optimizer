import { absoluteUrl } from "@/lib/paths";
import { useEffect, useMemo, useRef } from 'react';
import { printElement } from '@/lib/print.js';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
// Select UI no usado actualmente en esta vista
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calculator, Copy, Trash2, Printer } from 'lucide-react';
import { computeEdgeTotals } from '@/features/edgebanding/edgeBanding.js';
// SummarySheet removido según requerimiento de diseño
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

// (helpers de validación/combos removidos temporalmente por no uso)

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

const emptyClient = { name: '', email: '', phone: '', rut: '', address: '' };
const emptyCompany = { name: '', email: '', phone: '', rut: '', address: '', notes: '' };

const printStyles = `
  @media print {
    body {
      background: var(--surface);
      color: var(--text);
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
  const [baseMaterials, setBaseMaterials] = useLocalStorage('budget-base-materials', []);
  const [edgeItems, setEdgeItems] = useLocalStorage('budget-edge-items', []);
  const [hardwareItems, setHardwareItems] = useLocalStorage('budget-hardware-items', []);
  const [otherItems, __setOtherItems] = useLocalStorage('budget-other-items', []);
  // Parámetros financieros removidos (indirecto, margen, IVA, flete)
  // Leer el desperdicio configurado en la pestaña de Tapacantos para reflejarlo en las cantidades del presupuesto
  const [edgeWastePercent] = useLocalStorage('edgebanding-waste-percent', 0);
  // Desperdicio de tapacantos se calcula fuera; no se edita aquí.

  // (ancho eliminado)

  // Precios de materiales no se heredan; se definen en Presupuesto.
  const defaultBaseRows = useMemo(() => {
    const map = new Map();
    // 1) Usadas por patrones (post-optimización) — fuente de verdad para cantidad de planchas usadas
    const hasPatterns = Array.isArray(result?.patterns) && result.patterns.length > 0;
    if (hasPatterns) {
      for (const pattern of result.patterns) {
        const name = String(pattern.materialName || 'Material').trim();
        const len = Number(pattern.materialLength) || 0;
        const wid = Number(pattern.materialWidth) || 0;
        const key = `${name}|${len}x${wid}`;
        const areaM2 = rectangleAreaToSquareMeters(len, wid, 1, units);
        const current = map.get(key) ?? {
          name,
          unit: 'plancha',
          quantity: 0,
          price: 0,
          details: `${len} x ${wid} ${units}`,
          areaM2,
        };
        current.quantity += 1;
        map.set(key, current);
      }
    }

    // 2) Solo si NO hay patrones, podríamos caer a cantidades estimadas; para "solo items usados",
    // evitamos sugerir filas con cantidad 0. Preferimos no agregar nada por defecto.
    if (!hasPatterns) {
      // Mantener vacío: el usuario puede agregar manualmente si lo desea.
    }

    if (map.size > 0) {
      // Filtrar cualquier fila con cantidad <= 0 por seguridad
      return Array.from(map.values())
        .filter((item) => toNumber(item.quantity) > 0)
        .map((item) => createMaterialRow(item));
    }
    // Sin patrones: no proponemos filas por defecto aquí.
    return [];
  }, [result, materials, units]);

  const defaultEdgeRows = useMemo(() => {
    const totals = computeEdgeTotals(pieces) || {};
    const entries = Object.entries(totals);
    if (entries.length === 0) {
      return [];
    }
    const wasteFactor = 1 + (toNumber(edgeWastePercent) / 100);
    return entries
      .map(([type, lengthMm]) =>
        createEdgeRow({
          name: type,
          price: 0,
          // Metros lineales incluyendo desperdicio configurado en Tapacantos
          quantity: toNumber(((lengthMm ?? 0) / 1000) * wasteFactor),
        }),
      )
      .filter((row) => toNumber(row.quantity) > 0);
  }, [pieces, edgeWastePercent]);

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
  // Si herrajes/otros están completamente vacíos, mostramos una fila editable para facilitar el ingreso
  setHardwareItems((prev) => (Array.isArray(prev) && prev.length > 0 ? prev : [createHardwareRow()]));
  __setOtherItems((prev) => (Array.isArray(prev) && prev.length > 0 ? prev : [createOtherRow()]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultBaseRows, defaultEdgeRows]);

  // Sincronización con resultado: actualiza/añade filas base, pero NO elimina las existentes del usuario (incluye duplicados)
  const keyOf = (row) => `${String(row?.name ?? '').trim().toLowerCase()}|${String(row?.details ?? '').trim().toLowerCase()}`;
  useEffect(() => {
    if (!Array.isArray(defaultBaseRows) || defaultBaseRows.length === 0) return;
    setBaseMaterials((prev) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      let changed = false;

      // Partimos de prev y actualizamos/insertamos según defaultBaseRows
      let next = prevArr.slice();
      for (const r of defaultBaseRows) {
        const k = keyOf(r);
        const found = next.findIndex((x) => keyOf(x) === k);
        if (found >= 0) {
          const existing = next[found];
          const updated = {
            ...existing,
            name: r.name,
            unit: r.unit,
            // conservamos precio del usuario
            price: existing?.price ?? 0,
            // actualizamos cantidad/detalles/area desde cálculo
            quantity: r.quantity,
            details: r.details,
            areaM2: r.areaM2,
          };
          // comparar cambios relevantes
          if (
            toNumber(updated.quantity) !== toNumber(existing.quantity) ||
            String(updated.details) !== String(existing.details) ||
            toNumber(updated.areaM2) !== toNumber(existing.areaM2)
          ) {
            next[found] = updated;
            changed = true;
          }
        } else {
          // Insertar solo si la cantidad calculada es > 0
          if (toNumber(r.quantity) > 0) {
            next.push(createMaterialRow(r));
            changed = true;
          }
        }
      }
      return changed ? next : prevArr;
    });
  }, [defaultBaseRows, setBaseMaterials]);

  // Sincronización de Tapacantos: actualiza/añade filas calculadas, sin eliminar extras del usuario
  const keyOfEdge = (row) => String(row?.name ?? '').trim().toLowerCase();
  useEffect(() => {
    if (!Array.isArray(defaultEdgeRows) || defaultEdgeRows.length === 0) return;
    setEdgeItems((prev) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      let changed = false;
      let next = prevArr.slice();
      for (const r of defaultEdgeRows) {
        const k = keyOfEdge(r);
        const found = next.findIndex((x) => keyOfEdge(x) === k);
        if (found >= 0) {
          const existing = next[found];
          const updated = {
            ...existing,
            name: r.name,
            // conservamos precio del usuario
            price: existing?.price ?? 0,
            // cantidad desde cálculo (ml con desperdicio)
            quantity: r.quantity,
          };
          if (
            toNumber(updated.quantity) !== toNumber(existing.quantity)
          ) {
            next[found] = updated;
            changed = true;
          }
        } else {
          // Solo insertar si hay cantidad positiva
          if (toNumber(r.quantity) > 0) {
            next.push(createEdgeRow(r));
            changed = true;
          }
        }
      }
      return changed ? next : prevArr;
    });
  }, [defaultEdgeRows, setEdgeItems]);

  // Handlers de edición se eliminaron temporalmente mientras se reestructura la UI de secciones

  // (acciones de duplicar/eliminar filas removidas temporalmente)
  const duplicateRow = (setter, id, factory) => {
    setter((prev) => {
      const idx = prev.findIndex((row) => row.id === id);
      const current = idx >= 0 ? prev[idx] : undefined;
      const clone = current ? { ...current, id: undefined } : {};
      const newRow = factory(clone);
      if (idx < 0) return [...prev, newRow];
      const next = prev.slice();
      next.splice(idx + 1, 0, newRow);
      return next;
    });
  };

  const removeRow = (setter, id, fallbackFactory) => {
    setter((prev) => {
      if (prev.length === 1) return [fallbackFactory()];
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
  // Totales simplificados: Valor neto = directTotal; IVA = 19% automático; Total = neto + IVA
  const netValue = directTotal;
  const IVA_RATE = 0.19;
  const taxValue = netValue * IVA_RATE;
  const totalWithTax = netValue + taxValue;
  // (planillas intermedias removidas; se usa solo resumen de costos en impresión)

  // Exportación CSV removida por solicitud

  const __printBudget = () => {
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
      #budget-print-root { font-size: 12px; line-height: 1.35; color: var(--text); }
      #budget-print-root h1 { font-size: 22px; font-weight: 700; letter-spacing: .02em; }
      #budget-print-root .card-like { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; }
      #budget-print-root .field { border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; background: var(--surface); }
      #budget-print-root .label { color: var(--muted); font-size: 11px; text-transform: uppercase; }
      #budget-print-root .value { color: var(--text); font-size: 12px; }
      #budget-print-root .section-title { text-transform: uppercase; letter-spacing: .06em; font-weight: 600; color: var(--text); }
      #budget-print-root .muted { color: var(--muted); }
      #budget-print-root .total-label { text-transform: uppercase; color: var(--muted); font-size: 11px; }
      #budget-print-root .total-value { color: var(--text); font-weight: 600; }
      #budget-print-root .grid-gap { gap: 8px; }
      #budget-print-root .row-gap { row-gap: 6px; }
      #budget-print-root section, #budget-print-root .card-like { break-inside: avoid; }
      #budget-print-root .print-footer { text-align: center; margin-top: 10mm; }
      #budget-print-root .print-footer img { opacity: 0.15; height: 48px; filter: brightness(0); }
      /* Logo en encabezado: pasar de blanco a negro solo en impresión */
      #budget-print-root header img { filter: brightness(0); }
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
            <div data-slot="card-content" className="space-y-3 py-12 text-[var(--muted)] px-6">
              <p>Genera una optimizacion para calcular automaticamente el presupuesto.</p>
              <Button variant="outline" disabled>
                Esperando optimizacion
              </Button>
            </div>
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
            {/* Header compacto visible en pantalla */}
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text)]">Presupuesto</h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                  type="button"
                  onClick={__printBudget}
                  aria-label="Imprimir presupuesto"
                  title="Imprimir presupuesto"
                >
                  <Printer className="h-4 w-4 mr-1" /> Imprimir
                </Button>
              </div>
            </div>
            {/* Empresa y Cliente */}
            <div className="grid gap-2 sm:grid-cols-2" data-print-hide>
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2">
                <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">Empresa</h3>
                <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="space-y-1">
                    <Label className="uppercase text-[12px] text-[var(--muted)]">Nombre</Label>
                    <Input className="h-8 px-2 py-1 text-sm" value={company.name} onChange={(e) => setCompany((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="uppercase text-[12px] text-[var(--muted)]">Email</Label>
                    <Input className="h-8 px-2 py-1 text-sm" value={company.email} onChange={(e) => setCompany((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="uppercase text-[12px] text-[var(--muted)]">Teléfono</Label>
                    <Input className="h-8 px-2 py-1 text-sm" value={company.phone} onChange={(e) => setCompany((p) => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="uppercase text-[12px] text-[var(--muted)]">RUT</Label>
                    <Input className="h-8 px-2 py-1 text-sm" value={company.rut} onChange={(e) => setCompany((p) => ({ ...p, rut: e.target.value }))} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="uppercase text-[12px] text-[var(--muted)]">Dirección</Label>
                    <Input className="h-8 px-2 py-1 text-sm" value={company.address} onChange={(e) => setCompany((p) => ({ ...p, address: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2">
                <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">Cliente</h3>
                {/* Mismo layout que Empresa: 2 columnas + dirección a lo ancho */}
                <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="space-y-1">
                    <Label className="uppercase text-[12px] text-[var(--muted)]">Nombre</Label>
                    <Input className="h-8 px-2 py-1 text-sm" value={client.name} onChange={(e) => setClient((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="uppercase text-[12px] text-[var(--muted)]">Email</Label>
                    <Input className="h-8 px-2 py-1 text-sm" value={client.email} onChange={(e) => setClient((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="uppercase text-[12px] text-[var(--muted)]">Teléfono</Label>
                    <Input className="h-8 px-2 py-1 text-sm" value={client.phone} onChange={(e) => setClient((p) => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="uppercase text-[12px] text-[var(--muted)]">RUT</Label>
                    <Input className="h-8 px-2 py-1 text-sm" value={client.rut} onChange={(e) => setClient((p) => ({ ...p, rut: e.target.value }))} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="uppercase text-[12px] text-[var(--muted)]">Dirección</Label>
                    <Input className="h-8 px-2 py-1 text-sm" value={client.address} onChange={(e) => setClient((p) => ({ ...p, address: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>

            {/* Materiales base */}
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2" data-print-hide>
              <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">Materiales base</h3>
              <div className="space-y-1">
                {baseMaterials.filter((m) => toNumber(m.quantity) > 0).map((m) => (
                  <div key={m.id} className="grid items-end gap-1" style={{ gridTemplateColumns: '2fr 0.8fr 1fr 1fr 1fr auto' }}>
                    <div className="min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Tipo</Label>
                      <Input className="h-8 px-2 py-1 text-sm" value={m.name} readOnly />
                    </div>
                    <div className="min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Unidad</Label>
                      <Input className="h-8 px-2 py-1 text-sm" value={m.unit || 'plancha'} readOnly />
                    </div>
                    <div className="min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Precio (CLP)</Label>
                      <Input
                        className="h-8 px-2 py-1 text-sm"
                        type="number"
                        step="any"
                        min="0"
                        value={m.price}
                        onChange={(e) => setBaseMaterials((prev) => prev.map((row) => row.id === m.id ? { ...row, price: e.target.value } : row))}
                      />
                    </div>
                    <div className="min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Cantidad</Label>
                      <Input
                        className="h-8 px-2 py-1 text-sm"
                        type="number"
                        step="any"
                        min="0"
                        value={m.quantity}
                        onChange={(e) => setBaseMaterials((prev) => prev.map((row) => row.id === m.id ? { ...row, quantity: e.target.value } : row))}
                      />
                    </div>
                    <div className="min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Total</Label>
                      <Input className="h-8 px-2 py-1 text-sm" readOnly value={formatCLP(toNumber(m.price) * toNumber(m.quantity))} />
                    </div>
                    <div className="flex items-end justify-end gap-1 self-end">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        type="button"
                        title="Duplicar y Agregar"
                        aria-label="Duplicar y Agregar"
                        onClick={() => duplicateRow(setBaseMaterials, m.id, createMaterialRow)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8 text-[var(--danger)]"
                        type="button"
                        title="Eliminar"
                        aria-label="Eliminar"
                        onClick={() => removeRow(setBaseMaterials, m.id, createMaterialRow)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tapacantos */}
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2" data-print-hide>
              <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">Tapacantos</h3>
              <div className="space-y-1">
                {edgeItems.filter((e) => toNumber(e.quantity) > 0).map((e) => (
                  <div key={e.id} className="grid items-end gap-1" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>
                    <div className="min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Nombre</Label>
                      <Input className="h-8 px-2 py-1 text-sm" value={e.name} readOnly />
                    </div>
                    <div className="min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">$ / ml</Label>
                      <Input
                        className="h-8 px-2 py-1 text-sm"
                        type="number"
                        step="any"
                        min="0"
                        value={e.price}
                        onChange={(ev) => setEdgeItems((prev) => prev.map((row) => row.id === e.id ? { ...row, price: ev.target.value } : row))}
                      />
                    </div>
                    <div className="min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Cantidad (ml)</Label>
                      <Input className="h-8 px-2 py-1 text-sm" value={toNumber(e.quantity)} readOnly />
                    </div>
                    <div className="min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Total</Label>
                      <Input className="h-8 px-2 py-1 text-sm" readOnly value={formatCLP(toNumber(e.price) * toNumber(e.quantity))} />
                    </div>
                    <div className="flex items-end justify-end gap-1 self-end">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        type="button"
                        title="Duplicar y Agregar"
                        aria-label="Duplicar y Agregar"
                        onClick={() => duplicateRow(setEdgeItems, e.id, createEdgeRow)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8 text-[var(--danger)]"
                        type="button"
                        title="Eliminar"
                        aria-label="Eliminar"
                        onClick={() => removeRow(setEdgeItems, e.id, createEdgeRow)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Herrajes */}
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2" data-print-hide>
              <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">Herrajes</h3>
              <div className="space-y-1">
                {(Array.isArray(hardwareItems) ? hardwareItems : []).map((h) => (
                  <div key={h.id} className="grid items-end gap-1" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>
                    <div className="min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Nombre</Label>
                      <Input className="h-8 px-2 py-1 text-sm" placeholder="Bisagra 35mm / Corredera / Tornillos" value={h.name} onChange={(ev) => setHardwareItems((prev) => prev.map((row) => row.id === h.id ? { ...row, name: ev.target.value } : row))} />
                    </div>
                    <div className="min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">$ c/u</Label>
                      <Input className="h-8 px-2 py-1 text-sm" type="number" step="any" min="0" value={h.price} onChange={(ev) => setHardwareItems((prev) => prev.map((row) => row.id === h.id ? { ...row, price: ev.target.value } : row))} />
                    </div>
                    <div className="min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Cantidad</Label>
                      <Input className="h-8 px-2 py-1 text-sm" type="number" step="any" min="0" value={h.quantity} onChange={(ev) => setHardwareItems((prev) => prev.map((row) => row.id === h.id ? { ...row, quantity: ev.target.value } : row))} />
                    </div>
                    <div className="min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Total</Label>
                      <Input className="h-8 px-2 py-1 text-sm" readOnly value={formatCLP(toNumber(h.price) * toNumber(h.quantity))} />
                    </div>
                    <div className="flex items-end justify-end gap-1 self-end">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        type="button"
                        title="Duplicar y Agregar"
                        aria-label="Duplicar y Agregar"
                        onClick={() => duplicateRow(setHardwareItems, h.id, createHardwareRow)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8 text-[var(--danger)]"
                        type="button"
                        title="Eliminar"
                        aria-label="Eliminar"
                        onClick={() => removeRow(setHardwareItems, h.id, createHardwareRow)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Varios */}
            <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2" data-print-hide>
              <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">Varios</h3>
              <div className="space-y-1">
                {(Array.isArray(otherItems) ? otherItems : []).map((o) => (
                  <div key={o.id} className="grid items-end gap-1" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>
                    <div className="min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Nombre</Label>
                      <Input className="h-8 px-2 py-1 text-sm" placeholder="Varios" value={o.name} onChange={(ev) => __setOtherItems((prev) => prev.map((row) => row.id === o.id ? { ...row, name: ev.target.value } : row))} />
                    </div>
                    <div className="min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">$ c/u</Label>
                      <Input className="h-8 px-2 py-1 text-sm" type="number" step="any" min="0" value={o.price} onChange={(ev) => __setOtherItems((prev) => prev.map((row) => row.id === o.id ? { ...row, price: ev.target.value } : row))} />
                    </div>
                    <div className="min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Cantidad</Label>
                      <Input className="h-8 px-2 py-1 text-sm" type="number" step="any" min="0" value={o.quantity} onChange={(ev) => __setOtherItems((prev) => prev.map((row) => row.id === o.id ? { ...row, quantity: ev.target.value } : row))} />
                    </div>
                    <div className="min-w-0">
                      <Label className="uppercase text-[12px] text-[var(--muted)]">Total</Label>
                      <Input className="h-8 px-2 py-1 text-sm" readOnly value={formatCLP(toNumber(o.price) * toNumber(o.quantity))} />
                    </div>
                    <div className="flex items-end justify-end gap-1 self-end">
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        type="button"
                        title="Duplicar y Agregar"
                        aria-label="Duplicar y Agregar"
                        onClick={() => duplicateRow(__setOtherItems, o.id, createOtherRow)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8 text-[var(--danger)]"
                        type="button"
                        title="Eliminar"
                        aria-label="Eliminar"
                        onClick={() => removeRow(__setOtherItems, o.id, createOtherRow)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parámetros financieros removidos */}

            {/* Reemplazado por la planilla de visualización SummarySheet (solo pantalla) */}

            {/* Visualización tipo planilla removida: se ajustará a diseño de imagen */}

            {/* Bloque de totales finales: Valor neto, IVA 19% y Total */}
            <div className="no-print rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-2">
              <div className="grid items-end gap-1" style={{ gridTemplateColumns: 'repeat(3, minmax(160px,1fr)) auto' }}>
                <div className="space-y-1 min-w-0">
                  <Label className="uppercase text-[12px] text-[var(--muted)]">Valor neto</Label>
                  <Input className="h-8 px-2 py-1 text-sm" readOnly value={formatCLP(netValue)} />
                </div>
                <div className="space-y-1 min-w-0">
                  <Label className="uppercase text-[12px] text-[var(--muted)]">IVA (19%)</Label>
                  <Input className="h-8 px-2 py-1 text-sm" readOnly value={formatCLP(taxValue)} />
                </div>
                <div className="space-y-1 min-w-0">
                  <Label className="uppercase text-[12px] text-[var(--muted)]">Total</Label>
                  <Input className="h-8 px-2 py-1 text-sm" readOnly value={formatCLP(totalWithTax)} />
                </div>
                <div className="flex justify-end gap-2 justify-self-end">
                  <Button variant="outline" size="icon" className="size-8" title="Copiar totales" aria-label="Copiar totales" type="button"
                    onClick={() => {
                      const txt = `Valor neto: ${formatCLP(netValue)}\nIVA (19%): ${formatCLP(taxValue)}\nTotal: ${formatCLP(totalWithTax)}`;
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
  <div className="print-only p-6 space-y-3">
          {/* Encabezado: logo izquierda + título centrado */}
          <header className="flex items-center justify-between">
            <div className="flex-1 flex items-center gap-3">
              <img src={absoluteUrl('brand/industrial-plate/stencil_main.svg')} alt="Logo" style={{ height: 84, opacity: 0.85 }} />
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
          <section className="card-like p-2.5 space-y-1.5">
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
          <section className="card-like p-2.5 space-y-1.5">
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
            <div className="grid grid-cols-3 grid-gap">
              <div className="space-y-1">
                <div className="label">RUT</div>
                <div className="field value">{client.rut || ' '}</div>
              </div>
              <div className="space-y-1 col-span-2">
                <div className="label">Direccion</div>
                <div className="field value">{client.address || ' '}</div>
              </div>
            </div>
          </section>

          {/* Materiales base */}
          <section className="card-like p-2.5 space-y-1.5">
            {baseMaterials.filter((m) => toNumber(m.quantity) > 0).map((m) => (
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
            {baseMaterials.some((m) => toNumber(m.quantity) > 0) && (
              <div className="text-right"><span className="total-label">Total materiales base: </span><span className="total-value">{formatCLP(materialsTotal)}</span></div>
            )}
          </section>

          {/* Tapacantos */}
          <section className="card-like p-2.5 space-y-1.5">
            {edgeItems.filter((e) => toNumber(e.quantity) > 0).map((e) => (
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
            {edgeItems.some((e) => toNumber(e.quantity) > 0) && (
              <div className="text-right"><span className="total-label">Total tapacantos: </span><span className="total-value">{formatCLP(edgesTotal)}</span></div>
            )}
          </section>

          {/* Herrajes */}
          <section className="card-like p-2.5 space-y-1.5">
            {hardwareItems.filter((h) => toNumber(h.quantity) > 0).map((h) => (
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
            {hardwareItems.some((h) => toNumber(h.quantity) > 0) && (
              <div className="text-right"><span className="total-label">Total herrajes: </span><span className="total-value">{formatCLP(hardwareTotal)}</span></div>
            )}
          </section>

          {/* Varios */}
          <section className="card-like p-3 space-y-2">
            {otherItems.filter((o) => toNumber(o.quantity) > 0).map((o) => (
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
            {otherItems.some((o) => toNumber(o.quantity) > 0) && (
              <div className="text-right"><span className="total-label">Total varios: </span><span className="total-value">{formatCLP(othersTotal)}</span></div>
            )}
          </section>

          {/* Parámetros removidos en impresión */}

          {/* Totales finales: Valor neto, IVA 19% y Total */}
          <section className="card-like p-3">
            <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr) auto' }}>
              <div className="space-y-1 pr-2">
                <div className="label">Valor neto</div>
                <div className="field value">{formatCLP(netValue)}</div>
              </div>
              <div className="space-y-1 pr-2">
                <div className="label">IVA (19%)</div>
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

