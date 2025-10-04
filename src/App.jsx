import { useEffect, useState, useRef, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Grid3X3, Play, Scissors, Calculator, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Header } from "./components/layout/Header";
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
import { AIDemo } from "./components/ai/AIDemo.jsx";
import { normalizePiece, toMillimeters, cloneEdges, defaultEdges } from "./types/pieces.js";
import { areaToSquareMeters, formatSquareMeters } from "./lib/format.js";
import { useOptimization } from "./hooks/useOptimization";
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
  const [activeTab, setActiveTab] = useState("pieces");
  useEffect(() => {
    setConfig((prev) => (prev.allowRotation ? prev : { ...prev, allowRotation: true }));
  }, [setConfig]);

  // Ajuste fino único para el scroll de anclaje (piezas y patrones)
  const SCROLL_FINE_TUNE = -36; // px (20px más arriba que antes)

  // Helper reutilizable para desplazar la vista al encabezado de Patrones
  const scrollToPatterns = useCallback(() => {
    const target = patternsHeaderRef.current;
    if (!target) return;
    const headerEl = document.querySelector('header');
    const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH + SCROLL_FINE_TUNE;
    (document.scrollingElement || window).scrollTo({ top, behavior: 'smooth' });
  }, [SCROLL_FINE_TUNE]);

  // Helper para desplazar la vista al encabezado de Piezas
  const scrollToPieces = useCallback(() => {
    const target = piecesHeaderRef.current;
    if (!target) return;
    const headerEl = document.querySelector('header');
    const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH + SCROLL_FINE_TUNE;
    (document.scrollingElement || window).scrollTo({ top, behavior: 'smooth' });
  }, [SCROLL_FINE_TUNE]);

  // Helper para desplazar la vista al encabezado de Tapacantos
  const scrollToEdgebanding = useCallback(() => {
    const target = edgebandingHeaderRef.current;
    if (!target) return;
    const headerEl = document.querySelector('header');
    const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH + SCROLL_FINE_TUNE;
    (document.scrollingElement || window).scrollTo({ top, behavior: 'smooth' });
  }, [SCROLL_FINE_TUNE]);

  // Helper para desplazar la vista al encabezado de Materiales
  const scrollToMaterials = useCallback(() => {
    const target = materialsHeaderRef.current;
    if (!target) return;
    const headerEl = document.querySelector('header');
    const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH + SCROLL_FINE_TUNE;
    (document.scrollingElement || window).scrollTo({ top, behavior: 'smooth' });
  }, [SCROLL_FINE_TUNE]);

  // Helper para desplazar la vista al encabezado de Presupuesto
  const scrollToBudget = useCallback(() => {
    const target = budgetHeaderRef.current;
    if (!target) return;
    const headerEl = document.querySelector('header');
    const headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH + SCROLL_FINE_TUNE;
    (document.scrollingElement || window).scrollTo({ top, behavior: 'smooth' });
  }, [SCROLL_FINE_TUNE]);

  // Al activar la pestaña de patrones, desplazamos suavemente hasta el encabezado "Patrones de corte"
  useEffect(() => {
    if (activeTab !== "patterns") return;
    // Usar doble RAF para asegurar que Radix Tabs montó el contenido visible
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToPatterns()));
  }, [activeTab, scrollToPatterns]);

  // Al activar la pestaña de piezas, desplazamos al encabezado "Piezas a cortar"
  useEffect(() => {
    if (activeTab !== "pieces") return;
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToPieces()));
  }, [activeTab, scrollToPieces]);

  // Al activar la pestaña de tapacantos, desplazamos al encabezado "Tapacantos"
  useEffect(() => {
    if (activeTab !== "edgebanding") return;
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToEdgebanding()));
  }, [activeTab, scrollToEdgebanding]);

  // Al activar la pestaña de materiales, desplazamos al encabezado "Materiales disponibles"
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
  const { result, optimize, error } = useOptimization();
  const efficiencyFactor = 0.9;
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
    // Remover flags temporales (e.g., duplicado en borrador) y cualquier id previo
    const { isDuplicateDraft: _dup, id: _oldId, ...clean } = piece || {};
    const normalized = normalizePiece(clean, config.units);
    const newPiece = {
      ...clean,
      ...normalized,
      id: Date.now() + Math.random(),
      color: "hsl(" + Math.random() * 360 + ", 70%, 60%)",
      length: mmToUnits(normalized.largoMm, config.units),
      width: mmToUnits(normalized.anchoMm, config.units),
    };
    setPieces((prev) => [...prev, newPiece]);
  };
  const handleAddMaterial = (material) => {
    // Remover flags temporales y cualquier id previo en duplicados
    const { isDuplicateDraft: _dup, id: _oldId, ...clean } = material || {};
    const newMaterial = {
      ...clean,
      id: Date.now() + Math.random(),
    };
    setMaterials((prev) => [...prev, newMaterial]);
  };
  const handleDeletePiece = (id) => {
    setPieces((prev) => prev.filter((p) => p.id !== id));
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
    setPieces((prev) =>
      prev.map((piece) => {
        if (piece.id !== id) return piece;
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

        const merged = { ...piece, ...updatedPiece, ...(edgesAfter ? { edges: edgesAfter } : null) };
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
      // Desplazar tras activar 'patterns' (esperar al render con un frame)
      requestAnimationFrame(() => scrollToPatterns());
      toast.success("Optimizacion completada exitosamente");
    } catch (err) {
      toast.error(`Error durante la optimizacion: ${err.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };
  const toggleUnits = () => {
    setConfig((prev) => {
      const from = prev.units;
      const to = from === "mm" ? "cm" : "mm";
      const factor = from === "mm" && to === "cm" ? 0.1 : 10;
      setPieces((current) =>
        current.map((piece) => ({
          ...piece,
          length: Number((piece.length * factor).toFixed(3)),
          width: Number((piece.width * factor).toFixed(3)),
        })),
      );
      setMaterials((current) =>
        current.map((material) => ({
          ...material,
          length: Number((material.length * factor).toFixed(3)),
          width: Number((material.width * factor).toFixed(3)),
          kerf: Number((material.kerf * factor).toFixed(3)),
          margin: Number((material.margin * factor).toFixed(3)),
        })),
      );
      return {
        ...prev,
        units: to,
        kerfWidth: Number((prev.kerfWidth * factor).toFixed(3)),
        margin: Number((prev.margin * factor).toFixed(3)),
      };
    });
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <Header
          onShowInfo={() => setShowInfoModal(true)}
          onToggleUnits={toggleUnits}
          onOptimize={handleOptimize}
          canOptimize={pieces.length > 0 && materials.length > 0}
          isOptimizing={isOptimizing}
          units={config.units}
          tabsBar={
            <>
              <TabsList className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-1 text-sm text-[var(--muted)] overflow-x-auto no-scrollbar">
                <TabsTrigger
                  value="pieces"
                  onClick={() => {
                    requestAnimationFrame(() => requestAnimationFrame(() => scrollToPieces()));
                  }}
                  className="flex items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 font-medium transition data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white"
                >
                  <span>Piezas</span>
                </TabsTrigger>
                <TabsTrigger
                  value="materials"
                  onClick={() => {
                    requestAnimationFrame(() => requestAnimationFrame(() => scrollToMaterials()));
                  }}
                  className="flex items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 font-medium transition data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white"
                >
                  <span>Materiales</span>
                </TabsTrigger>
                <TabsTrigger
                  value="patterns"
                  onClick={() => {
                    // Forzar desplazamiento tras el cambio de pestaña (doble RAF)
                    requestAnimationFrame(() => requestAnimationFrame(() => scrollToPatterns()));
                  }}
                  className="flex items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 font-medium transition data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white"
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span>Patrones</span>
                </TabsTrigger>
                <TabsTrigger
                  value="edgebanding"
                  onClick={() => {
                    requestAnimationFrame(() => requestAnimationFrame(() => scrollToEdgebanding()));
                  }}
                  className="flex items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 font-medium transition data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white"
                >
                  <Scissors className="h-4 w-4" />
                  <span>Tapacantos</span>
                </TabsTrigger>
                <TabsTrigger
                  value="budget"
                  onClick={() => {
                    requestAnimationFrame(() => requestAnimationFrame(() => scrollToBudget()));
                  }}
                  className="flex items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 font-medium transition data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white"
                >
                  <Calculator className="h-4 w-4" />
                  <span>Presupuesto</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 font-medium transition data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white"><BarChart3 className="h-4 w-4" /><span>IA</span></TabsTrigger>
              </TabsList>
              {/* sin botón extra aquí: exportar volverá al contenido de Patrones */}
            </>
          }
        />
        <main className="mx-auto flex max-w-5xl flex-col gap-8 px-2 py-3 sm:px-4 lg:px-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiItems.map((item) => (
              <KpiCard key={item.label} {...item} />
            ))}
          </section>

          {/* Tarjetas de entrada principales: Agregar material (arriba) y Agregar pieza (abajo) */}
          <section className="grid gap-4">
            <MaterialForm
              onAddMaterial={handleAddMaterial}
              units={config.units}
              kerfWidth={config.kerfWidth}
              margin={config.margin}
              onConfigChange={(newConfig) => setConfig((prev) => ({ ...prev, ...newConfig }))}
            />
            <PieceForm
              onAddPiece={handleAddPiece}
              units={config.units}
              materials={materials}
              allowRotation={config.allowRotation}
              onToggleRotation={(value) => {
                setConfig((prev) => ({ ...prev, allowRotation: value }));
                // Ya no pisamos canRotate por pieza para respetar la elección local en el formulario/modal.
              }}
            />
          </section>

          {/* Sección principal: contenidos de cada pestaña */}
          <section className="space-y-6 w-full">
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

            <TabsContent value="ai" className="space-y-4">
              <AIDemo pieces={pieces} materials={materials} config={config} />
            </TabsContent>
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
    </div>
  );
}

export default App;



