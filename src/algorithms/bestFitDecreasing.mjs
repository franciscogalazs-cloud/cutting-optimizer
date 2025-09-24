export class BestFitDecreasing {
import { createPlacedPiece, createCuttingPattern, PIECE_COLORS } from '../types/index.js'
export class BestFitDecreasing {
  constructor(config = {}) {
    this.config = {
      kerf: config.kerf ?? 3,
      margin: config.margin ?? 5,
      allowRotation: config.allowRotation ?? true,
      ...config,
    }
    console.log('[BestFitDecreasing] allowRotation:', this.config.allowRotation);
  }

  getKerf(pattern) {
    return pattern?.kerf ?? this.config.kerf
  }

  getMargin(pattern) {
    return pattern?.margin ?? this.config.margin
  }

  optimize(pieces, materials) {
    const startTime = Date.now();
    const expandedPieces = this.expandPieces(pieces);
    const sortedPieces = this.sortPiecesByArea(expandedPieces);
    const patterns = [];
    const availableMaterials = materials.map(m => ({ ...m }));

    let remainingPieces = [...sortedPieces];
    while (remainingPieces.length > 0) {
      // Tomar la siguiente pieza a colocar
      const piece = remainingPieces[0];
      // Buscar un patrón existente donde quepa, si no, crear uno nuevo
      let pattern = null;
      for (const p of patterns) {
        if (!piece.material || p.materialName === piece.material) {
          pattern = p;
          break;
        }
      }
      if (!pattern) {
        // Crear nuevo patrón/material
        let bestMaterial = null;
        let bestMaterialIndex = -1;
        for (let i = 0; i < availableMaterials.length; i++) {
          const material = availableMaterials[i];

          // Algoritmo Best Fit Decreasing robusto: llena sistemáticamente el material, siempre prueba ambas orientaciones y rota si es necesario

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

            getKerf(pattern) {
              return pattern?.kerf ?? this.config.kerf;
            }
            getMargin(pattern) {
              return pattern?.margin ?? this.config.margin;
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
                let placedAny = false;
                for (const orientation of [false, true]) { // false: sin rotar, true: rotada
                  let margin = this.getMargin(pattern);
                  let kerf = this.getKerf(pattern);
                  let usableLength = pattern.materialLength - margin * 2;
                  let usableWidth = pattern.materialWidth - margin * 2;
                  let y = margin;
                  while (y + 0.01 <= pattern.materialWidth - margin) {
                    let x = margin;
                    while (x + 0.01 <= pattern.materialLength - margin) {
                      // Buscar la primera pieza que quepa en esta orientación
                      let idx = remainingPieces.findIndex(p => {
                        if (orientation && !this.config.allowRotation) return false;
                        const l = orientation ? p.width : p.length;
                        const w = orientation ? p.length : p.width;
                        return (l <= usableLength && w <= usableWidth);
                      });
                      if (idx === -1) {
                        x += 1;
                        continue;
                      }
                      const p = remainingPieces[idx];
                      const l = orientation ? p.width : p.length;
                      const w = orientation ? p.length : p.width;
                      if (x + l > pattern.materialLength - margin + 0.01 || y + w > pattern.materialWidth - margin + 0.01) {
                        x += 1;
                        continue;
                      }
                      // Verificar colisiones
                      let collision = false;
                      for (const placed of pattern.pieces) {
                        if (!(x + l <= placed.x || placed.x + placed.width <= x || y + w <= placed.y || placed.y + placed.height <= y)) {
                          collision = true;
                          break;
                        }
                      }
                      if (!collision) {
                        pattern.pieces.push(createPlacedPiece({
                          pieceId: p.id,
                          x,
                          y,
                          width: l,
                          height: w,
                          rotated: orientation,
                          label: p.label,
                          color: p.color,
                        }));
                        remainingPieces.splice(idx, 1);
                        placedAny = true;
                        x += l + kerf;
                      } else {
                        x += 1;
                      }
                    }
                    y += 1;
                  }
                  if (placedAny) break; // Si se colocó alguna pieza en esta orientación, no probar la otra
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
  isPositionValid(x, y, length, width, pattern, maxLength, maxWidth) {
    const margin = this.getMargin(pattern)
    const kerf = this.getKerf(pattern)
    if (x + length > maxLength + margin || y + width > maxWidth + margin) return false
    for (const placedPiece of pattern.pieces) {
      if (this.rectanglesOverlap(
        x, y, length, width,
        placedPiece.x - kerf / 2,
        placedPiece.y - kerf / 2,
        placedPiece.width + kerf,
        placedPiece.height + kerf,
      )) return false
    }
    return true
  }

  rectanglesOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    return !(x1 + w1 <= x2 || x2 + w2 <= x1 || y1 + h1 <= y2 || y2 + h2 <= y1)
  }

  calculateWasteAfterPlacement(piece, pattern, position) {
    const materialArea = pattern.materialLength * pattern.materialWidth
    const currentUsedArea = pattern.pieces.reduce((sum, p) => sum + (p.width * p.height), 0)
    const pieceArea = position.rotated ? piece.width * piece.length : piece.length * piece.width
    return materialArea - (currentUsedArea + pieceArea)
  }

  addPieceToPattern(piece, pattern, position) {
    // width y height correctos según rotación
    const placedPiece = createPlacedPiece({
      pieceId: piece.id,
      x: position.x,
      y: position.y,
      width: position.rotated ? piece.width : piece.length,
      height: position.rotated ? piece.length : piece.width,
      rotated: position.rotated,
      label: piece.label,
      color: piece.color,
    })
    pattern.pieces.push(placedPiece)
    this.updatePatternStatistics(pattern)
  }

  createNewPattern(piece, patterns, availableMaterials) {
    let bestMaterial = null
    let bestMaterialIndex = -1
    for (let i = 0; i < availableMaterials.length; i++) {
      const material = availableMaterials[i]
      if (material.quantity > 0) {
        if (piece.material && material.material && piece.material !== material.material) continue
        const canFit = this.canPieceFitInMaterial(piece, material)
        if (canFit && (!bestMaterial || this.getMaterialArea(material) < this.getMaterialArea(bestMaterial))) {
          bestMaterial = material
          bestMaterialIndex = i
        }
      }
    }
    if (!bestMaterial) {
      console.warn('No hay material disponible para la pieza (tipo/dimensiones):', piece)
      return
    }
    const pattern = createCuttingPattern({
      materialId: bestMaterial.id,
      materialName: bestMaterial.material,
      materialLength: bestMaterial.length,
      materialWidth: bestMaterial.width,
      kerf: bestMaterial.kerf ?? this.config.kerf,
      margin: bestMaterial.margin ?? this.config.margin,
      pieces: [],
    })
    const position = this.findBestPosition(piece, pattern)
    if (position) this.addPieceToPattern(piece, pattern, position)
    patterns.push(pattern)
    availableMaterials[bestMaterialIndex].quantity--
  }

  canPieceFitInMaterial(piece, material) {
  const margin = material.margin ?? this.config.margin;
  const usableLength = material.length - margin * 2;
  const usableWidth = material.width - margin * 2;
  // Siempre probar ambas orientaciones si allowRotation está activo
  if (piece.length <= usableLength && piece.width <= usableWidth) return true;
  if (this.config.allowRotation && piece.length !== piece.width && piece.width <= usableLength && piece.length <= usableWidth) return true;
  return false;
  }

  getMaterialArea(material) {
    return material.length * material.width
  }

  updatePatternStatistics(pattern) {
    const materialArea = pattern.materialLength * pattern.materialWidth
    const usedArea = pattern.pieces.reduce((sum, p) => sum + (p.width * p.height), 0)
    pattern.utilization = (usedArea / materialArea) * 100
    pattern.waste = materialArea - usedArea
  }

  calculateStatistics(patterns, originalMaterials) {
    let totalUtilization = 0
    let totalWaste = 0
    let totalCost = 0
    let materialsUsed = 0
    patterns.forEach(pattern => {
      this.updatePatternStatistics(pattern)
      const material = originalMaterials.find(m => m.id === pattern.materialId)
      if (material) {
        pattern.cost = material.price
        totalCost += material.price
      }
      totalWaste += pattern.waste
      materialsUsed++
    })
    if (patterns.length > 0) {
      totalUtilization = patterns.reduce((sum, p) => sum + p.utilization, 0) / patterns.length
    }
    return { patterns, totalUtilization, totalWaste, totalCost, materialsUsed, executionTime: 0 }
  }
}

