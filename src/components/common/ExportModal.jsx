import { useState } from 'react';
import { Download, FileText, Image, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

export const ExportModal = ({ isOpen, onClose, result, pieces, materials, config }) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      // Crear contenido HTML para el PDF
      const htmlContent = generateReportHTML(result, pieces, materials, config);
      
      // Crear un blob con el contenido HTML
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Crear enlace de descarga
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-optimizacion-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error al exportar PDF: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const csvContent = generateCSVContent(result, pieces, materials);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `datos-optimizacion-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error al exportar CSV: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToImage = async () => {
    setIsExporting(true);
    try {
      // Buscar el SVG de visualización
      const svgElement = document.querySelector('svg');
      if (!svgElement) {
        throw new Error('No se encontró la visualización para exportar');
      }

      // Crear canvas y convertir SVG a imagen
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `patron-corte-${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);
          URL.revokeObjectURL(url);
          setIsExporting(false);
        });
      };
      img.src = url;
    } catch (error) {
      alert('Error al exportar imagen: ' + error.message);
      setIsExporting(false);
    }
  };

  const generateReportHTML = (result, pieces, materials, config) => {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Optimización de Cortes</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f5f5f5; }
        .pattern { margin-bottom: 20px; }
        .pattern-header { background-color: #f0f9ff; padding: 10px; border-radius: 4px; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Reporte de Optimización de Cortes</h1>
        <p>Generado el ${new Date().toLocaleDateString('es-ES')}</p>
        <p>Algoritmo: ${result.algorithm}</p>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-value">${result.materialsUsed}</div>
            <div>Tableros Usados</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${result.totalUtilization.toFixed(1)}%</div>
            <div>Utilización</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${result.totalWaste.toLocaleString()}</div>
            <div>Desperdicio (${config.units}²)</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">$${result.totalCost.toFixed(2)}</div>
            <div>Costo Total</div>
        </div>
    </div>

    <h2>Piezas Solicitadas</h2>
    <table class="table">
        <thead>
            <tr>
                <th>Etiqueta</th>
                <th>Largo (${config.units})</th>
                <th>Ancho (${config.units})</th>
                <th>Cantidad</th>
                <th>Material</th>
                <th>Área (${config.units}²)</th>
            </tr>
        </thead>
        <tbody>
            ${pieces.map(piece => `
                <tr>
                    <td>${piece.label}</td>
                    <td>${piece.length}</td>
                    <td>${piece.width}</td>
                    <td>${piece.quantity}</td>
                    <td>${piece.material}</td>
                    <td>${(piece.length * piece.width * piece.quantity).toLocaleString()}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <h2>Materiales Utilizados</h2>
    <table class="table">
        <thead>
            <tr>
                <th>Material</th>
                <th>Largo (${config.units})</th>
                <th>Ancho (${config.units})</th>
                <th>Precio ($)</th>
                <th>Utilización (%)</th>
            </tr>
        </thead>
        <tbody>
            ${result.patterns.map((pattern) => {
              const material = materials.find(m => m.id === pattern.materialId);
              return `
                <tr>
                    <td>${material?.material || 'N/A'}</td>
                    <td>${pattern.materialLength}</td>
                    <td>${pattern.materialWidth}</td>
                    <td>$${pattern.cost.toFixed(2)}</td>
                    <td>${pattern.utilization.toFixed(1)}%</td>
                </tr>
              `;
            }).join('')}
        </tbody>
    </table>

    <h2>Patrones de Corte</h2>
    ${result.patterns.map((pattern, index) => `
        <div class="pattern">
            <div class="pattern-header">
                <strong>Hoja ${index + 1}</strong> - 
                ${pattern.materialLength} × ${pattern.materialWidth} ${config.units} - 
                Utilización: ${pattern.utilization.toFixed(1)}% - 
                ${pattern.pieces.length} piezas
            </div>
            <table class="table">
                <thead>
                    <tr>
                        <th>Pieza</th>
                        <th>Posición X</th>
                        <th>Posición Y</th>
                        <th>Ancho</th>
                        <th>Alto</th>
                        <th>Rotado</th>
                    </tr>
                </thead>
                <tbody>
                    ${pattern.pieces.map(piece => `
                        <tr>
                            <td>${piece.label}</td>
                            <td>${piece.x}</td>
                            <td>${piece.y}</td>
                            <td>${piece.width}</td>
                            <td>${piece.height}</td>
                            <td>${piece.rotated ? 'Sí' : 'No'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `).join('')}

    <div style="margin-top: 40px; text-align: center; color: #666;">
        <p>Generado por Optimizador de Cortes de Melamina v1.0</p>
    </div>
</body>
</html>
    `;
  };

  const generateCSVContent = (result, pieces, materials) => {
    let csv = 'Tipo,Etiqueta,Largo,Ancho,Cantidad,Material,Precio,Posicion_X,Posicion_Y,Rotado,Hoja\n';
    
    // Agregar piezas originales
    pieces.forEach(piece => {
      csv += `Pieza,"${piece.label}",${piece.length},${piece.width},${piece.quantity},"${piece.material}",,,,,\n`;
    });
    
    // Agregar materiales
    materials.forEach(material => {
      csv += `Material,"${material.material}",${material.length},${material.width},${material.quantity},"${material.material}",${material.price},,,,\n`;
    });
    
    // Agregar patrones de corte
    result.patterns.forEach((pattern, patternIndex) => {
      pattern.pieces.forEach(piece => {
        csv += `Corte,"${piece.label}",${piece.width},${piece.height},1,,${pattern.cost},${piece.x},${piece.y},${piece.rotated ? 'Si' : 'No'},${patternIndex + 1}\n`;
      });
    });
    
    return csv;
  };

  if (!result) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Resultados</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card className="cursor-pointer hover:bg-gray-50" onClick={exportToPDF}>
            <CardContent className="flex items-center space-x-4 p-4">
              <FileText className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="font-medium">Reporte PDF/HTML</h3>
                <p className="text-sm text-gray-600">Reporte completo con estadísticas y patrones</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50" onClick={exportToCSV}>
            <CardContent className="flex items-center space-x-4 p-4">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-medium">Datos CSV</h3>
                <p className="text-sm text-gray-600">Datos estructurados para análisis</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-gray-50" onClick={exportToImage}>
            <CardContent className="flex items-center space-x-4 p-4">
              <Image className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-medium">Imagen PNG</h3>
                <p className="text-sm text-gray-600">Visualización de patrones de corte</p>
              </div>
            </CardContent>
          </Card>

          {isExporting && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Exportando...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
