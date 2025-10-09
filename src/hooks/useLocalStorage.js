import { useState, useEffect, useCallback } from 'react';

export const useLocalStorage = (key, initialValue) => {
  // Función para obtener el valor del localStorage
  const getStoredValue = useCallback(() => {
    try {
      // Política: siempre arrancar en limpio para estas claves (excepto piezas/materiales que ahora tienen semilla por defecto)
      const ALWAYS_BLANK_KEYS = new Set([
        'budget-client',
        'budget-company',
        'budget-base-materials',
        'budget-edge-items',
        'budget-hardware-items',
        'budget-other-items',
      ]);
      if (typeof window !== 'undefined' && ALWAYS_BLANK_KEYS.has(key)) {
        return initialValue;
      }
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;
      const parsed = JSON.parse(item);
      // Migración suave: si tenemos [] guardado pero initialValue trae una semilla útil, úsala.
      if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(initialValue) && initialValue.length > 0) {
        return initialValue;
      }
      return parsed;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState(getStoredValue);

  // Función para actualizar el valor
  const setValue = useCallback((value) => {
    try {
      // Permitir que value sea una función para casos como setState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Función para eliminar el valor
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Escuchar cambios en localStorage desde otras pestañas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
};

// Hook especializado para el proyecto
export const useProjectData = () => {
  const [pieces, setPieces] = useLocalStorage('cutting-pieces', []);
  const [materials, setMaterials] = useLocalStorage('cutting-materials', []);
  const [config, setConfig] = useLocalStorage('cutting-config', {
    algorithm: 'bfd',
    allowRotation: true,
    kerf: 3,
    margin: 5,
    units: 'mm'
  });

  const clearAll = useCallback(() => {
    setPieces([]);
    setMaterials([]);
  }, [setPieces, setMaterials]);

  const exportData = useCallback(() => {
    return {
      pieces,
      materials,
      config,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }, [pieces, materials, config]);

  const importData = useCallback((data) => {
    if (data.pieces) setPieces(data.pieces);
    if (data.materials) setMaterials(data.materials);
    if (data.config) setConfig(data.config);
  }, [setPieces, setMaterials, setConfig]);

  return {
    pieces,
    setPieces,
    materials,
    setMaterials,
    config,
    setConfig,
    clearAll,
    exportData,
    importData
  };
};

