import { useEffect, useState, useRef, useCallback } from "react";
import fondoMetalica from "../fondos/metalica.jpg";
import { absoluteUrl, brandUrl, rootUrl } from "@/lib/paths";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Download, Grid3X3, Play, Scissors, Calculator, Home, Square, Layers } from "lucide-react";
import { toast } from "sonner";
import { PieceForm } from "./components/forms/PieceForm";
import { MaterialForm } from "./components/forms/MaterialForm";
import { PiecesTable } from "./components/tables/PiecesTable";
import { MaterialsTable } from "./components/tables/MaterialsTable";
import { AdvancedCuttingPattern } from "./components/visualization/AdvancedCuttingPattern";
import { KpiCard } from "./components/KpiCard.jsx";
import { PieceEditModal } from "./components/modals/PieceEditModal";
import { MaterialEditModal } from "./components/modals/MaterialEditModal";
import { InfoModal } from "./components/common/InfoModal";
import { ExportModal } from "./components/common/ExportModal";
import { EdgeBandingPanel } from "./features/edgebanding/EdgeBandingPanel.jsx";
import { BudgetPanel } from "./components/visualization/BudgetPanel.jsx";
// Pestaña IA retirada; reemplazada por Inicio
import { normalizePiece, toMillimeters, cloneEdges, defaultEdges } from "./types/pieces.js";
import { areaToSquareMeters, formatSquareMeters } from "./lib/format.js";
import { useOptimization } from "./hooks/useOptimization";
// Historial opcional removido de la UI por ahora
import { useLocalStorage } from "./hooks/useLocalStorage";
const mmToUnits = (valueMm, units) => {
  const numeric = Number(valueMm);
  if (!Number.isFinite(numeric)) return 0;
  switch (units) {
    case "cm":
      return Number((numeric / 10).toFixed(3));
    case "in":
      return Number((numeric / 25.4).toFixed(3));
    default:
      return Number(numeric.toFixed(3));
  }
};
// Ensure that no large code blocks have been accidentally removed.
// Review your recent changes for any unintended deletions.
function App() {
  // Contenedor compartido para alinear sticky bar y contenido (mismo ancho y padding lateral)
  const BASE_CONTAINER = "mx-auto w-full max-w-5xl px-2 sm:px-4 lg:px-6";
  // Fondo global mediante overlay fijo detrás de la UI
  const tabsBarRef = useRef(null);
  const patternsHeaderRef = useRef(null);
  const edgebandingHeaderRef = useRef(null);
  const materialsHeaderRef = useRef(null);
  const budgetHeaderRef = useRef(null);
  const piecesHeaderRef = useRef(null);
  const [pieces, setPieces] = useLocalStorage("cutting-pieces", []);
  const [materials, setMaterials] = useLocalStorage("cutting-materials", []);
  const [config, setConfig] = useLocalStorage("cutting-config", {
    units: "cm",
    kerfWidth: 3,
    margin: 5,
    allowRotation: true,
    separation: 0,
    rotationPenalty: 0,
  });
  // Historial deshabilitado: UI y atajos removidos
  const [activeTab, setActiveTab] = useState("home");
  useEffect(() => {
    setConfig((prev) => (prev.allowRotation ? prev : { ...prev, allowRotation: true }));
  }, [setConfig]);

  // Ajuste fino único para el scroll de anclaje (piezas y patrones)
  const SCROLL_FINE_TUNE = -36; // px (20px más arriba que antes)

  // Helper reutilizable para desplazar la vista al encabezado de Patrones
  const scrollToPatterns = useCallback(() => {
    const target = patternsHeaderRef.current;
    if (!target) return;
    const barEl = tabsBarRef.current;
    const barH = barEl ? barEl.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - barH + SCROLL_FINE_TUNE;
    (document.scrollingElement || window).scrollTo({ top, behavior: 'smooth' });
  }, [SCROLL_FINE_TUNE]);

  // Helper para desplazar la vista al encabezado de Piezas
  const scrollToPieces = useCallback(() => {
    const target = piecesHeaderRef.current;
    if (!target) return;
    const barEl = tabsBarRef.current;
    const barH = barEl ? barEl.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - barH + SCROLL_FINE_TUNE;
    (document.scrollingElement || window).scrollTo({ top, behavior: 'smooth' });
  }, [SCROLL_FINE_TUNE]);

  // Helper para desplazar la vista al encabezado de Materiales
  const scrollToMaterials = useCallback(() => {
    const target = materialsHeaderRef.current;
    if (!target) return;
    const barEl = tabsBarRef.current;
    const barH = barEl ? barEl.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - barH + SCROLL_FINE_TUNE;
    (document.scrollingElement || window).scrollTo({ top, behavior: 'smooth' });
  }, [SCROLL_FINE_TUNE]);

  // Helper para desplazar la vista al encabezado de Presupuesto
  const scrollToBudget = useCallback(() => {
    const target = budgetHeaderRef.current;
    if (!target) return;
    const barEl = tabsBarRef.current;
    const barH = barEl ? barEl.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - barH + SCROLL_FINE_TUNE;
    (document.scrollingElement || window).scrollTo({ top, behavior: 'smooth' });
  }, [SCROLL_FINE_TUNE]);

  // Al activar la pestaña de inicio, desplazamos al tope de la página
  useEffect(() => {
    if (activeTab !== "home") return;
    requestAnimationFrame(() => (document.scrollingElement || window).scrollTo({ top: 0, behavior: 'smooth' }));
  }, [activeTab]);

  // Al activar la pestaña de patrones ya no hacemos auto-scroll, así las tarjetas KPI quedan a la vista
  // useEffect(() => {
  //   if (activeTab !== "patterns") return;
  //   requestAnimationFrame(() => requestAnimationFrame(() => scrollToPatterns()));
  // }, [activeTab, scrollToPatterns]);

  // Al entrar a Patrones, forzar que las etiquetas estén activadas (preferencia persistida)
  useEffect(() => {
    if (activeTab !== 'patterns') return;
    try {
      const KEY = 'pattern-view-preferences';
      const raw = window.localStorage.getItem(KEY);
      const current = raw ? JSON.parse(raw) : {};
      if (current?.showLabels !== true) {
        const next = { ...current, showLabels: true };
        window.localStorage.setItem(KEY, JSON.stringify(next));
      }
    } catch {
      // si localStorage falla, la UI usa el default (true)
    }
  }, [activeTab]);

  // Al activar la pestaña de piezas, desplazamos al encabezado "Piezas a cortar"
  useEffect(() => {
    if (activeTab !== "pieces") return;
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToPieces()));
  }, [activeTab, scrollToPieces]);

  // Auto-scroll desactivado para 'edgebanding'.
  // Para 'materials', volvemos a habilitar el auto-scroll al encabezado "Materiales disponibles".
  useEffect(() => {
    if (activeTab !== "materials") return;
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToMaterials()));
  }, [activeTab, scrollToMaterials]);

  // Al activar la pestaña de presupuesto, desplazamos al encabezado "Presupuesto"
  useEffect(() => {
    if (activeTab !== "budget") return;
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToBudget()));
  }, [activeTab, scrollToBudget]);

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [editingPiece, setEditingPiece] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const { result, optimize, error } = useOptimization();
  const efficiencyFactor = 0.9;

  // Inicio limpio una sola vez por sesión: limpiar piezas/materiales solo en el primer load de la sesión
  useEffect(() => {
    try {
      // Limpiar todas las claves relevantes para evitar datos antiguos
      const KEYS = [
        'cutting-pieces',
        'cutting-materials',
        'budget-client',
        'budget-company',
        'budget-base-materials',
        'budget-edge-items',
        'budget-hardware-items',
        'budget-other-items',
      ];
      for (const k of KEYS) {
        try { window.localStorage.removeItem(k); } catch {}
      }
      setPieces([]);
      setMaterials([]);
    } catch {
      // ignorar errores de storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler centralizado para limpiar datos y recargar
  const handleClearAll = useCallback(() => {
    try {
      localStorage.removeItem('cutting-pieces');
      localStorage.removeItem('cutting-materials');
    } catch {
      console.warn('localStorage partial clear failed');
    } finally {
      window.location.reload();
    }
  }, []);
  useEffect(() => {
    setPieces((current) => {
      if (!Array.isArray(current) || current.length === 0) return current;
      const needsNormalization = current.some(
        (piece) => !piece?.edges || piece.largoMm == null || piece.anchoMm == null,
      );
      if (!needsNormalization) return current;
      return current.map((piece) => {
        const normalized = normalizePiece(piece, config.units);
        return {
          ...piece,
          ...normalized,
          length: mmToUnits(normalized.largoMm, config.units),
          width: mmToUnits(normalized.anchoMm, config.units),
        };
      });
    });
  }, [config.units, setPieces]);
  useEffect(() => {
    setMaterials((current) => {
      if (!Array.isArray(current) || current.length === 0) return current;

      const demandByMaterial = new Map();
      if (Array.isArray(pieces)) {
        pieces.forEach((piece) => {
          const key = String(piece?.material ?? '').trim().toLowerCase();
          if (!key) return;
          const pieceLengthMm = toMillimeters(piece?.length, config.units);
          const pieceWidthMm = toMillimeters(piece?.width, config.units);
          if (!Number.isFinite(pieceLengthMm) || !Number.isFinite(pieceWidthMm) || pieceLengthMm <= 0 || pieceWidthMm <= 0) return;
          const quantityValue = Number(piece?.quantity);
          const quantity = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1;
          const currentDemand = demandByMaterial.get(key) ?? 0;
          demandByMaterial.set(key, currentDemand + pieceLengthMm * pieceWidthMm * quantity);
        });
      }

      let updated = false;

      const nextMaterials = current.map((material) => {
        const key = String(material?.material ?? '').trim().toLowerCase();
        if (!key) return material;
        const materialLengthMm = toMillimeters(material?.length, config.units);
        const materialWidthMm = toMillimeters(material?.width, config.units);
        if (!Number.isFinite(materialLengthMm) || !Number.isFinite(materialWidthMm) || materialLengthMm <= 0 || materialWidthMm <= 0) {
          return material.quantity > 0 ? material : { ...material, quantity: 1 };
        }
        const materialArea = materialLengthMm * materialWidthMm;
        const demand = demandByMaterial.get(key) ?? 0;
        if (demand <= 0) {
          const nextQuantity = material.quantity > 0 ? material.quantity : 1;
          if (nextQuantity !== material.quantity) {
            updated = true;
            return { ...material, quantity: nextQuantity };
          }
          return material;
        }
        const requiredQuantity = Math.max(1, Math.ceil((demand / efficiencyFactor) / materialArea));
        if (requiredQuantity !== material.quantity) {
          updated = true;
        }
        const coveredArea = materialArea * requiredQuantity * efficiencyFactor;
        demandByMaterial.set(key, Math.max(0, demand - coveredArea));
        return requiredQuantity !== material.quantity ? { ...material, quantity: requiredQuantity } : material;
      });

      return updated ? nextMaterials : current;
    });
  }, [pieces, config.units, setMaterials]);
  const handleAddPiece = (piece) => {
    // Remover flags temporales (e.g., duplicado en borrador)
    const { isDuplicateDraft: _dup, ...clean } = piece || {};
    // Validaciones defensivas por si el origen envía datos malos
    const q = Number(clean?.quantity);
    const L = Number(clean?.length);
    const W = Number(clean?.width);
    if (!Number.isFinite(L) || !Number.isFinite(W) || L <= 0 || W <= 0 || !Number.isFinite(q) || q <= 0) {
      try { console.warn('[App] handleAddPiece invalid payload', { clean }); } catch {}
      return;
    }
    const normalized = normalizePiece(clean, config.units);
    const newPiece = {
      ...clean,
      ...normalized,
      // Conservar id si existe (p. ej. desde createPiece); generar uno string si falta
      id: clean?.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      color: clean?.color || `hsl(${Math.floor(Math.random()*360)}, 70%, 60%)`,
      length: mmToUnits(normalized.largoMm, config.units),
      width: mmToUnits(normalized.anchoMm, config.units),
    };
    setPieces((prev) => [...prev, newPiece]);
  };
  const handleAddMaterial = (material) => {
    // Remover flags temporales en duplicados
    const { isDuplicateDraft: _dup, ...clean } = material || {};
    const newMaterial = {
      ...clean,
      id: clean?.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    };
    setMaterials((prev) => [...prev, newMaterial]);
  };
  const handleDeletePiece = (id) => {
    const target = String(id);
    setPieces((prev) => prev.filter((p) => String(p.id) !== target));
  };
  const handleDeleteMaterial = (id) => {
  setMaterials((prev) => prev.filter((m) => m.id !== id));
  };
  const handleDuplicateMaterial = (material) => {
    // Crear borrador de duplicado sin agregar aún; se agregará solo al guardar
    const duplicateDraft = {
      ...material,
      // sin id para indicar que es nuevo al guardar
      id: undefined,
      material: `${material.material} (copia)`,
      quantity: 1,
      price: 0,
      isDuplicateDraft: true,
    };
    setEditingMaterial(duplicateDraft);
  };
  const handleEditPiece = (id, updatedPiece) => {
    const target = String(id);
    setPieces((prev) =>
      prev.map((piece) => {
        if (String(piece.id) !== target) return piece;
        // Sanitizar cantidad
        const rawQty = Number(updatedPiece?.quantity);
        const nextQuantity = Number.isFinite(rawQty) && rawQty > 0 ? Math.floor(rawQty) : piece.quantity;
        // Si el usuario rotó manualmente (intercambió largo/ancho) y no envió edges nuevos,
        // rotamos también los cantos para que sigan el mismo lado físico.
        const isSwap =
          updatedPiece &&
          typeof updatedPiece.length !== 'undefined' &&
          typeof updatedPiece.width !== 'undefined' &&
          Number(updatedPiece.length) === Number(piece.width) &&
          Number(updatedPiece.width) === Number(piece.length);

        let edgesAfter = updatedPiece?.edges;
        if (!edgesAfter && isSwap) {
          const e = piece.edges || {};
          // Rotación 90° antihoraria (CCW) por defecto:
          // new.top = right, new.right = bottom, new.bottom = left, new.left = top
          edgesAfter = {
            arriba: e?.derecha ?? { enabled: false, tipo: null },
            derecha: e?.abajo ?? { enabled: false, tipo: null },
            abajo: e?.izquierda ?? { enabled: false, tipo: null },
            izquierda: e?.arriba ?? { enabled: false, tipo: null },
          };
        }

  // Importante: preservar el id original aunque updatedPiece no lo traiga
  const merged = { ...piece, ...updatedPiece, quantity: nextQuantity, ...(edgesAfter ? { edges: edgesAfter } : null), id: piece.id };
        const normalized = normalizePiece({ ...merged, largoMm: null, anchoMm: null }, config.units);
        return {
          ...merged,
          ...normalized,
          length: mmToUnits(normalized.largoMm, config.units),
          width: mmToUnits(normalized.anchoMm, config.units),
        };
      }),
    );
  };

  const handleDuplicatePiece = (piece) => {
    const baseLabel = (piece.label ?? piece.name ?? "Pieza").toString();
    const duplicateDraft = {
      ...piece,
      // sin id: se asignará al guardar
      id: undefined,
      label: `${baseLabel} (copia)`,
      quantity: 1,
      material: '',
      canRotate: true,
      edges: cloneEdges(defaultEdges),
      isDuplicateDraft: true,
    };
    // Abrir modal de edición con borrador (no agregado aún)
    setEditingPiece(duplicateDraft);
    // Asegurar foco en la pestaña de piezas
    setActiveTab("pieces");
  };
  const handleEditMaterial = (id, updatedMaterial) => {
  setMaterials((prev) => prev.map((material) => (material.id === id ? { ...material, ...updatedMaterial } : material)));
  };
  // Ejecuta la optimización con el algoritmo seleccionado (por ahora, guillotina)
  const handleOptimize = async () => {
    if (pieces.length === 0) {
      toast.error("Agrega al menos una pieza para optimizar");
      return;
    }
    if (materials.length === 0) {
      toast.error("Agrega al menos un material para optimizar");
      return;
    }
    setIsOptimizing(true);
    try {
  await optimize(pieces, materials, { ...config, algorithm: 'guillotine' });
      setActiveTab("patterns");
    // Sin auto-scroll: dejamos KPI visibles al cargar patrones
      toast.success("Optimizacion completada exitosamente");
    } catch {
      // Registrar error en consola para diagnóstico además del toast
      console.warn('optimize failed');
      toast.error('Error durante la optimizacion');
    } finally {
      setIsOptimizing(false);
    }
  };
  const totalPieces = pieces.reduce((sum, piece) => sum + piece.quantity, 0);
  const avgUsedM2 = (() => {
    const patterns = result?.patterns || [];
    if (!Array.isArray(patterns) || patterns.length === 0) return null;
    let totalUsedArea = 0;
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
    return areaToSquareMeters(avgArea, config.units);
  })();
  const wasteAmount = typeof result?.totalWaste === "number" ? result.totalWaste : null;
  const optimizedBoards = result?.patterns?.length ?? 0;
  const kpiItems = [
    {
      label: "Piezas registradas",
      value: totalPieces.toLocaleString(),
      subtitle: `${pieces.length} tipos cargados`,
      intent: "default",
    },
    {
      label: "Utilizacion promedio",
      value: avgUsedM2 !== null ? `${formatSquareMeters(avgUsedM2, 2)} m2` : "--",
      subtitle: result ? "Promedio m2 usados por hoja" : "Ejecuta la optimizacion",
      intent: "success",
    },
    {
      label: "Desperdicio total",
      value: (() => {
        if (wasteAmount === null) return "--";
        let wasteInSquareMeters;
        if (config.units === "cm") {
          wasteInSquareMeters = wasteAmount / 10000;
        } else if (config.units === "in") {
          wasteInSquareMeters = wasteAmount / 1550.003;
        } else {
          wasteInSquareMeters = wasteAmount / 1000000;
        }
        return `${wasteInSquareMeters.toFixed(2)} m2`;
      })(),
      subtitle: result ? "Area sin usar" : "Disponible tras optimizar",
      intent: "danger",
    },
    {
      label: "Tableros optimizados",
      value: optimizedBoards.toString(),
      subtitle: optimizedBoards > 0 ? "Patrones listos" : "Corre la optimizacion",
      intent: "default",
    },
  ];
  // Nota: getTabBadgeVariant no se usa actualmente; removido para evitar warning de lint

  return (
    <div className="min-h-screen bg-transparent text-[var(--text)] transition-colors flex flex-col relative">
      {/* Overlay de fondo fijo (solo pantalla) */}
      <div
        aria-hidden
        className="bg-overlay fixed inset-0 -z-10"
        style={{
          backgroundImage: `url(${fondoMetalica})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Oscurecedor removido a solicitud: la imagen de fondo se muestra sin sombreado */}
  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
    {/* Header eliminado: renderizamos TabsList directamente para borrar logo y botones del header */}
  <div ref={tabsBarRef} className="sticky top-0 z-50 bg-transparent relative isolate shadow-md">
          {/* Underlay fijo: replica el fondo bajo el header para que no se vea contenido detrás al hacer scroll */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              backgroundImage: `url(${fondoMetalica})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundAttachment: 'fixed',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div className={`${BASE_CONTAINER} pt-2`}>
            {/* Logo encima de la barra de tabs */}
            <div className="flex items-center py-2">
              <span
                className="group inline-flex items-center rounded-sm shadow-lg hover:shadow-xl transition-shadow duration-200 px-[1px] py-0 leading-none shrink-0 cursor-pointer"
                role="button"
                aria-label="Recargar"
                title="Recargar"
                tabIndex={0}
                onClick={() => window.location.reload()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.location.reload();
                  }
                }}
              >
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
                className="block h-20 sm:h-24 w-auto select-none transition-transform duration-200 ease-out will-change-transform group-hover:scale-105 group-hover:drop-shadow-lg"
                style={{ opacity: 0.7 }}
                draggable={false}
              />
              </span>
            </div>
          {/* Barra de historial/guardar removida a solicitud */}
          <TabsList className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-transparent p-1 text-sm text-[var(--muted)] overflow-x-auto no-scrollbar">
            <TabsTrigger
              value="home"
              onClick={() => {
                requestAnimationFrame(() => (document.scrollingElement || window).scrollTo({ top: 0, behavior: 'smooth' }));
              }}
              className="flex items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 font-medium transition text-[var(--text)] shadow-md hover:shadow-lg"
            >
              <Home className="h-4 w-4" />
              <span>Inicio</span>
            </TabsTrigger>
            <TabsTrigger
              value="pieces"
              onClick={() => {
                requestAnimationFrame(() => requestAnimationFrame(() => scrollToPieces()));
              }}
              className="flex items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 font-medium transition text-[var(--text)] shadow-md hover:shadow-lg"
            >
              <Square className="h-4 w-4" />
              <span>Piezas</span>
            </TabsTrigger>
            <TabsTrigger
              value="materials"
              onClick={() => {
                requestAnimationFrame(() => requestAnimationFrame(() => scrollToMaterials()));
              }}
              className="flex items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 font-medium transition text-[var(--text)] shadow-md hover:shadow-lg"
            >
              <Layers className="h-4 w-4" />
              <span>Materiales</span>
            </TabsTrigger>
            <TabsTrigger
              value="patterns"
              onClick={(e) => {
                // Evitar cambiar de pestaña automáticamente; controlamos flujo
                e.preventDefault();
                if (!isOptimizing) {
                  // En reposo: lanzar optimización; handleOptimize se encargará de ir a 'patterns' y hacer scroll
                  handleOptimize();
                } else {
                  // Si ya está optimizando, ir/centrar en la sección de patrones
                  setActiveTab("patterns");
                  requestAnimationFrame(() => requestAnimationFrame(() => scrollToPatterns()));
                }
              }}
              aria-label={isOptimizing ? "Patrones" : (optimizedBoards > 0 ? "Optimizar (hover: Patrones)" : "Optimizar")}
              className="group flex items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 font-medium transition text-[var(--text)] shadow-md hover:shadow-lg"
            >
              {isOptimizing || activeTab === "patterns" ? (
                <>
                  <Grid3X3 className="h-4 w-4" />
                  <span>Patrones</span>
                </>
              ) : optimizedBoards > 0 ? (
                // Hay patrones: en reposo mostrar "Optimizar" y en hover cambiar a "Patrones" con transición suave
                <>
                  <span className="relative grid place-items-center">
                    <Play className="h-4 w-4 transition-opacity duration-200 opacity-100 group-hover:opacity-0" />
                    <Grid3X3 className="h-4 w-4 absolute transition-opacity duration-200 opacity-0 group-hover:opacity-100" />
                  </span>
                  <span className="relative grid place-items-center">
                    <span className="transition-opacity duration-200 opacity-100 group-hover:opacity-0">Optimizar</span>
                    <span className="absolute transition-opacity duration-200 opacity-0 group-hover:opacity-100">Patrones</span>
                  </span>
                </>
              ) : (
                // No hay patrones aún: mostrar "Optimizar"
                <>
                  <Play className="h-4 w-4" />
                  <span>Optimizar</span>
                </>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="edgebanding"
              className="flex items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 font-medium transition text-[var(--text)] shadow-md hover:shadow-lg"
            >
              <Scissors className="h-4 w-4" />
              <span>Tapacantos</span>
            </TabsTrigger>
            <TabsTrigger
              value="budget"
              onClick={() => {
                requestAnimationFrame(() => requestAnimationFrame(() => scrollToBudget()));
              }}
              className="flex items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 font-medium transition text-[var(--text)] shadow-md hover:shadow-lg"
            >
              <Calculator className="h-4 w-4" />
              <span>Presupuesto</span>
            </TabsTrigger>
            {/* Acciones: Ayuda y Limpiar, ubicadas al costado derecho del botón Presupuesto */}
            <div className="flex items-center gap-2 pl-2">
              <button
                onClick={() => setShowInfoModal(true)}
                aria-label="Ayuda"
                title="Ayuda"
                className="inline-flex items-center justify-center rounded-[12px] border border-[var(--border)] text-[var(--text)] bg-white shadow-md hover:shadow-lg
                           h-[28px] w-[32px] sm:h-[32px] sm:w-[36px] hover:bg-white/90 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12" y2="17"></line>
                </svg>
              </button>
              <button
                onClick={() => setShowClearModal(true)}
                aria-label="Limpiar"
                title="Limpiar"
                className="inline-flex items-center justify-center rounded-[12px] border border-[var(--border)] text-[var(--text)] bg-white shadow-md hover:shadow-lg
                           h-[28px] w-[32px] sm:h-[32px] sm:w-[36px] hover:bg-white/90 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
            {/* Pestaña IA eliminada */}
          </TabsList>
          </div>
        </div>
        {/* Modal de historial removido de la interfaz actual */}
  <main className={`${BASE_CONTAINER} flex flex-col gap-8 py-3`}>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiItems.map((item) => (
              <KpiCard key={item.label} {...item} />
            ))}
          </section>

          {/* Tarjetas de entrada principales: ocultar en Patrones o mientras se optimiza */}
          {activeTab !== 'patterns' && activeTab !== 'budget' && activeTab !== 'edgebanding' && !isOptimizing && (
            <section className="grid gap-4">
              <MaterialForm
                onAddMaterial={handleAddMaterial}
                onRemoveMaterial={handleDeleteMaterial}
                units={config.units}
                kerfWidth={config.kerfWidth}
                margin={config.margin}
                materials={materials}
                onConfigChange={(newConfig) => setConfig((prev) => ({ ...prev, ...newConfig }))}
              />
              <PieceForm
                onAddPiece={handleAddPiece}
                onRemovePiece={handleDeletePiece}
                units={config.units}
                materials={materials}
                pieces={pieces}
                allowRotation={config.allowRotation}
                onToggleRotation={(value) => {
                  setConfig((prev) => ({ ...prev, allowRotation: value }));
                  // Ya no pisamos canRotate por pieza para respetar la elección local en el formulario/modal.
                }}
              />
            </section>
          )}

          {/* Sección principal: contenidos de cada pestaña */}
          <section className="space-y-6 w-full">
            <TabsContent value="home" className="space-y-4">
              <Card className="border-[var(--border)] bg-[var(--surface)] text-center shadow-[var(--shadow)]">
                <CardContent className="space-y-3 py-12">
                  <Home className="mx-auto h-12 w-12 text-[var(--muted)]" />
                  <h3 className="text-lg font-medium text-[var(--text)]">Bienvenido</h3>
                  <p className="text-sm text-[var(--muted)]">
                    Usa las pestañas para cargar piezas y materiales, optimizar, y preparar el presupuesto.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="pieces" className="space-y-4" id="pieces">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 ref={piecesHeaderRef} className="text-lg font-semibold text-[var(--text)]">Piezas a cortar</h2>
              </div>
              <PiecesTable
                pieces={pieces}
                units={config.units}
                materials={materials}
                onDelete={handleDeletePiece}
                onEdit={handleEditPiece}
                onEditRequest={setEditingPiece}
                onDuplicate={handleDuplicatePiece}
              />
            </TabsContent>

            <TabsContent value="materials" className="space-y-4" id="materials">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 ref={materialsHeaderRef} className="text-lg font-semibold text-[var(--text)]">Materiales disponibles</h2>
              </div>
              <MaterialsTable
                materials={materials}
                units={config.units}
                onDelete={handleDeleteMaterial}
                onEdit={handleEditMaterial}
                onEditRequest={setEditingMaterial}
                onDuplicate={handleDuplicateMaterial}
              />
            </TabsContent>

            <TabsContent value="patterns" className="space-y-4 scroll-mt-24" id="patterns">
              <div ref={patternsHeaderRef} className="h-0 scroll-mt-24" />
              {result && Array.isArray(result.patterns) && result.patterns.length > 0 && (
                <AdvancedCuttingPattern
                  patterns={result.patterns}
                  materials={materials}
                  units={config.units}
                  onExport={() => setShowExportModal(true)}
                />
              )}
              {(!result || (Array.isArray(result.patterns) && result.patterns.length === 0)) && (
                <Card className="border-[var(--border)] bg-[var(--surface)] text-center shadow-[var(--shadow)]">
                  <CardContent className="space-y-3 py-12">
                    <Grid3X3 className="mx-auto h-12 w-12 text-[var(--muted)]" />
                    <h3 className="text-lg font-medium text-[var(--text)]">No hay patrones generados</h3>
                    <p className="text-sm text-[var(--muted)]">
                      Carga piezas y materiales, luego ejecuta la optimizacion para visualizar patrones.
                    </p>
                    <Button onClick={handleOptimize} disabled={pieces.length === 0 || materials.length === 0} className="rounded-full">
                      <Play className="h-4 w-4" />
                      Optimizar cortes
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="edgebanding" className="space-y-4" id="edgebanding">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 ref={edgebandingHeaderRef} className="text-lg font-semibold text-[var(--text)]">Tapacantos</h2>
              </div>
              <EdgeBandingPanel pieces={pieces} units={config.units} onEditPiece={setEditingPiece} />
            </TabsContent>

            {/* Pestaña de estadísticas retirada a solicitud */}

            <TabsContent value="budget" className="space-y-4" id="budget">
              {/* Ancla invisible para scroll al encabezado de Presupuesto (el título visible vive dentro de BudgetPanel) */}
              <div ref={budgetHeaderRef} className="h-0 scroll-mt-24" />
              {result ? (
                <BudgetPanel result={result} pieces={pieces} materials={materials} units={config.units} />
              ) : (
                <Card className="border-[var(--border)] bg-[var(--surface)] text-center shadow-[var(--shadow)]">
                  <CardContent className="space-y-3 py-12">
                    <Calculator className="mx-auto h-12 w-12 text-[var(--muted)]" />
                    <h3 className="text-lg font-medium text-[var(--text)]">Presupuesto no disponible</h3>
                    <p className="text-sm text-[var(--muted)]">
                      Ejecuta la optimizacion para generar automaticamente un resumen de costos.
                    </p>
                    <Button onClick={handleOptimize} disabled={pieces.length === 0 || materials.length === 0}>
                      <Play className="h-4 w-4" />
                      Optimizar cortes
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Contenido de IA removido */}
          </section>

          {error && (
          <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
            <CardContent className="text-sm text-[var(--danger)]">
              <strong className="font-semibold">Error:</strong> {error}
            </CardContent>
          </Card>
          )}
        </main>
      </Tabs>

      {/* Footer global visible en todas las pestañas (no se imprime) */}
      <div className="no-print pb-6 flex items-center justify-center" style={{ marginTop: '20cm' }}>
        <img
          src={absoluteUrl('brand/industrial-plate/stencil_main.svg')}
          alt="Logo"
          style={{ opacity: 0.15, height: 96 }}
        />
      </div>

      {/* Modales */}
      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        result={result}
        pieces={pieces}
        materials={materials}
        config={config}
      />
      <PieceEditModal
        open={!!editingPiece}
        piece={editingPiece}
        units={config.units}
        materials={materials}
        onClose={() => setEditingPiece(null)}
        onSave={(data) => {
          if (!editingPiece) return;
          if (editingPiece.isDuplicateDraft) {
            const payload = { ...editingPiece, ...data };
            handleAddPiece(payload);
          } else {
            handleEditPiece(editingPiece.id, data);
          }
        }}
      />
      <MaterialEditModal
        open={!!editingMaterial}
        material={editingMaterial}
        units={config.units}
        onClose={() => setEditingMaterial(null)}
        onSave={(data) => {
          if (!editingMaterial) return;
          if (editingMaterial.isDuplicateDraft) {
            const payload = { ...editingMaterial, ...data };
            handleAddMaterial(payload);
          } else {
            handleEditMaterial(editingMaterial.id, data);
          }
        }}
      />

      {/* Modal nativo para limpiar datos */}
      <Dialog open={showClearModal} onOpenChange={setShowClearModal}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Limpiar datos</DialogTitle>
            <DialogDescription id="clear-data-desc" className="sr-only">
              Confirmación para limpiar piezas y materiales de la sesión actual.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-[var(--text)]">
            <p>Se eliminarán los datos de la sesión:</p>
            <ul className="list-disc pl-5">
              <li>Piezas</li>
              <li>Materiales</li>
            </ul>
            <p className="mt-2">Se conservarán:</p>
            <ul className="list-disc pl-5">
              <li>Presupuesto (Empresa/Cliente y listas)</li>
              <li>Configuración (unidades, kerf, margen)</li>
            </ul>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowClearModal(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleClearAll}>Limpiar</Button>
          </div>
        </DialogContent>
      </Dialog>
  </div>
  );
}

export default App;



