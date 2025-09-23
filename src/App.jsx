import { useEffect, useState } from "react";



import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";



import { Button } from "@/components/ui/button";



import { Badge } from "@/components/ui/badge";



import { Card, CardContent } from "@/components/ui/card";



import { Download, Grid3X3, Play, Scissors, TrendingUp, Calculator, BarChart3 } from "lucide-react";







import { Header } from "./components/layout/Header";



import { PieceForm } from "./components/forms/PieceForm";



import { MaterialForm } from "./components/forms/MaterialForm";



import { PiecesTable } from "./components/tables/PiecesTable";



import { MaterialsTable } from "./components/tables/MaterialsTable";



import { AdvancedCuttingPattern } from "./components/visualization/AdvancedCuttingPattern";



import { StatsPanel } from "./components/visualization/StatsPanel";



import { KpiCard } from "./components/KpiCard.jsx";

import { PatternSkeleton } from "./components/skeletons/PatternSkeleton.jsx";

import { StatsSkeleton } from "./components/skeletons/StatsSkeleton.jsx";



import { PieceEditModal } from "./components/modals/PieceEditModal";



import { MaterialEditModal } from "./components/modals/MaterialEditModal";



import { InfoModal } from "./components/common/InfoModal";



import { ExportModal } from "./components/common/ExportModal";



import { EdgeBandingPanel } from "./features/edgebanding/EdgeBandingPanel.jsx";



import { normalizePiece } from "./types/pieces.js";



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







