import React, { memo, useEffect, useRef } from 'react';
import { PatternThumb } from './PatternThumb';

/**
 * props:
 * - patterns: Array<Pattern>
 * - activeIndex: number
 * - onSelect: (i:number)=>void
 */
export const ThumbnailStrip = memo(function ThumbnailStrip({ patterns, activeIndex, onSelect }) {
  const containerRef = useRef(null);

  // Navegación con teclado izquierda/derecha
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onSelect(Math.max(0, activeIndex - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onSelect(Math.min(patterns.length - 1, activeIndex + 1));
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, onSelect, patterns.length]);

  return (
    <div ref={containerRef} className="flex gap-3 items-center overflow-x-auto py-2 px-0">
      {patterns.map((p, i) => (
        <button
          key={p.id ?? i}
          onClick={() => onSelect(i)}
          className={`relative w-24 h-16 shrink-0 rounded-lg bg-[var(--surface)] shadow-sm hover:shadow focus:outline-none overflow-hidden p-1 border ${
            i === activeIndex ? 'border-2 border-[var(--primary)]' : 'border-[var(--border)]'
          }`}
          title={`Hoja ${i + 1} de ${patterns.length}`}
        >
          <PatternThumb p={p} />
          <span className="sr-only">{`Hoja ${i + 1}`}</span>
        </button>
      ))}
    </div>
  );
});

export default ThumbnailStrip;
