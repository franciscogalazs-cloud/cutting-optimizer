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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
        {/* Móvil: tarjetas apiladas sin scroll horizontal */}
        <div className="block sm:hidden space-y-2">
          {pieces.map((piece) => (
            <div key={piece.id} className="rounded-md border border-[var(--border)] bg-[var(--bg)]/20 p-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[var(--text)] truncate" title={piece.label}>{piece.label}</div>
                  <div className="mt-1 text-[12px] text-[var(--muted)] grid grid-cols-2 gap-x-4 gap-y-1">
                    <span>Largo: <span className="tabular-nums">{piece.length}</span> {units}</span>
                    <span>Ancho: <span className="tabular-nums">{piece.width}</span> {units}</span>
                    <span>Cantidad: <Badge variant="secondary" className="bg-[var(--surface)] text-[var(--text)]">{piece.quantity}</Badge></span>
                    <span>Área: <span className="tabular-nums">{((piece.length * piece.width * piece.quantity) / 10000).toLocaleString()}</span> m2</span>
                    <span className="col-span-2">
                      <span>Material: </span>
                      <Select
                        value={materialNames.includes(piece.material) ? piece.material : ''}
                        onValueChange={(value) => onEdit && onEdit(piece.id, { material: value })}
                        disabled={materialNames.length === 0}
                      >
                        <SelectTrigger className="inline-flex w-auto min-w-[10rem] border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
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
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <div className="inline-flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-[var(--text)]"
                            title="Rotar"
                            aria-label="Rotar"
                            onClick={() => onEdit && onEdit(piece.id, { length: piece.width, width: piece.length })}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Rotar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDuplicate?.(piece)}
                            className="h-8 w-8 p-0 text-[var(--text)]"
                            title="Duplicar"
                            aria-label="Duplicar"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Duplicar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditRequest?.(piece)}
                            className="h-8 w-8 p-0 text-[var(--text)]"
                            title="Editar"
                            aria-label="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete?.(piece.id)}
                            className="h-8 w-8 p-0 text-[var(--danger)] hover:text-[var(--danger)]"
                            title="Eliminar"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* sm+: tabla completa */}
        <div className="hidden sm:block w-full max-w-none min-w-0 overflow-auto">
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
                      value={materialNames.includes(piece.material) ? piece.material : ''}
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
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-[var(--text)] hover:bg-[var(--border)]/40 hover:border-[var(--border)] hover:text-[var(--text)]"
                              title="Rotar"
                              aria-label="Rotar"
                              onClick={() => onEdit && onEdit(piece.id, { length: piece.width, width: piece.length })}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Rotar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDuplicate?.(piece)}
                              className="h-8 w-8 p-0 text-[var(--text)] hover:bg-[var(--border)]/40 hover:border-[var(--border)] hover:text-[var(--text)]"
                              title="Duplicar"
                              aria-label="Duplicar"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Duplicar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditRequest?.(piece)}
                              className="h-8 w-8 p-0 text-[var(--text)] hover:bg-[var(--border)]/40 hover:border-[var(--border)] hover:text-[var(--text)]"
                              title="Editar"
                              aria-label="Editar"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDelete?.(piece.id)}
                              className="h-8 w-8 p-0 text-[var(--danger)] hover:text-[var(--danger)] hover:bg-[var(--border)]/40 hover:border-[var(--border)]"
                              title="Eliminar"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
