import { createPlacedPiece, createCuttingPattern, PIECE_COLORS } from '../types/index.js';

export class BestFitDecreasing {
  constructor(config = {}) {
    this.config = {
      kerf: config.kerf ?? 3,
      margin: config.margin ?? 5,
      allowRotation: config.allowRotation ?? true,
      separation: config.separation ?? 0,
      rotationPenalty: config.rotationPenalty ?? 0,
      ...config,
    };
  }

  getMargin(pattern) {
    return pattern.margin ?? this.config.margin;
  }

  findBestPosition(piece, pattern, margin, _usableLength, _usableWidth) {
    let bestPosition = null;
    let bestScore = Infinity;
    const kerf = pattern.kerf ?? this.config.kerf;
    
    // Usar las dimensiones exactas como se definen en la pieza
    // length = dimensión más larga, width = dimensión más corta
    const originalLength = piece.length || 0;
    const originalWidth = piece.width || 0;
    
    // Probar ambas orientaciones de la pieza
    const orientations = [];
    const required = piece.requiredRotation; // 'original' | 'rotated' | true | false | undefined
    const allowRotation = (this.config.allowRotation && (piece.canRotate ?? true)) || required === 'rotated' || required === true;
    const allowOriginal = required === 'rotated' || required === true ? false : true;
    const allowRotated = required === 'original' || required === false ? false : allowRotation;
    if (allowOriginal) orientations.push({ width: originalLength, height: originalWidth, rotated: false });
    if (allowRotated && originalLength !== originalWidth) orientations.push({ width: originalWidth, height: originalLength, rotated: true });
    
    for (const orientation of orientations) {
      // Verificar si la orientación cabe en el material sin considerar márgenes
      if (orientation.width > pattern.materialLength || orientation.height > pattern.materialWidth) continue;

      // Ajustar margen efectivo según el tamaño real de la pieza
      const maxMarginX = Math.max(0, (pattern.materialLength - orientation.width) / 2);
      const maxMarginY = Math.max(0, (pattern.materialWidth - orientation.height) / 2);
      const effectiveMargin = Math.max(0, Math.min(margin, maxMarginX, maxMarginY));

      // Generar posiciones candidatas para esta orientación
      const candidatePositions = this.generateCandidatePositions(
        pattern, effectiveMargin, orientation.width, orientation.height, kerf
      );

      for (const position of candidatePositions) {
  if (this.isValidPosition(position.x, position.y, orientation.width, orientation.height, pattern)) {
          let score = this.calculatePositionScore(
            position.x, position.y, orientation.width, orientation.height, pattern
          );
          if (orientation.rotated && (required !== 'rotated' && required !== true)) {
            score += this.config.rotationPenalty || 0;
          }
          const orientationPreference = orientation.width <= orientation.height ? 0.75 : 0;
          const adjustedScore = score - orientationPreference;

          const tolerance = 1;
          if (adjustedScore < bestScore - tolerance || (bestPosition && Math.abs(adjustedScore - bestScore) <= tolerance && orientation.width + 1e-6 < bestPosition.width)) {
            bestScore = adjustedScore;
            bestPosition = {
              x: position.x,
              y: position.y,
              width: orientation.width,
              height: orientation.height,
              rotated: orientation.rotated,
              score: score,
            };
          }
        }
      }
    }

    return bestPosition;
  }

  pieceMatchesMaterial(piece, material) {
    if (!piece || !material) return false;
    if (piece.materialId) {
      return piece.materialId === material.id;
    }
    if (piece.material && material.material) {
      return String(piece.material).trim().toLowerCase() === String(material.material).trim().toLowerCase();
    }
    // Si no hay restricción de material específica, aceptar cualquier material
    return true;
  }

  generateCandidatePositions(pattern, margin, pieceWidth, pieceHeight, kerf) {
    const positions = [
      // Posición inicial en la esquina con margen
      { x: margin, y: margin }
    ];

    // Agregar posiciones basadas en piezas ya colocadas
    pattern.pieces.forEach(placedPiece => {
      // Posición a la derecha de la pieza existente
      positions.push({
        x: placedPiece.x + placedPiece.width + kerf,
        y: placedPiece.y
      });
      
      // Posición debajo de la pieza existente
      positions.push({
        x: placedPiece.x,
        y: placedPiece.y + placedPiece.height + kerf
      });
      
      // Posición alineada con bordes
      positions.push({
        x: placedPiece.x + placedPiece.width + kerf,
        y: placedPiece.y + placedPiece.height + kerf
      });
    });

    // Filtrar posiciones que no caben en el material
    const validPositions = positions.filter(pos => 
      pos.x + pieceWidth <= pattern.materialLength - margin &&
      pos.y + pieceHeight <= pattern.materialWidth - margin &&
      pos.x >= margin && pos.y >= margin
    );

    // Remover duplicados
    const uniquePositions = validPositions.filter((pos, index, arr) => 
      arr.findIndex(p => Math.abs(p.x - pos.x) < 0.01 && Math.abs(p.y - pos.y) < 0.01) === index
    );

    return uniquePositions;
  }

