// Imprime solo un nodo usando un iframe oculto (sin abrir ventanas emergentes)
// Copia estilos del documento actual (style y link rel=stylesheet)
export function printElement(node, { title = 'Imprimir', extraCss = '' } = {}) {
  if (!node) return window.print();

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return window.print();
  }

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('');

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  ${styles}
  <style>
    @page { margin: 12mm; }
    body { background: #fff; }
    ${extraCss}
  </style>
</head>
<body>${node.outerHTML}</body>
</html>`;

  doc.open();
  doc.write(html);
  doc.close();

  const iframeWin = iframe.contentWindow;
  const iframeDoc = iframeWin?.document;

  const waitForImages = () => {
    try {
      const imgs = Array.from(iframeDoc?.images || []);
      return Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              }),
        ),
      );
    } catch {
      return Promise.resolve();
    }
  };

  const waitForFonts = () => {
    try {
      return iframeDoc?.fonts ? iframeDoc.fonts.ready.catch(() => {}) : Promise.resolve();
    } catch {
      return Promise.resolve();
    }
  };

  const ready = Promise.all([
    new Promise((r) => iframeWin?.requestAnimationFrame(() => r())),
    waitForImages(),
    waitForFonts(),
  ]);

  const fallback = new Promise((r) => setTimeout(r, 800));

  Promise.race([ready, fallback]).then(() => {
    // pequeño respiro final para layout
    setTimeout(() => {
      try {
        iframeWin?.focus();
        iframeWin?.print();
      } finally {
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 100);
      }
    }, 40);
  });
}
