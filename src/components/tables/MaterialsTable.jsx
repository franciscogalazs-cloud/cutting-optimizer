import { Edit2, Trash2 } from 'lucide-react';
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

export const MaterialsTable = ({ materials, onDelete, onEditRequest, units = 'mm' }) => {
  const totalMaterials = materials.reduce((sum, material) => sum + material.quantity, 0);
  const totalArea = materials.reduce((sum, material) => sum + material.length * material.width * material.quantity, 0);

  if (materials.length === 0) {
    return (
      <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <CardHeader>
          <CardTitle className="text-[var(--text)]">Materiales disponibles</CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center text-[var(--muted)]">
          <p>No hay materiales cargados.</p>
          <p className="text-xs">Añade tableros desde la sección izquierda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
      <CardHeader>
        <CardTitle className="flex flex-col gap-1 text-[var(--text)] sm:flex-row sm:items-center sm:justify-between">
          <span>Materiales disponibles</span>
          <span className="text-sm text-[var(--muted)]">
            Total: {totalMaterials} tableros · Área: {totalArea.toLocaleString()} {units}²
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[var(--surface)]">
                <TableHead>Material</TableHead>
                <TableHead>Largo ({units})</TableHead>
                <TableHead>Ancho ({units})</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Grosor sierra ({units})</TableHead>
                <TableHead>Margen ({units})</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Área ({units}²)</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium text-[var(--text)]">{material.material}</TableCell>
                  <TableCell>{material.length}</TableCell>
                  <TableCell>{material.width}</TableCell>
                  <TableCell>{material.quantity}</TableCell>
                  <TableCell>{material.kerf}</TableCell>
                  <TableCell>{material.margin}</TableCell>
                  <TableCell>{material.price?.toLocaleString(undefined, { style: 'currency', currency: 'USD' }) || '--'}</TableCell>
                  <TableCell>{(material.length * material.width * material.quantity).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
