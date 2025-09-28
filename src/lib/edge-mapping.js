// Helper para remapear lados de tapacanto cuando la pieza está rotada 90°

// Direcciones posibles: 'CW' (horario) o 'CCW' (antihorario)
const MAP_CW = {
  arriba: 'izquierda',
  derecha: 'arriba',
  abajo: 'derecha',
  izquierda: 'abajo',
};

const MAP_CCW = {
  arriba: 'derecha',
  derecha: 'abajo',
  abajo: 'izquierda',
  izquierda: 'arriba',
};

export const mapEdgesForRotation = (edges = {}, rotated = false, direction = 'CW') => {
  if (!rotated || !edges) return edges || {};
  const map = direction === 'CCW' ? MAP_CCW : MAP_CW;
  return {
    arriba: edges?.[map.arriba],
    derecha: edges?.[map.derecha],
    abajo: edges?.[map.abajo],
    izquierda: edges?.[map.izquierda],
  };
};

// Dado un lado original, devuelve a qué lado queda en la pieza colocada (rotada)
export const mapSideOriginalToPlaced = (side = 'arriba', rotated = false, direction = 'CW') => {
  if (!rotated) return side;
  const map = direction === 'CCW' ? MAP_CCW : MAP_CW; // map[newSide] = oldSide
  // invertir el mapa: encontrar la clave cuyo valor sea el lado original
  for (const [newSide, oldSide] of Object.entries(map)) {
    if (oldSide === side) return newSide;
  }
  return side;
};

// Dado un lado en la pieza colocada, devuelve cuál era el lado original
export const mapSidePlacedToOriginal = (side = 'arriba', rotated = false, direction = 'CW') => {
  if (!rotated) return side;
  const map = direction === 'CCW' ? MAP_CCW : MAP_CW; // map[newSide] = oldSide
  return map[side] || side;
};

export default mapEdgesForRotation;
