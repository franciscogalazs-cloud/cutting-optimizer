import { createPlacedPiece, createCuttingPattern, PIECE_COLORS } from '../types/index.js';

/**
 * Optimización tipo Guillotina (por franjas/filas):
 * - Coloca piezas en "shelves" (filas) de altura fija.
 * - Cada shelf ocupa todo el ancho disponible (con kerf entre piezas) y luego
 *   se hace un corte horizontal completo para pasar a la siguiente fila.
 * - Evita huecos internos; el sobrante queda en los bordes.
 */
export class GuillotineOptimizer {
  constructor(config = {}) {
    this.config = {
      kerf: config.kerf ?? 0,
      margin: config.margin ?? 0,
      allowRotation: config.allowRotation ?? true,
      orientation: config.orientation ?? 'rows', // 'rows' (filas) | 'cols' (columnas)
      separation: config.separation ?? 0, // separación adicional entre piezas además del kerf
      rotationPenalty: config.rotationPenalty ?? 0, // no se usa en guillotine, pero se acepta en config
      ...config,
    };
  }

  pieceMatchesMaterial(piece, material) {
    if (!piece || !material) return false;
    if (piece.materialId) return piece.materialId === material.id;
    if (piece.material && material.material) {
      return String(piece.material).trim().toLowerCase() === String(material.material).trim().toLowerCase();
    }
    return true;
  }

  /** Ordena piezas para shelves: primero por altura (desc), luego ancho (desc) */
  sortForShelves(pieces) {
    return [...pieces].sort((a, b) => {
      const ha = Math.max(a.length, a.width);
      const hb = Math.max(b.length, b.width);
      if (hb !== ha) return hb - ha;
      const wa = Math.min(a.length, a.width);
      const wb = Math.min(b.length, b.width);
      return wb - wa;
    });
  }

  optimize(pieces, materials) {
    const start = Date.now();
    // Expandir piezas por cantidad y colorear
    const expanded = [];
    const palette = PIECE_COLORS;
    let colorIdx = 0;
    const colorMap = new Map();
    const getColor = (key) => {
      if (!colorMap.has(key)) {
        colorMap.set(key, palette[colorIdx % palette.length]);
        colorIdx++;
      }
      return colorMap.get(key);
    };
    for (const piece of pieces) {
      const key = (piece.label || piece.material || piece.id || '').toString();
      for (let i = 0; i < (Number(piece.quantity) || 1); i++) {
        expanded.push({ ...piece, id: `${piece.id}_${i}`, color: getColor(key) });
      }
    }

  let leftovers = [...expanded];
    const mats = materials.map(m => ({ ...m }));
    const patterns = [];

    for (let mi = 0; mi < mats.length && leftovers.length > 0; mi++) {
      const material = mats[mi];
  let qty = Number(material.quantity) || 0;

      // Generar tantas planchas como sean necesarias para este material.
      // El quantity se usa como inventario inicial, pero si faltan piezas se siguen creando planchas virtuales.
      // Solo descontamos quantity cuando efectivamente se usó una plancha.
      while (leftovers.some(p => this.pieceMatchesMaterial(p, material))) {
        const basePattern = createCuttingPattern({
          materialId: material.id,
          materialName: material.material,
          materialLength: Number(material.length) || 0,
          materialWidth: Number(material.width) || 0,
          kerf: Number(material.kerf ?? this.config.kerf) || 0,
          margin: Number(material.margin ?? this.config.margin) || 0,
          pieces: [],
        });
        // probar filas (shelves) y columnas, elegir el mejor por uso de área
  const patRows = { ...basePattern, id: crypto.randomUUID(), pieces: [] };
  const poolRows = [...leftovers];
  this.packShelves(patRows, poolRows, material);

  const patCols = { ...basePattern, id: crypto.randomUUID(), pieces: [] };
  const poolCols = [...leftovers];
  this.packColumns(patCols, poolCols, material);

        const usedRows = patRows.pieces.reduce((s, p) => s + p.width * p.height, 0);
        const usedCols = patCols.pieces.reduce((s, p) => s + p.width * p.height, 0);
        const chooseCols = usedCols > usedRows;
        const chosen = chooseCols ? patCols : patRows;
        if (chosen.pieces.length > 0) {
          patterns.push(chosen);
          leftovers = chooseCols ? poolCols : poolRows; // adoptar el pool correspondiente
          if (qty > 0) qty--; // consumimos inventario si existe
        } else {
          // No se pudo colocar ninguna pieza en esta plancha: salir del bucle para este material
          break;
        }
      }
    }

    // Stats
    let totalMaterialArea = 0;
    let totalUsedArea = 0;
    let materialsUsed = 0;
    let totalCost = 0;
    for (const pat of patterns) {
      const area = pat.materialLength * pat.materialWidth;
      const used = pat.pieces.reduce((s, p) => s + p.width * p.height, 0);
      pat.waste = Math.max(0, area - used);
      pat.utilization = area > 0 ? (used / area) * 100 : 0;
      totalMaterialArea += area;
      totalUsedArea += used;
      const mat = materials.find(m => m.id === pat.materialId);
      if (mat) {
        pat.cost = Number(mat.price) || 0;
        totalCost += pat.cost;
      }
      materialsUsed++;
    }

    const totalUtilization = totalMaterialArea > 0 ? (totalUsedArea / totalMaterialArea) * 100 : 0;
    const totalWaste = Math.max(0, totalMaterialArea - totalUsedArea);

    return {
      patterns,
      totalUtilization,
      totalWaste,
      totalCost,
      materialsUsed,
      executionTime: Date.now() - start,
      algorithm: 'Guillotine (Shelves)',
    };
  }

