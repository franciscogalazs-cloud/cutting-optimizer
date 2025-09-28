import { Edit2, RotateCcw, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
export const PiecesTable = ({ pieces, onEdit, onDelete, onEditRequest, onDuplicate, units = 'mm', materials = [] }) => {
  const totalPieces = pieces.reduce((sum, piece) => sum + piece.quantity, 0);
  const totalArea = pieces.reduce((sum, piece) => sum + piece.length * piece.width * piece.quantity, 0) / 10000;

  const materialNames = Array.from(new Set(materials.map((material) => material.material))).filter(Boolean);
  const nameToSample = new Map();
  for (const material of materials) {
    if (material.material && !nameToSample.has(material.material)) {
      nameToSample.set(material.material, material);
    }
  }

  if (pieces.length === 0) {
    return (
      <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <CardHeader>
          <CardTitle className="text-[var(--text)]">Piezas a cortar</CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center text-[var(--muted)]">
          <p>No hay piezas agregadas.</p>
          <p className="text-xs">Utiliza el formulario de la izquierda para cargar nuevas piezas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] min-w-0 w-full flex-1">
      <CardHeader>
        <CardTitle className="flex flex-col gap-1 text-[var(--text)] sm:flex-row sm:items-center sm:justify-between">
          <span>Piezas a cortar</span>
          <span className="text-sm text-[var(--muted)]">
            Total: {totalPieces} piezas - Area: {totalArea.toLocaleString()} m2
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full max-w-none min-w-0 overflow-auto">
          <table className="w-full table-auto caption-bottom text-sm">
            <colgroup>
              <col />
              <col className="w-24" />
              <col className="w-24" />
              <col className="w-24" />
              <col className="w-[18rem]" />
              <col className="w-24" />
              <col className="w-36" />
            </colgroup>
            <TableHeader>
              <TableRow className="bg-[var(--surface)]">
                <TableHead className="text-left">Etiqueta</TableHead>
                <TableHead className="text-center">Largo ({units})</TableHead>
                <TableHead className="text-center">Ancho ({units})</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-center">Material</TableHead>
                <TableHead className="text-center">Area (m2)</TableHead>
                <TableHead className="text-right sticky right-0 bg-[var(--surface)] z-10">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pieces.map((piece) => (
                <TableRow key={piece.id}>
                  <TableCell className="font-medium text-[var(--text)] text-left">
                    <span className="block max-w-[16rem] truncate" title={piece.label}>
                      {piece.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{piece.length}</TableCell>
                  <TableCell className="text-center">{piece.width}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-[var(--surface)] text-[var(--text)]">
                      {piece.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Select
                      value={materialNames.includes(piece.material) ? piece.material : undefined}
                      onValueChange={(value) => onEdit && onEdit(piece.id, { material: value })}
                      disabled={materialNames.length === 0}
                    >
                      <SelectTrigger className="w-full relative border-[var(--border)] bg-[var(--surface)] text-center text-[var(--text)]">
                        <SelectValue placeholder={materialNames.length === 0 ? 'Sin materiales' : 'Selecciona material'} />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={4} className="z-50">
                        {materialNames.map((name) => {
                          const sample = nameToSample.get(name);
                          const label = sample && sample.length && sample.width
                            ? `${name} - ${sample.length}x${sample.width} ${units}`
                            : name;
                          return (
                            <SelectItem key={name} value={name}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">{((piece.length * piece.width * piece.quantity) / 10000).toLocaleString()}</TableCell>
                  <TableCell className="text-right sticky right-0 bg-[var(--surface)]">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-[var(--text)]"
                        title="Rotar largo/ancho"
                        onClick={() => onEdit && onEdit(piece.id, { length: piece.width, width: piece.length })}
                      >
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Rotar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDuplicate?.(piece)}
                        className="h-8 w-8 p-0 text-[var(--text)]"
                        title="Duplicar pieza"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditRequest?.(piece)}
                        className="h-8 w-8 p-0 text-[var(--text)]"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete?.(piece.id)}
                        className="h-8 w-8 p-0 text-[var(--danger)] hover:text-[var(--danger)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
