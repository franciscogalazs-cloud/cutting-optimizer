export const areaToSquareMeters = (area = 0, units = 'cm') => {
  if (!Number.isFinite(area)) return 0;
  switch (units) {
    case 'mm':
      return area / 1_000_000;
    case 'cm':
      return area / 10_000;
    case 'in':
      return area * 0.00064516;
    case 'm':
      return area;
    default:
      return area;
  }
};

export const rectangleAreaToSquareMeters = (length = 0, width = 0, quantity = 1, units = 'cm') => {
  if (!Number.isFinite(length) || !Number.isFinite(width) || !Number.isFinite(quantity)) {
    return 0;
  }
  return areaToSquareMeters(length * width * quantity, units);
};

export const formatSquareMeters = (value, fractionDigits = 2) => {
  if (!Number.isFinite(value)) return '--';
  return value.toLocaleString('es-CL', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

export const formatCLP = (value) => {
  if (!Number.isFinite(value)) return '--';
  return value.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  });
};