  packShelves(pattern, leftovers, material) {
    const kerf = Number(pattern.kerf) || 0;
    const clearance = kerf + (Number(this.config.separation) || 0);
    const margin = Number(pattern.margin) || 0;
    const widthAvail = Math.max(0, pattern.materialLength - margin * 2);
    const heightAvail = Math.max(0, pattern.materialWidth - margin * 2);

    let y = margin; // eje Y: alto del tablero
    let remainH = heightAvail;

    // candidatas que coinciden de material
    const candidates = this.sortForShelves(
      leftovers.filter(p => this.pieceMatchesMaterial(p, material))
    );

    while (remainH > 0) {
      // Elegir una altura de shelf: la mayor altura que quepa en remainH
      let shelfHeight = 0;
      for (const p of candidates) {
        const dims = this.getOrientations(p);
        const h = Math.min(dims.a.height, dims.b.height);
        if (h <= remainH && h > shelfHeight) shelfHeight = h;
      }
      if (shelfHeight <= 0) break; // no cabe nada más

      // Rellenar el shelf de izquierda a derecha
  let x = margin;
  let remainW = widthAvail;
      let placedInShelf = false;

      for (let i = 0; i < candidates.length; i++) {
        const piece = candidates[i];
        if (!piece) continue;
        const { a, b } = this.getOrientations(piece);
        // elegir la orientación cuya altura <= shelfHeight y mejor ancho para remainW
        const fitsA = a.height <= shelfHeight && a.width <= remainW;
        const fitsB = b.height <= shelfHeight && b.width <= remainW;
        let chosen = null;
        if (fitsA && fitsB) {
          // elige la de menor altura (más ordenado) y si empatan, la más ancha
          if (a.height !== b.height) chosen = a.height < b.height ? a : b;
          else chosen = a.width >= b.width ? a : b;
        } else if (fitsA) chosen = a; else if (fitsB) chosen = b;
        if (!chosen) continue;

        // colocar
        pattern.pieces.push(createPlacedPiece({
          pieceId: piece.id,
          x,
          y,
          width: chosen.width,
          height: chosen.height,
          rotated: chosen.rotated,
          label: piece.label,
          color: piece.color,
          edges: piece.edges,
        }));

        // actualizar cursores (usar clearance = kerf + separation entre piezas)
        x += chosen.width;
        remainW -= chosen.width;
        // si aún queda espacio para otra pieza, sumar kerf de separación
        if (remainW > 0) {
          x += clearance;
          remainW = Math.max(0, remainW - clearance);
        }
        placedInShelf = true;

        // remover del pool (también de leftovers)
        candidates.splice(i, 1);
        const idx = leftovers.findIndex(lp => lp.id === piece.id);
        if (idx >= 0) leftovers.splice(idx, 1);
        i--; // ajustar índice tras remover
      }

      if (!placedInShelf) {
        // no cupo ninguna en este shelf: terminar
        break;
      }

      // pasar a siguiente shelf
      y += shelfHeight;
      remainH -= shelfHeight;
      // corte horizontal completo: usar clearance entre filas si queda altura
      if (remainH > 0) {
        y += clearance;
        remainH = Math.max(0, remainH - clearance);
      }
    }
  }