  getBoundingBox(pieces) {
    if (pieces.length === 0) return null;
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    pieces.forEach(piece => {
      minX = Math.min(minX, piece.x);
      minY = Math.min(minY, piece.y);
      maxX = Math.max(maxX, piece.x + piece.width);
      maxY = Math.max(maxY, piece.y + piece.height);
    });
    
    return { minX, minY, maxX, maxY };
  }

  calculatePositionScore(x, y, width, height, pattern) {
    // Penalizaciones base
    let score = 0;
    
    // Preferir posiciones cerca del origen (esquina inferior izquierda)
    score += x * 0.1 + y * 0.1;
    
    // Bonificar compactación - preferir posiciones que minimizan el bounding box
    const newPieces = [...pattern.pieces, { x, y, width, height }];
    const bbox = this.getBoundingBox(newPieces);
    if (bbox) {
      score += (bbox.maxX - bbox.minX) * 0.05 + (bbox.maxY - bbox.minY) * 0.05;
    }
    
    // Penalizar desperdicio de área
    const usedArea = newPieces.reduce((sum, p) => sum + (p.width * p.height), 0);
    const totalArea = pattern.materialLength * pattern.materialWidth;
    const wasteRatio = 1 - (usedArea / totalArea);
    score += wasteRatio * 1000;

    const minDimension = this.smallestDimension || 0;
    if (minDimension > 0) {
      const remainingWidth = Math.max(0, pattern.materialLength - (x + width));
      const remainingHeight = Math.max(0, pattern.materialWidth - (y + height));
      if (remainingWidth > 0 && remainingWidth < minDimension) {
        score += remainingWidth * 0.5;
      }
      if (remainingHeight > 0 && remainingHeight < minDimension) {
        score += remainingHeight * 0.5;
      }
    }

    return score;
  }

  isValidPosition(x, y, width, height, pattern) {
    // Verificar que la pieza esté dentro de los límites del material
    if (x < 0 || y < 0 || x + width > pattern.materialLength || y + height > pattern.materialWidth) {
      return false;
    }

    // Verificar colisiones con piezas existentes (incluyendo kerf)
  const clearance = (pattern.kerf ?? this.config.kerf) + (this.config.separation ?? 0);
    for (const existingPiece of pattern.pieces) {
      const collision = !(
        x >= existingPiece.x + existingPiece.width + clearance ||
        x + width + clearance <= existingPiece.x ||
        y >= existingPiece.y + existingPiece.height + clearance ||
        y + height + clearance <= existingPiece.y
      );

      if (collision) {
        return false;
      }
    }
    return true;
  }

