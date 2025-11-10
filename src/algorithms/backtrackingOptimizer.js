// Algoritmo de optimizacion 2D con backtracking
// Busca la mejor disposicion global de piezas en el material
import { createPlacedPiece, createCuttingPattern, PIECE_COLORS } from '../types/index.js';

export class BacktrackingOptimizer {
  constructor(config = {}) {
    this.config = {
      kerf: config.kerf ?? 3,
      margin: config.margin ?? 5,
      allowRotation: config.allowRotation ?? true,
      separation: config.separation ?? 0,
      maxPatterns: config.maxPatterns ?? null,
      ...config,
    };
  }

  optimize(pieces, materials, options = {}) {
    const { initialResult = null } = options;
    const expandedPieces = this.expandPieces(pieces);
    const sortedPieces = this.sortPiecesByArea(expandedPieces);
    const availableMaterials = materials.map((material) => ({ ...material }));
    const bestState = this.createInitialState(initialResult);

    if (sortedPieces.length === 0) {
      return this.buildResult(bestState.patterns, materials, 'Backtracking');
    }

    this.backtrack(sortedPieces, availableMaterials, [], bestState);
    return this.buildResult(bestState.patterns, materials, 'Backtracking');
  }

  createInitialState(initialResult) {
    if (!initialResult || !Array.isArray(initialResult.patterns) || initialResult.patterns.length === 0) {
      return {
        patterns: [],
        totalWaste: Infinity,
      };
    }
    const clonedPatterns = this.clonePatterns(initialResult.patterns);
    const totalWaste = this.computeTotalWaste(clonedPatterns);
    return {
      patterns: clonedPatterns,
      totalWaste: Number.isFinite(initialResult.totalWaste) ? initialResult.totalWaste : totalWaste,
    };
  }

  buildResult(patterns, materials, algorithmName) {
    if (!patterns || patterns.length === 0) {
      return {
        patterns: [],
        totalUtilization: 0,
        totalWaste: 0,
        totalCost: 0,
        materialsUsed: 0,
        executionTime: 0,
        algorithm: algorithmName,
      };
    }

    const evaluatedPatterns = patterns.map((pattern) => this.evaluatePattern(pattern, materials));
    const totalWaste = evaluatedPatterns.reduce((sum, pattern) => sum + pattern.waste, 0);
    const totalUtilization = evaluatedPatterns.length
      ? evaluatedPatterns.reduce((sum, pattern) => sum + pattern.utilization, 0) / evaluatedPatterns.length
      : 0;
    const totalCost = evaluatedPatterns.reduce((sum, pattern) => sum + (pattern.cost || 0), 0);

    return {
      patterns: evaluatedPatterns,
      totalUtilization,
      totalWaste,
      totalCost,
      materialsUsed: evaluatedPatterns.length,
      executionTime: 0,
      algorithm: algorithmName,
    };
  }

