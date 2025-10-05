import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { computeEdgeTotals } from './edgeBanding';
import { EdgeBandingPattern } from './EdgeBandingPattern.jsx';

const formatMm = (value) => value.toLocaleString(undefined, { maximumFractionDigits: 2 });
const formatMeters = (value) => value.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });

const hasAnyEdges = (totals) => Object.values(totals).some((total) => total > 0);

export const EdgeBandingPanel = ({ pieces = [], units = 'cm', onEditPiece }) => {
  const [wastePercent, setWastePercent] = useState(0);
  // Cargar desperdicio desde localStorage al iniciar
  useEffect(() => {
    try {
      const raw = localStorage.getItem('edgebanding-waste-percent');
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0) setWastePercent(n);
    } catch {
      // noop: ignorar errores de localStorage
    }
  }, []);

  const totals = useMemo(() => computeEdgeTotals(pieces), [pieces]);
  const sortedEntries = useMemo(
    () => Object.entries(totals).sort(([a], [b]) => a.localeCompare(b, 'es')),
    [totals],
  );

  const totalMm = useMemo(() => sortedEntries.reduce((acc, [, mm]) => acc + mm, 0), [sortedEntries]);
  const totalMeters = totalMm / 1000;
  const totalWithWaste = totalMeters * (1 + wastePercent / 100);

  const handleWasteChange = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
      setWastePercent(0);
      return;
    }
    setWastePercent(numeric);
    try {
      localStorage.setItem('edgebanding-waste-percent', String(numeric));
    } catch {
      // noop: ignorar errores de escritura en localStorage
    }
  };

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
      <CardHeader>
        <CardTitle>Tapacantos - Totales por tipo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Piezas registradas</span>
            <span className="text-xl font-semibold">{pieces.length}</span>
          </div>
          <label className="flex flex-col">
            <span className="text-sm text-muted-foreground">Desperdicio (%)</span>
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={wastePercent}
              onChange={(event) => handleWasteChange(event.target.value)}
              className="mt-1"
            />
          </label>
        </div>

        {hasAnyEdges(totals) ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Longitud (mm)</TableHead>
                <TableHead>Longitud (m)</TableHead>
                <TableHead>Con desperdicio (m)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedEntries.map(([tipo, mm]) => {
                const meters = mm / 1000;
                const metersWithWaste = meters * (1 + wastePercent / 100);
                return (
                  <TableRow key={tipo}>
                    <TableCell className="font-medium">{tipo}</TableCell>
                    <TableCell>{formatMm(mm)}</TableCell>
                    <TableCell>{formatMeters(meters)}</TableCell>
                    <TableCell>{formatMeters(metersWithWaste)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="font-semibold">{formatMm(totalMm)}</TableCell>
                <TableCell className="font-semibold">{formatMeters(totalMeters)}</TableCell>
                <TableCell className="font-semibold">{formatMeters(totalWithWaste)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        ) : (
          <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-center text-sm text-muted-foreground">
            Activa tapacantos en las piezas para ver los totales por tipo.
          </div>
        )}

        <EdgeBandingPattern pieces={pieces} units={units} onEditPiece={onEditPiece} />
      </CardContent>
    </Card>
  );
};