function App() {



  const [pieces, setPieces] = useLocalStorage("cutting-pieces", []);



  const [materials, setMaterials] = useLocalStorage("cutting-materials", []);



  const [config, setConfig] = useLocalStorage("cutting-config", {



    units: "cm",



    kerfWidth: 3,



    margin: 5,



    allowRotation: true,



  });







  const [activeTab, setActiveTab] = useState("pieces");



  const [showInfoModal, setShowInfoModal] = useState(false);



  const [showExportModal, setShowExportModal] = useState(false);



  const [isOptimizing, setIsOptimizing] = useState(false);



  const [editingPiece, setEditingPiece] = useState(null);



  const [editingMaterial, setEditingMaterial] = useState(null);







  const { result, optimize, error } = useOptimization();







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







  const handleAddPiece = (piece) => {



    const normalized = normalizePiece(piece, config.units);



    const newPiece = {



      ...piece,



      ...normalized,



      id: Date.now() + Math.random(),



      color: `hsl(${Math.random() * 360}, 70%, 60%)`,



      length: mmToUnits(normalized.largoMm, config.units),



      width: mmToUnits(normalized.anchoMm, config.units),



    };



    setPieces((prev) => [...prev, newPiece]);



  };







  const handleAddMaterial = (material) => {



    const newMaterial = {



      ...material,



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







  const handleEditPiece = (id, updatedPiece) => {



    setPieces((prev) =>



      prev.map((piece) => {



        if (piece.id !== id) return piece;



        const merged = { ...piece, ...updatedPiece };



        const normalized = normalizePiece(merged, config.units);



        return {



          ...piece,



          ...normalized,



          length: mmToUnits(normalized.largoMm, config.units),



          width: mmToUnits(normalized.anchoMm, config.units),



        };



      }),



    );



  };







  const handleEditMaterial = (id, updatedMaterial) => {



    setMaterials((prev) => prev.map((material) => (material.id === id ? { ...material, ...updatedMaterial } : material)));



  };







  const handleOptimize = async () => {



    if (pieces.length === 0) {



      alert("Agrega al menos una pieza para optimizar");



      return;



    }



    if (materials.length === 0) {



      alert("Agrega al menos un material para optimizar");



      return;



    }



    setIsOptimizing(true);



    try {



      await optimize(pieces, materials, config);



      setActiveTab("patterns");



    } catch (err) {



      alert(`Error durante la optimización: ${err.message}`);



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







  const handleExportPattern = (pattern, index) => {



    console.log("Exportando patrÃ³n:", pattern, index);



  };







  const totalPieces = pieces.reduce((sum, piece) => sum + piece.quantity, 0);



  const totalArea = pieces.reduce((sum, piece) => sum + piece.length * piece.width * piece.quantity, 0);



  const totalMaterials = materials.reduce((sum, material) => sum + material.quantity, 0);



  const utilization = typeof result?.totalUtilization === "number" ? result.totalUtilization : null;



  const wasteAmount = typeof result?.totalWaste === "number" ? result.totalWaste : null;



  const optimizedBoards = result?.patterns?.length ?? 0;



  const kerfDisplay = `${Number(config.kerfWidth ?? 0).toFixed(2)} ${config.units}`;



  const marginDisplay = `${Number(config.margin ?? 0).toFixed(2)} ${config.units}`;







  const kpiItems = [



    {



      label: "Piezas registradas",



      value: totalPieces.toLocaleString(),



      subtitle: `${pieces.length} tipos cargados`,



      intent: "default",

    },

    {



      label: "UtilizaciÃ³n promedio",



      value: utilization !== null ? `${utilization.toFixed(1)} %` : "--",



      subtitle: result ? "Promedio sobre tableros optimizados" : "Ejecuta la optimización",



      intent: "success",

    },

    {



      label: "Desperdicio total",



      value: wasteAmount !== null ? `${wasteAmount.toLocaleString()} ${config.units}Â²` : "--",



      subtitle: result ? "Ãrea sin usar" : "Disponible tras optimizar",



      intent: "danger",

    },

    {



      label: "Grosor / Margen",



      value: kerfDisplay,



      subtitle: `Margen ${marginDisplay}`,



      intent: "default",

    },

    {



      label: "Tableros optimizados",



      value: optimizedBoards.toString(),



      subtitle: optimizedBoards > 0 ? "Patrones listos" : "Corre la optimización",



      intent: "default",



    },

  ];







  const getTabBadgeVariant = (tab) => {



    switch (tab) {



      case "pieces":



        return pieces.length > 0 ? "default" : "secondary";



      case "materials":



        return materials.length > 0 ? "default" : "secondary";



      case "patterns":



        return result?.patterns?.length > 0 ? "default" : "secondary";



      case "stats":



        return result ? "default" : "secondary";



      default:



        return "secondary";



    }



  };







  return (



    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">



      <Header



        onShowInfo={() => setShowInfoModal(true)}



        onToggleUnits={toggleUnits}



        onOptimize={handleOptimize}



        canOptimize={pieces.length > 0 && materials.length > 0}



        isOptimizing={isOptimizing}



        units={config.units}



      />







      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 lg:px-6">



        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">



          {kpiItems.map((item) => (



            <KpiCard key={item.label} {...item} />



          ))}



        </section>







        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">



          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">



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



              onToggleRotation={(value) => setConfig((prev) => ({ ...prev, allowRotation: value }))}



            />



            <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">



              <CardContent className="space-y-4 p-5 text-sm text-[var(--muted)]">



                <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--text)]">



                  <Calculator className="h-5 w-5 text-[var(--primary)]" />



                  Panel de optimización



                </h3>



                <p>



                  Usa el botÃ³n â€œOptimizarâ€ en la barra superior para generar patrones. Cada tablero utiliza su propio grosor de sierra y margen.



                </p>



                <div className="flex items-center justify-between text-xs">



                  <span>RotaciÃ³n global</span>



                  <span className="font-medium text-[var(--text)]">{config.allowRotation ? "Permitida" : "Bloqueada"}</span>



                </div>



                <div className="space-y-1 text-xs">



                  <div>



                    Piezas totales: <strong>{totalPieces}</strong> ({pieces.length} tipos)



                  </div>



                  <div>



                    Materiales cargados: <strong>{totalMaterials}</strong> ({materials.length} variantes)



                  </div>



                </div>



              </CardContent>



            </Card>



          </aside>







          <section className="space-y-6">



            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">



              <TabsList className="grid gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-1 text-sm text-[var(--muted)] sm:grid-cols-2 lg:grid-cols-5">



                <TabsTrigger value="pieces" className="flex items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 font-medium transition data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white">



                  <span>Piezas</span>



                  <Badge variant={getTabBadgeVariant("pieces")} className="ml-1">



                    {pieces.length}



                  </Badge>



                </TabsTrigger>



                <TabsTrigger value="materials" className="flex items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 font-medium transition data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white">



                  <span>Materiales</span>



                  <Badge variant={getTabBadgeVariant("materials")} className="ml-1">



                    {materials.length}



                  </Badge>



                </TabsTrigger>



                <TabsTrigger value="patterns" className="flex items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 font-medium transition data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white">



                  <Grid3X3 className="h-4 w-4" />



                  <span>Patrones</span>



                  <Badge variant={getTabBadgeVariant("patterns")} className="ml-1">



                    {result?.patterns?.length || 0}



                  </Badge>



                </TabsTrigger>



                <TabsTrigger value="edgebanding" className="flex items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 font-medium transition data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white">



                  <Scissors className="h-4 w-4" />



                  <span>Tapacantos</span>



                </TabsTrigger>



                <TabsTrigger value="stats" className="flex items-center justify-center gap-2 rounded-[var(--radius)] px-3 py-2 font-medium transition data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white">



                  <BarChart3 className="h-4 w-4" />



                  <span>Estadísticas</span>



                  <Badge variant={getTabBadgeVariant("stats")} className="ml-1">



                    {result ? "Listo" : "--"}



                  </Badge>



                </TabsTrigger>



              </TabsList>







              <TabsContent value="pieces" className="space-y-4">



                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">



                  <h2 className="text-lg font-semibold text-[var(--text)]">Piezas a cortar</h2>



                  {pieces.length > 0 && (



                    <span className="text-sm text-[var(--muted)]">



                      Total: {totalPieces} piezas Â· Ãrea combinada: {totalArea.toLocaleString()} {config.units}Â²



                    </span>



                  )}



                </div>



                <PiecesTable



                  pieces={pieces}



                  units={config.units}



                  materials={materials}



                  onDelete={handleDeletePiece}



                  onEdit={handleEditPiece}



                  onEditRequest={setEditingPiece}



                />



              </TabsContent>







              <TabsContent value="materials" className="space-y-4">



                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">



                  <h2 className="text-lg font-semibold text-[var(--text)]">Materiales disponibles</h2>



                  {materials.length > 0 && (



                    <span className="text-sm text-[var(--muted)]">Total: {totalMaterials} tableros</span>



                  )}



                </div>



                <MaterialsTable



                  materials={materials}



                  units={config.units}



                  onDelete={handleDeleteMaterial}



                  onEdit={handleEditMaterial}



                  onEditRequest={setEditingMaterial}



                />



              </TabsContent>







              <TabsContent value="patterns" className="space-y-4">



                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">



                  <h2 className="text-lg font-semibold text-[var(--text)]">Patrones de corte</h2>



                  {result && (



                    <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)} className="border-[var(--border)] text-[var(--text)]">



                      <Download className="h-4 w-4" />



                      Exportar



                    </Button>



                  )}



                </div>



                {result?.patterns ? (



                  <AdvancedCuttingPattern



                    patterns={result.patterns}



                    units={config.units}



                    onExportPattern={handleExportPattern}



                  />



                ) : (



                  <Card className="border-[var(--border)] bg-[var(--surface)] text-center shadow-[var(--shadow)]">



                    <CardContent className="space-y-3 py-12">



                      <Grid3X3 className="mx-auto h-12 w-12 text-[var(--muted)]" />



                      <h3 className="text-lg font-medium text-[var(--text)]">No hay patrones generados</h3>



                      <p className="text-sm text-[var(--muted)]">



                        Carga piezas y materiales, luego ejecuta la optimización para visualizar patrones.



                      </p>



                      <Button onClick={handleOptimize} disabled={pieces.length === 0 || materials.length === 0}>



                        <Play className="h-4 w-4" />



                        Optimizar cortes



                      </Button>



                    </CardContent>



                  </Card>



                )}



              </TabsContent>







              <TabsContent value="edgebanding">



                <EdgeBandingPanel pieces={pieces} />



              </TabsContent>







              <TabsContent value="stats" className="space-y-4">



                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">



                  <h2 className="text-lg font-semibold text-[var(--text)]">Estadísticas de optimización</h2>



                  {result && (



                    <Badge variant="outline" className="border-[var(--border)] text-[var(--muted)]">



                      {result.algorithm}



                    </Badge>



                  )}



                </div>



                {result ? (



                  <StatsPanel result={result} pieces={pieces} materials={materials} config={config} />



                ) : (



                  <Card className="border-[var(--border)] bg-[var(--surface)] text-center shadow-[var(--shadow)]">



                    <CardContent className="space-y-3 py-12">



                      <TrendingUp className="mx-auto h-12 w-12 text-[var(--muted)]" />



                      <h3 className="text-lg font-medium text-[var(--text)]">Sin estadÃ­sticas todavÃ­a</h3>



                      <p className="text-sm text-[var(--muted)]">



                        Ejecuta la optimización para analizar el uso de materiales y el desperdicio.



                      </p>



                      <Button onClick={handleOptimize} disabled={pieces.length === 0 || materials.length === 0}>



                        <Calculator className="h-4 w-4" />



                        Generar estadÃ­sticas



                      </Button>



                    </CardContent>



                  </Card>



                )}



              </TabsContent>



            </Tabs>



          </section>



        </div>







        {error && (



          <Card className="border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">



            <CardContent className="text-sm text-[var(--danger)]">



              <strong className="font-semibold">Error:</strong> {error}



            </CardContent>



          </Card>



        )}



      </main>







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



        onSave={(data) => editingPiece && handleEditPiece(editingPiece.id, data)}



      />



      <MaterialEditModal



        open={!!editingMaterial}



        material={editingMaterial}



        units={config.units}



        onClose={() => setEditingMaterial(null)}



        onSave={(data) => editingMaterial && handleEditMaterial(editingMaterial.id, data)}



      />



    </div>



  );



}







export default App;



