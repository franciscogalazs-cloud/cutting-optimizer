import React from 'react';
import { formatCLP } from '@/lib/format.js';
import { Button } from '@/components/ui/button.jsx';

export type SheetItem = {
  detalle: string;
  cantidad: number;
  metros2?: number;
  unitario: number;
  subtotal?: number;
};

export type Totals = {
  materialesBase: number;
  tapacantos: number;
  herrajes: number;
  indirectos: number;
  flete: number;
  subtotalNeto: number;
  margen: number;
  precioVenta: number;
  iva: number;
  totalConIVA: number;
};

export interface SummarySheetProps {
  items: SheetItem[];
  totals: Totals;
  percents?: {
    indirectos?: number;
    margen?: number;
    iva?: number;
  };
  className?: string;
}

function toSubtotal(item: SheetItem): number {
  const metros2 = item.metros2 ?? 1;
  return (item.subtotal ?? item.unitario * metros2 * item.cantidad) || 0;
}

function sumItems(items: SheetItem[]): number {
  return items.reduce((acc, it) => acc + toSubtotal(it), 0);
}

export default function SummarySheet({ items, totals, percents, className }: SummarySheetProps) {
  // Agrupar ítems por (detalle, unitario, metros2) para evitar filas repetidas
  const aggItems = React.useMemo(() => {
    const map = new Map<string, SheetItem & { subtotal: number }>();
    for (const it of items) {
      const key = `${(it.detalle || '').trim()}|${Number(it.unitario) || 0}|${it.metros2 != null ? Number(it.metros2).toFixed(4) : 'na'}`;
      const prev = map.get(key);
      const sub = toSubtotal(it);
      if (prev) {
        const cantidad = (Number(prev.cantidad) || 0) + (Number(it.cantidad) || 0);
        const subtotal = (Number(prev.subtotal) || 0) + (Number(sub) || 0);
        map.set(key, { ...prev, cantidad, subtotal });
      } else {
        map.set(key, {
          detalle: it.detalle,
          cantidad: Number(it.cantidad) || 0,
          metros2: it.metros2,
          unitario: Number(it.unitario) || 0,
          subtotal: Number(sub) || 0,
        });
      }
    }
    return Array.from(map.values());
  }, [items]);

  const totalItems = React.useMemo(() => aggItems.reduce((acc, it) => acc + (Number((it as any).subtotal) || 0), 0), [aggItems]);

  // Cantidades por categoría inferidas desde el detalle
  const counts = React.useMemo(() => {
    let materiales = 0;
    let tapacantos = 0;
    let herrajes = 0;
    for (const it of aggItems) {
      const name = (it.detalle || '').toLowerCase();
      const qty = Number(it.cantidad) || 0;
      if (name.startsWith('tapacanto')) tapacantos += qty;
      else if (name.startsWith('herraje')) herrajes += qty;
      else materiales += qty;
    }
    return { materiales, tapacantos, herrajes };
  }, [aggItems]);

  const formatCountForItem = (detalle: string, cantidad: number) => {
    const name = (detalle || '').toLowerCase();
    if (name.startsWith('tapacanto')) {
      return `${(Number(cantidad) || 0).toLocaleString('es-CL', { maximumFractionDigits: 2 })} ml`;
    }
    return (Number(cantidad) || 0).toLocaleString('es-CL');
  };

  const formatCountForSummary = (label: string, count: number | string | undefined) => {
    if (count == null || count === '') return '';
    if (typeof count === 'string') return count;
    if (label === 'Tapacantos') {
      return `${(Number(count) || 0).toLocaleString('es-CL', { maximumFractionDigits: 2 })} ml`;
    }
    return (Number(count) || 0).toLocaleString('es-CL');
  };

  return (
    <section className={['w-full', className].filter(Boolean).join(' ')}>
      {/* Bloque único como en la imagen: dentro va la tabla de Ítems y el Resumen */}
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
  <div className="px-4 sm:py-3 py-2 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-semibold text-[var(--text)]">Planilla de costos</h2>
          <Button variant="outline" size="sm" onClick={() => window.print()} aria-label="Imprimir presupuesto">Imprimir</Button>
        </div>
  <div className="px-2 sm:px-4 pb-4">
          {/* Ítems dentro del mismo bloque */}
          <div className="overflow-x-auto touch-pan-x">
            <table className="w-full border-collapse text-xs sm:text-sm table-fixed">
              <caption className="sr-only">Ítems del presupuesto</caption>
              <thead className="sticky top-0 z-10">
                <tr className="bg-[var(--surface)] text-[var(--muted)]">
                  <th scope="col" className="px-2 sm:px-3 py-1.5 sm:py-2 text-left w-14 sm:w-[72px]">Cant.</th>
                  <th scope="col" className="px-2 sm:px-3 py-1.5 sm:py-2 text-left">Detalle</th>
                  <th scope="col" className="px-2 sm:px-3 py-1.5 sm:py-2 text-right w-24 sm:w-[128px]">Unitario</th>
                  <th scope="col" className="px-2 sm:px-3 py-1.5 sm:py-2 text-right w-24 sm:w-[128px]">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {aggItems.map((it, idx) => {
                  const sub = (it as any).subtotal ?? toSubtotal(it);
                  return (
                    <tr key={idx} className="odd:bg-[var(--bg)]/30">
                      <td className="border-t border-[var(--border)] px-2 sm:px-3 py-2 sm:py-2.5 align-top text-left font-mono tabular-nums whitespace-nowrap">{formatCountForItem(it.detalle, Number(it.cantidad) || 0)}</td>
                      {/* Usamos th con scope=row para accesibilidad */}
                      <th scope="row" className="border-t border-[var(--border)] px-2 sm:px-3 py-2 sm:py-2.5 text-left font-normal text-[var(--text)] truncate max-w-[1px]">{it.detalle}</th>
                      <td className="border-t border-[var(--border)] px-2 sm:px-3 py-2 sm:py-2.5 text-right font-mono tabular-nums whitespace-nowrap">{formatCLP(it.unitario)}</td>
                      <td className="border-t border-[var(--border)] px-2 sm:px-3 py-2 sm:py-2.5 text-right font-mono tabular-nums whitespace-nowrap">{formatCLP(sub)}</td>
                    </tr>
                  );
                })}

                {/* Filas de valores agregados (resumen) dentro de la misma lista */}
                <tr>
                  <td colSpan={4} className="p-0"></td>
                </tr>
                {(() => {
                  const pctIndirectos = Number(percents?.indirectos);
                  const pctMargen = Number(percents?.margen);
                  const pctIva = Number(percents?.iva);
                  const rows = [
                    // Omitimos filas de categoria para evitar duplicar con ítems (Tapacantos/Herrajes)
                    // { label: 'Tapacantos', value: totals.tapacantos, strong: false, primary: false, count: counts.tapacantos },
                    // { label: 'Herrajes', value: totals.herrajes, strong: false, primary: false, count: counts.herrajes },
                    { label: 'Indirectos', value: totals.indirectos, strong: false, primary: false, count: Number.isFinite(pctIndirectos) ? `${pctIndirectos}%` : '' },
                    { label: 'Flete', value: totals.flete, strong: false, primary: false, count: 1 },
                    { label: 'Subtotal neto', value: totals.subtotalNeto, strong: true, primary: false },
                    { label: 'Margen', value: totals.margen, strong: false, primary: false, count: Number.isFinite(pctMargen) ? `${pctMargen}%` : '' },
                    { label: 'Precio de venta', value: totals.precioVenta, strong: false, primary: false },
                    { label: 'IVA', value: totals.iva, strong: false, primary: false, count: Number.isFinite(pctIva) ? `${pctIva}%` : '' },
                    { label: 'Total con IVA', value: totals.totalConIVA, strong: true, primary: true },
                  ];
                  return rows.map((row, i) => (
                  <tr key={`summary-${i}`} className="odd:bg-[var(--bg)]/30">
                    <td className="border-t border-[var(--border)] px-2 sm:px-3 py-2 sm:py-2.5 text-left font-mono tabular-nums whitespace-nowrap">{formatCountForSummary(row.label, row.count as number | string | undefined)}</td>
                    <th
                      scope="row"
                      className={[
                        'border-t border-[var(--border)] px-2 sm:px-3 py-2 sm:py-2.5 text-left',
                        row.strong ? 'font-semibold' : 'font-normal',
                      ].join(' ')}
                    >
                      {row.label}
                    </th>
                    <td className="border-t border-[var(--border)] px-2 sm:px-3 py-2 sm:py-2.5 text-right font-mono tabular-nums whitespace-nowrap">{formatCLP(row.value)}</td>
                    <td
                      className={[
                        'border-t border-[var(--border)] px-2 sm:px-3 py-2 sm:py-2.5 text-right font-mono tabular-nums whitespace-nowrap',
                        row.strong ? 'font-semibold' : 'font-normal',
                        row.primary ? 'text-[var(--primary)]' : '',
                      ].join(' ')}
                    >
                      {formatCLP(row.value)}
                    </td>
                  </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
          
        </div>
      </div>
    </section>
  );
}
