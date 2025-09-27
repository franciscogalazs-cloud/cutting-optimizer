import { useMemo } from 'react';
import { FileText, ExternalLink, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { areaToSquareMeters, formatSquareMeters } from '../../lib/format';

// Generador del HTML del reporte (fuera del componente para evitar TDZ y re-creaciones)
function generateReportHTML(result, pieces, materials, config) {
  const fmt = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const wasteForPattern = (p) => {
    const used = Array.isArray(p.pieces) ? p.pieces.reduce((s, pc) => s + (Number(pc.width)||0)*(Number(pc.height)||0), 0) : 0;
    const board = (Number(p.materialLength)||0) * (Number(p.materialWidth)||0);
    return Math.max(0, board - used);
  };
  const styles = `
    <style>
      @page { size: A4 portrait; margin: 12mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .page { width: auto; padding: 0; margin: 0; }
        .pattern { page-break-inside: avoid; }
      }
      .page { width: 190mm; padding: 10mm; margin: 0 auto; box-sizing: border-box; background: #ffffff; color: #111827; font-family: Arial, sans-serif; }
      .header { text-align: center; margin-bottom: 18px; }
      .header h1 { margin: 0 0 8px; font-size: 20px; }
      .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
      .stat-card { border: 1px solid #e5e7eb; padding: 10px; border-radius: 6px; text-align: center; }
      .stat-value { font-size: 18px; font-weight: bold; color: #2563eb; }
      .table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; font-size: 12px; }
      .table th, .table td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
      .table th { background-color: #f8fafc; }
      h2 { font-size: 14px; margin: 16px 0 8px; }
      .pattern { margin: 14px 0 18px; }
      .pattern-header { background-color: #f0f9ff; padding: 8px; border-radius: 4px; margin-bottom: 8px; font-size: 12px; }
      .pattern-figure { text-align: center; margin: 8px 0 10px; }
      .pattern-figure svg { width: 100%; max-width: 640px; height: auto; border: 1px solid #e5e7eb; border-radius: 6px; background: #ffffff; }
    </style>
  `;
  const hasPatterns = Array.isArray(result?.patterns) && result.patterns.length > 0;
  const content = `
    <div class="page">
      <div class="header">
        <h1>Reporte de Optimización de Cortes</h1>
        <p>Generado el ${new Date().toLocaleDateString('es-ES')}</p>
        <p>Algoritmo: ${result?.algorithm ?? 'N/A'}</p>
      </div>

      <div class="stats">
        <div class="stat-card">
          <div class="stat-value">${result?.materialsUsed ?? 0}</div>
          <div>Tableros Usados</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Number(result?.totalUtilization ?? 0).toFixed(1)}%</div>
          <div>Utilización</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatSquareMeters(areaToSquareMeters(Number(result?.totalWaste ?? 0), config.units))}</div>
          <div>Desperdicio (m²)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">$${Number(result?.totalCost ?? 0).toFixed(2)}</div>
          <div>Costo Total</div>
        </div>
      </div>

      <h2>Piezas Solicitadas</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Etiqueta</th>
            <th>Largo (${config.units})</th>
            <th>Ancho (${config.units})</th>
            <th>Cantidad</th>
            <th>Material</th>
            <th>Área (${config.units}²)</th>
          </tr>
        </thead>
        <tbody>
          ${Array.isArray(pieces) ? pieces.map(piece => `
            <tr>
              <td>${piece.label ?? ''}</td>
              <td>${fmt(piece.length)} ${config.units}</td>
              <td>${fmt(piece.width)} ${config.units}</td>
              <td>${piece.quantity}</td>
              <td>${piece.material ?? ''}</td>
              <td>${fmt((Number(piece.length)||0) * (Number(piece.width)||0) * (Number(piece.quantity)||0))} ${config.units}²</td>
            </tr>
          `).join('') : ''}
        </tbody>
      </table>

      <h2>Materiales Utilizados</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Material</th>
            <th>Largo (${config.units})</th>
            <th>Ancho (${config.units})</th>
            <th>Utilización (%)</th>
            <th>Desperdicio (m²)</th>
          </tr>
        </thead>
        <tbody>
          ${Array.isArray(result?.patterns) ? result.patterns.map((pattern) => {
            const material = (Array.isArray(materials) ? materials.find(m => m.id === pattern.materialId) : null);
            const waste = 'waste' in pattern ? Number(pattern.waste) || 0 : wasteForPattern(pattern);
            return `
              <tr>
                <td>${material?.material || 'N/A'}</td>
                <td>${fmt(pattern.materialLength)} ${config.units}</td>
                <td>${fmt(pattern.materialWidth)} ${config.units}</td>
                <td>${Number(pattern.utilization||0).toFixed(1)}%</td>
                <td>${formatSquareMeters(areaToSquareMeters(waste, config.units))}</td>
              </tr>
            `;
          }).join('') : ''}
        </tbody>
      </table>

      <h2>Patrones de Corte</h2>
      ${hasPatterns ? result.patterns.map((pattern, index) => `
        <div class="pattern">
          <div class="pattern-header">
            <strong>Hoja ${index + 1}</strong> - 
            ${fmt(pattern.materialLength)} × ${fmt(pattern.materialWidth)} ${config.units} - 
            Utilización: ${Number(pattern.utilization||0).toFixed(1)}% - 
            ${(pattern.pieces||[]).length} piezas - 
            Desperdicio: ${formatSquareMeters(areaToSquareMeters(('waste' in pattern ? Number(pattern.waste)||0 : wasteForPattern(pattern)), config.units))} m²
          </div>
          <div class="pattern-figure">
            <svg viewBox="0 0 ${pattern.materialLength} ${pattern.materialWidth}">
              <defs>
                <style>
                  .label { font: 12px Arial, sans-serif; fill: #111827; font-weight: bold; }
                  .dim { font: 10px Arial, sans-serif; fill: #374151; }
                </style>
              </defs>
              <rect x="0" y="0" width="${pattern.materialLength}" height="${pattern.materialWidth}" fill="#ffffff" stroke="#e5e7eb" stroke-width="2" />
              ${(pattern.pieces||[]).map((piece) => {
                const showLabel = piece.width > 40 && piece.height > 24;
                const showDims = piece.width > 50 && piece.height > 36;
                const labelX = piece.x + piece.width / 2;
                const labelY = piece.y + piece.height / 2;
                const dimHX = piece.x + piece.width / 2;
                const dimHY = piece.y + 8;
                const dimVX = piece.x + 8;
                const dimVY = piece.y + piece.height / 2;
                return `
                  <g>
                    <rect x="${piece.x}" y="${piece.y}" width="${piece.width}" height="${piece.height}" fill="${piece.color || '#3B82F6'}" fill-opacity="0.78" stroke="#1f2937" stroke-width="0.5" />
                    ${showLabel ? `<text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" class="label">${piece.label || ''}</text>` : ''}
                    ${showDims ? `<text x="${dimHX}" y="${dimHY}" text-anchor="middle" class="dim">${fmt(piece.width)} ${config.units}</text>` : ''}
                    ${showDims ? `<text x="${dimVX}" y="${dimVY}" text-anchor="middle" class="dim" transform="rotate(-90 ${dimVX} ${dimVY})">${fmt(piece.height)} ${config.units}</text>` : ''}
                  </g>
                `;
              }).join('')}
            </svg>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Pieza</th>
                <th>Ancho (${config.units})</th>
                <th>Alto (${config.units})</th>
                <th>Rotado</th>
              </tr>
            </thead>
            <tbody>
              ${(pattern.pieces||[]).map(piece => `
                <tr>
                  <td>${piece.label ?? ''}</td>
                  <td>${fmt(piece.width)}</td>
                  <td>${fmt(piece.height)}</td>
                  <td>${piece.rotated ? 'Sí' : 'No'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('') : '<p style="color:#6b7280">No hay patrones generados.</p>'}

      <div style="margin-top: 20px; text-align: center; color: #6b7280; font-size: 12px;">
        <p>Generado por Optimizador de Cortes de Melamina v1.0</p>
      </div>
    </div>
  `;
  return `${styles}${content}`;
}

export const ExportModal = ({ isOpen, onClose, result, pieces, materials, config }) => {
  const htmlReport = useMemo(() => {
    if (!result) return '';
    return generateReportHTML(result, pieces, materials, config);
  }, [result, pieces, materials, config]);

  const openInNewTab = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      // Envolver en documento completo para impresión
      win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Reporte</title></head><body>${htmlReport}</body></html>`);
      win.document.close();
    } else {
      alert('El navegador bloqueó la apertura de una nueva pestaña. Permite pop-ups para ver el reporte.');
    }
  };

  const printReport = () => {
    // Crear una ventana temporal para imprimir con estilos del reporte
    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Imprimir reporte</title></head><body>${htmlReport}</body></html>`);
      win.document.close();
      // Esperar un tick para que el contenido renderice antes de imprimir
      setTimeout(() => {
        win.focus();
        win.print();
      }, 150);
    } else {
      alert('El navegador bloqueó la apertura de una nueva pestaña. Permite pop-ups para imprimir.');
    }
  };

  

  // Eliminado generador CSV

  if (!result) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-600" />
            Reporte (HTML)
            <span className="ml-auto inline-flex items-center gap-1 text-sm text-blue-600 cursor-pointer hover:underline" onClick={openInNewTab}>
              <ExternalLink className="h-4 w-4" /> Abrir en nueva pestaña
            </span>
            <Button variant="ghost" size="sm" className="ml-2 text-[var(--text)]" onClick={printReport}>
              <Printer className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:ml-1">Imprimir</span>
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-3">
          <Card className="border-[var(--border)] bg-[var(--surface)]">
            <CardContent className="p-3 sm:p-4">
              <div className="max-h-[75vh] overflow-auto rounded-md border bg-white">
                <div dangerouslySetInnerHTML={{ __html: htmlReport }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
