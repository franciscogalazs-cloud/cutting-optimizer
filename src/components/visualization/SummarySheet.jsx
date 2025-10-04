import React from 'react';
import { formatCLP, formatSquareMeters } from '@/lib/format.js';
import { Button } from '@/components/ui/button';

function toSubtotal(item) {
  const subtotal = Number(item?.subtotal);
  if (Number.isFinite(subtotal)) return subtotal;
  const unitario = Number(item?.unitario) || 0;
  const cantidad = Number(item?.cantidad) || 0;
  const metros2 = Number(item?.metros2);
  const factorArea = Number.isFinite(metros2) && metros2 > 0 ? metros2 : 1;
  const value = unitario * factorArea * cantidad;
  return Number.isFinite(value) ? value : 0;
}

export default function SummarySheet({ items, totals, percents, className, onPrint }) {
  const aggItems = React.useMemo(() => {
    const map = new Map();
    for (const it of items || []) {
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

  const formatCountForItem = (detalle, cantidad) => {
    const name = (detalle || '').toLowerCase();
    if (name.startsWith('tapacanto')) {
      return `${(Number(cantidad) || 0).toLocaleString('es-CL', { maximumFractionDigits: 2 })} ml`;
    }
    return (Number(cantidad) || 0).toLocaleString('es-CL');
  };

  const formatCountForSummary = (label, count) => {
    if (count == null || count === '') return '';
    if (typeof count === 'string') return count;
    if (label === 'Tapacantos') {
      return `${(Number(count) || 0).toLocaleString('es-CL', { maximumFractionDigits: 2 })} ml`;
    }
    return (Number(count) || 0).toLocaleString('es-CL');
  };

  const exportCSV = () => {
    try {
      const headers = ['Cantidad', 'Unidad', 'Detalle', 'm²', 'Unitario', 'Subtotal'];
      const rows = [];
      for (const it of aggItems) {
        const isTapacanto = String(it.detalle || '').toLowerCase().startsWith('tapacanto');
        const unidad = isTapacanto ? 'ml' : 'u';
        const cantidad = Number(it.cantidad) || 0;
        const m2 = Number(it.metros2);
        const m2Str = Number.isFinite(m2) && m2 > 0 ? String(m2) : '';
        const unitario = Number(it.unitario) || 0;
        const subtotal = toSubtotal(it);
        rows.push([cantidad, unidad, it.detalle || '', m2Str, unitario, subtotal]);
      }
      // Resumen
      const pctIndirectos = Number(percents?.indirectos);
      const pctMargen = Number(percents?.margen);
      const pctIva = Number(percents?.iva);
      const summary = [
        ['Indirectos', Number.isFinite(pctIndirectos) ? `${pctIndirectos}%` : '', '', '', '', Number(totals?.indirectos) || 0],
        ['Flete', '', '', '', '', Number(totals?.flete) || 0],
        ['Costo', '', '', '', '', Number(totals?.subtotalNeto) || 0],
        ['Margen', Number.isFinite(pctMargen) ? `${pctMargen}%` : '', '', '', '', Number(totals?.margen) || 0],
        ['Neto', '', '', '', '', Number(totals?.precioVenta) || 0],
        ['IVA', Number.isFinite(pctIva) ? `${pctIva}%` : '', '', '', '', Number(totals?.iva) || 0],
        ['Total con IVA', '', '', '', '', Number(totals?.totalConIVA) || 0],
      ];

      // Construir CSV
      const escape = (val) => {
        const s = String(val ?? '');
        if (/[",\n;]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      };
      const lines = [headers.map(escape).join(',')];
      for (const r of rows) lines.push(r.map(escape).join(','));
      lines.push('');
      lines.push(['Resumen'].join(','));
      for (const sr of summary) lines.push(sr.map(escape).join(','));
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'planilla-costos.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // Fallback silencioso
      console.error('CSV export failed', e);
    }
  };

  return (
    <section className={["w-full", className].filter(Boolean).join(' ')}>
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] max-h-[70vh] overflow-auto overscroll-contain">
        <div className="sticky top-0 z-20 px-4 sm:py-3 py-2 flex items-center justify-between flex-wrap gap-2 bg-[var(--surface)] border-b border-[var(--border)]">
          <h2 className="text-base font-semibold text-[var(--text)]">Planilla de costos</h2>
          <div className="flex items-center gap-2">
            <Button className="px-3" variant="outline" size="sm" onClick={exportCSV} aria-label="Exportar CSV">CSV</Button>
            <Button className="px-3" variant="outline" size="sm" onClick={onPrint ?? (() => window.print())} aria-label="Imprimir presupuesto">Imprimir</Button>
          </div>
        </div>

        <div className="px-2 sm:px-4 pb-4">
          {/* KPIs compactos */}
          {totals && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3">
              <div className="rounded-md border border-[var(--border)] bg-[var(--bg)]/20 p-2">
                <div className="text-[11px] text-[var(--muted)]">Costo</div>
                <div className="text-[13px] font-semibold tabular-nums">{formatCLP(totals.subtotalNeto)}</div>
              </div>
              <div className="rounded-md border border-[var(--border)] bg-[var(--bg)]/20 p-2">
                <div className="text-[11px] text-[var(--muted)]">Neto</div>
                <div className="text-[13px] font-semibold tabular-nums">{formatCLP(totals.precioVenta)}</div>
              </div>
              <div className="rounded-md border border-[var(--border)] bg-[var(--bg)]/20 p-2">
                <div className="text-[11px] text-[var(--muted)]">IVA</div>
                <div className="text-[13px] font-semibold tabular-nums">{formatCLP(totals.iva)}</div>
              </div>
              <div className="rounded-md border border-[var(--border)] bg-[var(--bg)]/20 p-2">
                <div className="text-[11px] text-[var(--muted)]">Total</div>
                <div className="text-[13px] font-semibold tabular-nums text-[var(--primary)]">{formatCLP(totals.totalConIVA)}</div>
              </div>
            </div>
          )}
          {/* Móvil: tarjetas apiladas sin scroll horizontal */}
          <div className="block sm:hidden">
            <div className="space-y-2">
              {aggItems.map((it, idx) => {
                const sub = (it?.subtotal) ?? toSubtotal(it);
                return (
                  <div key={idx} className="rounded-md border border-[var(--border)] bg-[var(--bg)]/20 p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-[var(--text)] truncate" title={it.detalle}>{it.detalle}</div>
                        <div className="mt-1 text-[12px] text-[var(--muted)] flex flex-wrap gap-x-3 gap-y-1">
                          <span className="tabular-nums">Cant.: {formatCountForItem(it.detalle, Number(it.cantidad) || 0)}</span>
                          {Number.isFinite(Number(it.metros2)) && Number(it.metros2) > 0 && (
                            <span className="tabular-nums">m²: {formatSquareMeters(Number(it.metros2), 2)}</span>
                          )}
                          <span className="tabular-nums">Unit.: {formatCLP(it.unitario)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] font-semibold tabular-nums">{formatCLP(sub)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Resumen móvil */}
              <div className="h-1" />
              {(() => {
                const pctIndirectos = Number(percents?.indirectos);
                const pctMargen = Number(percents?.margen);
                const pctIva = Number(percents?.iva);
                const rows = [
                  { label: 'Indirectos', value: totals.indirectos, strong: false, primary: false, count: Number.isFinite(pctIndirectos) ? `${pctIndirectos}%` : '' },
                  { label: 'Flete', value: totals.flete, strong: false, primary: false, count: '' },
                  { label: 'Costo', value: totals.subtotalNeto, strong: true, primary: false },
                  { label: 'Margen', value: totals.margen, strong: false, primary: false, count: Number.isFinite(pctMargen) ? `${pctMargen}%` : '' },
                  { label: 'Neto', value: totals.precioVenta, strong: false, primary: false },
                  { label: 'IVA', value: totals.iva, strong: false, primary: false, count: Number.isFinite(pctIva) ? `${pctIva}%` : '' },
                  { label: 'Total con IVA', value: totals.totalConIVA, strong: true, primary: true },
                ];
                return rows.map((row, i) => (
                  <div key={`m-summary-${i}`} className="rounded-md border border-[var(--border)] bg-[var(--bg)]/20 p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className={[ 'text-[13px]', row.strong ? 'font-semibold' : 'font-medium', 'text-[var(--text)]' ].join(' ')}>{row.label}</div>
                        {row.count != null && row.count !== '' && (
                          <div className="mt-1 text-[12px] text-[var(--muted)] tabular-nums">Cant.: {formatCountForSummary(row.label, row.count)}</div>
                        )}
                      </div>
                      <div className={[ 'text-right text-[13px] tabular-nums', row.strong ? 'font-semibold' : 'font-normal', row.primary ? 'text-[var(--primary)]' : '' ].join(' ')}>
                        {formatCLP(row.value)}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* sm+: tabla completa */}
          <div className="hidden sm:block overflow-x-auto touch-pan-x">
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
                  const sub = (it?.subtotal) ?? toSubtotal(it);
                  return (
                    <tr key={idx} className="odd:bg-[var(--bg)]/30">
                      <td className="border-t border-[var(--border)] px-2 sm:px-3 py-2 sm:py-2.5 align-top text-left tabular-nums whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{formatCountForItem(it.detalle, Number(it.cantidad) || 0)}</span>
                          {Number.isFinite(Number(it.metros2)) && Number(it.metros2) > 0 && (
                            <span className="text-[11px] text-[var(--muted)]">m²: {formatSquareMeters(Number(it.metros2), 2)}</span>
                          )}
                        </div>
                      </td>
                      <th scope="row" className="border-t border-[var(--border)] px-2 sm:px-3 py-2 sm:py-2.5 text-left font-normal text-[var(--text)] truncate max-w-[1px]">{it.detalle}</th>
                      <td className="border-t border-[var(--border)] px-2 sm:px-3 py-2 sm:py-2.5 text-right tabular-nums whitespace-nowrap">{formatCLP(it.unitario)}</td>
                      <td className="border-t border-[var(--border)] px-2 sm:px-3 py-2 sm:py-2.5 text-right tabular-nums whitespace-nowrap">{formatCLP(sub)}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td colSpan={4} className="p-0"></td>
                </tr>
                {(() => {
                  const pctIndirectos = Number(percents?.indirectos);
                  const pctMargen = Number(percents?.margen);
                  const pctIva = Number(percents?.iva);
                  const rows = [
                    { label: 'Indirectos', value: totals.indirectos, strong: false, primary: false, count: Number.isFinite(pctIndirectos) ? `${pctIndirectos}%` : '' },
                    { label: 'Flete', value: totals.flete, strong: false, primary: false, count: '' },
                    { label: 'Costo', value: totals.subtotalNeto, strong: true, primary: false },
                    { label: 'Margen', value: totals.margen, strong: false, primary: false, count: Number.isFinite(pctMargen) ? `${pctMargen}%` : '' },
                    { label: 'Neto', value: totals.precioVenta, strong: false, primary: false },
                    { label: 'IVA', value: totals.iva, strong: false, primary: false, count: Number.isFinite(pctIva) ? `${pctIva}%` : '' },
                    { label: 'Total con IVA', value: totals.totalConIVA, strong: true, primary: true },
                  ];
                  return rows.map((row, i) => (
                    <tr key={`summary-${i}`} className="odd:bg-[var(--bg)]/30">
                      <td className="border-t border-[var(--border)] px-2 sm:px-3 py-2 sm:py-2.5 text-left tabular-nums whitespace-nowrap">{formatCountForSummary(row.label, row.count)}</td>
                      <th scope="row" className={[ 'border-t border-[var(--border)] px-2 sm:px-3 py-2 sm:py-2.5 text-left', row.strong ? 'font-semibold' : 'font-normal' ].join(' ')}>{row.label}</th>
                      <td className="border-t border-[var(--border)] px-2 sm:px-3 py-2 sm:py-2.5 text-right tabular-nums whitespace-nowrap"></td>
                      <td className={[ 'border-t border-[var(--border)] px-2 sm:px-3 py-2 sm:py-2.5 text-right tabular-nums whitespace-nowrap', row.strong ? 'font-semibold' : 'font-normal', row.primary ? 'text-[var(--primary)]' : '' ].join(' ')}>{formatCLP(row.value)}</td>
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
