import React from "react";

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
  main: "/brand/industrial-plate/stencil_main.svg",
  compact: "/brand/industrial-plate/stencil_compact.svg",
  square: "/brand/industrial-plate/stencil_square.svg",
  stack: "/brand/industrial-plate/stencil_stack.svg",
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
