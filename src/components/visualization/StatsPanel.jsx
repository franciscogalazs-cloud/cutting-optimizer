import { TrendingUp, TrendingDown, Clock, Package, DollarSign, Scissors } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { areaToSquareMeters, formatSquareMeters, formatCLP } from '@/lib/format.js';
const formatTime = (ms) => {
  if (typeof ms !== 'number' || Number.isNaN(ms)) return '--';
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
};

const utilizationColor = (value) => {
  if (value >= 80) return 'text-[var(--success)]';
  if (value >= 60) return 'text-[var(--warning)]';
  return 'text-[var(--danger)]';
};

const utilizationBadge = (value) => {
  if (value >= 80) return 'default';
  if (value >= 60) return 'secondary';
  return 'destructive';
};

export const StatsPanel = ({ result, units = 'mm' }) => {
  if (!result) {
    return (
      <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
        <CardHeader>
          <CardTitle className="text-[var(--text)]">Estadisticas de optimizacion</CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center text-[var(--muted)]">
          <p>No hay estadisticas disponibles.</p>
          <p className="text-xs">Ejecuta la optimizacion para analizar el desempeno de los tableros.</p>
        </CardContent>
      </Card>
    );
  }

  const _totalWasteM2 = formatSquareMeters(areaToSquareMeters(result.totalWaste ?? 0, units));
  // Utilización promedio en m²: promedio del área usada por hoja
  const avgUsedM2 = (() => {
    const patterns = result?.patterns || [];
    if (!Array.isArray(patterns) || patterns.length === 0) return 0;
    let totalUsedArea = 0; // en unidades cuadradas de `units`
    for (const pat of patterns) {
      const pieces = pat?.pieces || pat?.placedPieces || [];
      for (const p of pieces) {
        const w = Number(p?.width ?? p?.w ?? 0);
        const h = Number(p?.height ?? p?.h ?? 0);
        if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
          totalUsedArea += w * h;
        }
      }
    }
    const avgArea = totalUsedArea / patterns.length;
    return areaToSquareMeters(avgArea, units);
  })();
  const totalCostCLP = formatCLP(result.totalCost ?? 0);
  const metrics = [
    {
      title: 'Tableros usados',
      icon: Package,
      accent: 'bg-[var(--primary)]/10 text-[var(--primary)]',
      value: result.materialsUsed,
    },
    {
      title: 'Utilizacion promedio',
      icon: TrendingUp,
      accent: 'bg-[var(--success)]/10 text-[var(--success)]',
      value: `${formatSquareMeters(avgUsedM2)} m2`,
    },
    {
      title: 'Desperdicio total',
      icon: TrendingDown,
      accent: 'bg-[var(--danger)]/10 text-[var(--danger)]',
      value: `${formatSquareMeters(areaToSquareMeters(result.totalWaste ?? 0, units))} m2`,
    },
    {
      title: 'Costo estimado',
      icon: DollarSign,
      accent: 'bg-[var(--warning)]/15 text-[var(--warning)]',
      value: totalCostCLP,
    },
  ];

  return (
    <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
      <CardHeader className="flex flex-col gap-2">
        <CardTitle className="flex items-center gap-2 text-[var(--text)]">
          <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
          Estadisticas de optimizacion
          <Badge variant="outline" className="border-[var(--border)] text-[var(--muted)]">
            {result.algorithm}
          </Badge>
        </CardTitle>
        <p className="text-xs text-[var(--muted)]">
          Resumen de desempeno para los tableros procesados en la ultima optimizacion.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map(({ title, icon, accent, value }) => {
            const IconComponent = icon;
            return (
              <div
                key={title}
                className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${accent}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="mt-3 text-xs text-[var(--muted)]">{title}</div>
                <div className="text-lg font-semibold text-[var(--text)]">{value}</div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-[var(--text)]">
            <span>Eficiencia global</span>
            <Badge variant={utilizationBadge(result.totalUtilization)}>
              {result.totalUtilization.toFixed(1)}%
            </Badge>
          </div>
          <Progress value={result.totalUtilization} className="h-3" />
          <div className="flex justify-between text-[10px] text-[var(--muted)]">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="grid gap-4 border-t border-[var(--border)] pt-4 text-sm text-[var(--muted)] sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-[var(--muted)]" />
            <div>
              <div className="font-medium text-[var(--text)]">Tiempo de ejecucion</div>
              <div>{formatTime(result.executionTime)}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Scissors className="h-5 w-5 text-[var(--muted)]" />
            <div>
              <div className="font-medium text-[var(--text)]">Patrones generados</div>
              <div>{result.patterns.length} hojas</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-[var(--text)]">Desglose por tablero</h4>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {result.patterns.map((pattern, index) => (
              <div
                key={pattern.id ?? index}
                className="flex flex-col gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--muted)] md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Hoja {index + 1}</Badge>
                  {pattern.materialName && (
                    <Badge variant="secondary" className="bg-[var(--primary)]/10 text-[var(--primary)]">
                      {pattern.materialName}
                    </Badge>
                  )}
                  <span>
                    {pattern.materialLength} × {pattern.materialWidth} {units}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <span className={`font-medium ${utilizationColor(pattern.utilization)}`}>
                    {pattern.utilization.toFixed(1)}%
                  </span>
                  <span>{pattern.pieces.length} piezas</span>
                  {pattern.kerf != null && <span>Kerf: {(pattern.kerf ?? 0).toFixed(2)} {units}</span>}
                  {pattern.margin != null && <span>Margen: {(pattern.margin ?? 0).toFixed(2)} {units}</span>}
                  <span className="text-[var(--success)] font-medium">{formatCLP(pattern.cost ?? 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 rounded-[var(--radius)] border border-[var(--primary)]/30 bg-[var(--primary)]/10 p-4 text-xs text-[var(--primary)]">
          <h4 className="text-sm font-semibold text-[var(--text)]">Recomendaciones</h4>
          <ul className="list-disc space-y-1 pl-4">
            {result.totalUtilization < 60 && (
              <li>Considera usar tableros mas pequenos o reacomodar piezas para reducir Desperdicio.</li>
            )}
            {result.totalUtilization > 90 && (
              <li>Excelente aprovechamiento del material. Procura reutilizar esta configuracion.</li>
            )}
            {result.patterns.length > 5 && (
              <li>Agrupa pedidos similares para disminuir el numero de tableros necesarios.</li>
            )}
            <li>Verifica que las dimensiones sean compatibles con el equipo de corte disponible.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};






