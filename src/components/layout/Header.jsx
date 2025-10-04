import { Trash2, Info, Play } from "lucide-react";
import { brandUrl, rootUrl } from "@/lib/paths";
import { Button } from "@/components/ui/button";
// BUILD_INFO removido del header (ocultamos versión)

export const Header = ({
  onShowInfo,
  onToggleUnits,
  onOptimize,
  units = "mm",
  canOptimize = true,
  isOptimizing = false,
  tabsBar = null,
}) => {
  const handleClear = () => {
    if (confirm("¿Estás seguro de que quieres limpiar todos los datos?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
  <header className="sticky top-0 z-40 border-b border-white bg-[var(--bg)]/95 backdrop-blur overflow-visible">
  <div className="mx-auto flex max-w-5xl items-center gap-2 px-2 pt-4 pb-7 sm:gap-4 sm:px-4 lg:px-6">
    <div className="flex items-center shrink-0">
      <img
        src={brandUrl("brand/industrial-plate/stencil_main.svg")}
        onError={(e) => {
          if (import.meta.env.DEV) {
            const t = e.currentTarget;
            if (!t.dataset.fallback) {
              t.dataset.fallback = "1";
              t.src = rootUrl("brand/industrial-plate/stencil_main.svg");
            }
          }
        }}
        alt="Logo"
        width="300"
        className="hidden sm:block"
      />
      <img
        src={brandUrl("brand/industrial-plate/stencil_main.svg")}
        onError={(e) => {
          if (import.meta.env.DEV) {
            const t = e.currentTarget;
            if (!t.dataset.fallback) {
              t.dataset.fallback = "1";
              t.src = rootUrl("brand/industrial-plate/stencil_main.svg");
            }
          }
        }}
        alt="Logo"
        width="160"
        className="sm:hidden max-w-[60%] h-auto"
      />
    </div>

    {/* Buscador eliminado para simplificar el header */}

  <div className="ml-2 mt-0 mb-1 flex flex-nowrap items-center gap-1.5 text-[var(--muted)] overflow-x-auto overflow-y-visible no-scrollbar whitespace-nowrap">
          {/* Etiqueta de versión eliminada */}
          <Button
            size="lg"
            onClick={onOptimize}
            disabled={!canOptimize || isOptimizing}
            className="rounded-full min-w-[148px] !hover:translate-y-[2px] !active:translate-y-[2px] !active:scale-100"
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

          <Button variant="outline" size="lg" onClick={onShowInfo} className="border-[var(--stroke)] text-[var(--fg)] rounded-full min-w-[148px] !hover:translate-y-[2px] !active:translate-y-[2px] !active:scale-100">
            <Info className="h-4 w-4" />
            <span>Ayuda</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={handleClear}
            className="border-[var(--stroke)] text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-full min-w-[148px] !hover:translate-y-[2px] !active:translate-y-[2px] !active:scale-100"
          >
            <Trash2 className="h-4 w-4" />
            <span>Limpiar</span>
          </Button>

          <Button variant="outline" size="lg" onClick={onToggleUnits} className="border-[var(--stroke)] text-[var(--fg)] rounded-full min-w-[148px] !hover:translate-y-[2px] !active:translate-y-[2px] !active:scale-100">
            Unidades: {units}
          </Button>

        </div>
      </div>
      {tabsBar ? (
        <div className="mx-auto w-full max-w-5xl px-2 pt-2 sm:px-4 lg:px-6">
          {tabsBar}
        </div>
      ) : null}
    </header>
  );
};



