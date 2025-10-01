import { Trash2, Info, Play, Search } from "lucide-react";
import { brandUrl } from "@/lib/paths";
import { Button } from "@/components/ui/button";

export const Header = ({
  onShowInfo,
  onToggleUnits,
  onOptimize,
  units = "mm",
  canOptimize = true,
  isOptimizing = false,
}) => {
  const handleClear = () => {
    if (confirm("¿Estás seguro de que quieres limpiar todos los datos?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--stroke)] bg-[var(--bg)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
  <img src={brandUrl("brand/industrial-plate/stencil_main.svg")} alt="Logo" width="300" className="hidden sm:block" />
  <img src={brandUrl("brand/industrial-plate/stencil_main.svg")} alt="Logo" width="220" className="sm:hidden" />

        <div className="hidden flex-1 items-center justify-center md:flex">
          <label className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="search"
              placeholder="Buscar piezas/materiales…"
              className="h-10 w-full rounded-full border border-[var(--stroke)] bg-[var(--card)] pl-10 pr-4 text-sm text-[var(--fg)] shadow-sm outline-none transition focus:ring-2 focus:ring-[var(--accent)]"
            />
          </label>
        </div>

        <div className="ml-auto flex items-center gap-2 text-[var(--muted)]">
          <Button
            size="sm"
            onClick={onOptimize}
            disabled={!canOptimize || isOptimizing}
            className="bg-[var(--accent)] text-white hover:brightness-105"
          >
            {isOptimizing ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                <span>Optimizando…</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Optimizar</span>
              </>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={onShowInfo} className="border-[var(--stroke)] text-[var(--fg)]">
            <Info className="h-4 w-4" />
            <span>Ayuda</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="border-[var(--stroke)] text-[var(--danger)] hover:bg-[var(--danger)]/10"
          >
            <Trash2 className="h-4 w-4" />
            <span>Limpiar</span>
          </Button>

          <Button variant="outline" size="sm" onClick={onToggleUnits} className="border-[var(--stroke)] text-[var(--fg)]">
            Unidades: {units}
          </Button>

        </div>
      </div>
    </header>
  );
};



