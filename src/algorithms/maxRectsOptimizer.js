// Algoritmo Maximal Rectangles (MaxRects) para optimización de cortes 2D
// Versión inicial, soporta rotación y múltiples materiales
import { createPlacedPiece, createCuttingPattern, PIECE_COLORS } from '../types/index.js';

export class MaxRectsOptimizer {
  constructor(config = {}) {
    this.config = {
      kerf: config.kerf ?? 3,
      margin: config.margin ?? 5,
      allowRotation: config.allowRotation ?? true,
      separation: config.separation ?? 0, // separación adicional entre piezas
      rotationPenalty: config.rotationPenalty ?? 0, // penalización por rotar si no es obligatorio
      ...config,
    };
  }

  getMargin(pattern) {
    return pattern.margin ?? this.config.margin;
  }

  optimize(pieces, materials) {
    const startTime = Date.now();
    const expandedPieces = this.expandPieces(pieces);
    const sortedPieces = this.sortPiecesByArea(expandedPieces);
    const patterns = [];
    const availableMaterials = materials.map(m => ({ ...m }));

    for (const piece of sortedPieces) {
      const placed = this.placePiece(piece, patterns);
      if (!placed) {
        this.createNewPattern(piece, patterns, availableMaterials);
      }
    }

    const result = this.calculateStatistics(patterns, materials);
    result.executionTime = Date.now() - startTime;
    result.algorithm = 'MaxRects';
    return result;
  }

  // Clearance mínimo entre piezas y cortes: kerf + separación
  getClearance(pattern) {
    const kerf = this.getKerf(pattern);
    const sep = Number(this.config.separation) || 0;
    return (Number(kerf) || 0) + sep;
  }

  expandPieces(pieces) {
    const expanded = [];
    let colorIndex = 0;
    // Contador global para numerar todas las piezas individuales secuencialmente
    let globalPieceNumber = 1;
    
    pieces.forEach(piece => {
      for (let i = 0; i < piece.quantity; i++) {
        // Obtener configuración de tapacantos específica para esta instancia
        let instanceEdges;
        if (piece.instanceEdges && piece.instanceEdges[i]) {
          instanceEdges = piece.instanceEdges[i];
        } else {
          // Para compatibilidad hacia atrás, usar la configuración base de la pieza
          instanceEdges = piece.edges || {};
        }
        
        // Crear etiqueta numerada individualmente
        const baseLabel = piece.label || 'Pieza';
        const numberedLabel = piece.quantity > 1 ? `${baseLabel} #${i + 1}` : baseLabel;
        
        expanded.push({
          ...piece,
          id: `${piece.id}_${i}`,
          label: numberedLabel,
          edges: instanceEdges,
          originalId: piece.id,
          originalInstance: i,
          color: PIECE_COLORS[colorIndex % PIECE_COLORS.length],
          instanceNumber: i + 1,
          globalNumber: globalPieceNumber++
        });
      }
      colorIndex++;
    });
    return expanded;
  }

  sortPiecesByArea(list) {
    return list.sort((a, b) => (b.length * b.width) - (a.length * a.width));
  }

  placePiece(piece, patterns) {
    for (const pattern of patterns) {
      if (pattern.materialName && piece.material && pattern.materialName !== piece.material) continue;
      const position = this.findMaxRectsPosition(piece, pattern);
      if (position) {
        this.addPieceToPattern(piece, pattern, position);
        return true;
      }
    }
    return false;
  }

  findMaxRectsPosition(piece, pattern) {
    const margin = this.getMargin(pattern);
    if (!pattern.freeRects) {
      pattern.freeRects = [
        {
          x: margin,
          y: margin,
          width: pattern.materialLength - margin * 2,
          height: pattern.materialWidth - margin * 2,
        },
      ];
    }
    let bestRect = null;
    let bestWaste = Infinity;
    let bestBalanceScore = Infinity;
    const orientations = [];
    const required = piece.requiredRotation; // 'original' | 'rotated' | true | false | undefined
    const allowRotation = (this.config.allowRotation && (piece.canRotate ?? true)) || required === 'rotated' || required === true;
    const allowOriginal = required === 'rotated' || required === true ? false : true;
    const allowRotated = required === 'original' || required === false ? false : allowRotation;
    if (allowOriginal) orientations.push({ width: piece.length, height: piece.width, rotated: false });
    if (allowRotated) orientations.push({ width: piece.width, height: piece.length, rotated: true });
    const rotationPenalty = Number(this.config.rotationPenalty) || 0;
    for (const orient of orientations) {
      for (const rect of pattern.freeRects) {
        if (orient.width <= rect.width && orient.height <= rect.height) {
          const waste = rect.width * rect.height - orient.width * orient.height;
          let balanceScore = Math.abs((rect.width - orient.width) - (rect.height - orient.height));
          if (orient.rotated && (required !== 'rotated' && required !== true)) {
            balanceScore += rotationPenalty;
          }
          if (waste < bestWaste - 1e-6 || (Math.abs(waste - bestWaste) <= 1e-6 && balanceScore < bestBalanceScore)) {
            bestWaste = waste;
            bestBalanceScore = balanceScore;
            bestRect = {
              x: rect.x,
              y: rect.y,
              width: orient.width,
              height: orient.height,
              balanceScore: bestBalanceScore,
              rotated: orient.rotated,
              rectIndex: pattern.freeRects.indexOf(rect),
            };
          }
        }
      }
    }
    return bestRect;
  }

