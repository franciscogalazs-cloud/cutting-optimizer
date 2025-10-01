import React from "react";
import { brandUrl, rootUrl } from "@/lib/paths";

type Variant = "main" | "compact" | "square" | "stack";

type Props = {
  variant?: Variant;
  /** Texto grande (e.g., "MELAMINA OPTIMIZER"). Poner MAYÚSCULAS aquí si se quiere full caps */
  name?: string;
  /** Mostrar u ocultar badge PRO visual (si el SVG lo tiene) */
  showBadge?: boolean;
  /** width en px (o className si usas Tailwind) */
  width?: number;
  className?: string;
};

const fileByVariant: Record<Variant, string> = {
  main: brandUrl("brand/industrial-plate/stencil_main.svg"),
  compact: brandUrl("brand/industrial-plate/stencil_compact.svg"),
  square: brandUrl("brand/industrial-plate/stencil_square.svg"),
  stack: brandUrl("brand/industrial-plate/stencil_stack.svg"),
};

export default function LogoPlate({
  variant = "main",
  name,
  showBadge = true,
  width = 320,
  className,
}: Props) {
  const src = fileByVariant[variant];

  return (
    <img
      src={src}
      onError={(e) => {
        if (import.meta.env.DEV) {
          const t = e.currentTarget as HTMLImageElement;
          if (!(t as any).dataset?.fallback) {
            (t as any).dataset = { ...(t as any).dataset, fallback: "1" } as DOMStringMap;
            // mapear variante a ruta relativa root
            const relByVariant: Record<Variant, string> = {
              main: "brand/industrial-plate/stencil_main.svg",
              compact: "brand/industrial-plate/stencil_compact.svg",
              square: "brand/industrial-plate/stencil_square.svg",
              stack: "brand/industrial-plate/stencil_stack.svg",
            };
            t.src = rootUrl(relByVariant[variant]);
          }
        }
      }}
      width={width}
      className={className}
      alt={`Logo placa industrial (${variant})`}
      loading="eager"
      decoding="async"
    />
  );
}

/*
import { useEffect, useState } from "react";
export function InlineLogoPlate({ variant = "main", name, showBadge = true }: Props) {
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    fetch(fileByVariant[variant])
      .then(r => r.text())
      .then(txt => {
        let s = txt;
        if (name) s = s.replace(/MELAMINA OPTIMIZER/gi, name.toUpperCase());
        if (!showBadge) s = s.replace(/>PRO</g, "><");
        setSvg(s);
      });
  }, [variant, name, showBadge]);

  return <div dangerouslySetInnerHTML={{ __html: svg }} aria-label={`Logo ${variant}`} />;
}
*/
