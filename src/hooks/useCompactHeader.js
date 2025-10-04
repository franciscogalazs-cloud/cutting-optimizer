import { useEffect, useState } from "react";

export function useCompactHeader(ref) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    const ro = new ResizeObserver(() => {
      // compacta si el contenido desborda el ancho disponible
      setCompact(el.scrollWidth > el.clientWidth);
    });
    
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return compact;
}