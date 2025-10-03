import { Edit2, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { rectangleAreaToSquareMeters, formatSquareMeters } from '@/lib/format.js';
export const MaterialsTable = ({ materials, onDelete, onEditRequest, onDuplicate, units = 'mm' }) => {
  // Se elimina el resumen de área total en el encabezado

  if (materials.length === 0) {
    return (
      <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <CardHeader>
          <CardTitle className="text-[var(--text)]">Materiales disponibles</CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center text-[var(--muted)]">
          <p>No hay materiales cargados.</p>
          <p className="text-xs">Anade tableros desde la seccion izquierda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
      <CardHeader>
        <CardTitle className="flex flex-col gap-1 text-[var(--text)] sm:flex-row sm:items-center sm:justify-between">Materiales disponibles</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Móvil: tarjetas apiladas sin scroll horizontal */}
        <div className="block sm:hidden space-y-2">
          {materials.map((material) => (
            <div key={material.id} className="rounded-md border border-[var(--border)] bg-[var(--bg)]/20 p-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[var(--text)] truncate" title={material.material}>{material.material}</div>
                  <div className="mt-1 text-[12px] text-[var(--muted)] grid grid-cols-2 gap-x-4 gap-y-1">
                    <span>Largo: <span className="font-mono tabular-nums">{material.length}</span> {units}</span>
                    <span>Ancho: <span className="font-mono tabular-nums">{material.width}</span> {units}</span>
                    <span>Sierra: <span className="font-mono tabular-nums">{material.kerf}</span> {units}</span>
                    <span>Margen: <span className="font-mono tabular-nums">{material.margin}</span> {units}</span>
                    <span>Área: <span className="font-mono tabular-nums">{formatSquareMeters(rectangleAreaToSquareMeters(material.length, material.width, material.quantity, units))}</span></span>
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDuplicate?.(material)}
                      className="h-8 w-8 p-0 text-[var(--text)]"
                      title="Duplicar material"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditRequest?.(material)}
                      className="h-8 w-8 p-0 text-[var(--text)]"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete?.(material.id)}
                      className="h-8 w-8 p-0 text-[var(--danger)] hover:text-[var(--danger)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* sm+: tabla completa */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[var(--surface)]">
                <TableHead>Material</TableHead>
                <TableHead>Largo ({units})</TableHead>
                <TableHead>Ancho ({units})</TableHead>
                <TableHead>Grosor sierra ({units})</TableHead>
                <TableHead>Margen ({units})</TableHead>
                <TableHead>Area (m2)</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium text-[var(--text)]">{material.material}</TableCell>
                  <TableCell>{material.length}</TableCell>
                  <TableCell>{material.width}</TableCell>
                  <TableCell>{material.kerf}</TableCell>
                  <TableCell>{material.margin}</TableCell>
                  <TableCell>{formatSquareMeters(rectangleAreaToSquareMeters(material.length, material.width, material.quantity, units))}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDuplicate?.(material)}
                        className="h-8 w-8 p-0 text-[var(--text)]"
                        title="Duplicar material"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditRequest?.(material)}
                        className="h-8 w-8 p-0 text-[var(--text)]"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete?.(material.id)}
                        className="h-8 w-8 p-0 text-[var(--danger)] hover:text-[var(--danger)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
