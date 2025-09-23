import { Edit2, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const PiecesTable = ({ pieces, onEdit, onDelete, onEditRequest, units = 'mm', materials = [] }) => {
  const totalPieces = pieces.reduce((sum, piece) => sum + piece.quantity, 0);
  const totalArea = pieces.reduce((sum, piece) => sum + piece.length * piece.width * piece.quantity, 0);

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
    <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
      <CardHeader>
        <CardTitle className="flex flex-col gap-1 text-[var(--text)] sm:flex-row sm:items-center sm:justify-between">
          <span>Piezas a cortar</span>
          <span className="text-sm text-[var(--muted)]">
            Total: {totalPieces} piezas · Área: {totalArea.toLocaleString()} {units}²
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[var(--surface)]">
                <TableHead>Etiqueta</TableHead>
                <TableHead>Largo ({units})</TableHead>
                <TableHead>Ancho ({units})</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Área ({units}²)</TableHead>
                <TableHead>Opciones</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pieces.map((piece) => (
                <TableRow key={piece.id}>
                  <TableCell className="font-medium text-[var(--text)]">{piece.label}</TableCell>
                  <TableCell>{piece.length}</TableCell>
                  <TableCell>{piece.width}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-[var(--surface)] text-[var(--text)]">
                      {piece.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={materialNames.includes(piece.material) ? piece.material : undefined}
                      onValueChange={(value) => onEdit && onEdit(piece.id, { material: value })}
                      disabled={materialNames.length === 0}
                    >
                      <SelectTrigger className="w-48 border-[var(--border)] bg-[var(--surface)] text-left text-[var(--text)]">
                        <SelectValue placeholder={materialNames.length === 0 ? 'Sin materiales' : 'Selecciona material'} />
                      </SelectTrigger>
                      <SelectContent>
                        {materialNames.map((name) => {
                          const sample = nameToSample.get(name);
                          const label = sample && sample.length && sample.width
                            ? `${name} — ${sample.length}x${sample.width} ${units}`
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
                  <TableCell>{(piece.length * piece.width * piece.quantity).toLocaleString()}</TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