  addPieceToPattern(piece, pattern, position) {
    const placedPiece = createPlacedPiece({
      pieceId: piece.id,
      x: position.x,
      y: position.y,
      width: position.width,
      height: position.height,
      rotated: position.rotated,
      label: piece.label,
      color: piece.color,
      // Propagar tapacantos desde la pieza original
      edges: piece.edges,
      originalId: piece.originalId,
      originalInstance: piece.originalInstance,
    });
    pattern.pieces.push(placedPiece);
    this.splitFreeRects(pattern, position);
    this.updatePatternStatistics(pattern);
  }

  splitFreeRects(pattern, position) {
    // Divide el rectángulo libre donde se colocó la pieza en hasta 2 nuevos rectángulos
    const clearance = this.getClearance(pattern);
    const rect = pattern.freeRects[position.rectIndex];
    const newRects = [];
    // Derecha
    if (rect.width > position.width + clearance) {
      newRects.push({
        x: rect.x + position.width + clearance,
        y: rect.y,
        width: rect.width - position.width - clearance,
        height: position.height,
      });
    }
    // Abajo
    if (rect.height > position.height + clearance) {
      newRects.push({
        x: rect.x,
        y: rect.y + position.height + clearance,
        width: rect.width,
        height: rect.height - position.height - clearance,
      });
    }
    // Resto del Ã¡rea no ocupada
    if (rect.width > position.width + clearance && rect.height > position.height + clearance) {
      newRects.push({
        x: rect.x + position.width + clearance,
        y: rect.y + position.height + clearance,
        width: rect.width - position.width - clearance,
        height: rect.height - position.height - clearance,
      });
    }
    // Eliminar el rectÃ¡ngulo original y agregar los nuevos
    pattern.freeRects.splice(position.rectIndex, 1, ...newRects);
    // Opcional: eliminar solapamientos y rectÃ¡ngulos degenerados
    pattern.freeRects = pattern.freeRects.filter(r => r.width > 2 && r.height > 2);
  }

  createNewPattern(piece, patterns, availableMaterials) {
    let bestMaterial = null;
    let bestMaterialIndex = -1;
    for (let i = 0; i < availableMaterials.length; i++) {
      const material = availableMaterials[i];
      if (piece.material && material.material && piece.material !== material.material) continue;
      const canFit = this.canPieceFitInMaterial(piece, material);
      if (canFit && (!bestMaterial || this.getMaterialArea(material) < this.getMaterialArea(bestMaterial))) {
        bestMaterial = material;
        bestMaterialIndex = i;
      }
    }
    if (!bestMaterial) {
      console.warn('No hay material disponible para la pieza (tipo/dimensiones):', piece);
      return;
    }
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
    if (availableMaterials[bestMaterialIndex].quantity > 0) {
      availableMaterials[bestMaterialIndex].quantity--;
    }
    // Inicializar freeRects
    pattern.freeRects = [
      {
        x: pattern.margin,
        y: pattern.margin,
        width: pattern.materialLength - pattern.margin * 2,
        height: pattern.materialWidth - pattern.margin * 2,
      },
    ];
    // Colocar la pieza en el nuevo patrÃ³n
    const position = this.findMaxRectsPosition(piece, pattern);
    if (position) this.addPieceToPattern(piece, pattern, position);
  }

  canPieceFitInMaterial(piece, material) {
    const margin = material.margin ?? this.config.margin;
    const usableLength = material.length - margin * 2;
    const usableWidth = material.width - margin * 2;
    if (piece.length <= usableLength && piece.width <= usableWidth) return true;
    if (this.config.allowRotation && (piece.canRotate ?? true) && piece.width <= usableLength && piece.length <= usableWidth) return true;
    return false;
  }

  getKerf(pattern) {
    return pattern?.kerf ?? this.config.kerf;
  }

  getMaterialArea(material) {
    return material.length * material.width;
  }

  updatePatternStatistics(pattern) {
    const materialArea = pattern.materialLength * pattern.materialWidth;
    const usedArea = pattern.pieces.reduce((sum, p) => sum + (p.width * p.height), 0);
    pattern.utilization = (usedArea / materialArea) * 100;
    pattern.waste = materialArea - usedArea;
  }

  calculateStatistics(patterns, originalMaterials) {
    let totalUtilization = 0;
    let totalWaste = 0;
    let totalCost = 0;
    let materialsUsed = 0;
    patterns.forEach(pattern => {
      this.updatePatternStatistics(pattern);
      const material = originalMaterials.find(m => m.id === pattern.materialId);
      if (material) {
        const price = Number(material.price) || 0;
        pattern.cost = price;
        totalCost += price;
      }
      totalWaste += pattern.waste;
      materialsUsed++;
    });
    if (patterns.length > 0) {
      totalUtilization = patterns.reduce((sum, p) => sum + p.utilization, 0) / patterns.length;
    }
    return { patterns, totalUtilization, totalWaste, totalCost, materialsUsed, executionTime: 0 };
  }
}







