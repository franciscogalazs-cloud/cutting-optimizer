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
      let margin = this.getMargin(pattern);
      let kerf = this.getKerf(pattern);
      let usableLength = pattern.materialLength - margin * 2;
      let usableWidth = pattern.materialWidth - margin * 2;

      let placedAny = true;
      while (placedAny && remainingPieces.length > 0) {
        placedAny = false;
        let bestIdx = -1;
        let bestX = 0, bestY = 0, bestRotated = false;
        let minWaste = Infinity;
        for (let idx = 0; idx < remainingPieces.length; idx++) {
          const p = remainingPieces[idx];
          for (const rotated of [false, true]) {
            if (rotated && !this.config.allowRotation) continue;
            const l = rotated ? p.width : p.length;
            const w = rotated ? p.length : p.width;
            if (l > usableLength || w > usableWidth) continue;
            for (let y = margin; y + w <= pattern.materialWidth - margin + 0.01; y += 1) {
              for (let x = margin; x + l <= pattern.materialLength - margin + 0.01; x += 1) {
                // Verificar colisiones
                let collision = false;
                for (const placed of pattern.pieces) {
                  if (!(x + l <= placed.x || placed.x + placed.width <= x || y + w <= placed.y || placed.y + placed.height <= y)) {
                    collision = true;
                    break;
                  }
                }
                if (!collision) {
                  // Calcular desperdicio si se coloca aquí
                  const usedArea = pattern.pieces.reduce((sum, pc) => sum + (pc.width * pc.height), 0) + l * w;
                  const waste = (pattern.materialLength * pattern.materialWidth) - usedArea;
                  if (waste < minWaste) {
                    minWaste = waste;
                    bestIdx = idx;
                    bestX = x;
                    bestY = y;
                    bestRotated = rotated;
                  }
                }
              }
            }
          }
        }
        if (bestIdx !== -1) {
          const p = remainingPieces[bestIdx];
          const l = bestRotated ? p.width : p.length;
          const w = bestRotated ? p.length : p.width;
          pattern.pieces.push(createPlacedPiece({
            pieceId: p.id,
            x: bestX,
            y: bestY,
            width: l,
            height: w,
            rotated: bestRotated,
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