  getOrientations(piece) {
    const required = piece.requiredRotation; // 'original' | 'rotated' | true | false
    const canRotate = (this.config.allowRotation && (piece.canRotate ?? true)) || required === 'rotated' || required === true;
    const allowOriginal = required === 'rotated' || required === true ? false : true;
    const allowRotated = required === 'original' || required === false ? false : canRotate;
    const a = { width: Number(piece.length) || 0, height: Number(piece.width) || 0, rotated: false };
    const b = { width: Number(piece.width) || 0, height: Number(piece.length) || 0, rotated: true };
    if (allowOriginal && allowRotated) return { a, b };
    if (allowOriginal) return { a, b: a };
    if (allowRotated) return { a: b, b };
    // Si ninguna es permitida, por seguridad devolver original
    return { a, b: a };
  }

  // Empaquetado por columnas (cortes verticales): transposición del esquema de filas
  packColumns(pattern, leftovers, material) {
    const kerf = Number(pattern.kerf) || 0;
    const clearance = kerf + (Number(this.config.separation) || 0);
    const margin = Number(pattern.margin) || 0;
    const widthAvail = Math.max(0, pattern.materialLength - margin * 2);
    const heightAvail = Math.max(0, pattern.materialWidth - margin * 2);

    let x = margin; // eje X: ancho del tablero
    let remainW = widthAvail;

    const candidates = this.sortForShelves(
      leftovers.filter(p => this.pieceMatchesMaterial(p, material))
    );

    while (remainW > 0) {
      // elegir ancho de columna como la mayor anchura que quepa en remainW
      let colWidth = 0;
      for (const p of candidates) {
        const { a, b } = this.getOrientations(p);
        const w = Math.min(a.width, b.width);
        if (w <= remainW && w > colWidth) colWidth = w;
      }
      if (colWidth <= 0) break;

      let y = margin;
      let remainH = heightAvail;
      let placedInCol = false;

      for (let i = 0; i < candidates.length; i++) {
        const piece = candidates[i];
        if (!piece) continue;
        const { a, b } = this.getOrientations(piece);
        const fitsA = a.width <= colWidth && a.height <= remainH;
        const fitsB = b.width <= colWidth && b.height <= remainH;
        let chosen = null;
        if (fitsA && fitsB) {
          // elige la de menor ancho (para encajar mejor) y si empatan, la más alta
          if (a.width !== b.width) chosen = a.width < b.width ? a : b;
          else chosen = a.height >= b.height ? a : b;
        } else if (fitsA) chosen = a; else if (fitsB) chosen = b;
        if (!chosen) continue;

        pattern.pieces.push(createPlacedPiece({
          pieceId: piece.id,
          x,
          y,
          width: chosen.width,
          height: chosen.height,
          rotated: chosen.rotated,
          label: piece.label,
          color: piece.color,
          edges: piece.edges,
        }));

        y += chosen.height;
        remainH -= chosen.height;
        if (remainH > 0) {
          y += clearance;
          remainH = Math.max(0, remainH - clearance);
        }
        placedInCol = true;

        candidates.splice(i, 1);
        const idx = leftovers.findIndex(lp => lp.id === piece.id);
        if (idx >= 0) leftovers.splice(idx, 1);
        i--;
      }

      if (!placedInCol) break;

      x += colWidth;
      remainW -= colWidth;
      if (remainW > 0) {
        x += clearance;
        remainW = Math.max(0, remainW - clearance);
      }
    }
  }
}
