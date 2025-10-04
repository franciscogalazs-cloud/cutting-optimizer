import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, RotateCcw, Save, History } from 'lucide-react';

export function VersionHistoryModal({
  isOpen,
  onClose,
  versions = [],
  onRestore,
  onDelete,
  onSaveNow,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Historial de versiones
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-sm text-[var(--muted)]">Guardadas: <Badge variant="secondary">{versions.length}</Badge></div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onSaveNow}><Save className="h-4 w-4" />Guardar actual</Button>
            </div>
          </div>
          <Card className="border-[var(--border)] bg-[var(--surface)]">
            <CardContent className="p-0">
              <ul className="max-h-[60vh] overflow-auto divide-y">
                {versions.length === 0 ? (
                  <li className="p-4 text-sm text-[var(--muted)]">Sin versiones guardadas aún.</li>
                ) : versions.map((v) => (
                  <li key={v.id} className="p-3 flex items-center justify-between gap-3 hover:bg-[var(--surface-2)]/60">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{new Date(v.ts).toLocaleString()}</div>
                      <div className="text-xs text-[var(--muted)] truncate">{v.note || '—'} · {v.counts?.pieces ?? 0} piezas · {v.counts?.materials ?? 0} materiales · unidades: {v.config?.units ?? 'mm'}</div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="outline" onClick={() => onRestore?.(v.id)} title="Restaurar esta versión"><RotateCcw className="h-4 w-4" />Restaurar</Button>
                      <Button size="sm" variant="outline" className="text-[var(--danger)] border-[var(--stroke)]" onClick={() => onDelete?.(v.id)} title="Eliminar esta versión"><Trash2 className="h-4 w-4" />Eliminar</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
