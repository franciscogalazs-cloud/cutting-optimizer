import { createPlacedPiece, createCuttingPattern, PIECE_COLORS } from '../types/index.js';

export class BestFitDecreasing {
  constructor(config = {}) {
    this.config = {
      kerf: config.kerf ?? 3,
      margin: config.margin ?? 5,
      allowRotation: config.allowRotation ?? true,
      ...config,
    };
  }

  getMargin(pattern) {
    return pattern.margin ?? this.config.margin;
  }

  findBestPosition(piece, pattern, margin, usableLength, usableWidth) {
    let bestPosition = null;
    let minWaste = Infinity;
    
    const orientations = [
      { width: piece.length, height: piece.width, rotated: false }
    ];
    
    if (this.config.allowRotation) {
      orientations.push({ width: piece.width, height: piece.length, rotated: true });
    }
    
    for (const orientation of orientations) {
      if (orientation.width > usableLength || orientation.height > usableWidth) continue;
      
      // Usar paso más eficiente basado en el tamaño de las piezas existentes
      const stepSize = Math.max(1, Math.min(orientation.width, orientation.height) / 10);
      
      for (let y = margin; y + orientation.height <= pattern.materialWidth - margin + 0.01; y += stepSize) {
        for (let x = margin; x + orientation.width <= pattern.materialLength - margin + 0.01; x += stepSize) {
          
          if (!this.checkCollision(x, y, orientation.width, orientation.height, pattern.pieces)) {
            const usedArea = pattern.pieces.reduce((sum, pc) => sum + (pc.width * pc.height), 0) + orientation.width * orientation.height;
            const waste = (pattern.materialLength * pattern.materialWidth) - usedArea;
            
            if (waste < minWaste) {
              minWaste = waste;
              bestPosition = {
                x: Math.round(x),
                y: Math.round(y),
                width: orientation.width,
                height: orientation.height,
                rotated: orientation.rotated,
                waste: waste
              };
            }
          }
        }
      }
    }
    
    return bestPosition;
  }

  checkCollision(x, y, width, height, placedPieces) {
    for (const placed of placedPieces) {
      if (!(x + width <= placed.x || placed.x + placed.width <= x || 
            y + height <= placed.y || placed.y + placed.height <= y)) {
        return true;
      }
    }
    return false;
  }

  optimize(pieces, materials) {
    const startTime = Date.now();
    // Expandir piezas por cantidad
    const expandedPieces = [];
    let colorIndex = 0;
    pieces.forEach(piece => {
      for (let i = 0; i < piece.quantity; i++) {
        expandedPieces.push({
          ...piece,
          id: `${piece.id}_${i}`,
          originalId: piece.id,
          color: PIECE_COLORS[colorIndex % PIECE_COLORS.length],
          instanceNumber: i + 1,
        });
      }
      colorIndex++;
    });
    // Ordenar por área descendente
    expandedPieces.sort((a, b) => (b.length * b.width) - (a.length * a.width));

    const patterns = [];
    const availableMaterials = materials.map(m => ({ ...m }));
    let remainingPieces = [...expandedPieces];

    while (remainingPieces.length > 0) {
      // Seleccionar material disponible
      let bestMaterial = null;
      let bestMaterialIndex = -1;
      for (let i = 0; i < availableMaterials.length; i++) {
        const material = availableMaterials[i];
        if (material.quantity > 0) {
          bestMaterial = material;
          bestMaterialIndex = i;
          break;
        }
      }
      if (!bestMaterial) break;
      const pattern = createCuttingPattern({
        materialId: bestMaterial.id,
        materialName: bestMaterial.material,
        materialLength: bestMaterial.length,
        materialWidth: bestMaterial.width,
        kerf: bestMaterial.kerf ?? this.config.kerf,
        margin: bestMaterial.margin ?? this.config.margin,
        pieces: [],
      });
      patterns.push(pattern);
      availableMaterials[bestMaterialIndex].quantity--;

      // Intentar llenar el patrón con la mayor cantidad de piezas posible
      const margin = this.getMargin(pattern);
      const usableLength = pattern.materialLength - margin * 2;
      const usableWidth = pattern.materialWidth - margin * 2;

      let placedAny = true;
      while (placedAny && remainingPieces.length > 0) {
        placedAny = false;
        let bestIdx = -1;
        let bestPosition = null;
        let minWaste = Infinity;
        
        for (let idx = 0; idx < remainingPieces.length; idx++) {
          const p = remainingPieces[idx];
          const position = this.findBestPosition(p, pattern, margin, usableLength, usableWidth);
          
          if (position && position.waste < minWaste) {
            minWaste = position.waste;
            bestIdx = idx;
            bestPosition = position;
          }
        }
        
        if (bestIdx !== -1) {
          const p = remainingPieces[bestIdx];
          pattern.pieces.push(createPlacedPiece({
            pieceId: p.id,
            x: bestPosition.x,
            y: bestPosition.y,
            width: bestPosition.width,
            height: bestPosition.height,
            rotated: bestPosition.rotated,
            label: p.label,
            color: p.color,
          }));
          remainingPieces.splice(bestIdx, 1);
          placedAny = true;
        }
      }
    }

    // Calcular estadísticas
    let totalUtilization = 0;
    let totalWaste = 0;
    let totalCost = 0;
    let materialsUsed = 0;
    patterns.forEach(pattern => {
      const materialArea = pattern.materialLength * pattern.materialWidth;
      const usedArea = pattern.pieces.reduce((sum, p) => sum + (p.width * p.height), 0);
      pattern.utilization = (usedArea / materialArea) * 100;
      pattern.waste = materialArea - usedArea;
      const material = materials.find(m => m.id === pattern.materialId);
      if (material) {
        pattern.cost = material.price;
        totalCost += material.price;
      }
      totalWaste += pattern.waste;
      materialsUsed++;
    });
    if (patterns.length > 0) {
      totalUtilization = patterns.reduce((sum, p) => sum + p.utilization, 0) / patterns.length;
    }
    return {
      patterns,
      totalUtilization,
      totalWaste,
      totalCost,
      materialsUsed,
      executionTime: Date.now() - startTime,
      algorithm: 'Best Fit Decreasing',
    };
  }
}





