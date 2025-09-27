import { Book, Lightbulb, Settings, Zap, Target, Calculator } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const InfoModal = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Book className="h-6 w-6" />
            <span>Optimizador de Cortes de Melamina - Guía Completa</span>
            <Badge variant="outline">v1.0 Pro</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="guide" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="guide">Guía de Uso</TabsTrigger>
            <TabsTrigger value="features">Características</TabsTrigger>
            <TabsTrigger value="tips">Consejos</TabsTrigger>
            <TabsTrigger value="about">Acerca de</TabsTrigger>
          </TabsList>

          <TabsContent value="guide" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>¿Cómo usar la aplicación?</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-[var(--primary)] text-[var(--surface)] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <h4 className="font-medium text-[var(--text)]">Agregar Piezas</h4>
                      <p className="text-sm text-[var(--muted)]">
                        Usa el formulario "Agregar Pieza" para introducir las dimensiones, cantidad y etiqueta de cada pieza que necesitas cortar.
                        Puedes especificar si la pieza puede rotarse para optimizar el corte.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-[var(--primary)] text-[var(--surface)] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <h4 className="font-medium text-[var(--text)]">Agregar Materiales</h4>
                      <p className="text-sm text-[var(--muted)]">
                        Define los tableros disponibles usando el formulario "Agregar Material". Puedes usar los presets comunes o introducir dimensiones personalizadas.
                        Incluye el precio para calcular costos automáticamente.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-[var(--primary)] text-[var(--surface)] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <h4 className="font-medium text-[var(--text)]">Configurar Parámetros</h4>
                      <p className="text-sm text-[var(--muted)]">
                        Ajusta el grosor de sierra (kerf) y márgenes según tu equipo de corte. Estos parámetros afectan la precisión de la optimización.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-[var(--primary)] text-[var(--surface)] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <h4 className="font-medium text-[var(--text)]">Optimizar</h4>
                      <p className="text-sm text-[var(--muted)]">
                        Haz clic en "Optimizar Cortes" para generar los patrones de corte. El algoritmo calculará la mejor distribución para minimizar el desperdicio.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-[var(--primary)] text-[var(--surface)] rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</div>
                    <div>
                      <h4 className="font-medium text-[var(--text)]">Revisar Resultados</h4>
                      <p className="text-sm text-[var(--muted)]">
                        Explora las pestañas "Patrones" y "Estadísticas" para ver los resultados. Puedes navegar entre diferentes hojas y exportar los datos.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5" />
                    <span>Algoritmo Avanzado</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Algoritmo Best Fit Decreasing optimizado</li>
                    <li>• Soporte para rotación automática de piezas</li>
                    <li>• Consideración de grosor de sierra y márgenes</li>
                    <li>• Optimización multi-objetivo (desperdicio vs costo)</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Interfaz Moderna</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Diseño responsive para todos los dispositivos</li>
                    <li>• Visualización interactiva de patrones 2D</li>
                    <li>• Navegación intuitiva entre resultados</li>
                    <li>• Feedback visual en tiempo real</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Gestión de Datos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Persistencia automática en navegador</li>
                    <li>• Importación/exportación de proyectos</li>
                    <li>• Presets de tableros comunes</li>
                    <li>• Validación inteligente de datos</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Book className="h-5 w-5" />
                    <span>Reportes y Exportación</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Reportes detallados en HTML/PDF</li>
                    <li>• Exportación de datos en CSV</li>
                    <li>• Imágenes de patrones de corte</li>
                    <li>• Estadísticas de utilización y costos</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tips" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>Consejos para Mejores Resultados</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-[var(--success)] mb-2">✅ Mejores Prácticas</h4>
                  <ul className="space-y-1 text-sm text-[var(--text)]">
                    <li>• <strong>Permite la rotación</strong> cuando sea posible para mayor eficiencia</li>
                    <li>• <strong>Agrupa piezas similares</strong> para reducir el número de tableros</li>
                    <li>• <strong>Usa etiquetas descriptivas</strong> para identificar fácilmente las piezas</li>
                    <li>• <strong>Configura correctamente el kerf</strong> según tu sierra (típicamente 3-4mm)</li>
                    <li>• <strong>Considera márgenes de seguridad</strong> apropiados (5-10mm)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[var(--warning)] mb-2">⚠️ Consideraciones Importantes</h4>
                  <ul className="space-y-1 text-sm text-[var(--text)]">
                    <li>• Verifica que las dimensiones de corte sean factibles en tu equipo</li>
                    <li>• Ten en cuenta la dirección de la veta para materiales como melamina</li>
                    <li>• Considera el orden de corte para evitar piezas inestables</li>
                    <li>• Revisa la utilización: menos del 60% indica posible mejora</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-[var(--primary)] mb-2">💡 Trucos Avanzados</h4>
                  <ul className="space-y-1 text-sm text-[var(--text)]">
                    <li>• Usa tableros de diferentes tamaños para optimizar costos</li>
                    <li>• Agrupa proyectos pequeños para aprovechar mejor el material</li>
                    <li>• Guarda configuraciones frecuentes como presets personalizados</li>
                    <li>• Exporta los patrones como imágenes para referencia en el taller</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Optimizador de Cortes de Melamina v1.0 Pro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-[var(--text)]">Acerca de esta aplicación</h4>
                  <p className="text-sm text-[var(--muted)]">
                    Esta aplicación web profesional está diseñada para optimizar el corte de tableros de melamina y otros materiales en láminas.
                    Utiliza algoritmos avanzados de optimización para minimizar el desperdicio de material y reducir costos.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-[var(--text)]">Tecnologías utilizadas</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">React</Badge>
                    <Badge variant="outline">TypeScript</Badge>
                    <Badge variant="outline">Tailwind CSS</Badge>
                    <Badge variant="outline">Shadcn/ui</Badge>
                    <Badge variant="outline">Vite</Badge>
                    <Badge variant="outline">Algoritmos de Optimización</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-[var(--text)]">Características técnicas</h4>
                  <ul className="space-y-1 text-sm text-[var(--muted)]">
                    <li>• Algoritmo Best Fit Decreasing con optimizaciones personalizadas</li>
                    <li>• Visualización SVG interactiva de patrones de corte</li>
                    <li>• Persistencia de datos en localStorage del navegador</li>
                    <li>• Diseño responsive compatible con dispositivos móviles</li>
                    <li>• Exportación múltiple de formatos (HTML, CSV, PNG)</li>
                  </ul>
                </div>

                <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/20 p-4 rounded-lg">
                  <h4 className="font-medium text-[var(--primary)] mb-2">Ventajas sobre Cutting Optimization Pro</h4>
                  <ul className="space-y-1 text-sm text-[var(--text)]">
                    <li>✅ Interfaz web moderna y responsive</li>
                    <li>✅ No requiere instalación de software</li>
                    <li>✅ Visualización interactiva mejorada</li>
                    <li>✅ Exportación múltiple de formatos</li>
                    <li>✅ Persistencia automática de datos</li>
                    <li>✅ Cálculo automático de costos</li>
                    <li>✅ Recomendaciones inteligentes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

