// Algoritmo Best Fit Decreasing para optimización de cortes 2D
import { createPlacedPiece, createCuttingPattern, PIECE_COLORS } from '../types/index.js'

export class BestFitDecreasing {
  constructor(config = {}) {
    this.config = {
      kerf: config.kerf ?? 3,
      margin: config.margin ?? 5,
      allowRotation: config.allowRotation ?? true,
      ...config,
    }
  }

  getKerf(pattern) {
    return pattern?.kerf ?? this.config.kerf
  }

  getMargin(pattern) {
    return pattern?.margin ?? this.config.margin
  }

  optimize(pieces, materials) {
    const startTime = Date.now()

    const expandedPieces = this.expandPieces(pieces)
    const sortedPieces = this.sortPiecesByArea(expandedPieces)

    const patterns = []
    const availableMaterials = materials.map(m => ({ ...m }))

    for (const piece of sortedPieces) {
      const placed = this.placePiece(piece, patterns)
      if (!placed) {
        this.createNewPattern(piece, patterns, availableMaterials)
      }
    }

    const result = this.calculateStatistics(patterns, materials)
    result.executionTime = Date.now() - startTime
    result.algorithm = 'Best Fit Decreasing'
    return result
  }

  expandPieces(pieces) {
    const expanded = []
    let colorIndex = 0
    pieces.forEach(piece => {
      for (let i = 0; i < piece.quantity; i++) {
        expanded.push({
          ...piece,
          id: `${piece.id}_${i}`,
          originalId: piece.id,
          color: PIECE_COLORS[colorIndex % PIECE_COLORS.length],
          instanceNumber: i + 1,
        })
      }
      colorIndex++
    })
    return expanded
  }

  sortPiecesByArea(list) {
    return list.sort((a, b) => (b.length * b.width) - (a.length * a.width))
  }

  placePiece(piece, patterns) {
    let bestPattern = null
    let bestPosition = null
    let bestWaste = Infinity

    for (const pattern of patterns) {
      if (pattern.materialName && piece.material && pattern.materialName !== piece.material) continue
      const position = this.findBestPosition(piece, pattern)
      if (position) {
        const waste = this.calculateWasteAfterPlacement(piece, pattern, position)
        if (waste < bestWaste) {
          bestWaste = waste
          bestPattern = pattern
          bestPosition = position
        }
      }
    }

    if (bestPattern && bestPosition) {
      this.addPieceToPattern(piece, bestPattern, bestPosition)
      return true
    }
    return false
  }

  findBestPosition(piece, pattern) {
    const margin = this.getMargin(pattern)
    const materialLength = pattern.materialLength - margin * 2
    const materialWidth = pattern.materialWidth - margin * 2

    let position = this.findPositionForSize(
      piece.length, piece.width, pattern, materialLength, materialWidth
    )
    if (position) return { ...position, rotated: false }

    if (this.config.allowRotation && piece.canRotate) {
      position = this.findPositionForSize(
        piece.width, piece.length, pattern, materialLength, materialWidth
      )
      if (position) return { ...position, rotated: true }
    }
    return null
  }

  findPositionForSize(length, width, pattern, maxLength, maxWidth) {
    if (length > maxLength || width > maxWidth) return null

    const positions = this.generatePossiblePositions(pattern)
    for (const pos of positions) {
      if (this.isPositionValid(pos.x, pos.y, length, width, pattern, maxLength, maxWidth)) {
        return pos
      }
    }
    return null
  }

  generatePossiblePositions(pattern) {
    const margin = this.getMargin(pattern)
    const kerf = this.getKerf(pattern)
    const positions = [{ x: margin, y: margin }]
    for (const placedPiece of pattern.pieces) {
      positions.push({ x: placedPiece.x + placedPiece.width + kerf, y: placedPiece.y })
      positions.push({ x: placedPiece.x, y: placedPiece.y + placedPiece.height + kerf })
    }
    return positions.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y))
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
    const margin = material.margin ?? this.config.margin
    const usableLength = material.length - margin * 2
    const usableWidth = material.width - margin * 2
    if (piece.length <= usableLength && piece.width <= usableWidth) return true
    if (this.config.allowRotation && piece.canRotate && piece.width <= usableLength && piece.length <= usableWidth) return true
    return false
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