  expandPieces(pieces) {
    const expanded = [];
    let colorIndex = 0;
    // Contador global para numerar todas las piezas individuales secuencialmente
    let globalPieceNumber = 1;
    
    pieces.forEach((piece) => {
      const quantity = Math.max(1, Number(piece.quantity) || 1);
      for (let i = 0; i < quantity; i++) {
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
          globalNumber: globalPieceNumber++,
          // Asegurar consistencia con allowRotation global
          canRotate: (piece.canRotate ?? true) && (this.config.allowRotation ?? true),
        });
      }
      colorIndex++;
    });
    return expanded;
  }

  sortPiecesByArea(list) {
    return list.sort((a, b) => (b.length * b.width) - (a.length * a.width));
  }

  backtrack(pieces, materials, currentPatterns, bestState) {
    if (bestState.totalWaste === 0) {
      return;
    }

    if (pieces.length === 0) {
      const totalWaste = this.computeTotalWaste(currentPatterns);
      if (totalWaste < bestState.totalWaste) {
        bestState.patterns = this.clonePatterns(currentPatterns);
        bestState.totalWaste = totalWaste;
      }
      return;
    }

    const [piece, ...remainingPieces] = pieces;

    currentPatterns.forEach((pattern, patternIndex) => {
      const positions = this.generatePossiblePositions(pattern, piece);
      for (const pos of positions) {
        const placedPiece = this.tryPlacePiece(piece, pattern, pos);
        if (!placedPiece) continue;
        const updatedPattern = {
          ...pattern,
          pieces: [...pattern.pieces, placedPiece],
        };
        const nextPatterns = [...currentPatterns];
        nextPatterns[patternIndex] = updatedPattern;
        this.backtrack(remainingPieces, materials, nextPatterns, bestState);
      }
    });

    if (this.config.maxPatterns && currentPatterns.length >= this.config.maxPatterns) {
      return;
    }

    materials.forEach((material, materialIndex) => {
      if ((material.quantity ?? 0) <= 0) return;
      if (piece.material && material.material && piece.material !== material.material) return;

      const basePattern = createCuttingPattern({
        materialId: material.id,
        materialName: material.material,
        materialLength: material.length,
        materialWidth: material.width,
        kerf: material.kerf ?? this.config.kerf,
        margin: material.margin ?? this.config.margin,
        pieces: [],
      });

      const positions = this.generatePossiblePositions(basePattern, piece);
      for (const pos of positions) {
        const placedPiece = this.tryPlacePiece(piece, basePattern, pos);
        if (!placedPiece) continue;
        const updatedPattern = {
          ...basePattern,
          pieces: [placedPiece],
        };
        const nextMaterials = materials.map((mat, idx) => (
          idx === materialIndex
            ? { ...mat, quantity: Math.max(0, (mat.quantity ?? 0) - 1) }
            : { ...mat }
        ));
        const nextPatterns = [...currentPatterns, updatedPattern];
        this.backtrack(remainingPieces, nextMaterials, nextPatterns, bestState);
      }
    });
  }

  generatePossiblePositions(pattern, piece) {
    const margin = this.getMargin(pattern);
    const kerf = this.getKerf(pattern);
  const required = piece.requiredRotation; // 'original' | 'rotated' | true | false
  const canRotatePiece = (this.config.allowRotation && (piece.canRotate ?? true)) || required === 'rotated' || required === true;
    const positions = [{ x: margin, y: margin, rotated: false }];
    if (canRotatePiece) {
      positions.push({ x: margin, y: margin, rotated: true });
    }

    for (const placedPiece of pattern.pieces) {
      positions.push({ x: placedPiece.x + placedPiece.width + kerf, y: placedPiece.y, rotated: false });
      positions.push({ x: placedPiece.x, y: placedPiece.y + placedPiece.height + kerf, rotated: false });
      if (canRotatePiece) {
        positions.push({ x: placedPiece.x + placedPiece.height + kerf, y: placedPiece.y, rotated: true });
        positions.push({ x: placedPiece.x, y: placedPiece.y + placedPiece.width + kerf, rotated: true });
      }
    }

    const unique = [];
    const seen = new Set();
    for (const pos of positions) {
      const key = `${pos.x},${pos.y},${pos.rotated}`;
      if (!seen.has(key)) {
        unique.push(pos);
        seen.add(key);
      }
    }
    return unique;
  }

  tryPlacePiece(piece, pattern, pos) {
    const margin = this.getMargin(pattern);
  const kerf = this.getKerf(pattern);
  const clearance = kerf + (this.config.separation ?? 0);
    const materialLength = pattern.materialLength - margin * 2;
    const materialWidth = pattern.materialWidth - margin * 2;
  const required = piece.requiredRotation;
  const canRotate = (this.config.allowRotation && (piece.canRotate ?? true)) || required === 'rotated' || required === true;
    const length = pos.rotated && canRotate ? piece.width : piece.length;
    const width = pos.rotated && canRotate ? piece.length : piece.width;

    if (length <= 0 || width <= 0) return null;
    if (pos.x + length > materialLength + margin || pos.y + width > materialWidth + margin) return null;

    for (const placedPiece of pattern.pieces) {
      if (this.rectanglesOverlap(
        pos.x, pos.y, length, width,
        placedPiece.x - clearance / 2,
        placedPiece.y - clearance / 2,
        placedPiece.width + clearance,
        placedPiece.height + clearance,
      )) {
        return null;
      }
    }

    return createPlacedPiece({
      pieceId: piece.id,
      x: pos.x,
      y: pos.y,
      width: length,
      height: width,
      rotated: pos.rotated && canRotate,
      label: piece.label,
      color: piece.color,
      edges: piece.edges,
      originalId: piece.originalId,
      originalInstance: piece.originalInstance,
    });
  }

  rectanglesOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    return !(x1 + w1 <= x2 || x2 + w2 <= x1 || y1 + h1 <= y2 || y2 + h2 <= y1);
  }

  getKerf(pattern) {
    return pattern?.kerf ?? this.config.kerf;
  }

  getMargin(pattern) {
    return pattern?.margin ?? this.config.margin;
  }

  clonePatterns(patterns) {
    return patterns.map((pattern) => ({
      ...pattern,
      pieces: (pattern.pieces || []).map((piece) => ({ ...piece })),
    }));
  }

  computeTotalWaste(patterns) {
    return patterns.reduce((sum, pattern) => {
      const usedArea = (pattern.pieces || []).reduce((acc, piece) => acc + (piece.width * piece.height), 0);
      const materialArea = pattern.materialLength * pattern.materialWidth;
      return sum + Math.max(0, materialArea - usedArea);
    }, 0);
  }

  positionScore(pattern, piece, pos) {
    const margin = this.getMargin(pattern);
    const canRotate = this.config.allowRotation && (piece.canRotate ?? true);
    const length = pos.rotated && canRotate ? piece.width : piece.length;
    const width = pos.rotated && canRotate ? piece.length : piece.width;
    const usableLength = pattern.materialLength - margin * 2;
    const usableWidth = pattern.materialWidth - margin * 2;
    const edgeGapX = Math.max(0, usableLength - (pos.x - margin + length));
    const edgeGapY = Math.max(0, usableWidth - (pos.y - margin + width));
    const centerBias = pos.rotated ? -0.5 : 0;
    return edgeGapX + edgeGapY + pos.x * 0.01 + pos.y * 0.01 + centerBias;
  }

  shouldReplace(currentBest, candidate) {
    if (!candidate || candidate.length === 0) return false;
    if (!currentBest || currentBest.length === 0) return true;
    const bestScore = this.patternArrangementScore(currentBest);
    const candidateScore = this.patternArrangementScore(candidate);
    if (candidateScore.edgeGap < bestScore.edgeGap - 1e-6) return true;
    if (Math.abs(candidateScore.edgeGap - bestScore.edgeGap) <= 1e-6 && candidateScore.rotatedPieces > bestScore.rotatedPieces) {
      return true;
    }
    return false;
  }

  patternArrangementScore(patterns) {
    return patterns.reduce((acc, pattern) => {
      const margin = this.getMargin(pattern);
      const pieces = pattern.pieces || [];
      const maxX = pieces.reduce((max, piece) => Math.max(max, piece.x + piece.width), margin);
      const maxY = pieces.reduce((max, piece) => Math.max(max, piece.y + piece.height), margin);
      const gapX = Math.max(0, pattern.materialLength - maxX);
      const gapY = Math.max(0, pattern.materialWidth - maxY);
      acc.edgeGap += gapX + gapY;
      acc.rotatedPieces += pieces.filter((piece) => piece.rotated).length;
      return acc;
    }, { edgeGap: 0, rotatedPieces: 0 });
  }
  evaluatePattern(pattern, materials) {
    const materialArea = pattern.materialLength * pattern.materialWidth;
    const pieces = (pattern.pieces || []).map((piece) => ({ ...piece }));
    const usedArea = pieces.reduce((sum, piece) => sum + (piece.width * piece.height), 0);
    const waste = Math.max(0, materialArea - usedArea);
    const utilization = materialArea > 0 ? (usedArea / materialArea) * 100 : 0;
    const sourceMaterial = materials.find((mat) => mat.id === pattern.materialId);

    return {
      ...pattern,
      pieces,
      utilization,
      waste,
      cost: sourceMaterial?.price ?? pattern.cost ?? 0,
    };
  }
}