  optimize(pieces, materials) {
    const startTime = Date.now();
    // Expandir piezas por cantidad
    const expandedPieces = [];
    const labelColorMap = new Map();
    const palette = PIECE_COLORS;
    let colorCursor = 0;

    const getPieceColor = (piece) => {
      const materialKey = (piece.material ?? piece.materialName ?? piece.materialId ?? '').trim().toLowerCase();
      const labelKey = (piece.label ?? '').trim().toLowerCase();
      const fallback = String(piece.id ?? '');
      const key = materialKey || labelKey || fallback;
      if (!labelColorMap.has(key)) {
        const color = palette[colorCursor % palette.length];
        labelColorMap.set(key, color);
        colorCursor++;
      }
      return labelColorMap.get(key);
    };

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
        
        expandedPieces.push({
          ...piece,
          id: `${piece.id}_${i}`,
          label: numberedLabel,
          edges: instanceEdges,
          originalId: piece.id,
          originalInstance: i,
          color: getPieceColor(piece),
          instanceNumber: i + 1,
          globalNumber: globalPieceNumber++
        });
      }
    });

    // Ordenar por área descendente, pero con preferencia por piezas más difíciles de colocar
    expandedPieces.sort((a, b) => {
      const areaA = a.length * a.width;
      const areaB = b.length * b.width;
      
      // Primero por área (más grande primero)
      if (areaA !== areaB) {
        return areaB - areaA;
      }
      
      // Si tienen la misma área, preferir la más larga (más difícil de colocar)
      return Math.max(b.length, b.width) - Math.max(a.length, a.width);
    });

    const smallestDimension = expandedPieces.reduce((min, piece) => {
      const pieceMin = Math.min(piece.length, piece.width);
      return Math.min(min, pieceMin);
    }, Infinity);
    this.smallestDimension = Number.isFinite(smallestDimension) ? smallestDimension : 0;

    const patterns = [];
    const availableMaterials = materials.map(m => ({ ...m }));
    let remainingPieces = [...expandedPieces];

    while (remainingPieces.length > 0) {
      // Encontrar el mejor material para la siguiente pieza
  let bestMaterial = null;
  let bestMaterialIndex = -1;
      let bestMaterialWaste = Infinity;

      for (let i = 0; i < availableMaterials.length; i++) {
        const material = availableMaterials[i];

        // Calcular cuánto desperdicio tendría usar este material
        let materialWaste = Infinity;
        const margin = material.margin ?? this.config.margin;
        const usableLengthCandidate = material.length - margin * 2;
        const usableWidthCandidate = material.width - margin * 2;

        // Intentar crear un patrón temporal y verificar qué tan bien encajaría la primera pieza
        const tempPattern = createCuttingPattern({
          materialId: material.id,
          materialName: material.material,
          materialLength: material.length,
          materialWidth: material.width,
          kerf: material.kerf ?? this.config.kerf,
          margin: material.margin ?? this.config.margin,
          pieces: [],
        });

        for (const piece of remainingPieces) {
          if (this.pieceMatchesMaterial(piece, material)) {
            const candidatePosition = this.findBestPosition(piece, tempPattern, margin, usableLengthCandidate, usableWidthCandidate);
            if (candidatePosition) {
              const usableAreaCandidate = usableLengthCandidate * usableWidthCandidate;
              const pieceArea = candidatePosition.width * candidatePosition.height;
              materialWaste = Math.min(materialWaste, usableAreaCandidate - pieceArea);
              if (materialWaste === 0) break;
            }
          }
        }

        if (materialWaste !== Infinity && materialWaste < bestMaterialWaste) {
          bestMaterialWaste = materialWaste;
          bestMaterial = material;
          bestMaterialIndex = i;
        }
      }

      // Si no hay stock, permitir materiales como "virtuales" si al menos una pieza puede caber
      if (!bestMaterial) {
        for (let i = 0; i < availableMaterials.length; i++) {
          const material = availableMaterials[i];
          let canFitAny = false;
          for (const p of remainingPieces) {
            if (this.pieceMatchesMaterial(p, material)) {
              // chequeo rápido de cabida con margen
              const margin = material.margin ?? this.config.margin;
              const usableL = material.length - margin * 2;
              const usableW = material.width - margin * 2;
              if ((p.length <= usableL && p.width <= usableW) || ((this.config.allowRotation && (p.canRotate ?? true)) && (p.width <= usableL && p.length <= usableW))) {
                canFitAny = true;
                break;
              }
            }
          }
          if (canFitAny) {
            bestMaterial = material;
            bestMaterialIndex = i;
            break;
          }
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
      if (availableMaterials[bestMaterialIndex].quantity > 0) {
        availableMaterials[bestMaterialIndex].quantity--;
      }

      // Intentar llenar el patrón con la mayor cantidad de piezas posible
      const margin = this.getMargin(pattern);
      const usableLength = pattern.materialLength - margin * 2;
      const usableWidth = pattern.materialWidth - margin * 2;

      let placedAny = true;
      while (placedAny && remainingPieces.length > 0) {
        placedAny = false;
        let bestIdx = -1;
        let bestPosition = null;
        let bestScore = Infinity;
        
        for (let idx = 0; idx < remainingPieces.length; idx++) {
          const p = remainingPieces[idx];
          if (!this.pieceMatchesMaterial(p, bestMaterial)) {
            continue;
          }
          const position = this.findBestPosition(p, pattern, margin, usableLength, usableWidth);
          
          if (position && position.score < bestScore) {
            bestScore = position.score;
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
            // Propagar tapacantos desde la pieza original
            edges: p.edges,
            originalId: p.originalId,
            originalInstance: p.originalInstance,
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
    let totalMaterialArea = 0;
    let totalUsedArea = 0;

    patterns.forEach(pattern => {
      const materialArea = pattern.materialLength * pattern.materialWidth;
      const usedArea = pattern.pieces.reduce((sum, p) => sum + (p.width * p.height), 0);
      pattern.utilization = materialArea > 0 ? (usedArea / materialArea) * 100 : 0;
      pattern.waste = materialArea - usedArea;
      totalMaterialArea += materialArea;
      totalUsedArea += usedArea;
      const material = materials.find(m => m.id === pattern.materialId);
      if (material) {
        const price = Number(material.price) || 0;
        pattern.cost = price;
        totalCost += price;
      }
      materialsUsed++;
    });

    if (totalMaterialArea > 0) {
      totalUtilization = (totalUsedArea / totalMaterialArea) * 100;
      totalWaste = totalMaterialArea - totalUsedArea;
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





