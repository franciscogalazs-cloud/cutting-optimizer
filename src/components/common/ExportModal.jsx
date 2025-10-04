import { useMemo, useRef, useEffect, useCallback } from 'react';
import { FileText, ExternalLink, Printer, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { printElement } from '@/lib/print';
import { generateReportHTML } from '@/lib/report';

// generateReportHTML ahora se importa desde '@/lib/report'

export const ExportModal = ({ isOpen, onClose, result, pieces, materials, config, autoPrint = false }) => {
  const reportRef = useRef(null);
  const htmlReport = useMemo(() => {
    if (!result) return '';
    return generateReportHTML(result, pieces, materials, config);
  }, [result, pieces, materials, config]);

  const printReport = useCallback(() => {
    // Imprimir el contenido del modal sin usar pop-ups
    const node = reportRef.current;
    if (node) {
      printElement(node, { title: 'Reporte de cortes' });
      return;
    }
    // Fallback: abrir nueva pestaña si no hay nodo (debería ser raro)
    const win = window.open('', '_blank');
    if (!win) {
      alert('El navegador bloqueó la apertura de una nueva pestaña. Permite pop-ups para imprimir.');
      return;
    }
    win.document.open();
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Imprimir reporte</title></head><body>${htmlReport}</body></html>`);
    win.document.close();
    setTimeout(() => { try { win.focus(); win.print(); } catch { /* ignore */ } }, 150);
  }, [htmlReport]);

  useEffect(() => {
    if (!isOpen || !autoPrint) return;
    // Pequeño delay para asegurar que el contenido esté en el DOM
    const t = setTimeout(() => {
      try { printReport(); } catch { /* ignore */ }
    }, 60);
    return () => clearTimeout(t);
  }, [isOpen, autoPrint, printReport]);

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

  const downloadReport = () => {
    try {
      const fullHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Reporte de Cortes</title></head><body>${htmlReport}</body></html>`;
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0,10);
      a.href = url;
      a.download = `reporte-cortes-${date}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      // fallback simple
      alert('No se pudo descargar el reporte: ' + (e?.message || e));
    }
  };

  // printReport definido con useCallback más arriba

  

  // Eliminado generador CSV

  if (!result) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] pr-12">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-10">
            <FileText className="h-5 w-5 text-red-600" />
            Reporte (HTML)
          </DialogTitle>
        </DialogHeader>
        <div className="mt-3">
          <Card className="border-[var(--border)] bg-[var(--surface)]">
            <CardContent className="p-3 sm:p-4">
              <div className="max-h-[75vh] overflow-auto rounded-md border bg-white">
                <div className="sticky top-0 z-10 flex items-center justify-end gap-2 border-b bg-white/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                  <button type="button" onClick={openInNewTab} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    <ExternalLink className="h-4 w-4" /> Abrir en nueva pestaña
                  </button>
                  <Button variant="outline" size="sm" onClick={printReport}>
                    <Printer className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Imprimir</span>
                  </Button>
                  <Button variant="default" size="sm" onClick={downloadReport}>
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Descargar</span>
                  </Button>
                </div>
                <div ref={reportRef} dangerouslySetInnerHTML={{ __html: htmlReport }} />
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
