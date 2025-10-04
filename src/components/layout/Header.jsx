import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { Trash2, Info, MoreHorizontal } from "lucide-react";
import { brandUrl, rootUrl } from "@/lib/paths";
import { useCompactHeader } from "@/hooks/useCompactHeader";

export const Header = ({
  onShowInfo,
  onToggleUnits: _onToggleUnits,
  onOptimize: _onOptimize,
  units: _units = "mm",
  canOptimize: _canOptimize = true,
  isOptimizing: _isOptimizing = false,
  tabsBar = null,
}) => {
  const headerRowRef = useRef(null);
  const logoRef = useRef(null);
  const tabsWrapRef = useRef(null);
  const handleClear = () => {
    if (confirm("¿Estás seguro de que quieres limpiar todos los datos?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Alinear el borde izquierdo del logo con el borde izquierdo del contenedor de tabs
  useLayoutEffect(() => {
    function alignLogo() {
      if (!logoRef.current || !tabsWrapRef.current) return;
      const logoRect = logoRef.current.getBoundingClientRect();
      const tabsRect = tabsWrapRef.current.getBoundingClientRect();
  const dx = Math.round(tabsRect.left - logoRect.left);
  const OFFSET = -112; // px: +30px más a la izquierda
  logoRef.current.style.marginLeft = `${dx + OFFSET}px`;
    }
    alignLogo();
    const onResize = () => requestAnimationFrame(alignLogo);
    window.addEventListener('resize', onResize);
    // Observamos cambios en tamaño de tabs o logo
    const roTabs = new ResizeObserver(onResize);
    const roLogo = new ResizeObserver(onResize);
    if (tabsWrapRef.current) roTabs.observe(tabsWrapRef.current);
    if (logoRef.current) roLogo.observe(logoRef.current);
    return () => {
      window.removeEventListener('resize', onResize);
      roTabs.disconnect();
      roLogo.disconnect();
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white bg-[var(--bg)]/95 backdrop-blur overflow-hidden">
      <div ref={headerRowRef} className="mx-auto w-full max-w-5xl flex items-center justify-between gap-5 md:gap-7 px-2 sm:px-4 lg:px-6 py-2">
  <div ref={logoRef} className="min-w-0 shrink-0 cursor-pointer transition-transform duration-300 ease-out hover:scale-105 hover:brightness-110 flex items-center">
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
            width="600"
            className="hidden sm:block max-h-24"
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
            width="320"
            className="sm:hidden max-w-[80%] h-auto max-h-16"
          />
        </div>

  <div className="">
          <ActionsBar
            onShowInfo={onShowInfo}
            onClear={handleClear}
          />
        </div>
      </div>
      
      {tabsBar ? (
        <div ref={tabsWrapRef} className="mx-auto w-full max-w-5xl px-2 pt-2 sm:px-4 lg:px-6">
          {tabsBar}
        </div>
      ) : null}
    </header>
  );
};

function ActionsBar({ onShowInfo, onClear }) {
  const ref = useRef(null);
  const compact = useCompactHeader(ref);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <div
      ref={ref}
      data-compact={compact ? "true" : "false"}
      className="flex items-center justify-end flex-wrap gap-[clamp(6px,1vw,12px)] min-w-0 shrink overflow-hidden"
    >
      <button
        onClick={onShowInfo}
        aria-label="Ayuda"
        title="Ayuda"
        className="inline-flex items-center justify-center rounded-[12px] border border-[var(--stroke)] text-[var(--fg)]
                   h-[clamp(30px,2.6vw,40px)] w-[clamp(34px,2.8vw,40px)]
                   hover:bg-[var(--bg-subtle)] transition-colors"
      >
        <Info className="size-[clamp(16px,1.6vw,18px)]" />
      </button>

      <button
        onClick={onClear}
        aria-label="Limpiar"
        title="Limpiar"
        className="inline-flex items-center justify-center rounded-[12px] border border-[var(--stroke)] text-rose-500
                   h-[clamp(30px,2.6vw,40px)] w-[clamp(34px,2.8vw,40px)]
                   hover:bg-rose-50 transition-colors"
      >
        <Trash2 className="size-[clamp(16px,1.6vw,18px)]" />
      </button>
      {compact && (
        <MoreMenu 
          onShowInfo={onShowInfo}
          onClear={onClear}
          showMenu={showMoreMenu}
          setShowMenu={setShowMoreMenu}
        />
      )}
    </div>
  );
}

// UnitsPicker eliminado según solicitud

function MoreMenu({ onShowInfo, onClear, showMenu, setShowMenu }) {
  const menuRef = useRef(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu, setShowMenu]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        aria-label="Más opciones"
        title="Más opciones"
        className="inline-flex items-center justify-center rounded-[12px] border border-[var(--stroke)]
                   h-[clamp(30px,2.6vw,40px)] w-[clamp(34px,2.8vw,40px)]
                   hover:bg-[var(--bg-subtle)] transition-colors"
      >
        <MoreHorizontal className="size-[clamp(16px,1.6vw,18px)]" />
      </button>
      
      {showMenu && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--stroke)] shadow-lg rounded-lg py-1 min-w-[120px] z-50">
          <button
            onClick={() => { onShowInfo(); setShowMenu(false); }}
            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <Info className="size-4" />
            Ayuda
          </button>
          <button
            onClick={() => { onClear(); setShowMenu(false); }}
            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm text-rose-500"
          >
            <Trash2 className="size-4" />
            Limpiar
          </button>
        </div>
      )}
    </div>
  );
}



