import { useMemo } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// useVersionHistory: gestiona un historial de versiones (snapshots) del estado del proyecto
// Almacena en localStorage un array de versiones: { id, ts, note, counts, config, state }
export function useVersionHistory(key = "cutting-project", { limit = 20 } = {}) {
  const storageKey = `${key}-versions`;
  const [versions, setVersions] = useLocalStorage(storageKey, []);

  const ordered = useMemo(() => {
    const arr = Array.isArray(versions) ? versions.slice() : [];
    arr.sort((a, b) => Number(b?.ts || 0) - Number(a?.ts || 0));
    return arr;
  }, [versions]);

  function save(state, note) {
    try {
      if (!state || typeof state !== "object") return;
      const { pieces = [], materials = [], config = {} } = state;
      const entry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ts: Date.now(),
        note: note ? String(note).slice(0, 200) : "",
        counts: { pieces: Array.isArray(pieces) ? pieces.length : 0, materials: Array.isArray(materials) ? materials.length : 0 },
        config: {
          units: config?.units,
          kerfWidth: config?.kerfWidth,
          margin: config?.margin,
          allowRotation: config?.allowRotation,
          separation: config?.separation,
          rotationPenalty: config?.rotationPenalty,
        },
        state: { pieces, materials, config },
      };
      setVersions((prev) => {
        const next = Array.isArray(prev) ? [...prev, entry] : [entry];
        // limitar cantidad total conservando las más recientes
        next.sort((a, b) => Number(b?.ts || 0) - Number(a?.ts || 0));
        return next.slice(0, Math.max(1, limit));
      });
      return entry;
    } catch {
      // Silenciar errores de serialización/tamaño de localStorage
      return null;
    }
  }

  function remove(id) {
    setVersions((prev) => (Array.isArray(prev) ? prev.filter((v) => v.id !== id) : []));
  }

  function clear() {
    setVersions([]);
  }

  function getById(id) {
    const list = Array.isArray(versions) ? versions : [];
    return list.find((v) => v.id === id) || null;
  }

  return {
    versions: ordered,
    save,
    remove,
    clear,
    getById,
  };
}
